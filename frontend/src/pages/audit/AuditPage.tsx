import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { AuditLog } from "../../types";
import { formatDate, getRoleBadgeClass } from "../../lib/utils";
import { Shield } from "lucide-react";

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["audit", page],
    queryFn: () => api.get(`/audit?page=${page}&limit=20`).then(r => r.data),
    placeholderData: prev => prev,
  });

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-foreground">Audit Logs</h2><p className="text-sm text-muted-foreground">Track critical system actions</p></div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {["Action", "Entity", "User", "IP", "Time"].map(h => <th key={h} className="text-left px-5 py-3.5 text-muted-foreground font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : data?.logs?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12"><Shield size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No audit logs</p></td></tr>
            ) :
            data?.logs?.map((l: AuditLog) => (
              <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3.5"><span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">{l.action}</span></td>
                <td className="px-5 py-3.5 text-muted-foreground">{l.entity}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-foreground">{l.user.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${getRoleBadgeClass(l.user.role)}`}>{l.user.role}</span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{l.ipAddress ?? "—"}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 glass rounded-lg disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p+1))} disabled={page===data.meta.totalPages} className="px-3 py-1.5 glass rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
