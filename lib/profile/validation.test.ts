import { describe, expect, it } from "vitest";
import {
  normalizeUsername,
  validateBio,
  validateFullName,
  validatePassword,
  validateUsername,
} from "./validation";

describe("profile validation", () => {
  it("normalizes username", () => {
    expect(normalizeUsername("  John Doe  ")).toBe("johndoe");
  });

  it("accepts valid username and rejects invalid username", () => {
    expect(validateUsername("john_123")).toBeNull();
    expect(validateUsername("John Doe")).toContain("Username must be");
    expect(validateUsername("ab")).toContain("Username must be");
  });

  it("validates full name and bio lengths", () => {
    expect(validateFullName("A".repeat(80))).toBeNull();
    expect(validateFullName("A".repeat(81))).toContain("under 80");
    expect(validateBio("A".repeat(280))).toBeNull();
    expect(validateBio("A".repeat(281))).toContain("under 280");
  });

  it("enforces password strength", () => {
    expect(validatePassword("Password1")).toBeNull();
    expect(validatePassword("short1")).toContain("at least 8");
    expect(validatePassword("longpassword")).toContain("letters and numbers");
  });
});
