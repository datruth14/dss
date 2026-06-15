const API = "/api/inventify-db";

export interface Product {
  id: string;
  name: string;
  totalCount: number;
  availableCount: number;
  createdAt: string;
}

export interface InventifyUser {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Request {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  quantity: number;
  status: "pending" | "approved" | "denied" | "return-pending" | "returned";
  requestedAt: string;
  updatedAt: string;
}

export interface DbData {
  products: Product[];
  users: InventifyUser[];
  requests: Request[];
  oneSignalSubscriptions: { id: string; playerId: string; role: string }[];
}

export async function getDb(): Promise<DbData> {
  const res = await fetch(API);
  return res.json();
}

export async function apiPost(action: string, data: any) {
  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
  });
}
