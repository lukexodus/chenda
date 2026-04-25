"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Loader2, Navigation, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TrackingPayload {
  delivery: {
    id: number;
    order_id: number;
    status: string;
    provider_type: string;
    proof_photo_url?: string;
    buyer_name?: string;
    seller_name?: string;
    eta_at?: string;
    delivered_at?: string;
    failed_at?: string;
    failure_reason?: string;
    buyer_address_snapshot?: string;
    seller_address_snapshot?: string;
  };
  timeline: Array<{ event_type: string; event_note?: string; metadata: Record<string, unknown> | null; created_at: string }>;
}

export default function RiderDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const deliveryId = Number(params?.id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reportingLocation, setReportingLocation] = useState(false);
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [failureReason, setFailureReason] = useState("");

  const load = async () => {
    if (!deliveryId) return;
    setLoading(true);
    try {
      const res = await api.get(`/deliveries/rider/${deliveryId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load delivery");
      setData({
        delivery: res.data.delivery,
        timeline: res.data.timeline || [],
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load delivery";
      toast({ variant: "destructive", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [deliveryId]);

  const nextStatusOptions = useMemo(() => {
    const status = data?.delivery?.status;
    if (!status) return [] as string[];

    if (status === "accepted") return ["picked_up"];
    if (status === "picked_up") return ["in_transit"];
    if (status === "in_transit") return ["failed"];
    return [] as string[];
  }, [data?.delivery?.status]);

  const updateStatus = async (newStatus: string) => {
    if (!deliveryId) return;
    setSavingStatus(true);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === "failed") {
        payload.failure_reason = failureReason || "Delivery failed";
      }

      const res = await api.put(`/deliveries/${deliveryId}/status`, payload);
      if (!res.data?.success) throw new Error(res.data?.message || "Status update failed");
      toast({ title: "Status updated", description: `Delivery marked as ${newStatus.replace("_", " ")}.` });
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Status update failed";
      toast({ variant: "destructive", title: "Update failed", description: message });
    } finally {
      setSavingStatus(false);
    }
  };

  const acceptDelivery = async () => {
    if (!deliveryId) return;
    setSavingStatus(true);
    try {
      const res = await api.post(`/deliveries/${deliveryId}/accept`);
      if (!res.data?.success) throw new Error(res.data?.message || "Accept failed");
      toast({ title: "Job Accepted", description: "You have accepted this delivery." });
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Accept failed";
      toast({ variant: "destructive", title: "Action failed", description: message });
    } finally {
      setSavingStatus(false);
    }
  };

  const declineDelivery = async () => {
    if (!deliveryId) return;
    setSavingStatus(true);
    try {
      const res = await api.post(`/deliveries/${deliveryId}/decline`);
      if (!res.data?.success) throw new Error(res.data?.message || "Decline failed");
      toast({ title: "Job Declined", description: "You have declined this delivery." });
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Decline failed";
      toast({ variant: "destructive", title: "Action failed", description: message });
    } finally {
      setSavingStatus(false);
    }
  };

  const reportLocation = async () => {
    if (!deliveryId || !navigator.geolocation) {
      toast({ variant: "destructive", title: "Location unavailable", description: "Geolocation is not supported in this browser." });
      return;
    }

    setReportingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post(`/deliveries/${deliveryId}/location`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: "auto",
          });
          if (!res.data?.success) throw new Error(res.data?.message || "Location update failed");
          toast({ title: "Location updated", description: "Current position sent." });
          await load();
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Location update failed";
          toast({ variant: "destructive", title: "Update failed", description: message });
        } finally {
          setReportingLocation(false);
        }
      },
      (geoError) => {
        toast({ variant: "destructive", title: "Location denied", description: geoError.message || "Unable to get location." });
        setReportingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const uploadProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryId) return;

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("proof") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      toast({ variant: "destructive", title: "Missing photo", description: "Please choose a proof-of-delivery photo." });
      return;
    }

    const body = new FormData();
    body.append("proof_photo", file);

    setUploadingProof(true);
    try {
      const res = await api.post(`/deliveries/${deliveryId}/proof-photo`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Photo upload failed");
      toast({ title: "Photo uploaded", description: "Proof-of-delivery photo saved." });
      form.reset();
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Photo upload failed";
      toast({ variant: "destructive", title: "Upload failed", description: message });
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fresh-text-primary">Delivery #{data.delivery.id}</h1>
          <p className="text-fresh-text-muted">Order #{data.delivery.order_id} · Status: {data.delivery.status}</p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Snapshot</CardTitle>
          <CardDescription>Pickup and dropoff details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Pickup:</span> {data.delivery.seller_address_snapshot || "N/A"}</p>
          <p><span className="font-medium">Dropoff:</span> {data.delivery.buyer_address_snapshot || "N/A"}</p>
          {data.delivery.proof_photo_url && (
            <p>
              <span className="font-medium">Proof:</span>{" "}
              <a className="text-fresh-primary underline" href={data.delivery.proof_photo_url} target="_blank" rel="noreferrer">
                View uploaded photo
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Update delivery lifecycle and location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {data.delivery.status === "assigned" && (
              <>
                <Button onClick={acceptDelivery} disabled={savingStatus} className="bg-green-600 hover:bg-green-700">
                  {savingStatus ? "Saving..." : "Accept Job"}
                </Button>
                <Button onClick={declineDelivery} variant="destructive" disabled={savingStatus}>
                  {savingStatus ? "Saving..." : "Decline Job"}
                </Button>
              </>
            )}

            {data.delivery.status !== "assigned" && nextStatusOptions.map((status) => (
              <Button key={status} onClick={() => updateStatus(status)} disabled={savingStatus}>
                {savingStatus ? "Saving..." : `Mark ${status.replace("_", " ")}`}
              </Button>
            ))}
          </div>

          {nextStatusOptions.includes("failed") && (
            <div className="max-w-md space-y-2">
              <Label htmlFor="failureReason">Failure reason (required for failed status)</Label>
              <Input
                id="failureReason"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="Recipient unavailable, wrong address, etc."
              />
            </div>
          )}

          <div>
            <Button variant="outline" onClick={reportLocation} disabled={reportingLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              {reportingLocation ? "Sending location..." : "Send Current Location"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof of Delivery</CardTitle>
          <CardDescription>Upload the required POD photo after dropoff.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={uploadProof}>
            <Input type="file" name="proof" accept="image/*" required />
            <Button type="submit" disabled={uploadingProof}>
              <Camera className="h-4 w-4 mr-2" />
              {uploadingProof ? "Uploading..." : "Upload POD Photo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.timeline.length === 0 && <p className="text-sm text-fresh-text-muted">No events yet.</p>}
          {data.timeline.map((event, idx) => (
            <div key={`${event.event_type}-${event.created_at}-${idx}`} className="border rounded-md p-3">
              <p className="font-medium text-sm">{event.event_type}</p>
              {event.event_note && <p className="text-sm text-fresh-text-muted">{event.event_note}</p>}
              <p className="text-xs text-fresh-text-muted">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
