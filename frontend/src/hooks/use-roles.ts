import { useSession } from "next-auth/react";

export function useRoles() {
  const { data: session } = useSession();
  const roles = session?.user?.roles || [];

  const isSuperAdmin = () => roles.includes("superadmin");
  const isAdmin = () => roles.includes("admin");
  const isDirectivo = () => roles.includes("principal"); // Frontend UI term 'directivo' maps to backend 'principal'
  const isGuardian = () => roles.includes("guardian"); // Backend role is 'guardian'
  const isSecretary = () => roles.includes("secretary");
  const isUser = () => roles.includes("user");
  // Admin access: superadmin OR admin
  const hasAdminAccess = () => isSuperAdmin() || isAdmin();

  return {
    hasRole: (role: string) => roles.includes(role),
    isSuperAdmin,
    isAdmin,
    isDirectivo,
    isGuardian,
    isSecretary,
    isUser,
    hasAdminAccess,
    roles,
  };
}


