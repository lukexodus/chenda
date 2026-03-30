"use client";

import { useEffect, useState } from "react";
import { Loader2, Bike } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: number;
  order_id: number;
  buyer_name: string;
  seller_name: string;
  product_name: string;
  total_amount: string | number;
  buyer_address_snapshot?: string;
}

export default function RiderJobsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/deliveries/rider/jobs/available");
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load jobs");
      setJobs(res.data.jobs || []);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load jobs";
      toast({ variant: "destructive", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (deliveryId: number) => {
    setAcceptingId(deliveryId);
    try {
      const res = await api.post(`/deliveries/${deliveryId}/accept`);
      if (!res.data?.success) throw new Error(res.data?.message || "Unable to accept job");
      toast({ title: "Job accepted", description: `Delivery #${deliveryId} is now assigned to you.` });
      setJobs((prev) => prev.filter((j) => j.id !== deliveryId));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unable to accept job";
      toast({ variant: "destructive", title: "Accept failed", description: message });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fresh-text-primary">Available Jobs</h1>
        <p className="text-fresh-text-muted mt-2">Accept open in-house delivery jobs.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-fresh-text-muted">No available delivery jobs right now.</CardContent>
        </Card>
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="text-base">Order #{job.order_id} · {job.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-fresh-text-muted">Buyer: {job.buyer_name}</p>
                <p className="text-sm text-fresh-text-muted">Seller: {job.seller_name}</p>
                <p className="text-sm text-fresh-text-muted">Dropoff: {job.buyer_address_snapshot || "Address will be shown in detail"}</p>
                <p className="font-medium text-fresh-text-primary">Order Amount: PHP {Number(job.total_amount || 0).toFixed(2)}</p>
                <Button onClick={() => accept(job.id)} disabled={acceptingId === job.id}>
                  <Bike className="h-4 w-4 mr-2" />
                  {acceptingId === job.id ? "Accepting..." : "Accept Job"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
