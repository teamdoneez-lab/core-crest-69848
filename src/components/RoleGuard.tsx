import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

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
  const { hasAnyRole, loading, error, role } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Show error state if role fetch failed - don't redirect
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Profile/Role Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unable to load your profile or role. This may be due to RLS policies or database configuration.
            </p>
            <p className="text-sm font-mono bg-muted p-2 rounded text-destructive">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If role is null (no roles found and no error), show profile missing state
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Profile Missing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your user profile could not be found. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAnyRole(allowedRoles)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Helper component for automatic role-based redirects
export function RoleRedirect() {
  const { role, loading, error } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error || !role) {
    // Let RoleGuard handle error display
    return null;
  }

  // Redirect based on role
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'pro') {
    return <Navigate to="/pro-dashboard" replace />;
  }
  // Default to customer dashboard (Index page handles this)
  return null;
}