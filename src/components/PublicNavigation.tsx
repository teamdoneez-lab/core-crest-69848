import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-modern.png';
import santaHat from '@/assets/santa-hat.png';

export function PublicNavigation() {
  return (
    <nav className="border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="relative flex items-center">
              <img
                src={santaHat}
                alt=""
                className="absolute -top-3 -left-1 h-8 w-auto z-10 pointer-events-none select-none"
                style={{
                  transform: 'rotate(-18deg)',
                  filter: 'drop-shadow(0 1px 1px hsl(var(--foreground) / 0.22))',
                }}
                draggable={false}
              />
              <img
                src={logo}
                alt="DoneEZ auto repair marketplace logo"
                className="h-12 w-auto object-contain mr-2 cursor-pointer select-none"
                draggable={false}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <Link to="/how-it-works">
              <Button variant="ghost" className="text-sm lg:text-base">
                How It Works
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="ghost" className="text-sm lg:text-base">
                FAQ
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                variant="outline"
                className="border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 text-sm lg:text-base px-3 lg:px-4"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant transition-all duration-300 text-sm lg:text-base px-3 lg:px-4">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className="md:hidden hidden border-t border-primary/10 bg-background/95 backdrop-blur-xl"
        >
          <div className="px-2 pt-2 pb-3 space-y-2">
            <Link to="/how-it-works" className="block">
              <Button variant="ghost" className="w-full justify-start">
                How It Works
              </Button>
            </Link>
            <Link to="/faq" className="block">
              <Button variant="ghost" className="w-full justify-start">
                FAQ
              </Button>
            </Link>
            <Link to="/auth" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth" className="block">
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90 text-white shadow-elegant transition-all duration-300">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
