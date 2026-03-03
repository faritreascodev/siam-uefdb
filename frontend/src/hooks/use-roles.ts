import { useSession } from "next-auth/react";

/**
 * Role hierarchy (highest to lowest privilege):
 *   superadmin  → full system access, no restrictions
 *   admin       → full academic management, settings, users — no system-level configs
 *   principal   → view/approve admissions, reports, cursillo — no user mgmt or settings
 *   secretary   → day-to-day processing (modules configurable via Settings)
 *   apoderado   → own applications only
 */
export function useRoles() {
  const { data: session } = useSession();
  const roles: string[] = (session?.user as any)?.roles ?? [];

  const has = (role: string) => roles.includes(role);

  // Individual role checkers
  const isSuperAdmin = () => has("superadmin");
  const isAdmin = () => has("admin");
  const isPrincipal = () => has("principal");   // Rector / Directivo
  const isSecretary = () => has("secretary");
  const isApoderado = () => has("apoderado");

  // Convenience groups
  /** Has complete admin panel access (all menu items visible) */
  const isFullAdmin = () => isSuperAdmin() || isAdmin();

  /** Can access the admin layout but with restricted menus */
  const hasAdminAccess = () => isSuperAdmin() || isAdmin() || isPrincipal() || isSecretary();

  /** Can manage system-level settings (SMTP, security, etc.) — superadmin only */
  const canManageSystem = () => isSuperAdmin();

  /** Can manage users and roles */
  const canManageUsers = () => isSuperAdmin() || isAdmin();

  /** Can assign roles (only superadmin can elevate to admin) */
  const canAssignRoles = () => isSuperAdmin();

  /** Can access audit logs */
  const canViewAudit = () => isSuperAdmin() || isAdmin();

  /** Can approve / reject applications */
  const canApproveApplications = () => isSuperAdmin() || isAdmin() || isPrincipal() || isSecretary();

  /** Can access system config page */
  const canAccessSettings = () => isSuperAdmin() || isAdmin();

  /** Can view cursillo module (admin panel) */
  const canManageCursillo = () => isSuperAdmin() || isAdmin() || isPrincipal() || isSecretary();

  return {
    roles,
    has,

    // Individual checkers
    isSuperAdmin,
    isAdmin,
    isPrincipal,
    isSecretary,
    isApoderado,

    // Legacy aliases (keep old names to avoid breaking existing code)
    isDirectivo: isPrincipal,

    // Group helpers
    isFullAdmin,
    hasAdminAccess,

    // Permission helpers
    canManageSystem,
    canManageUsers,
    canAssignRoles,
    canViewAudit,
    canApproveApplications,
    canAccessSettings,
    canManageCursillo,
  };
}
