// frontend/src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Tab1Upload from "@/components/Tab1Upload";
import TextualSearch from "@/components/TextualSearch";
import ProductivityReport from "@/components/ProductivityReport";
import LogsViewer from "@/components/LogsViewer";
import ImageSimilarity from "@/components/ImageSimilarity";

interface UserSession {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>("New Sketch Upload");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");

  const tabs = [
    "New Sketch Upload",
    // "Edit Details",
    "Backlog Upload",
    "Textual Search",
    "Image Similarity",
    "Productivity Report",
    "Logs",
    "My Profile",
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBackendUrl(`http://${window.location.hostname}:8000`);
      const cached = localStorage.getItem("sketchbank_user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      setUser(data);
      localStorage.setItem("sketchbank_user", JSON.stringify(data));
      setActiveTab("New Sketch Upload");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sketchbank_user");
    setUser(null);
    setUsername("");
    setPassword("");
  };

  // --- 1. LIGHT-THEMED LOGIN GATEKEEPER ---
  if (!user) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-md">
              💍
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jewelry OS</h1>
            <p className="text-xs text-slate-500">Sign in to access Sketchbank</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. anurag or sandip"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg text-sm text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- 2. MAIN APPLICATION WORKSPACE ---
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col">
      <Navbar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-6 flex flex-col">
        {activeTab === "New Sketch Upload" ? (
            <Tab1Upload
              backendUrl={backendUrl}
              userId={user.user_id}
              username={user.username}
            />
          ) : activeTab === "Textual Search" ? (
            <TextualSearch
              backendUrl={backendUrl}
              userId={user.user_id}
              username={user.username}
            />
          ): activeTab === "Image Similarity" ? (
            <ImageSimilarity backendUrl={backendUrl} />
          ): activeTab === "Productivity Report" ? (
            <ProductivityReport backendUrl={backendUrl} />
          ) : activeTab === "Logs" ? (
            <LogsViewer backendUrl={backendUrl} />
          ): activeTab === "My Profile" ? (
            /* Profile Tab */
            <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">User Profile</h2>
                <p className="text-xs text-slate-500">Currently active session</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full uppercase">
                {user.role}
              </span>
            </div>

            <div className="space-y-3 font-mono text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">User ID:</span>
                <span className="font-semibold text-slate-900">{user.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="font-semibold text-blue-600">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold rounded-lg text-sm transition"
            >
              Log Out
            </button>
          </div>
        ) : (
              /* Placeholder View for other tabs */
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeTab}</h2>
                <p className="text-sm text-slate-500 max-w-md">
                  Screen container for <strong>{activeTab}</strong>.
                </p>
              </div>
            )}
          </main>
    </div>
  );
}