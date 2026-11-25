import React, { useState, useEffect } from "react";
import { TrendingUp, Clock, Award, Layers, Sparkles, RefreshCw, BarChart3, Users } from "lucide-react";
import { api } from "../../services/api";

export default function ProductivityReport() {
  const [timeRange, setTimeRange] = useState("this_month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const json = await api.getProductivityReport({ time_range: timeRange });
      setData(json);
    } catch (err) {
      console.error("Error loading productivity report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [timeRange]);

  return (
    <div className="flex flex-col gap-6 max-w-[1700px] w-full mx-auto">
      {/* HEADER & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            Design & Studio Productivity Analytics
          </h2>
          <p className="text-xs text-slate-500">Live throughput, designer output, and category portfolio balance.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: "today", label: "Today" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "all_time", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  timeRange === tab.id
                    ? "bg-white text-[#2563EB] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReport}
            title="Refresh Metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Sketches Tagged
            </span>
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : data?.kpis?.total_tagged || 0}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Ready in Catalog</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Queue Backlog
            </span>
            <span className="text-2xl font-black text-[#E11D48]">
              {loading ? "..." : data?.kpis?.pending_queue || 0}
            </span>
            <span className="text-[10px] text-rose-500 font-bold block mt-1">Awaiting Metadata</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-center justify-center text-[#E11D48]">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Edits / Updates
            </span>
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : data?.kpis?.total_edits || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Audit Log Recorded</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Top Lead Designer
            </span>
            <span className="text-xl font-black text-[#2563EB] truncate block max-w-[150px]">
              {loading ? "..." : data?.kpis?.top_designer || "None"}
            </span>
            <span className="text-[10px] text-blue-600 font-bold block mt-1">Highest Output Volume</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                Creative Designer Output Ranking
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Total Designs by Artist</span>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400">Loading ranking...</div>
            ) : data?.designer_leaderboard?.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">No output recorded for this period.</div>
            ) : (
              <div className="space-y-4">
                {(data?.designer_leaderboard || []).map((row, idx) => (
                  <div key={row.designer} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        {row.designer}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {row.count} styles <span className="text-slate-400 font-normal">({row.share_pct}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(row.share_pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                Main Category Portfolio Share
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading...</div>
            ) : data?.category_breakdown?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No category data.</div>
            ) : (
              <div className="space-y-3">
                {(data?.category_breakdown || []).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{cat.category}</span>
                      <span className="font-semibold text-slate-500">
                        {cat.count} ({cat.share_pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FDA4AF] h-full rounded-full"
                        style={{ width: `${cat.share_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">
              Target Customers
            </h3>
            <div className="flex flex-wrap gap-2">
              {(data?.customer_breakdown || []).map((cust) => (
                <div
                  key={cust.customer}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2"
                >
                  <span className="text-xs font-bold text-slate-800">{cust.customer}</span>
                  <span className="text-[10px] font-bold bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] px-1.5 py-0.5 rounded-full">
                    {cust.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}