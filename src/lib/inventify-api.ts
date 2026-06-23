const API = "/api/inventify-db";

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  image?: string;
  totalCount: number;
  availableCount: number;
  assignedTo?: string;
  createdAt: string;
}

export interface InventifyUser {
  id: string;
  code: string;
  name: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface Request {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  quantity: number;
  purpose?: string;
  status: "pending" | "approved" | "denied" | "return-pending" | "returned";
  requestedAt: string;
  updatedAt: string;
}

export interface DbData {
  products: Product[];
  users: InventifyUser[];
  requests: Request[];
  categories: Category[];
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
