"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ActiveDelivery {
  id: number;
  order_id: number;
  status: string;
  buyer_name: string;
  product_name: string;
  buyer_address_snapshot?: string;
}

export default function RiderTrackingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/deliveries/rider/dashboard");
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load active deliveries");
      setDeliveries(res.data.dashboard?.activeDeliveries || []);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load tracking";
      toast({ variant: "destructive", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fresh-text-primary">Tracking</h1>
        <p className="text-fresh-text-muted mt-2">Active deliveries currently under your route.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
        </div>
      )}

      {!loading && deliveries.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-fresh-text-muted">No active deliveries for tracking.</CardContent>
        </Card>
      )}

      {!loading && deliveries.length > 0 && (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <CardTitle className="text-base">Order #{delivery.order_id} · {delivery.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-fresh-text-muted">
                <p>Status: {delivery.status}</p>
                <p>Buyer: {delivery.buyer_name}</p>
                <p>Dropoff: {delivery.buyer_address_snapshot || "Address available in detail view"}</p>
                <Link className="text-fresh-primary underline" href={`/rider/deliveries/${delivery.id}`}>
                  Open delivery details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
