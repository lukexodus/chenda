"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Loader2, MapPinned } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RiderDashboardResponse {
  dashboard: {
    profile: {
      is_available: boolean;
      base_fee: string | number;
      percentage_rate: string | number;
    };
    activeDeliveries: Array<{
      id: number;
      order_id: number;
      status: string;
      buyer_name: string;
      product_name: string;
      eta_at?: string;
    }>;
    todayStats: {
      delivered_today: number;
      failed_today: number;
      active_today: number;
    };
  };
}

export default function RiderDashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RiderDashboardResponse["dashboard"] | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/deliveries/rider/dashboard");
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load dashboard");
      setData(res.data.dashboard);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load rider dashboard";
      toast({ variant: "destructive", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvailability = async () => {
    if (!data) return;

    setUpdatingAvailability(true);
    try {
      const next = !data.profile.is_available;
      const res = await api.put("/deliveries/rider/availability", { is_available: next });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to update availability");
      setData({ ...data, profile: { ...data.profile, is_available: next } });
      toast({ title: "Availability updated", description: next ? "You are now available for jobs" : "You are now unavailable" });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update availability";
      toast({ variant: "destructive", title: "Update failed", description: message });
    } finally {
      setUpdatingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fresh-text-primary">Rider Dashboard</h1>
        <p className="text-fresh-text-muted mt-2">Manage assigned deliveries and availability.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>Toggle to receive or pause in-house job assignments.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="font-medium text-fresh-text-primary">
            {data.profile.is_available ? "Available" : "Unavailable"}
          </p>
          <Button onClick={toggleAvailability} disabled={updatingAvailability}>
            {updatingAvailability ? "Updating..." : data.profile.is_available ? "Set Unavailable" : "Set Available"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Active Tasks Today</CardDescription>
            <CardTitle>{data.todayStats.active_today}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Delivered Today</CardDescription>
            <CardTitle>{data.todayStats.delivered_today}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Failed Today</CardDescription>
            <CardTitle>{data.todayStats.failed_today}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Active Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.activeDeliveries.length === 0 && (
            <p className="text-sm text-fresh-text-muted">No active deliveries at the moment.</p>
          )}

          {data.activeDeliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-lg border p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-fresh-text-primary">Order #{delivery.order_id} · {delivery.product_name}</p>
                <p className="text-sm text-fresh-text-muted">Buyer: {delivery.buyer_name} · Status: {delivery.status}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/rider/deliveries/${delivery.id}`}>
                  <MapPinned className="h-4 w-4 mr-2" />
                  Open
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
