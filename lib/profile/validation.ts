export const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function validateUsername(value: string): string | null {
  if (!value) return null;
  if (!USERNAME_REGEX.test(value)) {
    return "Username must be 3-24 chars using lowercase letters, numbers, or underscore";
  }
  return null;
}

export function validateFullName(value: string): string | null {
  if (value.trim().length > 80) {
    return "Full name must be under 80 characters";
  }
  return null;
}

export function validateBio(value: string): string | null {
  if (value.trim().length > 280) {
    return "Bio must be under 280 characters";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value.trim()) return "Password is required";
  if (value.trim().length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) {
    return "Password must include letters and numbers";
  }
  return null;
}
