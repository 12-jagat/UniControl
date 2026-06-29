import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  ClipboardCheck, FileText, Award, CreditCard, Bell, User, Shield, LogOut, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { getInitials } from "../../lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Students", icon: GraduationCap, path: "/students", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR"] },
  { label: "Faculty", icon: Users, path: "/faculty", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Departments", icon: Building2, path: "/departments", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Courses", icon: BookOpen, path: "/courses", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Attendance", icon: ClipboardCheck, path: "/attendance", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Assignments", icon: FileText, path: "/assignments", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Exams & Grades", icon: Award, path: "/exams", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Fees", icon: CreditCard, path: "/fees", roles: ["SUPER_ADMIN","ADMIN","STUDENT"] },
  { label: "Notice Board", icon: Bell, path: "/notices", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Profile", icon: User, path: "/profile", roles: ["SUPER_ADMIN","ADMIN","PROFESSOR","STUDENT"] },
  { label: "Audit Logs", icon: Shield, path: "/audit", roles: ["SUPER_ADMIN","ADMIN"] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 h-screen flex flex-col" style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">UC</div>
          <div>
            <h1 className="font-bold text-foreground text-sm tracking-wide">UniControl</h1>
            <p className="text-xs text-muted-foreground">University Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filteredNav.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {location.pathname === path && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role.replace("_", " ")}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors ml-auto" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
