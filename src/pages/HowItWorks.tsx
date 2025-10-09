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

        <section className="mb-16">
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
