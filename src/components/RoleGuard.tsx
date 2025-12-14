import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';

type UserRole = 'customer' | 'pro' | 'admin';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = <div>Access denied</div>,
  redirectTo = '/'
}: RoleGuardProps) {
  const { hasAnyRole, loading } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hasAnyRole(allowedRoles)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}