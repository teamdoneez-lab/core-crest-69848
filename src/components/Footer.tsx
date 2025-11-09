import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import logo from '@/assets/logo-new.png';

export function Footer() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const isSupplier = user && hasRole('supplier');

  return (
    <footer className="border-t bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img src={logo} alt="DoneEZ" className="h-10 w-auto mr-2" />
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Professional automotive services delivered to your doorstep. Simple, fast, and reliable.
            </p>
          </div>
          
          {/* For Customers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Customers</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/auth" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Request Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/how-it-works" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For Professionals */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Professionals</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/auth" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Become a Pro
                </Link>
              </li>
              <li>
                <Link 
                  to="/auth" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Pro Sign In
                </Link>
              </li>
              <li>
                <Link 
                  to="/about-us" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For Suppliers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Suppliers</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/supplier-signup" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Become a Supplier
                </Link>
              </li>
              <li>
                {isSupplier ? (
                  <Link 
                    to="/supplier-dashboard" 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/supplier-login" 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Supplier Sign In
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
        
        {/* Legal Links */}
        <div className="border-t mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; 2025 DoneEZ. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link 
              to="/terms-of-service" 
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy-policy" 
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
