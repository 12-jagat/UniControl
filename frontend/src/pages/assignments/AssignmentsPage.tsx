import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Assignment, Submission, Course } from "../../types";
import { formatDate } from "../../lib/utils";
import { FileText, Plus, X, Upload, CheckCircle, AlertCircle, Award, Send, Edit3 } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "STUDENT";
  const isProfessor = user?.role === "PROFESSOR";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const canCreate = isProfessor || isAdmin;

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Grade state
  const [gradingSubmissionId, setGradingSubmissionId] = useState("");
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: "" });

  // Submit state (Student)
  const [submitForm, setSubmitForm] = useState({ content: "", fileUrl: "" });

  // Create state (Instructor / Admin)
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    courseId: "",
    maxScore: 100,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        const isAbsolute = data.fileUrl.startsWith("http://") || data.fileUrl.startsWith("https://");
        const fullUrl = isAbsolute ? data.fileUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${data.fileUrl}`;
        setSubmitForm(prev => ({ ...prev, fileUrl: fullUrl }));
        alert("File uploaded successfully!");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const queryClient = useQueryClient();

  // 1. Fetch Assignments
  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then(r => r.data.data),
  });

  // 2. Fetch Student's Personal Submission
  const { data: mySubmission, refetch: refetchMySubmission } = useQuery<Submission | null>({
    queryKey: ["my-submission", selectedAssignment?.id],
    queryFn: () => api.get(`/assignments/${selectedAssignment?.id}/my-submission`).then(r => r.data.data),
    enabled: isStudent && !!selectedAssignment?.id,
  });

  // 3. Fetch All Submissions for Selected Assignment (Instructor / Admin)
  const { data: submissions, refetch: refetchSubmissions } = useQuery<Submission[]>({
    queryKey: ["submissions", selectedAssignment?.id],
    queryFn: () => api.get(`/assignments/${selectedAssignment?.id}/submissions`).then(r => r.data.data),
    enabled: !isStudent && !!selectedAssignment?.id,
  });

  // 4. Fetch Courses (Professor Profile)
  const { data: professorProfile } = useQuery({
    queryKey: ["professor-profile-assignments", user?.professor?.id],
    queryFn: () => api.get(`/faculty/${user?.professor?.id}`).then(r => r.data.data),
    enabled: isProfessor && !!user?.professor?.id,
  });

  // 5. Fetch Courses (Admin list)
  const { data: allCoursesData } = useQuery({
    queryKey: ["all-courses-assignments"],
    queryFn: () => api.get("/courses?limit=100").then(r => r.data),
    enabled: isAdmin,
  });

  const coursesToSelect = isProfessor
    ? professorProfile?.courses ?? []
    : allCoursesData?.courses ?? [];

  // ─── MUTATIONS ───────────────────────────────────────────────────────────
  // Create Assignment
  const createAssignmentMutation = useMutation({
    mutationFn: (payload: typeof createForm) => {
      return api.post("/assignments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        courseId: "",
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      setErrorMsg("");
      alert("Assignment created successfully!");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create assignment");
    },
  });

  // Student Submit Assignment
  const submitAssignmentMutation = useMutation({
    mutationFn: (payload: { content: string; fileUrl: string }) => {
      return api.post("/assignments/submit", {
        assignmentId: selectedAssignment?.id,
        studentId: user?.student?.id,
        ...payload,
      });
    },
    onSuccess: () => {
      refetchMySubmission();
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setSubmitForm({ content: "", fileUrl: "" });
      alert("Assignment submitted successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to submit assignment");
    },
  });

  // Grade Submission
  const gradeSubmissionMutation = useMutation({
    mutationFn: (payload: { submissionId: string; score: number; feedback?: string }) => {
      return api.patch(`/assignments/submissions/${payload.submissionId}/grade`, {
        score: payload.score,
        feedback: payload.feedback,
      });
    },
    onSuccess: () => {
      refetchSubmissions();
      setGradingSubmissionId("");
      setGradeForm({ score: 0, feedback: "" });
      alert("Submission graded successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to grade submission");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.courseId) {
      setErrorMsg("Please select a course");
      return;
    }
    createAssignmentMutation.mutate(createForm);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAssignmentMutation.mutate(submitForm);
  };

  const handleGradeSubmit = (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    if (gradeForm.score < 0 || gradeForm.score > (selectedAssignment?.maxScore || 100)) {
      alert(`Score must be between 0 and ${selectedAssignment?.maxScore}`);
      return;
    }
    gradeSubmissionMutation.mutate({
      submissionId,
      score: gradeForm.score,
      feedback: gradeForm.feedback,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Assignments</h2>
          <p className="text-sm text-muted-foreground">Manage coursework requirements and grading</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> New Assignment
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-xl h-24 animate-pulse" />) :
          assignments?.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center col-span-2 text-muted-foreground">
              <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
              No assignments issued yet.
            </div>
          ) : (
            assignments?.map((a: Assignment) => (
              <div
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                className="glass rounded-xl p-5 hover:scale-[1.01] hover:bg-secondary/20 transition-all duration-200 glow cursor-pointer flex justify-between items-center border border-border/40 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {a.course?.code}
                    </span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{a.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.course?.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-3">Due: {formatDate(a.dueDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-full">
                    <Award size={13} /> {a.maxScore} pts
                  </div>
                  {!isStudent && (
                    <span className="text-[10px] text-muted-foreground mt-2 block">
                      {a._count?.submissions ?? 0} Submissions
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
      </div>

      {/* WORKSPACE WORKFLOW MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-4xl p-6 flex flex-col max-h-[85vh] overflow-y-auto glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/40 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-md mb-2 inline-block">
                  {selectedAssignment.course?.code}
                </span>
                <h3 className="text-lg font-bold text-foreground">{selectedAssignment.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Due Date: {formatDate(selectedAssignment.dueDate)} • Max Marks: {selectedAssignment.maxScore}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setGradingSubmissionId("");
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column: Description & Student actions / personal submission status */}
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-foreground leading-relaxed bg-secondary/20 p-4 rounded-lg border border-border/20 whitespace-pre-wrap">
                    {selectedAssignment.description || "No description provided for this coursework."}
                  </p>
                </div>

                {/* STUDENT WORKSPACE VIEW */}
                {isStudent && (
                  <div className="glass p-4 rounded-xl border border-border/40">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      My Submission Workspace
                    </h4>
                    {mySubmission ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                          <CheckCircle size={14} /> Submitted on {formatDate(mySubmission.submittedAt)}
                        </div>

                        <div className="bg-secondary/15 p-3 rounded-lg border border-border/20 text-sm">
                          {mySubmission.content && (
                            <div className="mb-2">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Online Text</p>
                              <p className="text-foreground whitespace-pre-wrap">{mySubmission.content}</p>
                            </div>
                          )}
                          {mySubmission.fileUrl && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Submitted File/Link</p>
                              <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                                {mySubmission.fileUrl}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Grading alert */}
                        {mySubmission.status === "GRADED" ? (
                          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                            <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                              <span className="text-sm font-bold text-foreground">Score Result</span>
                              <span className="text-lg font-bold text-primary font-mono">{mySubmission.score} / {selectedAssignment.maxScore}</span>
                            </div>
                            {mySubmission.feedback && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Instructor Feedback</span>
                                <p className="text-xs text-foreground italic mt-0.5">"{mySubmission.feedback}"</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs">
                            <AlertCircle size={14} /> Pending Instructor Grading evaluation.
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleStudentSubmit} className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Online Text Submission</label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Write your assignment submission text..."
                            value={submitForm.content}
                            onChange={e => setSubmitForm({ ...submitForm, content: e.target.value })}
                            className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Upload PDF or Image Attachment</label>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf"
                                onChange={handleFileChange}
                                className="flex-1 text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                              />
                              {uploading && <span className="text-xs text-muted-foreground animate-pulse shrink-0 self-center">Uploading...</span>}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Or Paste Project Link URL</label>
                            <div className="relative flex items-center">
                              <Upload size={13} className="absolute left-3 text-muted-foreground" />
                              <input
                                type="url"
                                placeholder="https://github.com/my-project-submission"
                                value={submitForm.fileUrl}
                                onChange={e => setSubmitForm({ ...submitForm, fileUrl: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submitAssignmentMutation.isPending}
                          className="w-full py-2 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg text-xs"
                        >
                          <Send size={13} />
                          {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Instructor Submission Grading Portal */}
              {!isStudent && (
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Student Submissions ({submissions?.length ?? 0})
                  </h4>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {submissions?.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-10 glass rounded-xl border border-border/30">
                        No submissions recorded yet.
                      </p>
                    ) : (
                      submissions?.map(sub => {
                        const isGradingActive = gradingSubmissionId === sub.id;
                        return (
                          <div key={sub.id} className="glass p-3 rounded-lg border border-border/40 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{sub.student?.user.name}</p>
                                <p className="text-[10px] text-muted-foreground">{sub.student?.user.email}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                sub.status === "GRADED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {sub.status}
                              </span>
                            </div>

                            {/* Submitted content */}
                            <div className="bg-secondary/20 p-2 rounded text-[11px] text-foreground border border-border/20">
                              {sub.content && <p className="whitespace-pre-wrap mb-1">{sub.content}</p>}
                              {sub.fileUrl && (
                                <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                                  Link: {sub.fileUrl}
                                </a>
                              )}
                            </div>

                            {sub.status === "GRADED" && !isGradingActive && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/20">
                                <div>
                                  <span className="font-semibold text-foreground">Score: {sub.score} / {selectedAssignment.maxScore}</span>
                                  {sub.feedback && <p className="text-[10px] text-muted-foreground italic mt-0.5">"{sub.feedback}"</p>}
                                </div>
                                <button
                                  onClick={() => {
                                    setGradingSubmissionId(sub.id);
                                    setGradeForm({ score: sub.score || 0, feedback: sub.feedback || "" });
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-secondary text-foreground rounded text-[10px] hover:bg-secondary/75 cursor-pointer"
                                >
                                  <Edit3 size={10} /> Regrade
                                </button>
                              </div>
                            )}

                            {sub.status !== "GRADED" && !isGradingActive && (
                              <button
                                onClick={() => {
                                  setGradingSubmissionId(sub.id);
                                  setGradeForm({ score: 0, feedback: "" });
                                }}
                                className="w-full py-1 gradient-primary text-white font-semibold rounded text-[10px] hover:opacity-90 cursor-pointer"
                              >
                                Grade Submission
                              </button>
                            )}

                            {/* INLINE GRADING FORM */}
                            {isGradingActive && (
                              <form onSubmit={(e) => handleGradeSubmit(e, sub.id)} className="space-y-3 pt-2 border-t border-border/20">
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-[10px] text-muted-foreground col-span-2 font-medium">Assigned Score (0 - {selectedAssignment.maxScore})</label>
                                  <input
                                    required
                                    type="number"
                                    min={0}
                                    max={selectedAssignment.maxScore}
                                    value={gradeForm.score}
                                    onChange={e => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                                    className="w-full px-2 py-1 bg-secondary/35 border border-border/50 rounded text-xs text-foreground text-center focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-muted-foreground block mb-0.5">Feedback / Comments</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Add constructive feedback..."
                                    value={gradeForm.feedback}
                                    onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                    className="w-full px-2 py-1 bg-secondary/35 border border-border/50 rounded text-xs text-foreground focus:outline-none resize-none"
                                  />
                                </div>

                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setGradingSubmissionId("")}
                                    className="px-2 py-1 bg-secondary text-foreground text-[10px] font-medium rounded hover:bg-secondary/80 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={gradeSubmissionMutation.isPending}
                                    className="px-2.5 py-1 gradient-primary text-white text-[10px] font-semibold rounded hover:opacity-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {gradeSubmissionMutation.isPending ? "Saving..." : "Save Grade"}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW ASSIGNMENT MODAL (Admin / Professor Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-lg p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Create Assignment</h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setErrorMsg("");
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Select Course *</label>
                <select
                  required
                  value={createForm.courseId}
                  onChange={e => setCreateForm({ ...createForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesToSelect?.map((c: Course) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Assignment Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Midterm Lab Project"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description / Prompt Requirements</label>
                <textarea
                  rows={4}
                  placeholder="Describe the instructions for this assignment..."
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max Score *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={createForm.maxScore}
                    onChange={e => setCreateForm({ ...createForm, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Due Date *</label>
                  <input
                    required
                    type="date"
                    value={createForm.dueDate}
                    onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
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
                  onClick={() => { setIsCreateModalOpen(false); setErrorMsg(""); }}
                  className="px-4 py-2 bg-secondary border border-border/40 text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                  className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
