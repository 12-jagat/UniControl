import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Notice } from "../../types";
import { formatDate, getRoleBadgeClass } from "../../lib/utils";
import { Bell, Plus, X, Send, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { user } = useAuthStore();

  // Role permissions
  const canPostNotice = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROFESSOR";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    targetRole: "", // Empty string means "All Users"
    expiresAt: "",
  });

  const queryClient = useQueryClient();

  // Fetch notices
  const { data, isLoading } = useQuery({
    queryKey: ["notices", search],
    queryFn: () => api.get(`/notices?search=${search}&limit=20`).then(r => r.data),
  });

  // Create Notice Mutation
  const createNoticeMutation = useMutation({
    mutationFn: (newNotice: typeof form) => {
      const payload = {
        title: newNotice.title,
        content: newNotice.content,
        targetRole: newNotice.targetRole || null,
        expiresAt: newNotice.expiresAt || undefined,
      };
      return api.post("/notices", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setIsModalOpen(false);
      setForm({
        title: "",
        content: "",
        targetRole: "",
        expiresAt: "",
      });
      setErrorMsg("");
      alert("Notice posted successfully!");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to post notice");
    },
  });

  // Delete Notice Mutation (Admin only)
  const deleteNoticeMutation = useMutation({
    mutationFn: (noticeId: string) => {
      return api.delete(`/notices/${noticeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      alert("Notice deleted successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete notice");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createNoticeMutation.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notice Board</h2>
          <p className="text-sm text-muted-foreground">University announcements and alerts</p>
        </div>
        {canPostNotice && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> Post Notice
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search notices by title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 glass rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="space-y-3">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass rounded-xl h-28 animate-pulse" />) :
          data?.notices?.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center">
              <Bell size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notices available</p>
            </div>
          ) : (
            data?.notices?.map((n: Notice) => (
              <div key={n.id} className="glass rounded-xl p-5 hover:bg-secondary/20 transition-colors relative group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-foreground">{n.title}</h3>
                      {n.targetRole ? (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${getRoleBadgeClass(n.targetRole)}`}>
                          {n.targetRole === "PROFESSOR" ? "FACULTY ONLY" : "STUDENTS ONLY"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-primary/20 text-primary bg-primary/5">
                          ALL USERS
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-between h-full min-h-[50px]">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                      <p className="text-xs text-primary font-medium mt-0.5">{n.author.name}</p>
                    </div>
                    {/* Delete button (Visible to Admins, or author of notice) */}
                    {(isAdmin || n.authorId === user?.id) && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete the notice "${n.title}"?`)) {
                            deleteNoticeMutation.mutate(n.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
      </div>

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-lg p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Post Announcement</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg("");
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Announcement Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. End Semester Exams Schedule"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Content / Message Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your message here..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Target Audience</label>
                  <select
                    value={form.targetRole}
                    onChange={e => setForm({ ...form, targetRole: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" className="bg-slate-900">All Users (Students & Faculty)</option>
                    <option value="STUDENT" className="bg-slate-900">Students Only</option>
                    <option value="PROFESSOR" className="bg-slate-900">Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setErrorMsg(""); }}
                  className="px-4 py-2 bg-secondary border border-border/40 text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNoticeMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Send size={14} />
                  {createNoticeMutation.isPending ? "Posting..." : "Post Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
