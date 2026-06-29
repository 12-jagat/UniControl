import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Course, Department, Professor, Student } from "../../types";
import { BookOpen, Plus, Users, X, UserCheck, GraduationCap, ArrowRight, UserPlus } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Assign teacher form state
  const [assignProfessorId, setAssignProfessorId] = useState("");
  // Enroll student form state
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollSemester, setEnrollSemester] = useState("Spring 2026");

  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    creditHours: 3,
    maxStudents: 60,
    departmentId: "",
    professorId: "",
  });

  const queryClient = useQueryClient();

  // Fetch Courses list
  const { data, isLoading } = useQuery({
    queryKey: ["courses", search, page],
    queryFn: () => api.get(`/courses?search=${search}&page=${page}&limit=12`).then(r => r.data),
    placeholderData: prev => prev,
  });

  // Fetch Departments for selectors
  const { data: deptsData } = useQuery({
    queryKey: ["departments-list"],
    queryFn: () => api.get("/departments").then(r => r.data.data),
    enabled: isModalOpen,
  });

  // Fetch Faculty (Professors) for selectors
  const { data: facultyData } = useQuery({
    queryKey: ["faculty-list"],
    queryFn: () => api.get("/faculty?limit=100").then(r => r.data.data.faculty),
    enabled: isModalOpen || !!selectedCourse,
  });

  // Fetch Students for enrollment selector
  const { data: studentsData } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => api.get("/students?limit=200").then(r => r.data.students),
    enabled: !!selectedCourse && isAdmin,
  });

  // Fetch full details of the clicked course (including enrollments)
  const { data: courseDetail, refetch: refetchCourseDetail } = useQuery({
    queryKey: ["course-detail", selectedCourse?.id],
    queryFn: () => api.get(`/courses/${selectedCourse?.id}`).then(r => r.data.data),
    enabled: !!selectedCourse?.id,
  });

  // Sync selected professor ID when course details are fetched
  useEffect(() => {
    if (courseDetail) {
      setAssignProfessorId(courseDetail.professorId || "");
    }
  }, [courseDetail]);

  // Create Course Mutation
  const createMutation = useMutation({
    mutationFn: (newCourse: typeof form) => {
      const payload = {
        ...newCourse,
        professorId: newCourse.professorId || null,
      };
      return api.post("/courses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsModalOpen(false);
      setForm({
        code: "",
        title: "",
        description: "",
        creditHours: 3,
        maxStudents: 60,
        departmentId: "",
        professorId: "",
      });
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create course");
    },
  });

  // Update Course Instructor Mutation
  const assignInstructorMutation = useMutation({
    mutationFn: (profId: string | null) => {
      return api.put(`/courses/${selectedCourse?.id}`, { professorId: profId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      refetchCourseDetail();
      alert("Instructor successfully updated!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to update instructor");
    },
  });

  // Enroll Student Mutation
  const enrollStudentMutation = useMutation({
    mutationFn: (payload: { studentId: string; semester: string }) => {
      return api.post(`/courses/${selectedCourse?.id}/enroll`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      refetchCourseDetail();
      setEnrollStudentId("");
      alert("Student enrolled successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to enroll student");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createMutation.mutate(form);
  };

  const handleAssignInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    assignInstructorMutation.mutate(assignProfessorId || null);
  };

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId) {
      alert("Please select a student.");
      return;
    }
    enrollStudentMutation.mutate({
      studentId: enrollStudentId,
      semester: enrollSemester,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Courses</h2>
          <p className="text-sm text-muted-foreground">Browse and manage the course catalog</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> New Course
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full px-4 py-2.5 glass rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-xl h-40 animate-pulse" />) :
          data?.courses?.map((c: Course) => (
            <div
              key={c.id}
              onClick={() => setSelectedCourse(c)}
              className="glass rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 glow cursor-pointer relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-400" />
                </div>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{c.code}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{c.department?.name}</p>
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{c.creditHours} credits</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} /> {c._count?.enrollments ?? 0}/{c.maxStudents}
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh] overflow-y-auto glow shadow-2xl relative animate-in zoom-in-95 duration-200 border border-border/40">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/40 pb-4 mb-5">
              <div>
                <span className="text-xs font-mono font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-md mb-2 inline-block">
                  {selectedCourse.code}
                </span>
                <h3 className="text-xl font-bold text-foreground">{selectedCourse.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedCourse.department?.name} • {selectedCourse.creditHours} Credits</p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left side info */}
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</h4>
                  <p className="text-sm text-foreground leading-relaxed bg-secondary/20 p-3 rounded-lg border border-border/20">
                    {courseDetail?.description || "No description provided for this course."}
                  </p>
                </div>

                {/* Enrolled Students list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Enrolled Students ({courseDetail?.enrollments?.length ?? 0} / {selectedCourse.maxStudents})
                    </h4>
                  </div>

                  <div className="glass rounded-xl overflow-hidden border border-border/30 max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-4 py-2 text-muted-foreground">Student</th>
                          <th className="text-left px-4 py-2 text-muted-foreground">Student ID</th>
                          <th className="text-left px-4 py-2 text-muted-foreground">Semester</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseDetail?.enrollments?.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-muted-foreground italic">
                              No students enrolled in this course yet.
                            </td>
                          </tr>
                        ) : (
                          courseDetail?.enrollments?.map((e: any) => (
                            <tr key={e.id} className="border-b border-border/20 hover:bg-secondary/10">
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-foreground">{e.student.user.name}</p>
                                <p className="text-[10px] text-muted-foreground">{e.student.user.email}</p>
                              </td>
                              <td className="px-4 py-2.5 font-mono">{e.student.studentId}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{e.semester}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right side options: Assign Instructor & Enroll Student */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Instructor details / assignment */}
                <div className="glass p-4 rounded-xl border border-border/40">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Instructor Details
                  </h4>
                  {courseDetail?.professor ? (
                    <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-lg border border-border/30 mb-4">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {courseDetail.professor.user.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{courseDetail.professor.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{courseDetail.professor.title || "Professor"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs mb-4">
                      No instructor currently assigned to this course.
                    </div>
                  )}

                  {/* Assign Teacher Dropdown form (Admin only) */}
                  {isAdmin && (
                    <form onSubmit={handleAssignInstructor} className="space-y-2">
                      <label className="text-[10px] text-muted-foreground font-medium block">
                        {courseDetail?.professor ? "Change Instructor" : "Assign Instructor"}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={assignProfessorId}
                          onChange={e => setAssignProfessorId(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-secondary/50 border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Unassigned (None)</option>
                          {facultyData?.map((f: Professor) => (
                            <option key={f.id} value={f.id}>
                              {f.user.name} ({f.department?.code})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={assignInstructorMutation.isPending}
                          className="flex items-center justify-center p-1.5 gradient-primary hover:opacity-90 rounded-lg text-white disabled:opacity-50 shrink-0 cursor-pointer"
                          title="Save Instructor"
                        >
                          <UserCheck size={16} />
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Enroll student form (Admin only) */}
                {isAdmin && (
                  <div className="glass p-4 rounded-xl border border-border/40">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Enroll Student
                    </h4>
                    <form onSubmit={handleEnrollStudent} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Select Student</label>
                        <select
                          required
                          value={enrollStudentId}
                          onChange={e => setEnrollStudentId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Choose Student --</option>
                          {studentsData?.map((s: Student) => (
                            <option key={s.id} value={s.id}>
                              {s.user.name} ({s.studentId})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Semester</label>
                        <input
                          required
                          type="text"
                          value={enrollSemester}
                          onChange={e => setEnrollSemester(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={enrollStudentMutation.isPending}
                        className="w-full py-2 bg-secondary border border-border/40 hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus size={14} />
                        {enrollStudentMutation.isPending ? "Enrolling..." : "Enroll Student"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh] overflow-y-auto glow shadow-2xl relative animate-in zoom-in-95 duration-200 border border-border/40">
            <h3 className="text-lg font-bold text-foreground mb-1">Create New Course</h3>
            <p className="text-xs text-muted-foreground mb-5">Fill in the fields below to add a new course to the catalog.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="CS301"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="Compiler Design"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the course content..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Credit Hours *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={6}
                    value={form.creditHours}
                    onChange={e => setForm({ ...form, creditHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Max Students *</label>
                  <input
                    required
                    type="number"
                    min={5}
                    max={120}
                    value={form.maxStudents}
                    onChange={e => setForm({ ...form, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Department *</label>
                  <select
                    required
                    value={form.departmentId}
                    onChange={e => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled className="bg-slate-900 text-muted-foreground">Select Department</option>
                    {deptsData?.map((d: Department) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-foreground">{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Instructor (Professor)</label>
                  <select
                    value={form.professorId}
                    onChange={e => setForm({ ...form, professorId: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" className="bg-slate-900 text-muted-foreground">None (Unassigned)</option>
                    {facultyData?.map((f: Professor) => (
                      <option key={f.id} value={f.id} className="bg-slate-900 text-foreground">{f.user.name}</option>
                    ))}
                  </select>
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
                  disabled={createMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
