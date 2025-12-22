import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePhotoNotifications } from '@/hooks/usePhotoNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MessageSquare, Menu } from 'lucide-react';
import { CartPanel } from '@/components/marketplace/CartPanel';
import logo from '@/assets/logo.png';
import santaHat from '@/assets/santa-hat.png';
import { useState } from 'react';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { role, isCustomer, isPro, isAdmin } = useRole();
  const unreadCount = useUnreadMessages();
  const { hasNewPhotos, hasPhotoRequests } = usePhotoNotifications();
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
            to="/request-service" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/request-service') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Request
          </Link>
          <Link 
            to="/my-requests" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap relative flex items-center gap-1",
              isActive('/my-requests') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <span>My Requests</span>
            {hasPhotoRequests && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
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
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap relative flex items-center gap-1",
              isActive('/my-jobs') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <span>Jobs</span>
            {hasNewPhotos && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
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
            to="/partner-offers" 
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
              isActive('/partner-offers') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Partner Offers
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
          <Link to="/" className="flex items-center flex-shrink-0 relative">
            <img
              src={santaHat}
              alt=""
              className="absolute -top-2 left-0 h-7 w-auto z-10 pointer-events-none select-none drop-shadow-sm"
              style={{ transform: 'rotate(-15deg)' }}
              draggable={false}
            />
            <img
              src={logo}
              alt="DoneEZ auto repair marketplace logo"
              className="h-12 w-auto object-contain select-none"
              draggable={false}
            />
          </Link>
            
          {!isMobile ? (
            <div className="flex items-center gap-4 flex-1 ml-6">
              {navLinks}
            </div>
          ) : null}

          <div className="flex items-center gap-2 flex-shrink-0">
            {isPro && <CartPanel />}
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {role || 'customer'}
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