/**
 * V3 Role Gate Hook — Production Completion Pack Part 1
 * For remix_-the-yard (tab-based SPA).
 */
import { useAuth } from '../AuthContext';

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0, moderator: 1, admin: 2, super_admin: 3,
};

function resolveRole(user: any): UserRole {
  if (!user) return 'user';
  if (user.role && ROLE_RANK[user.role as UserRole] !== undefined) return user.role as UserRole;
  if (user.is_admin === 1) return 'super_admin';
  return 'user';
}

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
