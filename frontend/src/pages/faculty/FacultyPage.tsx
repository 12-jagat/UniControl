import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Professor } from "../../types";
import { formatDate, getInitials } from "../../lib/utils";
import { Search, UserPlus, Trash2, X } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function FacultyPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["faculty", search, page],
    queryFn: () => api.get(`/faculty?search=${search}&page=${page}&limit=10`).then(r => r.data),
    placeholderData: prev => prev,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "Prof@123",
    departmentId: "",
    employeeTitle: "Professor",
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments-for-faculty"],
    queryFn: () => api.get("/departments").then(r => r.data.data),
    enabled: isCreateOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/faculty/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      alert("Faculty member deleted successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete faculty member");
    },
  });

  const createFacultyMutation = useMutation({
    mutationFn: (payload: typeof createForm) => {
      return api.post("/auth/register", {
        ...payload,
        role: "PROFESSOR",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "Prof@123",
        departmentId: "",
        employeeTitle: "Professor",
      });
      setErrorMsg("");
      alert("Faculty member created successfully!");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create faculty member");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.departmentId) {
      setErrorMsg("Please select a department");
      return;
    }
    createFacultyMutation.mutate(createForm);
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Faculty</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage professors and instructors</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <UserPlus size={16} /> Add Faculty
          </button>
        )}
      </div>

      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <Search size={16} className="text-muted-foreground" />
        <input type="text" placeholder="Search faculty..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none" />
        {data?.meta && <span className="text-xs text-muted-foreground">{data.meta.total} professors</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({length: 6}).map((_, i) => <div key={i} className="glass rounded-xl h-40 animate-pulse" />)
        ) : data?.faculty?.map((p: Professor) => (
          <div key={p.id} className="glass rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200 glow cursor-pointer relative group">
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to permanently delete faculty member "${p.user.name}"?`)) {
                    deleteMutation.mutate(p.id);
                  }
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                title="Delete Faculty Member"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                {getInitials(p.user.name)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{p.user.name}</p>
                <p className="text-xs text-muted-foreground">{p.title ?? "Professor"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{p.user.email}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md">{p.department.code}</span>
              <span className="text-xs text-muted-foreground">Joined {formatDate(p.joiningDate)}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Create Faculty Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-md p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Add New Faculty</h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setErrorMsg("");
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Robert Downey"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. robert@unicontrol.com"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Password *</label>
                <input
                  required
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Department *</label>
                  <select
                    required
                    value={createForm.departmentId}
                    onChange={e => setCreateForm({ ...createForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled className="bg-slate-900 text-muted-foreground">Select Dept</option>
                    {deptsData?.map((d: any) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-foreground">{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Employee Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Associate Professor"
                    value={createForm.employeeTitle}
                    onChange={e => setCreateForm({ ...createForm, employeeTitle: e.target.value })}
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
                  onClick={() => { setIsCreateOpen(false); setErrorMsg(""); }}
                  className="px-4 py-2 bg-secondary border border-border/40 text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFacultyMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {createFacultyMutation.isPending ? "Adding..." : "Add Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
