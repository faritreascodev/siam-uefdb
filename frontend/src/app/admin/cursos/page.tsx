"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { quotasApi } from "@/lib/api-quotas";
import { AdmissionQuota } from "@/types/quota";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper grouping function
function groupBy<T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result: Record<string, T[]>, item: T) => {
    const groupKey = String(item[key]);
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
}

export default function MonitorCursosPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [data, setData] = useState<AdmissionQuota[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const quotas = await quotasApi.getAll(token);
      setData(quotas);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos del monitor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  // Aggregate stats globally
  const globalStats = useMemo(() => {
    let total = 0;
    let occupied = 0;
    data.forEach(q => {
      total += q.totalQuota;
      occupied += q.occupiedQuota || 0;
    });
    return {
      total,
      occupied,
      available: total - occupied,
      percent: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }, [data]);

  // Group by 'shift' then by 'level'
  const groupedByShift = useMemo(() => {
    const byShift = groupBy(data, "shift");
    
    // Within each shift, group by level
    const hierarchy: Record<string, Record<string, AdmissionQuota[]>> = {};
    for (const shift of Object.keys(byShift)) {
      hierarchy[shift] = groupBy(byShift[shift], "level");
    }
    return hierarchy;
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <span className="text-muted-foreground animate-pulse">Cargando monitor de cursos en vivo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Monitor Global de Cursos</h2>
        <p className="text-muted-foreground">
          Vista en vivo de las matrículas y cupos disponibles por nivel y paralelo.
        </p>
      </div>

      {/* Global Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupos Totales Ofertados</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.total}</div>
            <p className="text-xs text-muted-foreground">En todo el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Asignados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.occupied}</div>
            <p className="text-xs text-muted-foreground">
              Aprobados / Cursillo Aprobado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidad Global</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.available}</div>
            {/* Visual Mini Progress */}
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${globalStats.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {globalStats.percent}% ocupado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Break down by Shift and Level */}
      {Object.entries(groupedByShift).map(([shift, levels]) => (
        <div key={shift} className="space-y-4">
          <div className="flex items-center gap-2 mt-8 mb-4">
            <h3 className="text-xl font-semibold">Jornada {shift}</h3>
            <Badge variant="outline" className="text-xs opacity-70">
              {Object.keys(levels).length} Niveles
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(levels).map(([level, parallels]) => {
              // Calculate level totals
              const levelTotal = parallels.reduce((acc, p) => acc + p.totalQuota, 0);
              const levelOccupied = parallels.reduce((acc, p) => acc + (p.occupiedQuota || 0), 0);
              const levelPercent = levelTotal > 0 ? Math.round((levelOccupied / levelTotal) * 100) : 0;
              
              const isFull = levelTotal > 0 && levelOccupied >= levelTotal;

              return (
                <Card key={level} className={`overflow-hidden transition-all hover:shadow-md ${isFull ? 'border-red-200 bg-red-50/10' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base leading-tight font-semibold line-clamp-1">{level}</CardTitle>
                      {isFull && <Badge variant="destructive" className="text-[10px] px-1 h-4 min-w-0">LLENO</Badge>}
                    </div>
                    <CardDescription className="text-xs">
                      {levelOccupied} / {levelTotal} asignados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Level Progress */}
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${levelPercent}%` }}
                      />
                    </div>
                    
                    {/* Parallels Info */}
                    <div className="space-y-2 mt-4">
                      {parallels.map(p => {
                        const isParallelFull = (p.occupiedQuota || 0) >= p.totalQuota;
                        return (
                          <div key={p.id} className="flex flex-col gap-1 text-sm bg-muted/40 p-2 rounded-md">
                            <div className="flex justify-between items-center font-medium">
                              <span>
                                Paralelo {p.parallel} 
                                {p.specialty && <span className="text-xs font-normal text-muted-foreground ml-1">({p.specialty})</span>}
                              </span>
                              <span className={isParallelFull ? "text-red-500 font-bold" : ""}>
                                {p.occupiedQuota || 0} / {p.totalQuota}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${isParallelFull ? 'bg-red-400' : 'bg-primary/70'}`} 
                                style={{ width: `${p.occupancyPercentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
