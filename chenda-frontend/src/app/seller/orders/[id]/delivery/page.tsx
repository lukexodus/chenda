"use client";

import { FormEvent, useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquareWarning } from "lucide-react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { DeliveryTimeline } from "@/components/delivery/DeliveryTimeline";

interface TrackingResponse {
  tracking: {
    delivery: {
      id: number;
      order_id: number;
      status: string;
      fulfillment_type: string;
      assigned_rider_id?: number;
      assigned_rider_name?: string;
      proof_photo_url?: string;
      eta_at?: string;
      delivered_at?: string;
      failed_at?: string;
      failure_reason?: string;
      third_party_provider?: string;
      third_party_tracking_ref?: string;
    };
    events: Array<{
      id: number;
      event_type: string;
      event_note?: string;
      payload?: Record<string, unknown>;
      created_at: string;
    }>;
    locations: Array<{
      id: number;
      latitude: number;
      longitude: number;
      source: string;
      created_at: string;
    }>;
  };
}

export default function SellerOrderDeliveryTrackingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const orderId = Number(params.id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingResponse["tracking"] | null>(null);
  const [issueMessage, setIssueMessage] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Re-assignment state
  const [riders, setRiders] = useState<Array<{ id: number; name: string; active_deliveries: number }>>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  const loadTracking = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/deliveries/orders/${orderId}/tracking`);
      if (!response.data?.success) throw new Error(response.data?.message || "Failed to load tracking");
      setTracking(response.data.tracking);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Tracking unavailable";
      toast({ variant: "destructive", title: "Tracking unavailable", description: message });
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    loadTracking();
  }, [orderId]);

  useEffect(() => {
    if (tracking?.delivery.status === 'declined' || tracking?.delivery.status === 'failed') {
      fetchAvailableRiders();
    }
  }, [tracking?.delivery.status]);

  const fetchAvailableRiders = async () => {
    setRidersLoading(true);
    try {
      const response = await api.get('/deliveries/dispatch/riders/available', { params: { limit: 100 } });
      if (response.data?.success) setRiders(response.data.riders || []);
    } catch (error) {
      console.error("Failed to load riders", error);
    } finally {
      setRidersLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedRiderId) {
      toast({ variant: 'destructive', title: 'Rider required', description: 'Please select a rider to reassign.' });
      return;
    }
    setIsDispatching(true);
    try {
      const res = await api.post(`/deliveries/orders/${orderId}/assign-in-house`, { rider_id: Number(selectedRiderId) });
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to reassign');
      toast({ title: 'Rider reassigned', description: 'The delivery has been reassigned to the new rider.' });
      setSelectedRiderId('');
      await loadTracking();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Reassignment failed', description: error.response?.data?.message || error.message || 'Please try again.' });
    } finally {
      setIsDispatching(false);
    }
  };

  const submitIssue = async (event: FormEvent) => {
    event.preventDefault();
    const message = issueMessage.trim();
    if (message.length < 5) {
      toast({ variant: "destructive", title: "Issue too short", description: "Please provide at least 5 characters." });
      return;
    }

    setSubmittingIssue(true);
    try {
      const response = await api.post(`/deliveries/orders/${orderId}/issues`, { message });
      if (!response.data?.success) throw new Error(response.data?.message || "Failed to report issue");
      toast({ title: "Issue reported", description: "Assigned rider was notified in-app." });
      setIssueMessage("");
      await loadTracking();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unable to report issue";
      toast({ variant: "destructive", title: "Report failed", description: errMsg });
    } finally {
      setSubmittingIssue(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-fresh-surface">
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <div className="container max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/seller/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
            <Button variant="outline" onClick={loadTracking}>Refresh</Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-fresh-text-primary">Seller Delivery Tracking</h1>
            <p className="text-fresh-text-muted mt-2">Order #{orderId}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
            </div>
          )}

          {!loading && !tracking && (
            <Card>
              <CardContent className="pt-6 text-sm text-fresh-text-muted">
                Tracking is not available for this order yet.
              </CardContent>
            </Card>
          )}

          {!loading && tracking && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Delivery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-medium">Status:</span> {tracking.delivery.status}</p>
                  <p><span className="font-medium">Fulfillment:</span> {tracking.delivery.fulfillment_type}</p>
                  {tracking.delivery.assigned_rider_name && (
                    <p><span className="font-medium">Assigned Rider:</span> {tracking.delivery.assigned_rider_name}</p>
                  )}
                  {tracking.delivery.eta_at && <p><span className="font-medium">ETA:</span> {new Date(tracking.delivery.eta_at).toLocaleString()}</p>}
                  {tracking.delivery.third_party_provider && (
                    <p><span className="font-medium">Courier:</span> {tracking.delivery.third_party_provider}</p>
                  )}
                  {tracking.delivery.third_party_tracking_ref && (
                    <p><span className="font-medium">Tracking Ref:</span> {tracking.delivery.third_party_tracking_ref}</p>
                  )}
                  {tracking.delivery.proof_photo_url && (
                    <p>
                      <span className="font-medium">POD:</span>{" "}
                      <a href={tracking.delivery.proof_photo_url} className="text-fresh-primary underline" target="_blank" rel="noreferrer">
                        View proof photo
                      </a>
                    </p>
                  )}
                  {tracking.delivery.failure_reason && <p><span className="font-medium">Failure:</span> {tracking.delivery.failure_reason}</p>}
                </CardContent>
              </Card>

              {['declined', 'failed'].includes(tracking.delivery.status) && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">Reassign Rider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-red-700">
                      {tracking.delivery.status === 'declined'
                        ? 'The assigned rider has declined this delivery. Please select a different rider to handle this order.'
                        : 'This delivery has failed. You can reassign it to try again.'}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <select
                        value={selectedRiderId}
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        disabled={ridersLoading || isDispatching}
                        className="flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-800"
                      >
                        <option value="">Select available rider...</option>
                        {riders.map((rider) => (
                          <option key={rider.id} value={String(rider.id)}>
                            {rider.name} ({rider.active_deliveries} active)
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={handleReassign}
                        disabled={!selectedRiderId || isDispatching || ridersLoading}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDispatching ? 'Reassigning...' : 'Reassign Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryTimeline delivery={tracking.delivery} events={tracking.events} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareWarning className="h-5 w-5" />
                    Report Delivery Issue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitIssue} className="space-y-3">
                    <Input
                      value={issueMessage}
                      onChange={(e) => setIssueMessage(e.target.value)}
                      placeholder="Describe the issue for rider follow-up"
                      minLength={5}
                      required
                    />
                    <Button type="submit" disabled={submittingIssue}>
                      {submittingIssue ? "Submitting..." : "Submit Issue"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
