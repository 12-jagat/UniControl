import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { formatDate } from "../../lib/utils";
import { Check, X, Clock, AlertCircle, Calendar, Save, CheckCircle } from "lucide-react";

interface StudentEnrollment {
  id: string;
  student: {
    id: string;
    studentId: string;
    user: {
      name: string;
      email: string;
    };
  };
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "STUDENT";
  const isProfessor = user?.role === "PROFESSOR";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();

  // ─── STUDENT FLOW ────────────────────────────────────────────────────────
  // 1. Fetch Student profile to get their enrollments
  const { data: studentProfile, isLoading: isStudentProfileLoading } = useQuery({
    queryKey: ["student-profile", user?.student?.id],
    queryFn: () => api.get(`/students/${user?.student?.id}`).then(r => r.data.data),
    enabled: isStudent && !!user?.student?.id,
  });

  // Find selected enrollment ID for student
  const activeStudentEnrollment = studentProfile?.enrollments?.find(
    (e: any) => e.courseId === selectedCourseId
  );

  // 2. Fetch Attendance history for selected enrollment
  const { data: studentAttendance, isLoading: isStudentAttendanceLoading } = useQuery({
    queryKey: ["student-attendance", activeStudentEnrollment?.id],
    queryFn: () => api.get(`/attendance/enrollment/${activeStudentEnrollment?.id}`).then(r => r.data.data),
    enabled: isStudent && !!activeStudentEnrollment?.id,
  });

  // 3. Fetch Student attendance summary
  const { data: studentSummary } = useQuery({
    queryKey: ["student-attendance-summary", activeStudentEnrollment?.id],
    queryFn: () => api.get(`/attendance/enrollment/${activeStudentEnrollment?.id}/summary`).then(r => r.data.data),
    enabled: isStudent && !!activeStudentEnrollment?.id,
  });


  // ─── PROFESSOR / ADMIN FLOW ──────────────────────────────────────────────
  // 1. Fetch Courses taught by Professor
  const { data: professorProfile } = useQuery({
    queryKey: ["professor-profile", user?.professor?.id],
    queryFn: () => api.get(`/faculty/${user?.professor?.id}`).then(r => r.data.data),
    enabled: isProfessor && !!user?.professor?.id,
  });

  // 2. Fetch all Courses if Admin
  const { data: allCoursesData } = useQuery({
    queryKey: ["all-courses-list"],
    queryFn: () => api.get("/courses?limit=100").then(r => r.data),
    enabled: isAdmin,
  });

  // Determine course selection choices
  const coursesToSelect = isProfessor
    ? professorProfile?.courses ?? []
    : isAdmin
    ? allCoursesData?.courses ?? []
    : studentProfile?.enrollments?.map((e: any) => e.course) ?? [];

  // 3. Fetch Course details (including enrolled students)
  const { data: selectedCourseDetail, isLoading: isCourseDetailLoading } = useQuery({
    queryKey: ["course-detail", selectedCourseId],
    queryFn: () => api.get(`/courses/${selectedCourseId}`).then(r => r.data.data),
    enabled: (isAdmin || isProfessor) && !!selectedCourseId,
  });

  // Sync attendance map when course detail is loaded
  useEffect(() => {
    if (selectedCourseDetail) {
      const initialMap: Record<string, { status: string; remarks: string }> = {};
      selectedCourseDetail.enrollments?.forEach((enrollment: StudentEnrollment) => {
        initialMap[enrollment.id] = { status: "PRESENT", remarks: "" };
      });
      setAttendanceMap(initialMap);
    }
  }, [selectedCourseDetail]);

  // ─── MUTATIONS ───────────────────────────────────────────────────────────
  const bulkMarkMutation = useMutation({
    mutationFn: (records: { enrollmentId: string; date: string; status: string; remarks?: string }[]) => {
      return api.post("/attendance/bulk", { records });
    },
    onSuccess: () => {
      setSuccessMessage("Attendance successfully saved for this class!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 4000);
      queryClient.invalidateQueries({ queryKey: ["course-detail", selectedCourseId] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || "Failed to submit attendance");
    },
  });

  const handleMarkStatus = (enrollmentId: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], status },
    }));
  };

  const handleMarkRemarks = (enrollmentId: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], remarks },
    }));
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const records = Object.entries(attendanceMap).map(([enrollmentId, data]) => ({
      enrollmentId,
      date: selectedDate,
      status: data.status,
      remarks: data.remarks || undefined,
    }));

    if (records.length === 0) {
      setErrorMessage("No students to submit attendance for.");
      return;
    }

    bulkMarkMutation.mutate(records);
  };

  // Status helper styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-semibold"><Check size={12} /> Present</span>;
      case "ABSENT":
        return <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full text-xs font-semibold"><X size={12} /> Absent</span>;
      case "LATE":
        return <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-semibold"><Clock size={12} /> Late</span>;
      case "EXCUSED":
        return <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-semibold"><AlertCircle size={12} /> Excused</span>;
      default:
        return <span className="text-muted-foreground text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Attendance Tracker</h2>
        <p className="text-sm text-muted-foreground">Manage and review classroom attendance logs</p>
      </div>

      {/* Course Selector Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass p-4 rounded-xl items-end">
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={e => {
              setSelectedCourseId(e.target.value);
              setSuccessMessage("");
              setErrorMessage("");
            }}
            className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Choose Course --</option>
            {coursesToSelect.map((c: any, idx: number) => (
              <option key={c.id || idx} value={c.id} className="bg-slate-900">
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker (Instructors / Admins only) */}
        {!isStudent && (
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1.5">Attendance Date</label>
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── STUDENT VIEW ────────────────────────────────────────────────── */}
      {isStudent && (
        <div className="space-y-6">
          {!selectedCourseId ? (
            <div className="glass rounded-xl p-10 text-center text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 text-primary/40" />
              Please select an active course above to view your attendance history.
            </div>
          ) : isStudentProfileLoading || isStudentAttendanceLoading ? (
            <div className="glass rounded-xl h-40 animate-pulse flex items-center justify-center text-muted-foreground">Loading attendance logs...</div>
          ) : (
            <>
              {/* Summary Cards */}
              {studentSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass p-4 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Attendance Rate</p>
                    <p className="text-2xl font-bold text-primary">{studentSummary.percentage}%</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Total Classes</p>
                    <p className="text-2xl font-bold text-foreground">{studentSummary.total}</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Classes Present</p>
                    <p className="text-2xl font-bold text-emerald-400">{studentSummary.present}</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Classes Absent</p>
                    <p className="text-2xl font-bold text-rose-400">{studentSummary.absent}</p>
                  </div>
                </div>
              )}

              {/* Attendance Table */}
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left px-5 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-5 py-3 text-muted-foreground font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAttendance?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-10 text-muted-foreground">
                          No attendance records registered for this course yet.
                        </td>
                      </tr>
                    ) : (
                      studentAttendance?.map((record: any) => (
                        <tr key={record.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3.5 text-foreground font-medium">{formatDate(record.date)}</td>
                          <td className="px-5 py-3.5">{getStatusBadge(record.status)}</td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs italic">{record.remarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PROFESSOR / ADMIN VIEW ───────────────────────────────────────── */}
      {(isProfessor || isAdmin) && (
        <div className="space-y-6">
          {!selectedCourseId ? (
            <div className="glass rounded-xl p-10 text-center text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 text-primary/40" />
              Please select a course and date above to load student attendance registers.
            </div>
          ) : isCourseDetailLoading ? (
            <div className="glass rounded-xl h-60 animate-pulse flex items-center justify-center text-muted-foreground">
              Loading enrolled students roster...
            </div>
          ) : selectedCourseDetail?.enrollments?.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 text-primary/40" />
              No students are currently enrolled in this course. Use Course enrollment to add students first.
            </div>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              {/* Alert Status Banner */}
              {successMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                  <CheckCircle size={16} /> {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium">
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}

              {/* Roster Table */}
              <div className="glass rounded-xl overflow-hidden shadow-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Student Name</th>
                      <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">ID</th>
                      <th className="text-center px-5 py-3.5 text-muted-foreground font-medium w-[320px]">Status</th>
                      <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourseDetail?.enrollments?.map((e: StudentEnrollment) => (
                      <tr key={e.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-semibold text-foreground">{e.student.user.name}</p>
                            <p className="text-xs text-muted-foreground">{e.student.user.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{e.student.studentId}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center bg-secondary/30 border border-border/30 rounded-lg p-0.5 max-w-[320px] mx-auto">
                            {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const).map(status => {
                              const isActive = attendanceMap[e.id]?.status === status;
                              let activeClass = "";
                              if (isActive) {
                                if (status === "PRESENT") activeClass = "bg-emerald-500 text-white shadow-md";
                                else if (status === "LATE") activeClass = "bg-amber-500 text-white shadow-md";
                                else if (status === "ABSENT") activeClass = "bg-rose-500 text-white shadow-md";
                                else activeClass = "bg-blue-500 text-white shadow-md";
                              }
                              return (
                                <button
                                  type="button"
                                  key={status}
                                  onClick={() => handleMarkStatus(e.id, status)}
                                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                    isActive ? activeClass : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <input
                            type="text"
                            placeholder="e.g. excused sick leave"
                            value={attendanceMap[e.id]?.remarks || ""}
                            onChange={evt => handleMarkRemarks(e.id, evt.target.value)}
                            className="w-full px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={bulkMarkMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  {bulkMarkMutation.isPending ? "Submitting..." : "Save Attendance"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
