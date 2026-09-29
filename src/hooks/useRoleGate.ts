/**
 * V3 Role Gate Hook — Production Completion Pack Part 1
 * For remix_-the-yard (tab-based SPA).
 */
import { useAuth } from '../AuthContext';

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0, moderator: 1, admin: 2, super_admin: 3,
};

/**
 * Resolves the effective role for a user.
 *
 * @param user - The user whose role should be resolved
 * @returns The user's valid role, `super_admin` for legacy administrator accounts, or `user` when no recognized role applies
 */
function resolveRole(user: any): UserRole {
  if (!user) return 'user';
  if (user.role && ROLE_RANK[user.role as UserRole] !== undefined) return user.role as UserRole;
  if (user.is_admin === 1) return 'super_admin';
  return 'user';
}

/**
 * Provides the authenticated user's resolved role and role-based access checks.
 *
 * @returns The resolved role, authentication and privilege status flags, and a function that checks whether the user meets a required role level.
 */
export function useRoleGate() {
  const { user } = useAuth();
  const role = resolveRole(user);
  return {
    role,
    isAuthenticated: !!user,
    isMod:        ROLE_RANK[role] >= ROLE_RANK['moderator'],
    isAdmin:      ROLE_RANK[role] >= ROLE_RANK['admin'],
    isSuperAdmin: role === 'super_admin',
    hasRole: (req: UserRole) => ROLE_RANK[role] >= ROLE_RANK[req],
  };
}
