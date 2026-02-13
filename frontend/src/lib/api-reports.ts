

export const reportsApi = {
  getDashboardStats: async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/stats/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al cargar estadísticas del dashboard");
    return res.json();
  },

  getLevelStats: async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/stats/levels`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al cargar estadísticas por nivel");
    return res.json();
  },
  exportAdmittedCsv: async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/admin/export/admitted-csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al exportar CSV");
    return res.json();
  },
};
