import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Student } from "../../types";
import { formatDate, getInitials } from "../../lib/utils";
import { Search, UserPlus, Trash2, X } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["students", search, page],
    queryFn: () => api.get(`/students?search=${search}&page=${page}&limit=10`).then(r => r.data),
    placeholderData: prev => prev,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    semester: 1,
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments-for-students"],
    queryFn: () => api.get("/departments").then(r => r.data.data),
    enabled: isCreateOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert("Student deleted successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete student");
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (payload: typeof createForm) => {
      return api.post("/auth/register", {
        ...payload,
        role: "STUDENT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        departmentId: "",
        semester: 1,
      });
      setErrorMsg("");
      alert("Student created successfully!");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create student");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.departmentId) {
      setErrorMsg("Please select a department");
      return;
    }
    createStudentMutation.mutate(createForm);
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage student records and enrollments</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
          >
            <UserPlus size={16} /> Add Student
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
        />
        {data?.meta && <span className="text-xs text-muted-foreground">{data.meta.total} students</span>}
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Student</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">ID</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Department</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Semester</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Enrolled</th>
              {isAdmin && <th className="text-center px-5 py-3.5 text-muted-foreground font-medium w-[80px]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : data?.students?.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-muted-foreground">No students found</td></tr>
            ) : data?.students?.map((s: Student) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(s.user.name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{s.studentId}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-1 rounded-md bg-secondary text-foreground text-xs">{s.department.code}</span>
                </td>
                <td className="px-5 py-3.5 text-foreground">{s.semester}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{formatDate(s.createdAt)}</td>
                {isAdmin && (
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete student "${s.user.name}"?`)) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 glass rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors">Prev</button>
            <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="px-3 py-1.5 glass rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      )}
      {/* Create Student Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-md p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Add New Student</h3>
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
                  placeholder="e.g. Alice Johnson"
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
                  placeholder="e.g. alice@unicontrol.com"
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
                  <label className="text-xs text-muted-foreground block mb-1">Semester *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={8}
                    value={createForm.semester}
                    onChange={e => setCreateForm({ ...createForm, semester: Number(e.target.value) })}
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
                  disabled={createStudentMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {createStudentMutation.isPending ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
