import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Fee, Student } from "../../types";
import { formatDate, formatCurrency, getStatusClass } from "../../lib/utils";
import { CreditCard, CheckCircle, AlertCircle, Plus, DollarSign, X } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export default function FeesPage() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  
  // Payment Modal form state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Admin Create Fee Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    studentId: "",
    amount: 10000,
    description: "Tuition Fees",
    dueDate: new Date().toISOString().split("T")[0],
    semester: "Semester 1",
  });

  const queryClient = useQueryClient();

  // 1. Fetch Student Fees summary & list (Student flow)
  const { data: studentFeeSummary, isLoading: isStudentFeesLoading } = useQuery({
    queryKey: ["student-fees", user?.student?.id],
    queryFn: () => api.get(`/fees/student/${user?.student?.id}`).then(r => r.data.data),
    enabled: isStudent && !!user?.student?.id,
  });

  // 2. Fetch All Fees (Admin flow)
  const { data: allFeesData, isLoading: isAllFeesLoading } = useQuery({
    queryKey: ["all-fees", page],
    queryFn: () => api.get(`/fees?page=${page}&limit=15`).then(r => r.data),
    enabled: isAdmin,
    placeholderData: prev => prev,
  });

  // 3. Fetch Student list for Admin Create Fee modal
  const { data: studentsData } = useQuery({
    queryKey: ["students-for-fees"],
    queryFn: () => api.get("/students?limit=200").then(r => r.data.students),
    enabled: isAdmin && isCreateModalOpen,
  });

  // ─── MUTATIONS ───────────────────────────────────────────────────────────
  // Pay Fee Mutation (Shared: Student pays / Admin marks paid)
  const payFeeMutation = useMutation({
    mutationFn: (feeId: string) => {
      return api.patch(`/fees/${feeId}/pay`);
    },
    onSuccess: () => {
      alert("Payment processed successfully!");
      setIsPayModalOpen(false);
      setSelectedFee(null);
      setPaymentForm({ cardNumber: "", expiry: "", cvv: "", name: "" });
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["all-fees"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Payment failed");
    },
  });

  // Admin Create Fee Mutation
  const createFeeMutation = useMutation({
    mutationFn: (payload: typeof createForm) => {
      return api.post("/fees", payload);
    },
    onSuccess: () => {
      alert("Fee Invoice created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({
        studentId: "",
        amount: 10000,
        description: "Tuition Fees",
        dueDate: new Date().toISOString().split("T")[0],
        semester: "Semester 1",
      });
      queryClient.invalidateQueries({ queryKey: ["all-fees"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to create fee invoice");
    },
  });

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;
    payFeeMutation.mutate(selectedFee.id);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.studentId) {
      alert("Please select a student");
      return;
    }
    createFeeMutation.mutate(createForm);
  };

  const feesList = isStudent ? studentFeeSummary?.fees : allFeesData?.fees;
  const isLoading = isStudent ? isStudentFeesLoading : isAllFeesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fee Management</h2>
          <p className="text-sm text-muted-foreground">Review billing invoices and process payments</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> Add Fee Invoice
          </button>
        )}
      </div>

      {/* Student Stats Summary */}
      {isStudent && studentFeeSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-5 rounded-xl border border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Billed</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(studentFeeSummary.total)}</p>
          </div>
          <div className="glass p-5 rounded-xl border border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(studentFeeSummary.paid)}</p>
          </div>
          <div className="glass p-5 rounded-xl border border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-1">Pending Balance</p>
            <p className="text-2xl font-bold text-rose-400">{formatCurrency(studentFeeSummary.pending)}</p>
          </div>
        </div>
      )}

      {/* Main Fees Table */}
      <div className="glass rounded-xl overflow-hidden shadow-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              {!isStudent && <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Student</th>}
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Description</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Amount</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Semester</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Due Date</th>
              <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">Status</th>
              <th className="text-center px-5 py-3.5 text-muted-foreground font-medium w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isStudent ? 6 : 7} className="text-center py-12 text-muted-foreground">
                  Loading fee records...
                </td>
              </tr>
            ) : feesList?.length === 0 ? (
              <tr>
                <td colSpan={isStudent ? 6 : 7} className="text-center py-12 text-muted-foreground">
                  No invoices found.
                </td>
              </tr>
            ) : (
              feesList?.map((f: Fee) => (
                <tr key={f.id} className="border-b border-border/40 hover:bg-secondary/25 transition-colors">
                  {!isStudent && (
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {f.student?.user.name}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-foreground">{f.description || "Tuition Fees"}</td>
                  <td className="px-5 py-3.5 text-foreground font-mono font-semibold">{formatCurrency(f.amount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">{f.semester}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatDate(f.dueDate)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusClass(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {f.status !== "PAID" && f.status !== "WAIVED" ? (
                      isStudent ? (
                        <button
                          onClick={() => {
                            setSelectedFee(f);
                            setIsPayModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer shadow"
                        >
                          Pay Now
                        </button>
                      ) : isAdmin ? (
                        <button
                          onClick={() => {
                            if (confirm(`Mark invoice of ${formatCurrency(f.amount)} for ${f.student?.user.name} as paid?`)) {
                              payFeeMutation.mutate(f.id);
                            }
                          }}
                          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white rounded text-xs font-semibold cursor-pointer shadow"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        "—"
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Cleared</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* STUDENT MOCK PAYMENT MODAL */}
      {isPayModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-md p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Mock Payment Gateway</h3>
              <button
                onClick={() => {
                  setIsPayModalOpen(false);
                  setSelectedFee(null);
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-secondary/35 p-3 rounded-lg border border-border/30 mb-4 text-sm">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Invoice Details</p>
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">{selectedFee.description}</span>
                <span className="text-primary font-mono">{formatCurrency(selectedFee.amount)}</span>
              </div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cardholder Name</label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={paymentForm.name}
                  onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Card Number</label>
                <div className="relative flex items-center">
                  <CreditCard size={14} className="absolute left-3 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    pattern="\d{16}"
                    maxLength={16}
                    placeholder="1234567890123456"
                    value={paymentForm.cardNumber}
                    onChange={e => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Expiry (MM/YY)</label>
                  <input
                    required
                    type="text"
                    placeholder="12/28"
                    pattern="\d\d/\d\d"
                    maxLength={5}
                    value={paymentForm.expiry}
                    onChange={e => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">CVV</label>
                  <input
                    required
                    type="password"
                    pattern="\d{3}"
                    maxLength={3}
                    placeholder="•••"
                    value={paymentForm.cvv}
                    onChange={e => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={payFeeMutation.isPending}
                className="w-full py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
              >
                <DollarSign size={16} />
                {payFeeMutation.isPending ? "Processing..." : `Pay ${formatCurrency(selectedFee.amount)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CREATE FEE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl w-full max-w-md p-6 flex flex-col glow shadow-2xl relative border border-border/40 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">Create Fee Invoice</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Select Student *</label>
                <select
                  required
                  value={createForm.studentId}
                  onChange={e => setCreateForm({ ...createForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                <label className="text-xs text-muted-foreground block mb-1">Amount (INR) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={createForm.amount}
                  onChange={e => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description *</label>
                <input
                  required
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Semester *</label>
                  <input
                    required
                    type="text"
                    value={createForm.semester}
                    onChange={e => setCreateForm({ ...createForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/35 border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createFeeMutation.isPending}
                className="w-full py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
              >
                {createFeeMutation.isPending ? "Creating..." : "Create Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
