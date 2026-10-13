import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values from conditional expressions", () => {
    const active = false;
    expect(cn("base", active && "active", null, undefined, "", "end")).toBe("base end");
  });
});
