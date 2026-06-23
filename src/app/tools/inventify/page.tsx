"use client";

import { useState, useEffect, useCallback } from "react";
import { getDb, apiPost } from "@/lib/inventify-api";
import type { Product, InventifyUser, Request, DbData, Category } from "@/lib/inventify-api";

const ADMIN_CODE = "123456789";

export default function InventifyPage() {
  const [db, setDb] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"login" | "user" | "admin">("login");
  const [loginTab, setLoginTab] = useState<"admin" | "user">("user");
  const [code, setCode] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<InventifyUser | null>(null);
  const [adminView, setAdminView] = useState<"dashboard" | "products" | "requests" | "history" | "users">("dashboard");
  const [userView, setUserView] = useState<"dashboard" | "my-requests" | "my-assets" | "profile">("dashboard");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ description: "", image: "", totalCount: "", category: "" });

  const [requestQty, setRequestQty] = useState<Record<string, string>>({});
  const [requestPurpose, setRequestPurpose] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userPlayerId, setUserPlayerId] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");

  useEffect(() => { initOneSignal(); }, []);

  useEffect(() => { if (userPlayerId && (role === "admin" || role === "user")) subscribePlayer(); }, [userPlayerId, role]);

  const reloadDb = useCallback(async () => {
    const data = await getDb();
    setDb(data);
    return data;
  }, []);

  useEffect(() => {
    if (role !== "admin" && role !== "user") return;
    const id = setInterval(() => reloadDb(), 5000);
    return () => clearInterval(id);
  }, [role, reloadDb]);

  useEffect(() => {
    reloadDb().then((data) => {
      if (data.categories.length === 0) {
        const cat: Category = { id: crypto.randomUUID(), name: "Table and Chairs Dressing" };
        apiPost("createCategory", cat).then(() => reloadDb());
      }
      const raw = localStorage.getItem("inventify-session");
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (s.type === "admin") setRole("admin");
          else if (s.type === "user") {
            const u = data.users.find((x: InventifyUser) => x.id === s.userId);
            if (u) { setCurrentUser(u); setRole("user"); }
            else localStorage.removeItem("inventify-session");
          }
        } catch { localStorage.removeItem("inventify-session"); }
      }
    }).finally(() => setLoading(false));
  }, [reloadDb]);

  // Derived
  const products = db?.products || [];
  const inventUsers = db?.users || [];
  const requests = db?.requests || [];
  const categories = db?.categories || [];

  const [newCategoryName, setNewCategoryName] = useState("");

  function categoryName(id?: string) {
    if (!id) return "";
    return categories.find((c) => c.id === id)?.name || id;
  }

  function statusLabel(s: string) {
    const map: Record<string, string> = {
      "pending": "Pending", "approved": "Approved", "denied": "Denied",
      "return-pending": "Returned unconfirmed", "returned": "Returned confirmed",
    };
    return map[s] || s;
  }

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
    return requests.filter((r) => r.status === "approved" || r.status === "denied" || r.status === "returned" || r.status === "return-pending")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  function getAvailableProducts() {
    return products.filter((p) => p.availableCount > 0).sort((a, b) => b.availableCount - a.availableCount);
  }

  function getFilteredProducts() {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return getAvailableProducts();
    return getAvailableProducts().filter((p) => p.name.toLowerCase().includes(q));
  }

  function getUserAssets(uid: string) {
    return products.filter((p) => p.assignedTo === uid);
  }

  function initOneSignal() {
    const s = document.createElement("script");
    s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    s.defer = true;
    s.onload = () => {
      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
        await OneSignal.init({ appId: "ea8c73b1-463c-40e8-8bdf-2d4f18c6806c" });
        const pid = await OneSignal.getUserId();
        if (pid) setUserPlayerId(pid);
      });
    };
    document.head.appendChild(s);
  }

  const subscribePlayer = async () => {
    if (!userPlayerId) return;
    if (role === "admin") {
      await apiPost("saveSubscription", { id: "admin", playerId: userPlayerId, role: "admin" });
    } else if (currentUser) {
      await apiPost("saveSubscription", { id: currentUser.id, playerId: userPlayerId, role: "user" });
    }
  };

  const logout = () => {
    localStorage.removeItem("inventify-session");
    setRole("login");
    setCode("");
    setRegName("");
    setRegPassword("");
    setRegPhone("");
    setLoginName("");
    setLoginPassword("");
    setIsRegistering(true);
    setLoginError("");
  };

  // Auth
  const handleAdminLogin = () => {
    if (code === ADMIN_CODE) {
      localStorage.setItem("inventify-session", JSON.stringify({ type: "admin" }));
      setRole("admin");
      setLoginError("");
    } else setLoginError("Invalid admin password");
  };

  const handleRegister = async () => {
    const name = regName.trim();
    const password = regPassword.trim();
    const phone = regPhone.trim();
    if (!name || !password || !phone) return;
    if (inventUsers.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      setLoginError("KC name already registered. Please log in.");
      return;
    }
    if (inventUsers.some((u) => u.phone === phone)) {
      setLoginError("Phone already registered.");
      return;
    }
    const user: InventifyUser = {
      id: crypto.randomUUID(), code: phone.slice(-4), name, phone, password, createdAt: new Date().toISOString(),
    };
    await apiPost("createUser", user);
    await reloadDb();
    localStorage.setItem("inventify-session", JSON.stringify({ type: "user", userId: user.id }));
    setCurrentUser(user);
    setRole("user");
  };

  const handleUserLogin = async () => {
    const name = loginName.trim();
    const password = loginPassword.trim();
    if (!name || !password) return;
    const existing = inventUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.password !== password) {
        setLoginError("Incorrect password.");
        return;
      }
      localStorage.setItem("inventify-session", JSON.stringify({ type: "user", userId: existing.id }));
      setCurrentUser(existing);
      setRole("user");
    } else {
      setLoginError("KC name not found. Please register.");
    }
  };

  // Products
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/cloudinary-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setProductForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProduct = async () => {
    const description = productForm.description.trim();
    const total = parseInt(productForm.totalCount);
    const image = productForm.image.trim() || undefined;
    const category = productForm.category || undefined;
    if (!description || isNaN(total) || total < 1) return;
    if (editProduct) {
      const updated = { ...editProduct, name: description, image, totalCount: total, availableCount: total - (editProduct.totalCount - editProduct.availableCount), description };
      if (category !== undefined) updated.category = category;
      else delete updated.category;
      await apiPost("updateProduct", updated);
    } else {
      const p: Product = { id: crypto.randomUUID(), name: description, image, totalCount: total, availableCount: total, createdAt: new Date().toISOString(), description };
      if (category) p.category = category;
      await apiPost("createProduct", p);
    }
    await reloadDb();
    setEditProduct(null);
    setProductForm({ description: "", image: "", totalCount: "", category: "" });
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    if (p.image) {
      try { await fetch("/api/cloudinary-upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: p.image }) }); } catch {}
    }
    await apiPost("deleteProduct", p);
    await reloadDb();
  };

  const assignProduct = async (p: Product, userId: string) => {
    await apiPost("updateProduct", { ...p, assignedTo: userId });
    await reloadDb();
    const user = inventUsers.find((u) => u.id === userId);
    if (user) sendNotification("Asset Assigned", `"${p.name}" has been assigned to you.`, userPlayerIds(userId));
  };

  const resetPassword = async (u: InventifyUser) => {
    const pw = newPasswords[u.id]?.trim();
    if (!pw || !confirm(`Reset password for ${u.name}?`)) return;
    await apiPost("updateUser", { ...u, password: pw });
    await reloadDb();
    setNewPasswords((prev) => ({ ...prev, [u.id]: "" }));
  };

  const unassignProduct = async (p: Product) => {
    await apiPost("updateProduct", { ...p, assignedTo: undefined });
    await reloadDb();
  };

  // Requests
  const sendNotification = async (heading: string, content: string, playerIds?: string[]) => {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading, content, playerIds }),
    });
  };

  const userPlayerIds = (userId: string) =>
    db?.oneSignalSubscriptions?.filter((s) => s.id === userId).map((s) => s.playerId) || [];

  const submitRequest = async (product: Product) => {
    if (!currentUser) return;
    const qty = parseInt(requestQty[product.id] || "1");
    const purpose = (requestPurpose[product.id] || "").trim();
    if (isNaN(qty) || qty < 1 || qty > product.availableCount) return;
    if (!purpose) { alert("Please provide a purpose for this request."); return; }
    const req: Request = {
      id: crypto.randomUUID(), userId: currentUser.id, userName: currentUser.name,
      productId: product.id, productName: product.name, quantity: qty, purpose,
      status: "pending", requestedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await apiPost("submitRequest", req);
    await reloadDb();
    setRequestQty((prev) => ({ ...prev, [product.id]: "" }));
    setRequestPurpose((prev) => ({ ...prev, [product.id]: "" }));
    sendNotification("New Item Request", `${currentUser.name} requested ${qty}x ${product.name} for ${purpose}`);
  };

  const approveRequest = async (req: Request) => {
    const product = products.find((p) => p.id === req.productId);
    if (!product || product.availableCount < req.quantity) { alert("Not enough stock."); return; }
    await apiPost("updateProduct", { ...product, availableCount: product.availableCount - req.quantity });
    await apiPost("updateRequest", { ...req, status: "approved", updatedAt: new Date().toISOString() });
    await reloadDb();
    sendNotification("Request Approved", `Your request for ${req.quantity}x ${req.productName} has been approved.`, userPlayerIds(req.userId));
  };

  const denyRequest = async (req: Request) => {
    await apiPost("updateRequest", { ...req, status: "denied", updatedAt: new Date().toISOString() });
    await reloadDb();
    sendNotification("Request Denied", `Your request for ${req.quantity}x ${req.productName} has been denied.`, userPlayerIds(req.userId));
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
    sendNotification("Return Confirmed", `Your return of ${req.quantity}x ${req.productName} has been confirmed.`, userPlayerIds(req.userId));
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    const name = profileName.trim();
    const password = profilePassword.trim();
    if (!name && !password) return;
    const updated = { ...currentUser };
    if (name) updated.name = name;
    if (password) updated.password = password;
    await apiPost("updateUser", updated);
    await reloadDb();
    localStorage.setItem("inventify-session", JSON.stringify({ type: "user", userId: updated.id }));
    setCurrentUser(updated);
    setProfileName("");
    setProfilePassword("");
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
              <button onClick={() => { setLoginTab("user"); setCode(""); setLoginError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${loginTab === "user" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>User</button>
              <button onClick={() => { setLoginTab("admin"); setCode(""); setLoginError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${loginTab === "admin" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>Admin</button>
            </div>
            {loginTab === "user" ? (
              <>
                <div className="mt-4 flex border-b border-zinc-800">
                  <button onClick={() => { setIsRegistering(true); setLoginError(""); setRegName(""); setRegPassword(""); setRegPhone(""); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${isRegistering ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>Register</button>
                  <button onClick={() => { setIsRegistering(false); setLoginError(""); setLoginName(""); setLoginPassword(""); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${!isRegistering ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500"}`}>Login</button>
                </div>
                <div className="mt-6 space-y-4">
                  {isRegistering ? (
                    <>
                      <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                        placeholder="KC name" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Password" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="Phone number" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <button onClick={handleRegister} disabled={!regName.trim() || !regPassword.trim() || !regPhone.trim()}
                        className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Register</button>
                    </>
                  ) : (
                    <>
                      <input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)}
                        placeholder="KC name" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUserLogin(); }}
                        placeholder="Password" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <button onClick={handleUserLogin} disabled={!loginName.trim() || !loginPassword.trim()}
                        className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Login</button>
                    </>
                  )}
                  {loginError && <p className="text-sm text-red-400 text-center">{loginError}</p>}
                </div>
              </>
            ) : (
              <><p className="mt-4 text-sm text-zinc-400 text-center">Enter admin password</p>
              <div className="mt-4">
                <input type="password" inputMode="numeric" maxLength={9} value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setLoginError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && code.length === 9) handleAdminLogin(); }}
                  placeholder="000000000"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" autoFocus />
                {loginError === "Invalid admin password" && <p className="mt-2 text-sm text-red-400 text-center">Invalid admin password</p>}
              </div>
              <button onClick={handleAdminLogin} disabled={code.length !== 9}
                className="mt-6 w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Login</button></>
            )}
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
            {(["dashboard", "products", "requests", "history", "users"] as const).map((v) => (
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
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Product description"
                        className="flex-1 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none resize-none" rows={2} />
                      <input type="number" value={productForm.totalCount} onChange={(e) => setProductForm({ ...productForm, totalCount: e.target.value })}
                        placeholder="Unit(s)" min="1" className="w-24 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-center" />
                    </div>
                    <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-zinc-300 focus:border-amber-500 focus:outline-none">
                      <option value="">Select category...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-3 items-center">
                      <label className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm text-zinc-400 cursor-pointer hover:border-zinc-500 transition-colors">
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span className="truncate">{uploading ? "Uploading..." : productForm.image ? "Change image" : "Upload image"}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={uploading}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                      </label>
                      {productForm.image && (
                        <div className="relative shrink-0">
                          <img src={productForm.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                          <button onClick={() => setProductForm((p) => ({ ...p, image: "" }))} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white hover:bg-red-500">x</button>
                        </div>
                      )}
                      <button onClick={saveProduct} disabled={!productForm.description.trim() || !productForm.totalCount}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors whitespace-nowrap">{editProduct ? "Update" : "Add"}</button>
                      {editProduct && <button onClick={() => { setEditProduct(null); setProductForm({ description: "", image: "", totalCount: "", category: "" }); }} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>}
                    </div>
                  </div>
                </div>

                {/* Manage Categories */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors select-none">Manage Categories</summary>
                  <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex gap-2">
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name" className="flex-1 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                      <button onClick={async () => {
                        const name = newCategoryName.trim();
                        if (!name) return;
                        await apiPost("createCategory", { id: crypto.randomUUID(), name });
                        await reloadDb();
                        setNewCategoryName("");
                      }} disabled={!newCategoryName.trim()}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Add</button>
                    </div>
                    {categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-black px-3 py-1.5 text-sm text-zinc-300">
                            <span>{c.name}</span>
                            <button onClick={async () => {
                              if (!confirm(`Delete category "${c.name}"?`)) return;
                              await apiPost("deleteCategory", { id: c.id });
                              await reloadDb();
                            }} className="text-xs text-red-400 hover:text-red-300">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.length === 0 ? <p className="col-span-full text-center text-sm text-zinc-500 pt-8">No products yet.</p> : (
                    products.map((p) => {
                      const assignedUser = p.assignedTo ? inventUsers.find((u) => u.id === p.assignedTo) : null;
                      return (
                        <div key={p.id} className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                          <div className="aspect-[4/3] bg-zinc-800">
                            {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                              : <div className="flex h-full items-center justify-center text-zinc-600"><svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                          </div>
                          <div className="flex flex-1 flex-col justify-between p-3">
                            <div>
                              <p className="text-sm font-semibold text-white truncate">{p.description || p.name}</p>
                              {p.category && <p className="text-xs text-zinc-400 mt-0.5">{categoryName(p.category)}</p>}
                              <p className="text-xs text-zinc-500 mt-0.5">{p.availableCount} / {p.totalCount} unit(s)</p>
                              {assignedUser && <p className="text-xs text-amber-400 mt-0.5">Assigned to {assignedUser.name}</p>}
                            </div>
                            <div className="mt-2 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button onClick={() => { setEditProduct(p); setProductForm({ description: p.description || "", image: p.image || "", totalCount: String(p.totalCount), category: p.category || "" }); }} className="flex-1 rounded bg-amber-500/10 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors">Edit</button>
                                <button onClick={() => deleteProduct(p)} className="flex-1 rounded bg-red-500/10 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                              </div>
                              {!p.assignedTo ? (
                                <select defaultValue="" onChange={(e) => { if (e.target.value) assignProduct(p, e.target.value); }}
                                  className="rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none">
                                  <option value="" disabled>Assign to user...</option>
                                  {inventUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                              ) : (
                                <button onClick={() => unassignProduct(p)} className="rounded-lg border border-zinc-700 py-1.5 text-xs text-zinc-400 hover:border-red-700 hover:text-red-400 transition-colors">Unassign</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {adminView === "users" && (
              <div className="space-y-4">
                {inventUsers.length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No users registered.</p> : (
                  inventUsers.map((u) => {
                    const userAssets = products.filter((p) => p.assignedTo === u.id);
                    return (
                      <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{u.phone} &middot; Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs text-zinc-400">{userAssets.length} asset{userAssets.length !== 1 ? "s" : ""}</span>
                      </div>
                      {userAssets.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {userAssets.map((a) => (
                            <div key={a.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2">
                              <div className="flex items-center gap-2">
                                {a.image ? <img src={a.image} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-zinc-800" />}
                                <span className="text-xs text-zinc-300">{a.name}</span>
                              </div>
                              <button onClick={() => unassignProduct(a)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <select defaultValue="" onChange={(e) => { if (e.target.value) assignProduct(products.find((p) => p.id === e.target.value)!, u.id); }}
                          className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none">
                          <option value="" disabled>Assign asset...</option>
                          {products.filter((p) => !p.assignedTo).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="password" value={newPasswords[u.id] || ""}
                          onChange={(e) => setNewPasswords({ ...newPasswords, [u.id]: e.target.value })}
                          placeholder="New password"
                          className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                        <button onClick={() => resetPassword(u)}
                          className="rounded-lg border border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 hover:border-amber-700 hover:text-amber-400 transition-colors whitespace-nowrap">Reset PW</button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
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
                          {req.purpose && <p className="text-xs text-zinc-500 mt-0.5">Purpose: {req.purpose}</p>}
                          <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.requestedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${req.status === "pending" ? "bg-amber-900/50 text-amber-300" : "bg-amber-900/50 text-amber-300"}`}>{statusLabel(req.status)}</span>
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
                          {req.purpose && <p className="text-xs text-zinc-500 mt-0.5">Purpose: {req.purpose}</p>}
                          <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.updatedAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          req.status === "approved" ? "bg-emerald-900/50 text-emerald-300" :
                          req.status === "returned" ? "bg-blue-900/50 text-blue-300" :
                          req.status === "return-pending" ? "bg-amber-900/50 text-amber-300" : "bg-red-900/50 text-red-300"
                        }`}>{statusLabel(req.status)}</span>
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
  const myAssets = currentUser ? getUserAssets(currentUser.id) : [];
  const myAssetsCount = myAssets.length;

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
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "dashboard" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Browse</button>
          <button onClick={() => setUserView("my-assets")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "my-assets" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>My Assets ({myAssetsCount})</button>
          <button onClick={() => setUserView("my-requests")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "my-requests" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>My Requests ({myRequests.length})</button>
          <button onClick={() => setUserView("profile")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${userView === "profile" ? "border-b-2 border-amber-500 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Profile</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {userView === "my-assets" && (
            <>
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">My Assets</h2>
              {myAssets.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center pt-8">No assets assigned to you yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {myAssets.map((a) => (
                    <div key={a.id} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                      <div className="aspect-[4/3] bg-zinc-800">
                        {a.image ? <img src={a.image} alt={a.name} className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center text-zinc-600"><svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white truncate">{a.description || a.name}</p>
                        {a.category && <p className="text-xs text-zinc-400 mt-0.5">{categoryName(a.category)}</p>}
                        <p className="text-xs text-zinc-500 mt-0.5">Assigned to you</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {userView === "dashboard" && (
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
                          {req.purpose && <p className="text-xs text-zinc-400 mt-0.5">Purpose: {req.purpose}</p>}
                        </div>
                        <button onClick={() => returnRequest(req)} className="rounded-lg border border-amber-700 px-4 py-1.5 text-xs text-amber-400 hover:bg-amber-950 transition-colors">Return</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available products */}
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Available Products</h2>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..." className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
              {getFilteredProducts().length === 0 ? (
                <p className="text-sm text-zinc-500 text-center pt-8">No products found.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getFilteredProducts().map((p) => (
                    <div key={p.id} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                      <div className="aspect-[4/3] bg-zinc-800">
                        {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center text-zinc-600"><svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                          <p className="text-sm font-semibold text-white truncate">{p.description || p.name}</p>
                          {p.category && <p className="text-xs text-zinc-400 mt-0.5">{categoryName(p.category)}</p>}
                          <p className="text-xs text-zinc-500 mt-0.5">{p.availableCount} unit(s)</p>
                        </div>
                        <div className="mt-2 space-y-2">
                          <input type="text" value={requestPurpose[p.id] || ""}
                            onChange={(e) => setRequestPurpose({ ...requestPurpose, [p.id]: e.target.value })}
                            placeholder="Purpose of request" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" max={p.availableCount} value={requestQty[p.id] || ""}
                              onChange={(e) => setRequestQty({ ...requestQty, [p.id]: e.target.value })}
                              placeholder="Qty" className="w-full rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-xs text-white text-center focus:border-amber-500 focus:outline-none" />
                            <button onClick={() => submitRequest(p)}
                              disabled={!requestQty[p.id] || parseInt(requestQty[p.id]) < 1 || !requestPurpose[p.id]?.trim()}
                              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Request</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {userView === "my-requests" && (
            <div className="space-y-3">
              {myRequests.length === 0 ? <p className="text-center text-sm text-zinc-500 pt-8">No requests yet.</p> : (
                myRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{req.productName} &times; {req.quantity}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(req.requestedAt).toLocaleString()}</p>
                        {req.purpose && <p className="text-xs text-zinc-400 mt-0.5">Purpose: {req.purpose}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        req.status === "pending" ? "bg-amber-900/50 text-amber-300" :
                        req.status === "approved" ? "bg-emerald-900/50 text-emerald-300" :
                        req.status === "denied" ? "bg-red-900/50 text-red-300" :
                        req.status === "return-pending" ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"
                      }`}>{statusLabel(req.status)}</span>
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
          {userView === "profile" && (
            <div className="max-w-sm mx-auto space-y-4 pt-4">
              <h2 className="text-sm font-semibold text-zinc-300">Update Profile</h2>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                placeholder={currentUser?.name || "New name"} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
              <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="New password" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none" />
              <button onClick={handleUpdateProfile} disabled={!profileName.trim() && !profilePassword.trim()}
                className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
