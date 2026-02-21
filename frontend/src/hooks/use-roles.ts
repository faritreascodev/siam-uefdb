import { useSession } from "next-auth/react";

export function useRoles() {
  const { data: session } = useSession();
  const roles = session?.user?.roles || [];

  const isSuperAdmin = () => roles.includes("superadmin");
  const isAdmin = () => roles.includes("admin");
  const isDirectivo = () => roles.includes("principal"); // Frontend UI term 'directivo' maps to backend 'principal'
  const isApoderado = () => roles.includes("apoderado"); // Backend role is 'apoderado'
  const isSecretary = () => roles.includes("secretary");
  const isUser = () => roles.includes("user");
  // Admin access: superadmin OR admin
  const hasAdminAccess = () => isSuperAdmin() || isAdmin();

  return {
    hasRole: (role: string) => roles.includes(role),
    isSuperAdmin,
    isAdmin,
    isDirectivo,
    isApoderado,
    isSecretary,
    isUser,
    hasAdminAccess,
    roles,
  };
}


