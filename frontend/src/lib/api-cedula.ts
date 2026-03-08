import { API_URL } from "./api-applications";

export async function searchByCedula(cedula: string, token: string) {
  const res = await fetch(`${API_URL}/applications/search-cedula/${cedula}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Error al consultar cédula");

  return res.json();
}
