import { describe, expect, it } from "vitest";
import {
  badgeClass,
  dedupeNotifications,
  formatRelativeTime,
  type NotificationItem,
} from "./helpers";

describe("notification helpers", () => {
  it("dedupes by id and keeps last value", () => {
    const base: NotificationItem = {
      id: "1",
      title: "One",
      body: "Body",
      href: "/a",
      createdAt: "2026-01-01T00:00:00.000Z",
      type: "info",
    };

    const deduped = dedupeNotifications([
      base,
      { ...base, title: "Updated" },
      { ...base, id: "2" },
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped.find((item) => item.id === "1")?.title).toBe("Updated");
  });

  it("formats relative time deterministically", () => {
    const now = new Date("2026-02-26T12:00:00.000Z");
    expect(formatRelativeTime("2026-02-26T11:59:30.000Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-02-26T11:40:00.000Z", now)).toBe("20m ago");
    expect(formatRelativeTime("2026-02-26T09:00:00.000Z", now)).toBe("3h ago");
    expect(formatRelativeTime("2026-02-24T12:00:00.000Z", now)).toBe("2d ago");
  });

  it("returns expected badge classes", () => {
    expect(badgeClass("success")).toContain("green");
    expect(badgeClass("warning")).toContain("yellow");
    expect(badgeClass("info")).toContain("blue");
  });
});
