"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getDb, apiPost } from "@/lib/api";
import type { AppEvent, AppUser, ScanRecord, DbData } from "@/lib/api";

const ADMIN_CODE = "123456789";

function generateCode(existing: string[]): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existing.includes(code));
  return code;
}

export default function MealTicketPage() {
  const [db, setDb] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<
    "login" | "select-event" | "scanner" | "admin"
  >("login");
  const [loginTab, setLoginTab] = useState<"admin" | "scanner">("scanner");
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentEvent, setCurrentEvent] = useState<AppEvent | null>(null);
  const [availableEvents, setAvailableEvents] = useState<AppEvent[]>([]);
  const [view, setView] = useState<"scanner" | "records">("scanner");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "duplicate";
    data: string;
    message: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [adminView, setAdminView] = useState<
    "events" | "event-detail" | "user-scans"
  >("events");
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [selectedLoginEvent, setSelectedLoginEvent] = useState<AppEvent | null>(null);

  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const autoStartedRef = useRef(false);
  const [scannerBoxSize, setScannerBoxSize] = useState(0);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) setScannerBoxSize(w);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- Database ----

  const reloadDb = useCallback(async () => {
    const data = await getDb();
    setDb(data);
    return data;
  }, []);

  useEffect(() => {
    reloadDb().then((data) => {
      const raw = sessionStorage.getItem("meal-ticket-session");
      if (raw) {
        try {
          const session = JSON.parse(raw);
          if (session.type === "admin") {
            setRole("admin");
          } else if (session.type === "scanner") {
            const user = data.users.find((u: AppUser) => u.id === session.userId);
            const event = data.events.find((e: AppEvent) => e.id === session.eventId);
            const assigned = data.userEvents.some(
              (ue: any) => ue.userId === session.userId && ue.eventId === session.eventId
            );
            if (user && event && assigned) {
              setCurrentUser(user);
              setCurrentEvent(event);
              setScans(data.scans?.[user.id] || []);
              setRole("scanner");
            } else {
              sessionStorage.removeItem("meal-ticket-session");
            }
          }
        } catch {
          sessionStorage.removeItem("meal-ticket-session");
        }
      }
    }).finally(() => setLoading(false));
  }, [reloadDb]);

  // ---- Derived data ----

  const events = db?.events || [];
  const users = db?.users || [];
  const userEvents = db?.userEvents || [];

  function getUserScansFor(userId: string): ScanRecord[] {
    return db?.scans?.[userId] || [];
  }

  function getUserByCode(c: string): AppUser | undefined {
    return users.find((u) => u.code === c);
  }

  function getUserEventsForUser(userId: string): AppEvent[] {
    const ue = userEvents.filter((ue) => ue.userId === userId);
    return events.filter((e) => ue.some((u) => u.eventId === e.id));
  }

  function getUsersForEvent(eventId: string): AppUser[] {
    const ue = userEvents.filter((ue) => ue.eventId === eventId);
    return users.filter((u) => ue.some((eu) => eu.userId === u.id));
  }

  function isUserAssignedToEvent(userId: string, eventId: string): boolean {
    return userEvents.some(
      (ue) => ue.userId === userId && ue.eventId === eventId
    );
  }

  // ---- Login ----

  const handleLogin = () => {
    if (loginTab === "admin") {
      if (code === ADMIN_CODE) {
        sessionStorage.setItem("meal-ticket-session", JSON.stringify({ type: "admin" }));
        setRole("admin");
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    } else {
      if (!selectedLoginEvent) {
        setLoginError(true);
        return;
      }
      const user = getUserByCode(code);
      if (user && isUserAssignedToEvent(user.id, selectedLoginEvent.id)) {
        sessionStorage.setItem(
          "meal-ticket-session",
          JSON.stringify({ type: "scanner", userId: user.id, eventId: selectedLoginEvent.id })
        );
        setCurrentUser(user);
        setCurrentEvent(selectedLoginEvent);
        setScans(getUserScansFor(user.id));
        setRole("scanner");
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    }
  };

  const handleLoginTabChange = (tab: "admin" | "scanner") => {
    setLoginTab(tab);
    setCode("");
    setLoginError(false);
    setSelectedLoginEvent(null);
  };

  const logout = () => {
    sessionStorage.removeItem("meal-ticket-session");
    setRole("login");
    setCode("");
    stopScanner();
  };

  const selectEvent = (event: AppEvent) => {
    if (!currentUser) return;
    setCurrentEvent(event);
    setScans(getUserScansFor(currentUser.id));
    setRole("scanner");
  };

  const changeEvent = () => {
    if (!currentUser) return;
    stopScanner();
    setCurrentEvent(null);
    setAvailableEvents(getUserEventsForUser(currentUser.id));
    setRole("select-event");
  };

  // ---- Scanner ----

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  const startScanner = useCallback(
    async (cameraMode: "environment" | "user" = "environment") => {
      if (!videoRef.current || scannerRef.current || !currentUser) return;

      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("meal-ticket-reader");
      scannerRef.current = scanner;

      setScanning(true);

      try {
        await scanner.start(
          { facingMode: cameraMode },
          { qrbox: { width: 250, height: 250 }, fps: 10 },
          async (decodedText: string) => {
            if (scannerRef.current) scannerRef.current.pause();

            const existing = getUserScansFor(currentUser.id);
            const duplicate = existing.find((s) => s.data === decodedText);

            if (duplicate) {
              setScanResult({
                status: "duplicate",
                data: decodedText,
                message: `Already scanned at ${new Date(
                  duplicate.scannedAt
                ).toLocaleString()}`,
              });
              return;
            }

            const record: ScanRecord = {
              id: crypto.randomUUID(),
              data: decodedText,
              scannedAt: new Date().toISOString(),
              scannedBy: currentUser.name || currentUser.code,
              eventId: currentEvent?.id || "",
              eventName: currentEvent?.name || "",
            };

            await apiPost("saveScan", record, currentUser.id);
            const fresh = await reloadDb();
            setScans(fresh.scans?.[currentUser.id] || []);
            setScanResult({
              status: "success",
              data: decodedText,
              message: "Ticket scanned successfully!",
            });
          },
          () => {}
        );
      } catch {
        if (cameraMode === "environment") {
          await stopScanner();
          startScanner("user");
        } else {
          setScanning(false);
          setScanResult({
            status: "duplicate",
            data: "",
            message: "Camera not found.",
          });
        }
      }
    },
    [currentUser, currentEvent, stopScanner, reloadDb]
  );

  useEffect(() => {
    if (role !== "scanner" || view !== "scanner") {
      stopScanner();
      autoStartedRef.current = false;
    }
  }, [role, view, stopScanner]);

  useEffect(() => {
    if (role === "scanner" && view === "scanner" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startScanner();
    }
  }, [role, view, startScanner]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (scanResult?.status === "success") {
      const t = setTimeout(() => window.location.reload(), 1500);
      return () => clearTimeout(t);
    }
    if (scanResult?.status === "duplicate") {
      const t = setTimeout(() => {
        setScanResult(null);
        scannerRef.current?.resume();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [scanResult]);

  // ---- Admin actions ----

  const createEvent = async () => {
    const name = newEventName.trim();
    if (!name) return;
    const event: AppEvent = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    await apiPost("createEvent", event);
    await reloadDb();
    setNewEventName("");
  };

  const createUserForEvent = async () => {
    const name = newUserName.trim();
    if (!name || !selectedEvent) return;
    if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      alert(`User "${name}" already exists.`);
      return;
    }
    const existingCodes = users.map((u) => u.code);
    const user: AppUser = {
      id: crypto.randomUUID(),
      code: generateCode(existingCodes),
      name,
      createdAt: new Date().toISOString(),
    };
    await apiPost("createUser", user);
    await apiPost("createUserEvent", { userId: user.id, eventId: selectedEvent.id });
    await reloadDb();
    setNewUserName("");
  };

  const clearUserScans = async (userId: string) => {
    if (!confirm("Clear all scans for this user?")) return;
    await apiPost("clearScans", null, userId);
    await reloadDb();
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  // === LOGIN SCREEN ===
  if (role === "login") {
    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pt-16">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-white text-center">
              Meal Ticket Scanner
            </h1>

            <div className="mt-6 flex border-b border-zinc-800">
              <button
                onClick={() => handleLoginTabChange("scanner")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  loginTab === "scanner"
                    ? "border-b-2 border-amber-500 text-amber-400"
                    : "text-zinc-500"
                }`}
              >
                Scanner
              </button>
              <button
                onClick={() => handleLoginTabChange("admin")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  loginTab === "admin"
                    ? "border-b-2 border-amber-500 text-amber-400"
                    : "text-zinc-500"
                }`}
              >
                Admin
              </button>
            </div>

            {loginTab === "scanner" ? (
              <>
                <p className="mt-4 mb-3 text-sm text-zinc-400 text-center">
                  Select Event
                </p>

                <select
                  value={selectedLoginEvent?.id || ""}
                  onChange={(e) => {
                    const ev = events.find((ev) => ev.id === e.target.value);
                    setSelectedLoginEvent(ev || null);
                    setLoginError(false);
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select an event
                  </option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  <p className="mb-2 text-xs text-zinc-500 text-center">
                    Enter your 4-digit code
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setLoginError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && code.length === 4 && selectedLoginEvent)
                        handleLogin();
                    }}
                    placeholder="0000"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <p className="mt-2 text-sm text-red-400 text-center">
                    Invalid code or not assigned to this event
                  </p>
                )}

                <button
                  onClick={handleLogin}
                  disabled={!selectedLoginEvent || code.length !== 4}
                  className="mt-6 w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-zinc-400 text-center">
                  Enter admin password
                </p>

                <div className="mt-4">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={9}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setLoginError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && code.length === 9)
                        handleLogin();
                    }}
                    placeholder="000000000"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                  {loginError && (
                    <p className="mt-2 text-sm text-red-400 text-center">
                      Invalid admin password
                    </p>
                  )}
                </div>

                <button
                  onClick={handleLogin}
                  disabled={code.length !== 9}
                  className="mt-6 w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === EVENT SELECTION (scanner picks event after login) ===
  if (role === "select-event") {
    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div className="relative z-10 flex flex-1 flex-col pt-24">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h1 className="text-lg font-bold text-white">Select Event</h1>
            <button
              onClick={() => {
                setRole("login");
                setCode("");
              }}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {availableEvents.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 pt-12">
                No events assigned to you yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {availableEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => selectEvent(event)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-left transition-colors hover:border-amber-500/50"
                  >
                    <p className="text-base font-semibold text-white">
                      {event.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === ADMIN DASHBOARD ===
  if (role === "admin") {
    if (adminView === "user-scans" && selectedUser && selectedEvent) {
      const userScans = getUserScansFor(selectedUser.id);
      return (
        <div className="relative flex min-h-screen flex-col bg-zinc-950">
          <div className="relative z-10 flex flex-1 flex-col pt-24">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <button
                onClick={() => {
                  setAdminView("event-detail");
                  setSelectedUser(null);
                }}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                &larr; Back
              </button>
              <div className="text-center">
                <p className="text-xs text-zinc-500">{selectedEvent.name}</p>
                <h1 className="text-lg font-bold text-white">
                  {selectedUser.name}
                </h1>
              </div>
              <button
                onClick={logout}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {userScans.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 pt-12">
                  No scans yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-zinc-400">
                        <th className="pb-3 pr-4 font-medium">#</th>
                        <th className="pb-3 pr-4 font-medium">Event</th>
                        <th className="pb-3 pr-4 font-medium">Data</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userScans.map((r, i) => (
                        <tr
                          key={r.id}
                          className="border-b border-zinc-800/50"
                        >
                          <td className="py-3 pr-4 text-zinc-500 font-mono text-xs">
                            {i + 1}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400 text-xs">
                            {r.eventName || "—"}
                          </td>
                          <td className="py-3 pr-4 text-white font-mono text-xs break-all max-w-[150px]">
                            {r.data}
                          </td>
                          <td className="py-3 text-zinc-400 text-xs whitespace-nowrap">
                            {new Date(r.scannedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                onClick={() => clearUserScans(selectedUser.id)}
                className="mt-4 w-full rounded-lg border border-red-800 py-2 text-sm text-red-400 hover:bg-red-950 transition-colors"
              >
                Clear All Scans
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (adminView === "event-detail" && selectedEvent) {
      const eventUsers = getUsersForEvent(selectedEvent.id);
      return (
        <div className="relative flex min-h-screen flex-col bg-zinc-950">
          <div className="relative z-10 flex flex-1 flex-col pt-24">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <button
                onClick={() => {
                  setAdminView("events");
                  setSelectedEvent(null);
                }}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                &larr; Events
              </button>
              <h1 className="text-lg font-bold text-white">
                {selectedEvent.name}
              </h1>
              <button
                onClick={logout}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-sm font-semibold text-zinc-300">
                Add Scanner User
              </h2>
              <div className="mt-3 flex gap-3">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && createUserForEvent()
                  }
                  placeholder="User name"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={createUserForEvent}
                  disabled={!newUserName.trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {eventUsers.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 pt-12">
                  No users in this event yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-zinc-400">
                        <th className="pb-3 pr-4 font-medium">Name</th>
                        <th className="pb-3 pr-4 font-medium">Code</th>
                        <th className="pb-3 pr-4 font-medium">Scans</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-zinc-800/50"
                        >
                          <td className="py-3 pr-4 text-white font-medium">
                            {user.name}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400 font-mono">
                            {user.code}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {getUserScansFor(user.id).length}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setAdminView("user-scans");
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                View Scans
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete scanner "${user.name}"?`)) {
                                    await apiPost("deleteUser", user);
                                    await reloadDb();
                                  }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div className="relative z-10 flex flex-1 flex-col pt-24">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            <button
              onClick={() => {
                setRole("login");
                setCode("");
              }}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-300">
              Create Event
            </h2>
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createEvent()}
                placeholder="Event name"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={createEvent}
                disabled={!newEventName.trim()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {events.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 pt-12">
                No events created yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-zinc-400">
                      <th className="pb-3 pr-4 font-medium">Event</th>
                      <th className="pb-3 pr-4 font-medium">Users</th>
                      <th className="pb-3 pr-4 font-medium">Created</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const userCount = getUsersForEvent(event.id).length;
                      return (
                        <tr
                          key={event.id}
                          className="border-b border-zinc-800/50"
                        >
                          <td className="py-3 pr-4 text-white font-medium">
                            {event.name}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {userCount}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400 text-xs">
                            {new Date(
                              event.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setNewUserName("");
                                  setAdminView("event-detail");
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                Manage
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete "${event.name}" and all its data?`)) {
                                    await apiPost("deleteEvent", event);
                                    await reloadDb();
                                  }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === SCANNER VIEW ===
  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950">
      <div className="relative z-10 flex flex-1 flex-col pt-24">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <button
              onClick={changeEvent}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              &larr; {currentEvent?.name || "Event"}
            </button>
            <h1 className="text-lg font-bold text-white">
              Meal Ticket Scanner
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {currentUser?.name || currentUser?.code}
            </span>
            <button
              onClick={logout}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setView("scanner")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === "scanner"
                ? "border-b-2 border-amber-500 text-amber-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => setView("records")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === "records"
                ? "border-b-2 border-amber-500 text-amber-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Scanned Data ({scans.length})
          </button>
        </div>

        {view === "scanner" ? (
          <div className="flex flex-1 flex-col items-center px-6 pt-12 pb-8">
            <div
              id="meal-ticket-reader"
              ref={videoRef}
              className="w-full max-w-md overflow-hidden rounded-xl bg-zinc-900"
              style={scannerBoxSize > 0 ? { height: scannerBoxSize } : { aspectRatio: "1 / 1" }}
            />

            {!scanning && !scanResult && (
              <button
                onClick={() => startScanner()}
                className="mt-6 rounded-lg bg-amber-500 px-8 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Start Scanner
              </button>
            )}

            {scanning && !scanResult && (
              <button
                onClick={stopScanner}
                className="mt-6 rounded-lg border border-red-700 px-6 py-2 text-sm text-red-400 hover:bg-red-950 transition-colors"
              >
                Stop Scanner
              </button>
            )}

            {scanResult && (
              <div className="mt-6 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                    scanResult.status === "success"
                      ? "bg-emerald-900/50 text-emerald-400"
                      : "bg-amber-900/50 text-amber-400"
                  }`}
                >
                  {scanResult.status === "success" ? "\u2713" : "\u26A0"}
                </div>
                <p
                  className={`mt-4 text-sm font-semibold ${
                    scanResult.status === "success"
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {scanResult.status === "success"
                    ? "Ticket Scanned Successfully"
                    : "Duplicate Ticket"}
                </p>
                <p className="mt-2 break-all text-xs text-zinc-400 font-mono">
                  {scanResult.data}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {scans.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 pt-12">
                No tickets scanned yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-zinc-400">
                      <th className="pb-3 pr-4 font-medium">ID</th>
                      <th className="pb-3 pr-4 font-medium">Event</th>
                      <th className="pb-3 pr-4 font-medium">Data</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((record, idx) => (
                      <tr
                        key={record.id}
                        className="border-b border-zinc-800/50"
                      >
                        <td className="py-3 pr-4 text-zinc-500 font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4 text-zinc-400 text-xs">
                          {record.eventName || "—"}
                        </td>
                        <td className="py-3 pr-4 text-white font-mono text-xs break-all max-w-[150px]">
                          {record.data}
                        </td>
                        <td className="py-3 text-zinc-400 text-xs whitespace-nowrap">
                          {new Date(
                            record.scannedAt
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={async () => {
                if (!currentUser) return;
                if (!confirm("Clear all scanned records?")) return;
                await apiPost("clearScans", null, currentUser.id);
                setScans([]);
              }}
              className="mt-6 w-full rounded-lg border border-red-800 py-2 text-sm text-red-400 hover:bg-red-950 transition-colors"
            >
              Clear All Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
