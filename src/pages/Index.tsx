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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">AutoServices</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-playfair">
                Professional Auto Services
                <span className="block text-primary">At Your Doorstep</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Connect with verified automotive professionals for quality repairs, maintenance, and services. 
                Book instantly, track progress, and pay securely.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                    <Car className="mr-2 h-5 w-5" />
                    Book a Service
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                    <Wrench className="mr-2 h-5 w-5" />
                    Join as Professional
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Hero Image/Stats */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">Verified Pros</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-2xl font-bold">4.9★</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-2xl font-bold">5000+</div>
                    <div className="text-sm text-muted-foreground">Jobs Completed</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm text-muted-foreground">Support</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From routine maintenance to complex repairs, we've got you covered
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.length > 0 && categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <Wrench className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground mb-4">
                    Professional {category.name.toLowerCase()} services by certified technicians
                  </p>
                  <Link to="/auth">
                    <Button variant="outline" className="w-full">
                      Book Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            
            {/* Default services if none loaded */}
            {categories.length === 0 && (
              <>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <Car className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Oil Changes</h3>
                    <p className="text-muted-foreground mb-4">
                      Quick and professional oil change services at your location
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <Wrench className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Brake Service</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete brake inspection, repair, and replacement services
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <Shield className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Diagnostics</h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced computer diagnostics to identify vehicle issues
                    </p>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
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
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting your vehicle serviced has never been easier
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Book Online</h3>
              <p className="text-muted-foreground">
                Choose your service, select a time, and provide your vehicle details through our easy booking system.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. We Come to You</h3>
              <p className="text-muted-foreground">
                Our certified professionals arrive at your location with all necessary tools and equipment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Pay Securely</h3>
              <p className="text-muted-foreground">
                Complete your service and pay securely through our platform with transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of satisfied customers and professional service providers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                <Car className="mr-2 h-5 w-5" />
                Book Your Service
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                <Users className="mr-2 h-5 w-5" />
                Become a Pro
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
