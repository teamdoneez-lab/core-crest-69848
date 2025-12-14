import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Users, 
  CheckCircle, 
  Clock, 
  Shield, 
  Star,
  ArrowRight,
  Wrench,
  MapPin,
  DollarSign,
  Phone,
  UserPlus,
  Calendar,
  Sparkles,
  Award,
  Zap,
  Target
} from 'lucide-react';
import logo from '@/assets/logo-new.png';
import mechanicWorking from '@/assets/mechanic-working.jpg';
import heroDaytime from '@/assets/hero-clean.jpg';
import heroNighttime from '@/assets/hero-nighttime.jpg';
import { Footer } from '@/components/Footer';
import { RotatingHeadline } from '@/components/RotatingHeadline';

interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [heroImage, setHeroImage] = useState(heroDaytime);

  useEffect(() => {
    fetchServiceCategories();
    
    // Time-based hero image swapping
    const updateHeroImage = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 19 || hour < 7;
      setHeroImage(isNight ? heroNighttime : heroDaytime);
    };
    
    updateHeroImage();
    // Update every minute to catch time changes
    const interval = setInterval(updateHeroImage, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchServiceCategories = async () => {
    // Service categories table not yet created - using empty array
    setCategories([]);
  };

  // If user is authenticated, show personalized dashboard
  if (user && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              {isAdmin && 'Admin Dashboard'}
              {isPro && 'Professional Dashboard'}
              {isCustomer && 'Customer Dashboard'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {profile?.name || user?.email}
            </p>
          </div>

          {isCustomer && (
            <div className="grid gap-6">
              <Card className="bg-gradient-card shadow-xl border-0">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">Quick Actions</CardTitle>
                  <CardDescription className="text-lg">
                    Professional auto services at your fingertips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/request-service">
                      <Card className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105 hover:bg-gradient-subtle border-2 hover:border-primary/20">
                        <CardContent className="p-8 text-center">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-elegant">
                            <Car className="h-8 w-8 text-white drop-shadow-lg" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Request Service</h3>
                          <p className="text-muted-foreground group-hover:text-primary/80 transition-colors">
                            Get your vehicle serviced by verified professionals
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link to="/appointments">
                      <Card className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105 hover:bg-gradient-subtle border-2 hover:border-primary/20">
                        <CardContent className="p-8 text-center">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-elegant">
                            <Calendar className="h-8 w-8 text-white drop-shadow-lg" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">My Appointments</h3>
                          <p className="text-muted-foreground group-hover:text-primary/80 transition-colors">
                            View and manage your scheduled services
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Services</CardTitle>
                  <CardDescription>
                    Browse auto services in your area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => window.location.href = '/request-service'}
                      >
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Find {category.name.toLowerCase()} services near you
                        </p>
                      </div>
                    ))}
                  </div>
                  {categories.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No service categories available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {isPro && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Dashboard</CardTitle>
                  <CardDescription>
                    Manage your auto service business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/service-requests">
                      <Button className="w-full h-20 text-lg">
                        <Wrench className="mr-2 h-6 w-6" />
                        New Requests
                      </Button>
                    </Link>
                    <Link to="/my-jobs">
                      <Button variant="outline" className="w-full h-20 text-lg">
                        <CheckCircle className="mr-2 h-6 w-6" />
                        My Jobs
                      </Button>
                    </Link>
                    <Link to="/earnings">
                      <Button variant="outline" className="w-full h-20 text-lg">
                        <DollarSign className="mr-2 h-6 w-6" />
                        Earning Jobs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isAdmin && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>
                    System administration and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin">
                    <Button className="w-full h-20 text-lg">
                      <Shield className="mr-2 h-6 w-6" />
                      Admin Panel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img src={logo} alt="DoneEZ" className="h-8 sm:h-10 w-auto mr-2 drop-shadow-md" />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              <Link to="/auth">
                <Button variant="outline" className="border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 text-sm lg:text-base px-3 lg:px-4">
                  Request Service
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant transition-all duration-300 text-sm lg:text-base px-3 lg:px-4">
                  Become a Pro
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 text-sm lg:text-base px-3 lg:px-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div id="mobile-menu" className="md:hidden hidden border-t border-primary/10 bg-background/95 backdrop-blur-xl">
            <div className="px-2 pt-2 pb-3 space-y-2">
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full justify-start border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300">
                  Request Service
                </Button>
              </Link>
              <Link to="/auth" className="block">
                <Button className="w-full justify-start bg-gradient-primary hover:opacity-90 text-white shadow-elegant transition-all duration-300">
                  Become a Pro
                </Button>
              </Link>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full justify-start border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300">
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

      {/* Hero Section */}
      <section className="hero-section relative w-full h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Background Image */}
        <img 
          src={heroImage} 
          alt="DoneEZ Mechanic" 
          className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
        />
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        
        {/* Content Container - Optimized vertical centering */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center">
          <div className="max-w-2xl lg:max-w-4xl -mt-8 sm:-mt-12 md:-mt-16">
            {/* Hero Headlines Container - Fixed height to prevent layout shift */}
            <div className="mb-5 sm:mb-6">
              {/* Rotating headline - separate h1 element */}
              <h1 className="hero-rotating text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight font-playfair text-white leading-[1.15] min-h-[1.3em]">
                <RotatingHeadline />
              </h1>
              {/* Static headline - separate h1 element */}
              <h1 className="hero-static text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight font-playfair text-white leading-[1.15]">
                The Easy Way
              </h1>
            </div>
            {/* Supporting tagline */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium mb-8 sm:mb-10">
              Compare. Book. Done.
            </p>
            {/* CTA buttons - fixed position */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 sm:py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 sm:py-7 border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  Join as a Professional
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gradient-to-br from-muted/20 via-background to-primary/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-l from-accent/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">Our Services</Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-playfair bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">All-in-One Auto Care</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Repair, maintenance, detailing, tires, bodywork, customization. Whatever your vehicle needs, DoneEZ has you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.length > 0 && categories.map((category, index) => (
              <Card key={category.id} className="group hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm border-primary/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${index % 3 === 0 ? 'from-primary to-accent' : index % 3 === 1 ? 'from-accent to-primary' : 'from-primary to-primary'} rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <Wrench className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">{category.name}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Professional {category.name.toLowerCase()} services by certified technicians with guaranteed quality
                  </p>
                  <Link to="/auth">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                      Book Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            
            {/* Default services if none loaded */}
            {categories.length === 0 && (
              <>
                <Card className="group hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm border-primary/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <Car className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">Oil Changes</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Quick and professional oil change services at your location with premium quality oil
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                        Book Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm border-primary/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">Brake Service</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Complete brake inspection, repair, and replacement services with certified parts and warranty
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                        Book Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm border-primary/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">Diagnostics</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Advanced computer diagnostics to accurately identify and resolve vehicle issues
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                        Book Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-background via-primary/3 to-accent/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-gradient-to-l from-accent/10 to-primary/10 rounded-full blur-2xl animate-pulse"></div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">How It Works</Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-playfair bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Simple. Fast. Reliable.</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Getting your vehicle serviced has never been easier with our streamlined three-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <Phone className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">1. Book Online</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Choose your service, select a convenient time, and provide your vehicle details through our easy booking system.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <Wrench className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">2. Get the Job Done</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Your selected service professional will complete the service using the right tools and quality parts.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <DollarSign className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">3. Pay After Service</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Once the work is finished and you're fully satisfied, you pay your service provider directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary via-primary to-accent relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/90 via-primary to-accent/90"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white font-playfair leading-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Join thousands of satisfied customers and professional service providers in revolutionizing auto care
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <Calendar className="mr-3 h-6 w-6" />
                Book Your Service Today
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <UserPlus className="mr-3 h-6 w-6" />
                Become a Professional Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
