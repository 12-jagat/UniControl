import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { Award } from "lucide-react";

export default function ExamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get("/exams").then(r => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-foreground">Exams & Grades</h2><p className="text-sm text-muted-foreground">Examination schedules and results</p></div>
      <div className="space-y-3">
        {isLoading ? Array.from({length: 4}).map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />) :
          data?.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center"><Award size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No exams scheduled</p></div>
          ) :
          data?.map((e: { id: string; title: string; course?: { title: string }; date: string; duration: number; maxScore: number; venue?: string }) => (
            <div key={e.id} className="glass rounded-xl p-5 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{e.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{e.course?.title} — {e.venue ?? "TBA"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{formatDate(e.date)}</p>
                  <p className="text-xs text-muted-foreground">{e.duration} min | Max: {e.maxScore}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
