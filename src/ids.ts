import { ulid } from "ulid";

export function newId(prefix: string): string {
  return `${prefix}_${ulid()}`;
}

export function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function nowIso(): string {
  return new Date().toISOString();
}
