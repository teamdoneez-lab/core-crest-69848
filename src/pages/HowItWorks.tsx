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
            How DoneEZ Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get your vehicle serviced in three simple steps. It's really that easy.
          </p>
        </div>

        {/* For Customers */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">For Customers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. Request Service</h3>
                <p className="text-muted-foreground">
                  Tell us what you need, when you need it, and where you're located. Include photos and details to get the most accurate quotes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. Get Quotes</h3>
                <p className="text-muted-foreground">
                  Receive competitive quotes from verified professionals in your area. Compare prices, reviews, and availability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. Get Service & Pay</h3>
                <p className="text-muted-foreground">
                  Accept the quote you like best, schedule your appointment, and pay your service provider directly after the work is completed to your satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Professionals */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">For Professionals</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. Get Leads</h3>
                <p className="text-muted-foreground">
                  Receive service requests from customers in your area looking for the services you provide.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. Send Quotes</h3>
                <p className="text-muted-foreground">
                  Review the details and send competitive quotes for jobs you want. Set your own prices and availability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. Grow Business</h3>
                <p className="text-muted-foreground">
                  Complete jobs, earn great reviews, and build your reputation to attract more customers.
                </p>
              </CardContent>
            </Card>
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
