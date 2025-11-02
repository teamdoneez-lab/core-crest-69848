import { Link } from 'react-router-dom';
import { PublicNavigation } from '@/components/PublicNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Search, Calendar, Wrench, DollarSign, Star } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      <div className="mx-auto max-w-6xl p-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Simple. Fast. Reliable.
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-2">
            Getting your vehicle serviced has never been easier with our streamlined three-step process.
          </p>
        </div>

        {/* For Customers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">For Customers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. Book Online</h3>
                <p className="text-muted-foreground">
                  Choose your service, select a convenient time, and provide your vehicle details through our easy booking system.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. Get the Job Done</h3>
                <p className="text-muted-foreground">
                  Your selected service professional will complete the service using the right tools and quality parts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. Pay After Service</h3>
                <p className="text-muted-foreground">
                  Once the work is finished and you're fully satisfied, you pay your service provider directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Professionals */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">For Professionals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Receive Leads</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified of service requests in your area that match your expertise and service categories.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Submit Quote</h3>
                <p className="text-sm text-muted-foreground">
                  Review the service request details and submit your competitive estimated quote to the customer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Get Selected</h3>
                <p className="text-sm text-muted-foreground">
                  When a customer accepts your quote, confirm the appointment by paying a one-time referral fee based on your estimated quote. (Referral fee rates are outlined in the FAQ section.)
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Complete & Earn</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule the service, complete the work professionally, and receive payment directly from the customer.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4 text-center">Why Join DoneEZ as a Professional?</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Only Pay When You Win</h4>
                  <p className="text-sm text-muted-foreground">No subscription fees; pay a one-time referral fee only when a customer accepts your quote.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Qualified Leads</h4>
                  <p className="text-sm text-muted-foreground">Receive pre-screened service requests that match your skills and location.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Set Your Own Prices</h4>
                  <p className="text-sm text-muted-foreground">Control your quotes and maintain your profit margins.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Build Your Business</h4>
                  <p className="text-sm text-muted-foreground">Grow your customer base and establish your reputation through verified reviews and completed jobs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of customers and professionals using DoneEZ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                Request Service
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Join as Professional
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
