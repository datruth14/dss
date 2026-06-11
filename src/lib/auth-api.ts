const API = "/api/auth-db";

export interface AppEvent {
  id: string;
  name: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface UserEvent {
  userId: string;
  eventId: string;
}

export interface ScanRecord {
  id: string;
  data: string;
  scannedAt: string;
  scannedBy: string;
  eventId: string;
  eventName: string;
}

export interface DbData {
  events: AppEvent[];
  users: AppUser[];
  userEvents: UserEvent[];
  scans: Record<string, ScanRecord[]>;
}

export async function getDb(): Promise<DbData> {
  const res = await fetch(API);
  return res.json();
}

export async function apiPost(action: string, data: any, userId?: string) {
  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data, userId }),
  });
}
