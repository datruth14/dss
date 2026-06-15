"use client";

import { useState, useEffect, useCallback } from "react";
import { getDb, apiPost } from "@/lib/inventify-api";
import type { Product, InventifyUser, Request, DbData } from "@/lib/inventify-api";

const ADMIN_CODE = "123456789";

function generateCode(existing: string[]): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existing.includes(code));
  return code;
}

export default function InventifyPage() {
  const [db, setDb] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"login" | "user" | "admin">("login");
  const [loginTab, setLoginTab] = useState<"admin" | "user">("user");
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [currentUser, setCurrentUser] = useState<InventifyUser | null>(null);
  const [adminView, setAdminView] = useState<"dashboard" | "products" | "requests" | "history">("dashboard");
  const [userView, setUserView] = useState<"dashboard" | "my-requests">("dashboard");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", totalCount: "" });
  const [newUserName, setNewUserName] = useState("");
  const [requestQty, setRequestQty] = useState<Record<string, string>>({});

  useEffect(() => { initOneSignal(); }, []);

  const reloadDb = useCallback(async () => {
    const data = await getDb();
    setDb(data);
    return data;
  }, []);

  useEffect(() => {
    reloadDb().then((data) => {
      const raw = sessionStorage.getItem("inventify-session");
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (s.type === "admin") setRole("admin");
          else if (s.type === "user") {
            const u = data.users.find((x: InventifyUser) => x.id === s.userId);
            if (u) { setCurrentUser(u); setRole("user"); }
            else sessionStorage.removeItem("inventify-session");
          }
        } catch { sessionStorage.removeItem("inventify-session"); }
      }
    }).finally(() => setLoading(false));
  }, [reloadDb]);

  // Derived
  const products = db?.products || [];
  const inventUsers = db?.users || [];
  const requests = db?.requests || [];

  function getUserRequests(uid: string) {
    return requests.filter((r) => r.userId === uid).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  function getPendingRequests() {
    return requests.filter((r) => r.status === "pending" || r.status === "return-pending")
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  function getHistory() {
    return requests.filter((r) => r.status === "approved" || r.status === "denied" || r.status === "returned")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  function getAvailableProducts() {
    return products.filter((p) => p.availableCount > 0);
  }

  function initOneSignal() {
    const s = document.createElement("script");
    s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    s.defer = true;
    s.onload = () => {
      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
        await OneSignal.init({ appId: "ea8c73b1-463c-40e8-8bdf-2d4f18c6806c" });
      });
    };
    document.head.appendChild(s);
  }

  const logout = () => {
    sessionStorage.removeItem("inventify-session");
    setRole("login");
    setCode("");
  };

  // Auth
  const handleLogin = () => {
    if (loginTab === "admin") {
      if (code === ADMIN_CODE) {
        sessionStorage.setItem("inventify-session", JSON.stringify({ type: "admin" }));
        setRole("admin");
        setLoginError(false);
      } else setLoginError(true);
    } else {
      const user = inventUsers.find((u) => u.code === code);
      if (user) {
        sessionStorage.setItem("inventify-session", JSON.stringify({ type: "user", userId: user.id }));
        setCurrentUser(user);
        setRole("user");
        setLoginError(false);
      } else setLoginError(true);
    }
  };

  // Products
  const saveProduct = async () => {
    const name = productForm.name.trim();
    const total = parseInt(productForm.totalCount);
    if (!name || isNaN(total) || total < 1) return;
    if (editProduct) {
      const updated = { ...editProduct, name, totalCount: total, availableCount: total - (editProduct.totalCount - editProduct.availableCount) };
      await apiPost("updateProduct", updated);
    } else {
      const p: Product = { id: crypto.randomUUID(), name, totalCount: total, availableCount: total, createdAt: new Date().toISOString() };
      await apiPost("createProduct", p);
    }
    await reloadDb();
    setEditProduct(null);
    setProductForm({ name: "", totalCount: "" });
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await apiPost("deleteProduct", p);
    await reloadDb();
  };

  // Users
  const createUser = async () => {
    const name = newUserName.trim();
    if (!name) return;
    if (inventUsers.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      alert("User already exists."); return;
    }
    const user: InventifyUser = {
      id: crypto.randomUUID(), code: generateCode(inventUsers.map((u) => u.code)),
      name, createdAt: new Date().toISOString(),
    };
    await apiPost("createUser", user);
    await reloadDb();
    setNewUserName("");
  };

  const deleteUser = async (u: InventifyUser) => {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    await apiPost("deleteUser", u);
    await reloadDb();
  };

  // Requests
  const sendNotification = async (heading: string, content: string) => {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, content }),
    });
  };

  const submitRequest = async (product: Product) => {
    if (!currentUser) return;
    const qty = parseInt(requestQty[product.id] || "1");
    if (isNaN(qty) || qty < 1 || qty > product.availableCount) return;
    const req: Request = {
      id: crypto.randomUUID(), userId: currentUser.id, userName: currentUser.name,
      productId: product.id, productName: product.name, quantity: qty,
      status: "pending", requestedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await apiPost("submitRequest", req);
    await reloadDb();
    setRequestQty((prev) => ({ ...prev, [product.id]: "" }));
    sendNotification("New Item Request", `${currentUser.name} requested ${qty}x ${product.name}`);
  };

  const approveRequest = async (req: Request) => {
    const product = products.find((p) => p.id === req.productId);
    if (!product || product.availableCount < req.quantity) { alert("Not enough stock."); return; }
    await apiPost("updateProduct", { ...product, availableCount: product.availableCount - req.quantity });
    await apiPost("updateRequest", { ...req, status: "approved", updatedAt: new Date().toISOString() });
    await reloadDb();
  };

  const denyRequest = async (req: Request) => {
    await apiPost("updateRequest", { ...req, status: "denied", updatedAt: new Date().toISOString() });
    await reloadDb();
  };

  const returnRequest = async (req: Request) => {
    await apiPost("updateRequest", { ...req, status: "return-pending", updatedAt: new Date().toISOString() });
    await reloadDb();
    sendNotification("Item Return Requested", `${req.userName} wants to return ${req.quantity}x ${req.productName}`);
  };

  const approveReturn = async (req: Request) => {
    const product = products.find((p) => p.id === req.productId);
    if (product) {
      await apiPost("updateProduct", { ...product, availableCount: product.availableCount + req.quantity });
    }
    await apiPost("updateRequest", { ...req, status: "returned", updatedAt: new Date().toISOString() });
    await reloadDb();
  };

  // ---- Render ----

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><p className="text-sm text-zinc-500">Loading...</p></div>;

  // === LOGIN ===
  if (role === "login") {
    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div className="flex flex-1 items-center justify-center px-6 pt-16">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-white text-center">Inventify</h1>
            <div className="mt-6 flex border-b border-zinc-800">
              <button onClick={() => { setLoginTab("user"); setCode(""); setLoginError(false); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${loginTab === "user" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>User</button>
              <button onClick={() => { setLoginTab("admin"); setCode(""); setLoginError(false); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${loginTab === "admin" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>Admin</button>
            </div>
            <p className="mt-4 text-sm text-zinc-400 text-center">{loginTab === "user" ? "Enter your 4-digit code" : "Enter admin password"}</p>
            <div className="mt-4">
              <input type="password" inputMode="numeric" maxLength={loginTab === "admin" ? 9 : 4} value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setLoginError(false); }}
                onKeyDown={(e) => { const len = loginTab === "admin" ? 9 : 4; if (e.key === "Enter" && code.length === len) handleLogin(); }}
                placeholder={loginTab === "admin" ? "000000000" : "0000"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" autoFocus />
              {loginError && <p className="mt-2 text-sm text-red-400 text-center">{loginTab === "admin" ? "Invalid admin password" : "Code not recognised"}</p>}
            </div>
            <button onClick={handleLogin} disabled={code.length !== (loginTab === "admin" ? 9 : 4)}
              className="mt-6 w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Login</button>
          </div>
        </div>
      </div>
    );
  }

  // === ADMIN ===
  if (role === "admin") {
    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div className="z-10 flex flex-1 flex-col pt-24">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <button onClick={logout} className="text-xs text-zinc-400 hover:text-red-400 transition-colors">Logout</button>
            </div>
          </div>

          {/* Nav */}
          <div className="flex border-b border-zinc-800">
            {(["dashboard", "products", "requests", "history"] as const).map((v) => (
              <button key={v} onClick={() => setAdminView(v)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${adminView === v ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>{v}</button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {adminView === "dashboard" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-2xl font-bold text-white">{products.length}</p><p className="text-xs text-zinc-400 mt-1">Products</p></div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-2xl font-bold text-white">{inventUsers.length}</p><p className="text-xs text-zinc-400 mt-1">Users</p></div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-2xl font-bold text-amber-400">{requests.filter((r) => r.status === "pending").length}</p><p className="text-xs text-zinc-400 mt-1">Pending Requests</p></div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-2xl font-bold text-amber-400">{requests.filter((r) => r.status === "return-pending").length}</p><p className="text-xs text-zinc-400 mt-1">Pending Returns</p></div>
              </div>
            )}

            {adminView === "products" && (
              <>
                <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h2 className="text-sm font-semibold text-zinc-300">{editProduct ? "Edit Product" : "Add Product"}</h2>
                  <div className="mt-3 flex gap-3">
                    <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Product name" className="flex-1 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                    <input type="number" value={productForm.totalCount} onChange={(e) => setProductForm({ ...productForm, totalCount: e.target.value })}
                      placeholder="Total count" min="1" className="w-24 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-center" />
                    <button onClick={saveProduct} disabled={!productForm.name.trim() || !productForm.totalCount}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors whitespace-nowrap">{editProduct ? "Update" : "Add"}</button>
                    {editProduct && <button onClick={() => { setEditProduct(null); setProductForm({ name: "", totalCount: "" }); }} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>}
                  </div>
                </div>
                <div className="space-y-3">
                  {products.length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No products yet.</p> : (
                    products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{p.availableCount} / {p.totalCount} available</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setEditProduct(p); setProductForm({ name: p.name, totalCount: String(p.totalCount) }); }} className="text-xs text-amber-400 hover:text-amber-300">Edit</button>
                          <button onClick={() => deleteProduct(p)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {adminView === "requests" && (
              <div className="space-y-3">
                {getPendingRequests().length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No pending requests or returns.</p> : (
                  getPendingRequests().map((req) => (
                    <div key={req.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{req.productName}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">by {req.userName} &middot; qty: {req.quantity}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.requestedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${req.status === "pending" ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"}`}>{req.status === "return-pending" ? "Return Requested" : "Pending"}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {req.status === "pending" && (
                          <><button onClick={() => approveRequest(req)} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">Approve</button>
                            <button onClick={() => denyRequest(req)} className="rounded-lg border border-red-700 px-4 py-1.5 text-xs text-red-400 hover:bg-red-950">Deny</button></>
                        )}
                        {req.status === "return-pending" && (
                          <button onClick={() => approveReturn(req)} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">Approve Return</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {adminView === "history" && (
              <div className="space-y-3">
                {getHistory().length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No history yet.</p> : (
                  getHistory().map((req) => (
                    <div key={req.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{req.productName} &times; {req.quantity}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{req.userName}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.updatedAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          req.status === "approved" ? "bg-emerald-900/50 text-emerald-300" :
                          req.status === "returned" ? "bg-blue-900/50 text-blue-300" : "bg-red-900/50 text-red-300"
                        }`}>{req.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === USER ===
  const myRequests = currentUser ? getUserRequests(currentUser.id) : [];

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950">
      <div className="z-10 flex flex-1 flex-col pt-24">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <p className="text-xs text-zinc-500">Inventify</p>
            <h1 className="text-lg font-bold text-white">{currentUser?.name || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="text-xs text-zinc-400 hover:text-red-400 transition-colors">Logout</button>
          </div>
        </div>

        <div className="flex border-b border-zinc-800">
          <button onClick={() => setUserView("dashboard")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "dashboard" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Dashboard</button>
          <button onClick={() => setUserView("my-requests")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "my-requests" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>My Requests ({myRequests.length})</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {userView === "dashboard" ? (
            <>
              {/* Current requests */}
              {myRequests.filter((r) => r.status === "approved").length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-zinc-300 mb-3">Items to Return</h2>
                  <div className="space-y-3">
                    {myRequests.filter((r) => r.status === "approved").map((req) => (
                      <div key={req.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{req.productName} &times; {req.quantity}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Approved {new Date(req.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => returnRequest(req)} className="rounded-lg border border-amber-700 px-4 py-1.5 text-xs text-amber-400 hover:bg-amber-950 transition-colors">Return</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available products */}
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Available Products</h2>
              {getAvailableProducts().length === 0 ? (
                <p className="text-sm text-zinc-500 text-center pt-8">No products available.</p>
              ) : (
                <div className="space-y-3">
                  {getAvailableProducts().map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.availableCount} available</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max={p.availableCount} value={requestQty[p.id] || ""}
                          onChange={(e) => setRequestQty({ ...requestQty, [p.id]: e.target.value })}
                          placeholder="Qty" className="w-16 rounded-lg border border-zinc-700 bg-black px-3 py-1.5 text-xs text-white text-center focus:border-amber-500 focus:outline-none" />
                        <button onClick={() => submitRequest(p)}
                          disabled={!requestQty[p.id] || parseInt(requestQty[p.id]) < 1}
                          className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Request</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {myRequests.length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No requests yet.</p> : (
                myRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{req.productName} &times; {req.quantity}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.requestedAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        req.status === "pending" ? "bg-amber-900/50 text-amber-300" :
                        req.status === "approved" ? "bg-emerald-900/50 text-emerald-300" :
                        req.status === "denied" ? "bg-red-900/50 text-red-300" :
                        req.status === "return-pending" ? "bg-blue-900/50 text-blue-300" : "bg-zinc-800 text-zinc-400"
                      }`}>{req.status.replace("-", " ")}</span>
                    </div>
                    {(req.status === "approved") && (
                      <div className="mt-3">
                        <button onClick={() => returnRequest(req)} className="rounded-lg border border-amber-700 px-4 py-1.5 text-xs text-amber-400 hover:bg-amber-950 transition-colors">Return</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
