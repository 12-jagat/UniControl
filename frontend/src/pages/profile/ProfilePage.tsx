import { useAuthStore } from "../../store/auth.store";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { User } from "../../types";
import { formatDate, getInitials, getRoleBadgeClass } from "../../lib/utils";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function ProfilePage() {
  const authUser = useAuthStore(s => s.user);
  const { data: user } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/users/me").then(r => r.data.data),
  });

  const u = user ?? authUser;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><h2 className="text-xl font-bold text-foreground">My Profile</h2><p className="text-sm text-muted-foreground">View and update your account information</p></div>

      {u && (
        <div className="glass rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {getInitials(u.name)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{u.name}</h3>
              <span className={`inline-block mt-1 text-xs font-medium px-3 py-1 rounded-full border ${getRoleBadgeClass(u.role)}`}>{u.role.replace("_", " ")}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <Mail size={16} className="text-primary" />
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium text-foreground">{u.email}</p></div>
            </div>
            {u.phone && <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <Phone size={16} className="text-primary" />
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium text-foreground">{u.phone}</p></div>
            </div>}
            {u.address && <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <MapPin size={16} className="text-primary" />
              <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm font-medium text-foreground">{u.address}</p></div>
            </div>}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <Calendar size={16} className="text-primary" />
              <div><p className="text-xs text-muted-foreground">Member since</p><p className="text-sm font-medium text-foreground">{formatDate(u.createdAt)}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
