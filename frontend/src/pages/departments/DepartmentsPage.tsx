import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Department } from "../../types";
import { Building2, Plus, X, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { user } = useAuthStore();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // Fetch Departments
  const { data, isLoading } = useQuery({
    queryKey: ["departments", search],
    queryFn: () => api.get(`/departments?search=${search}`).then(r => r.data.data as Department[]),
  });

  // Create Department Mutation
  const createMutation = useMutation({
    mutationFn: (newDept: typeof form) => {
      return api.post("/departments", newDept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsModalOpen(false);
      setForm({ name: "", code: "", description: "" });
      setErrorMsg("");
      alert("Department created successfully!");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create department");
    },
  });

  // Delete Department Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      alert("Department removed successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete department");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Departments</h2>
          <p className="text-sm text-muted-foreground">Manage academic departments</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> New Department
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search departments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 glass rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-xl h-36 animate-pulse" />) :
          data?.map((d: Department) => (
            <div key={d.id} className="glass rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 glow cursor-pointer relative group">
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete the department "${d.name}"? This might affect related faculty, students, and courses.`)) {
                      deleteMutation.mutate(d.id);
                    }
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Remove Department"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs font-mono text-primary">{d.code}</p>
                </div>
              </div>
              {d.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{d.description}</p>}
              {d._count && (
                <div className="flex gap-4 pt-3 border-t border-border/50">
                  <div className="text-center"><p className="text-lg font-bold text-foreground">{d._count.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-foreground">{d._count.professors}</p><p className="text-xs text-muted-foreground">Faculty</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-foreground">{d._count.courses}</p><p className="text-xs text-muted-foreground">Courses</p></div>
                </div>
              )}
            </div>
          ))
        }
      </div>

      {/* New Department Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-md p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Create Department</h3>
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
                <label className="text-xs text-muted-foreground block mb-1">Department Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mechanical Engineering"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Department Code *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ME"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Department of Mechanical Engineering..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
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
                  disabled={createMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {createMutation.isPending ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
