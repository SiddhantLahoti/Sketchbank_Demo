import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, RotateCcw, User } from "lucide-react";
import { api } from "../../services/api";

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [queryText, setQueryText] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [availableActions, setAvailableActions] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const json = await api.getAuditLogs({
        page,
        limit,
        q: queryText.trim(),
        action: selectedAction,
        username: selectedUser,
      });
      setLogs(json.logs || []);
      setTotalCount(json.total || 0);
      if (json.available_actions?.length > 0) setAvailableActions(json.available_actions);
      if (json.available_users?.length > 0) setAvailableUsers(json.available_users);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [queryText, selectedAction, selectedUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, queryText, selectedAction, selectedUser]);

  const resetFilters = () => {
    setQueryText("");
    setSelectedAction("");
    setSelectedUser("");
    setPage(1);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "ACTIVATE_SKETCH":
        return <span className="bg-blue-50 border border-blue-200 text-[#2563EB] px-2 py-0.5 rounded text-[10px] font-bold">ACTIVATE_SKETCH</span>;
      case "UPDATE_METADATA":
        return <span className="bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] px-2 py-0.5 rounded text-[10px] font-bold">UPDATE_METADATA</span>;
      case "UPLOAD_PDF":
        return <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">UPLOAD_PDF</span>;
      default:
        return <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{action}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="flex flex-col gap-5 max-w-[1700px] w-full mx-auto">
      {/* HEADER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              System Audit Trail & History
            </h2>
            <p className="text-xs text-slate-500">Immutable record of sketch uploads, modifications, and state changes.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total Logged Events: <strong className="text-slate-900">{totalCount}</strong>
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by Style #, user, or details..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:bg-white focus:border-[#2563EB] transition"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:border-[#2563EB]"
            >
              <option value="">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:border-[#2563EB]"
            >
              <option value="">All Users</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-[#E11D48] transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* LOGS AUDIT TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Style / Sketch</th>
                <th className="py-3 px-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.username}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#2563EB]">{log.style_number}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalCount > limit && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} events
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}