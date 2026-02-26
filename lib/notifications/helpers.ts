export type NotificationType = "info" | "success" | "warning";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  type: NotificationType;
};

export function dedupeNotifications(items: NotificationItem[]): NotificationItem[] {
  const map = new Map<string, NotificationItem>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

export function badgeClass(type: NotificationType): string {
  if (type === "success") return "bg-green-100 text-green-700";
  if (type === "warning") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
