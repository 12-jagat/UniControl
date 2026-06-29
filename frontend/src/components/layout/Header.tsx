import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { getRoleBadgeClass } from "../../lib/utils";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/faculty": "Faculty",
  "/departments": "Departments",
  "/courses": "Courses",
  "/attendance": "Attendance",
  "/assignments": "Assignments",
  "/exams": "Exams & Grades",
  "/fees": "Fee Management",
  "/notices": "Notice Board",
  "/profile": "My Profile",
  "/audit": "Audit Logs",
};

export default function Header() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const title = routeTitles[location.pathname] ?? "UniControl";

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 glass shrink-0">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-48"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        {user && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getRoleBadgeClass(user.role)}`}>
            {user.role.replace("_", " ")}
          </span>
        )}
      </div>
    </header>
  );
}
