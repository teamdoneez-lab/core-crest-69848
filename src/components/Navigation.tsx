import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-new.png';

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
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="DoneEZ" className="h-10 md:h-12 w-auto drop-shadow-lg" />
            </Link>
            
            <div className="flex space-x-4">
              <Link 
                to="/" 
                className={cn(
                  "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Dashboard
              </Link>

              {isCustomer && (
                <>
              <Link 
                to="/request-service-flow" 
                className={cn(
                  "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                  isActive('/request-service-flow') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Request Service
              </Link>
                  <Link 
                    to="/my-requests" 
                    className={cn(
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                      isActive('/my-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    My Requests
                  </Link>
                  <Link 
                    to="/appointments" 
                    className={cn(
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
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
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                      isActive('/pro-profile') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/service-requests" 
                    className={cn(
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                      isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    New Requests
                  </Link>
                  <Link 
                    to="/my-jobs" 
                    className={cn(
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                      isActive('/my-jobs') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    My Jobs
                  </Link>
                  <Link 
                    to="/earnings" 
                    className={cn(
                      "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                      isActive('/earnings') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Earnings
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={cn(
                    "text-sm lg:text-base font-medium transition-colors hover:text-primary",
                    isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm lg:text-base text-muted-foreground">
              Welcome, {profile?.name || user?.email}
            </span>
            <Badge variant="secondary" className="text-sm lg:text-base">
              {profile?.role || 'customer'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-sm lg:text-base">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}