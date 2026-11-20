// frontend/src/components/Navbar.tsx
"use client";

import React from "react";

interface UserSession {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

interface NavbarProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
}

export default function Navbar({
  tabs,
  activeTab,
  setActiveTab,
  user,
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            💍
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Jewelry <span className="text-blue-600 font-extrabold">OS</span>
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-rose-50 border border-rose-300 text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Right: Status Pill & User Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Demo Mode
          </div>

          <div
            onClick={() => setActiveTab("My Profile")}
            title="Open Profile"
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
          >
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}