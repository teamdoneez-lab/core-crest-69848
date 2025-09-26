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
  Phone
} from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isCustomer, isPro, isAdmin } = useRole();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const fetchServiceCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // If user is authenticated, show personalized dashboard
  if (user && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isAdmin && 'Admin Dashboard'}
              {isPro && 'Professional Dashboard'}
              {isCustomer && 'Customer Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.name || user?.email}
            </p>
          </div>

          {isCustomer && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with our auto services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/request-service">
                      <Button className="w-full h-20 text-lg">
                        <Car className="mr-2 h-6 w-6" />
                        Request Service
                      </Button>
                    </Link>
                    <Link to="/appointments">
                      <Button variant="outline" className="w-full h-20 text-lg">
                        <Clock className="mr-2 h-6 w-6" />
                        View Appointments
                      </Button>
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
                    <Link to="/pro-profile">
                      <Button className="w-full h-20 text-lg">
                        <Users className="mr-2 h-6 w-6" />
                        My Profile
                      </Button>
                    </Link>
                    <Link to="/pro-inbox">
                      <Button variant="outline" className="w-full h-20 text-lg">
                        <Wrench className="mr-2 h-6 w-6" />
                        Service Requests
                      </Button>
                    </Link>
                    <Link to="/appointments">
                      <Button variant="outline" className="w-full h-20 text-lg">
                        <Clock className="mr-2 h-6 w-6" />
                        Appointments
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
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-primary mr-3 drop-shadow-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AutoServices</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" className="hover:bg-primary/10 transition-all duration-300">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-br from-primary/3 via-background to-accent/5">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-bounce"></div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-playfair leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-sm">
                  Professional Auto Services
                </span>
                <br />
                <span className="text-foreground/90 text-4xl md:text-5xl">At Your Doorstep</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Connect with <span className="font-semibold text-primary">verified automotive professionals</span> for quality repairs, maintenance, and services. 
                Book instantly, track progress, and pay securely.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-2xl hover:shadow-primary/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    <Car className="mr-3 h-6 w-6" />
                    Book a Service
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 border-2 border-primary/30 hover:border-primary bg-background/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-500 transform hover:scale-105">
                    <Wrench className="mr-3 h-6 w-6" />
                    Join as Professional
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Hero Stats Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">500+</div>
                    <div className="text-sm text-muted-foreground font-medium">Verified Pros</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">4.9★</div>
                    <div className="text-sm text-muted-foreground font-medium">Average Rating</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">5000+</div>
                    <div className="text-sm text-muted-foreground font-medium">Jobs Completed</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">24/7</div>
                    <div className="text-sm text-muted-foreground font-medium">Support</div>
                  </CardContent>
                </Card>
              </div>
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
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-playfair bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Comprehensive Auto Care</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From routine maintenance to complex repairs, our network of certified professionals delivers excellence at your convenience
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
                      Complete brake inspection, repair, and replacement services with certified parts
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
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">Book Online</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Choose your service, select a convenient time, and provide your vehicle details through our intuitive booking system.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <MapPin className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">We Come to You</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our certified professionals arrive at your location fully equipped with all necessary tools and premium parts.
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
              <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors duration-300">Pay Securely</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Complete your service and pay securely through our platform with transparent, upfront pricing.
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
                <Car className="mr-3 h-6 w-6" />
                Book Your Service
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 border-2 border-white text-white hover:bg-white hover:text-primary transition-all duration-500 transform hover:scale-105">
                <Wrench className="mr-3 h-6 w-6" />
                Become a Professional
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Car className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold">AutoServices</span>
              </div>
              <p className="text-muted-foreground">
                Professional automotive services delivered to your doorstep.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Oil Changes</li>
                <li>Brake Service</li>
                <li>Diagnostics</li>
                <li>Maintenance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About Us</li>
                <li>How It Works</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Help Center</li>
                <li>Safety</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AutoServices. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
