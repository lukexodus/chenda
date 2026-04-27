"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bike,
  Circle,
  Clock,
  MapPin,
  Package,
  PackageCheck,
  ShieldAlert,
  Truck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DeliveryTimelineEvent = {
  id?: number | string;
  event_type: string;
  event_note?: string;
  created_at: string;
};

function titleize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function getFulfillmentType(delivery: { fulfillment_type?: string; provider_type?: string } | null | undefined) {
  return delivery?.fulfillment_type || delivery?.provider_type || "in_house";
}

function getEventMeta(eventType: string) {
  const normalized = String(eventType || "").toLowerCase();

  if (normalized === "delivery_assigned") return { icon: UserCheck, label: "Rider Assigned", tone: "info" as const };
  if (normalized === "delivery_reassigned") return { icon: UserCheck, label: "Rider Reassigned", tone: "info" as const };
  if (normalized === "delivery_accepted") return { icon: Bike, label: "Accepted", tone: "info" as const };
  if (normalized === "delivery_picked_up") return { icon: PackageCheck, label: "Picked Up", tone: "info" as const };
  if (normalized === "delivery_in_transit") return { icon: Truck, label: "In Transit", tone: "info" as const };
  if (normalized === "delivery_near_destination") return { icon: MapPin, label: "Near Destination", tone: "info" as const };
  if (normalized === "delivery_delivered") return { icon: BadgeCheck, label: "Delivered", tone: "success" as const };
  if (normalized === "delivery_proof_photo_uploaded") return { icon: BadgeCheck, label: "Proof Uploaded", tone: "success" as const };
  if (normalized === "delivery_declined") return { icon: XCircle, label: "Declined", tone: "danger" as const };
  if (normalized === "delivery_failed") return { icon: XCircle, label: "Failed", tone: "danger" as const };
  if (normalized === "delivery_issue_reported") return { icon: ShieldAlert, label: "Issue Reported", tone: "warning" as const };
  if (normalized === "delivery_dispatched_third_party") return { icon: Truck, label: "Dispatched (3rd party)", tone: "info" as const };

  return { icon: Clock, label: titleize(eventType), tone: "muted" as const };
}

function toneClasses(tone: "info" | "success" | "warning" | "danger" | "muted") {
  switch (tone) {
    case "success":
      return "bg-green-100 text-green-700 border-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "danger":
      return "bg-red-100 text-red-700 border-red-200";
    case "info":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

type Phase = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rank: number;
  optional?: boolean;
};

function getPhaseModel(fulfillmentType: string) {
  const f = String(fulfillmentType || "").toLowerCase();
  const isThirdParty = f === "third_party" || f === "third-party";

  const inHouse: Phase[] = [
    { key: "assigned", label: "Assigned", icon: UserCheck, rank: 1 },
    { key: "accepted", label: "Accepted", icon: Bike, rank: 2 },
    { key: "picked_up", label: "Picked Up", icon: PackageCheck, rank: 3 },
    { key: "in_transit", label: "In Transit", icon: Truck, rank: 4 },
    { key: "near_destination", label: "Near", icon: MapPin, rank: 5, optional: true },
    { key: "delivered", label: "Delivered", icon: BadgeCheck, rank: 6 },
  ];

  const thirdParty: Phase[] = [
    { key: "dispatched", label: "Dispatched", icon: Package, rank: 1 },
    { key: "in_transit", label: "In Transit", icon: Truck, rank: 2 },
    { key: "delivered", label: "Delivered", icon: BadgeCheck, rank: 3 },
  ];

  return isThirdParty ? thirdParty : inHouse;
}

function getStatusRank(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "assigned") return 1;
  if (s === "accepted") return 2;
  if (s === "picked_up") return 3;
  if (s === "in_transit") return 4;
  if (s === "delivered") return 6;
  if (s === "failed") return 6;
  if (s === "declined") return 1;
  return 0;
}

export function DeliveryPhaseTracker({
  delivery,
  events,
  className,
}: {
  delivery: { status: string; fulfillment_type?: string; provider_type?: string };
  events: Array<Pick<DeliveryTimelineEvent, "event_type">> | null | undefined;
  className?: string;
}) {
  const fulfillmentType = getFulfillmentType(delivery);
  const phases = getPhaseModel(fulfillmentType);
  const statusRank = getStatusRank(delivery.status);
  const nearDestination = Boolean(events?.some((e) => e.event_type === "delivery_near_destination"));

  const isFailed = ["failed", "declined"].includes(String(delivery.status || "").toLowerCase());

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-fresh-text-primary">Delivery Phases</p>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
            isFailed ? "border-red-200 bg-red-50 text-red-700" : "border-border bg-muted text-muted-foreground"
          )}
        >
          <Circle className={cn("h-2.5 w-2.5 fill-current", isFailed ? "text-red-600" : "text-fresh-primary")} />
          {titleize(delivery.status)}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {phases.map((phase) => {
          const completed =
            phase.key === "near_destination"
              ? nearDestination
              : statusRank >= phase.rank || (String(delivery.status || "").toLowerCase() === "delivered" && phase.key !== "near_destination");

          const current =
            !completed &&
            ((phase.key === "near_destination" && statusRank >= 4 && !nearDestination) ||
              (phase.rank === statusRank && phase.key !== "near_destination"));

          const Icon = phase.icon;
          return (
            <div
              key={phase.key}
              className={cn(
                "flex min-w-[120px] items-center gap-3 rounded-lg border px-3 py-2",
                completed
                  ? "border-green-200 bg-green-50"
                  : current
                  ? "border-fresh-primary/30 bg-fresh-primary/5"
                  : "border-border bg-white"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border",
                  completed
                    ? "border-green-200 bg-green-100 text-green-700"
                    : current
                    ? "border-fresh-primary/30 bg-fresh-primary/10 text-fresh-primary"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fresh-text-primary">{phase.label}</p>
                {phase.optional && (
                  <p className="text-[11px] text-muted-foreground">optional</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeliveryTimeline({
  delivery,
  events,
  emptyText = "No timeline updates yet.",
  className,
}: {
  delivery: { status: string; fulfillment_type?: string; provider_type?: string };
  events: DeliveryTimelineEvent[];
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <DeliveryPhaseTracker delivery={delivery} events={events} />

      <div className="space-y-2">
        {events.length === 0 && (
          <p className="text-sm text-fresh-text-muted">{emptyText}</p>
        )}

        {events.map((event, idx) => {
          const { icon: Icon, label, tone } = getEventMeta(event.event_type);
          return (
            <div key={event.id ?? `${event.event_type}-${event.created_at}-${idx}`} className="rounded-md border bg-white p-3">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", toneClasses(tone))}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-fresh-text-primary">{label}</p>
                    <p className="text-xs text-fresh-text-muted">{formatTime(event.created_at)}</p>
                  </div>
                  {event.event_note ? (
                    <p className="mt-1 text-sm text-fresh-text-muted">{event.event_note}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

