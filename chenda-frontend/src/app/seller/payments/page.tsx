"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletCards, Loader2, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type SettlementStatus =
  | "all"
  | "captured"
  | "partially_refunded"
  | "fully_refunded"
  | "pending"
  | "failed";

interface SettlementRow {
  order_id: number;
  created_at: string;
  payment_method: "cash" | "gcash";
  payment_status: string;
  order_status: string;
  total_amount: string | number;
  total_refunded: string | number;
  net_settlement: string | number;
  settlement_status: Exclude<SettlementStatus, "all">;
  buyer_name: string;
  product_name: string;
}

interface Overview {
  total_orders: number;
  gross_amount: string | number;
  refunded_amount: string | number;
  net_amount: string | number;
  captured_orders: number;
  partially_refunded_orders: number;
  fully_refunded_orders: number;
  pending_orders: number;
  failed_orders: number;
}

interface TrendRow {
  day: string;
  orders: number;
  gross_amount: string | number;
  refunded_amount: string | number;
  net_amount: string | number;
}

const STATUS_LABELS: Record<SettlementStatus, string> = {
  all: "All",
  captured: "Captured",
  partially_refunded: "Partial Refund",
  fully_refunded: "Full Refund",
  pending: "Pending",
  failed: "Failed",
};

const toAmount = (value: string | number) => Number(value || 0);

const formatCurrency = (value: string | number) => {
  const amount = toAmount(value);
  return `PHP ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function SellerPaymentsPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus>("all");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);

  const loadData = async (status: SettlementStatus) => {
    setIsLoading(true);
    try {
      const [overviewResponse, settlementsResponse] = await Promise.all([
        api.get("/orders/seller/payments/overview", { params: { days: 30 } }),
        api.get("/orders/seller/payments/settlements", {
          params: {
            status,
            limit: 50,
            offset: 0,
          },
        }),
      ]);

      if (!overviewResponse.data?.success || !settlementsResponse.data?.success) {
        throw new Error("Failed to load payment reporting data");
      }

      setOverview(overviewResponse.data.overview);
      setTrend(overviewResponse.data.trend || []);
      setSettlements(settlementsResponse.data.settlements || []);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to load payment report";

      toast({
        variant: "destructive",
        title: "Unable to load payments",
        description: message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  const latestTrend = useMemo(() => trend.slice(0, 7), [trend]);

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fresh-text-primary">Payments & Settlements</h1>
        <p className="text-fresh-text-muted mt-2">
          Track captured payments, refunds, and net payout values for your store.
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as SettlementStatus)}>
        <TabsList className="flex w-full md:grid md:grid-cols-6">
          {(Object.keys(STATUS_LABELS) as SettlementStatus[]).map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_LABELS[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
        </div>
      )}

      {!isLoading && overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardDescription>Gross Sales</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(overview.gross_amount)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-fresh-text-muted">Orders: {overview.total_orders}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Total Refunded</CardDescription>
                <CardTitle className="text-2xl text-fresh-danger">{formatCurrency(overview.refunded_amount)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-fresh-text-muted">
                Partial: {overview.partially_refunded_orders} | Full: {overview.fully_refunded_orders}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Estimated Net Payout</CardDescription>
                <CardTitle className="text-2xl text-fresh-primary">{formatCurrency(overview.net_amount)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-fresh-text-muted">
                Captured: {overview.captured_orders} | Pending: {overview.pending_orders}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Last 7 Daily Settlement Snapshots
              </CardTitle>
              <CardDescription>Based on order creation date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestTrend.length === 0 && (
                <p className="text-sm text-fresh-text-muted">No settlement data yet.</p>
              )}

              {latestTrend.map((row) => (
                <div key={row.day} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-fresh-text-primary">{formatDate(row.day)}</p>
                    <p className="text-xs text-fresh-text-muted">Orders: {row.orders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-fresh-text-muted">Gross {formatCurrency(row.gross_amount)}</p>
                    <p className="text-sm text-fresh-danger">Refunded {formatCurrency(row.refunded_amount)}</p>
                    <p className="font-semibold text-fresh-primary">Net {formatCurrency(row.net_amount)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-5 w-5" />
                Settlement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <p className="text-sm text-fresh-text-muted">No settlements for this filter.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Refunded</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((row) => (
                      <TableRow key={row.order_id}>
                        <TableCell>{formatDate(row.created_at)}</TableCell>
                        <TableCell>
                          <div className="font-medium">#{row.order_id}</div>
                          <div className="text-xs text-fresh-text-muted">{row.product_name}</div>
                        </TableCell>
                        <TableCell>{row.buyer_name}</TableCell>
                        <TableCell className="uppercase text-xs">{row.payment_method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.settlement_status === "captured"
                                ? "default"
                                : row.settlement_status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {STATUS_LABELS[row.settlement_status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total_amount)}</TableCell>
                        <TableCell className="text-right text-fresh-danger">
                          <span className="inline-flex items-center gap-1">
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                            {formatCurrency(row.total_refunded)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-fresh-primary font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            {formatCurrency(row.net_settlement)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => loadData(statusFilter)}>
              Refresh Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
