import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import logo from '@/assets/logo-new.png';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const location = useLocation();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src={logo} alt="DoneEZ" className="h-10 md:h-12 w-auto drop-shadow-lg" />
            </Link>
            
            <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-hide flex-1">
              <Link
                to="/" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
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
                  "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                  isActive('/request-service-flow') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Request
              </Link>
                  <Link 
                    to="/my-requests" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/my-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Requests
                  </Link>
                  <Link 
                    to="/appointments" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/appointments') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Appointments
                  </Link>
                  <Link 
                    to="/messages" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap",
                      isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                </>
              )}

              {isPro && (
                <>
                  <Link 
                    to="/pro-profile" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/pro-profile') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/service-requests" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Requests
                  </Link>
                  <Link 
                    to="/my-jobs" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/my-jobs') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Jobs
                  </Link>
                  <Link 
                    to="/earnings" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                      isActive('/earnings') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Earnings
                  </Link>
                  <Link 
                    to="/messages" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap",
                      isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                    isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <span className="text-xs lg:text-sm text-muted-foreground hidden md:block truncate max-w-[120px] lg:max-w-none">
              {profile?.name || user?.email}
            </span>
            <Badge variant="secondary" className="text-xs lg:text-sm whitespace-nowrap">
              {profile?.role || 'customer'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs lg:text-sm whitespace-nowrap">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}