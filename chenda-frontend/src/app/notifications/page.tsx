"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BellOff, Check, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type DeliveryNotification = {
  id: number;
  delivery_id: number;
  event_type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function NotificationsPage() {
	const router = useRouter();
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    const list = filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications;
    // Show unread first for better UX
    return [...list].sort((a, b) => {
      const aUnread = a.read_at ? 1 : 0;
      const bUnread = b.read_at ? 1 : 0;
      if (aUnread !== bUnread) return aUnread - bUnread;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filter, notifications]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/deliveries/notifications/me", { params: { limit: 200 } });
        if (!mounted) return;
        const list: DeliveryNotification[] = res.data?.notifications || [];
        setNotifications(list);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const markRead = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    );

    try {
      const res = await api.post(`/deliveries/notifications/${notificationId}/read`);
      const updated: DeliveryNotification | undefined = res.data?.notification;
      if (updated) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? updated : n)));
      }
    } catch {
      // revert optimistic update on failure
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read_at: null } : n)));
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    try {
      await api.post("/deliveries/notifications/me/read-all");
    } catch {
      // If this fails, reload from server for consistency.
      try {
        const res = await api.get("/deliveries/notifications/me", { params: { limit: 200 } });
        setNotifications(res.data?.notifications || []);
      } finally {
        // ignore
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

	return (
		<main className="mx-auto w-full max-w-3xl p-6">
			<div className="mb-6">
				<Button 
					variant="ghost" 
					size="sm" 
					onClick={() => router.back()}
					className="-ml-3 mb-4 text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isLoading || isMarkingAll || unreadCount === 0}
          >
            {isMarkingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Mark all read
          </Button>
        </div>
			</div>

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition",
            filter === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition",
            filter === "unread"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          Unread
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading notifications…
        </div>
      ) : visibleNotifications.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <BellOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No notifications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "unread" ? "You have no unread notifications." : "Notifications will appear here as things happen."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((n) => {
            const unread = !n.read_at;
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-lg border bg-white p-4",
                  unread ? "border-fresh-primary/30 bg-fresh-primary/5" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground break-words">{n.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelativeTime(n.created_at)} · delivery #{n.delivery_id}
                    </p>
                  </div>

                  {unread && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markRead(n.id)}
                      className="shrink-0"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
		</main>
	);
}
