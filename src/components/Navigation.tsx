import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const location = useLocation();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="DoneEZ" className="h-8 w-auto" />
            </Link>
            
            <div className="flex space-x-4">
              <Link 
                to="/" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Dashboard
              </Link>

              {isCustomer && (
                <>
                  <Link 
                    to="/request-service" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive('/request-service') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Request Service
                  </Link>
                  <Link 
                    to="/service-requests" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    My Requests
                  </Link>
                  <Link 
                    to="/appointments" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive('/appointments') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Appointments
                  </Link>
                </>
              )}

              {isPro && (
                <>
                  <Link 
                    to="/pro-profile" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive('/pro-profile') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/pro-inbox" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive('/pro-inbox') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Inbox
                  </Link>
                   <Link 
                     to="/service-requests" 
                     className={cn(
                       "text-sm font-medium transition-colors hover:text-primary",
                       isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
                     )}
                   >
                     Service Requests
                   </Link>
                </>
              )}

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.name || user?.email}
            </span>
            <Badge variant="secondary">
              {profile?.role || 'customer'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}