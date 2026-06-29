import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { DashboardStats } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useAuthStore } from "../../store/auth.store";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { GraduationCap, Users, BookOpen, Building2, CreditCard, Bell } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="glass rounded-xl p-5 glow hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<{ data: DashboardStats }>("/analytics/dashboard").then(r => r.data.data),
    enabled: user?.role === "SUPER_ADMIN" || user?.role === "ADMIN",
  });
  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollment-trend"],
    queryFn: () => api.get("/analytics/enrollment-trend").then(r => r.data.data),
    enabled: user?.role === "SUPER_ADMIN" || user?.role === "ADMIN",
  });
  const { data: attendanceData } = useQuery({
    queryKey: ["attendance-overview"],
    queryFn: () => api.get("/analytics/attendance-overview").then(r => r.data.data),
    enabled: user?.role === "SUPER_ADMIN" || user?.role === "ADMIN",
  });
  const { data: feeData } = useQuery({
    queryKey: ["fee-collection"],
    queryFn: () => api.get("/analytics/fee-collection").then(r => r.data.data),
    enabled: user?.role === "SUPER_ADMIN" || user?.role === "ADMIN",
  });

  const stats = statsData;
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Good day, {user?.name?.split(" ")[0]} 👋</h2>
        <p className="text-muted-foreground mt-1">Here is what is happening at the university today.</p>
      </div>

      {isAdmin && stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard label="Total Students" value={stats.studentCount} icon={GraduationCap} color="bg-blue-500/20 text-blue-400" />
            <StatCard label="Faculty Members" value={stats.professorCount} icon={Users} color="bg-purple-500/20 text-purple-400" />
            <StatCard label="Active Courses" value={stats.courseCount} icon={BookOpen} color="bg-green-500/20 text-green-400" />
            <StatCard label="Departments" value={stats.departmentCount} icon={Building2} color="bg-orange-500/20 text-orange-400" />
            <StatCard label="Pending Fees" value={formatCurrency(stats.pendingFees)} icon={CreditCard} color="bg-red-500/20 text-red-400" />
            <StatCard label="Active Notices" value={stats.activeNotices} icon={Bell} color="bg-teal-500/20 text-teal-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Enrollment by Semester</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={enrollmentData ?? []}>
                  <XAxis dataKey="semester" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Pie */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Attendance Overview</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={attendanceData ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {(attendanceData ?? []).map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Fee Collection */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Fee Collection Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={feeData ?? []} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="status" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {(feeData ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="glass rounded-xl p-8 text-center glow">
          <GraduationCap size={48} className="text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to UniControl</h3>
          <p className="text-muted-foreground">Use the sidebar navigation to access your modules.</p>
        </div>
      )}
    </div>
  );
}
