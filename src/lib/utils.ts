type ClassValue = string | false | null | undefined | 0;

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ');
}
