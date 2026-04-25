"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DeliveryHistoryItem {
  id: number;
  order_id: number;
  status: string;
  delivered_at?: string;
  failed_at?: string;
  failure_reason?: string;
  rider_fee_amount?: string | number;
}

export default function RiderHistoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DeliveryHistoryItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/deliveries/rider/history");
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load history");
      setHistory(res.data.history?.items || []);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load history";
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
        <h1 className="text-3xl font-bold text-fresh-text-primary">Delivery History</h1>
        <p className="text-fresh-text-muted mt-2">Past completed and failed assignments.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
        </div>
      )}

      {!loading && history.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-fresh-text-muted">No delivery history yet.</CardContent>
        </Card>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">Order #{item.order_id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-fresh-text-muted">
                <p>Status: {item.status}</p>
                {item.delivered_at && <p>Delivered: {new Date(item.delivered_at).toLocaleString()}</p>}
                {item.failed_at && <p>Failed: {new Date(item.failed_at).toLocaleString()}</p>}
                {item.failure_reason && <p>Reason: {item.failure_reason}</p>}
                <p>Rider Fee: PHP {Number(item.rider_fee_amount || 0).toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
