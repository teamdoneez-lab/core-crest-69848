import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import logo from '@/assets/logo-new.png';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const unreadCount = useUnreadMessages();
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
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-1 min-w-0">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src={logo} alt="DoneEZ" className="h-8 sm:h-10 md:h-12 w-auto drop-shadow-lg" />
            </Link>
            
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 overflow-x-auto scrollbar-hide flex-1">
              <Link
                to="/" 
                className={cn(
                  "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
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
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/request-service-flow') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Request
                  </Link>
                  <Link 
                    to="/my-requests" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/my-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Requests
                  </Link>
                  <Link 
                    to="/appointments" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/appointments') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Appointments
                  </Link>
                  <Link 
                    to="/messages" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap relative px-1 sm:px-0",
                      isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Messages</span>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-1 h-4 sm:h-5 min-w-4 sm:min-w-5 flex items-center justify-center rounded-full p-0 px-1 sm:px-1.5 text-[10px] sm:text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                  <Link 
                    to="/customer-profile" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/customer-profile') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Profile
                  </Link>
                </>
              )}

              {isPro && (
                <>
                  <Link 
                    to="/pro-profile" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/pro-profile') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/service-requests" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Requests
                  </Link>
                  <Link 
                    to="/my-jobs" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/my-jobs') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Jobs
                  </Link>
                  <Link 
                    to="/earnings" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                      isActive('/earnings') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Earnings
                  </Link>
                  <Link 
                    to="/messages" 
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap relative px-1 sm:px-0",
                      isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Messages</span>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-1 h-4 sm:h-5 min-w-4 sm:min-w-5 flex items-center justify-center rounded-full p-0 px-1 sm:px-1.5 text-[10px] sm:text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-1 sm:px-0",
                    isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0 ml-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs lg:text-sm whitespace-nowrap px-1.5 sm:px-2">
              {profile?.role || 'customer'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              className="text-[10px] sm:text-xs lg:text-sm whitespace-nowrap h-7 sm:h-9 px-2 sm:px-3"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}