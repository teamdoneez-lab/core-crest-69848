import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MessageSquare, Menu } from 'lucide-react';
import { CartPanel } from '@/components/marketplace/CartPanel';
import logo from '@/assets/logo-new.png';
import { useState } from 'react';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const unreadCount = useUnreadMessages();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    
    try {
      // Clear session first
      await signOut();
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to home page instead of auth
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect to home anyway
      window.location.href = '/';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = (
    <>
      <Link
        to="/" 
        onClick={() => setMobileMenuOpen(false)}
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
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/request-service-flow') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Request
          </Link>
          <Link 
            to="/my-requests" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/my-requests') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Requests
          </Link>
          <Link 
            to="/appointments" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/appointments') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Appointments
          </Link>
          <Link 
            to="/messages" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap relative",
              isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full p-0 px-1.5 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Link>
          <Link 
            to="/customer-profile" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
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
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/pro-profile') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Profile
          </Link>
          <Link 
            to="/service-requests" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/service-requests') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Requests
          </Link>
          <Link 
            to="/my-jobs" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/my-jobs') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Jobs
          </Link>
          <Link 
            to="/earnings" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/earnings') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Earnings
          </Link>
          <Link 
            to="/pro-marketplace" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/pro-marketplace') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Marketplace
          </Link>
          <Link 
            to="/messages"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap relative",
              isActive('/messages') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full p-0 px-1.5 text-xs"
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
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
            isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={logo} alt="DoneEZ" className="h-10 w-auto drop-shadow-lg" />
          </Link>
            
          {!isMobile ? (
            <div className="flex items-center gap-4 flex-1 ml-6">
              {navLinks}
            </div>
          ) : null}

          <div className="flex items-center gap-2 flex-shrink-0">
            {isPro && <CartPanel />}
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {profile?.role || 'customer'}
            </Badge>
            {!isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    {navLinks}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}