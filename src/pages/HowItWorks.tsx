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
