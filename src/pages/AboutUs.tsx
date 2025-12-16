import { Link } from 'react-router-dom';
import { PublicNavigation } from '@/components/PublicNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Shield, Heart } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      <div className="mx-auto max-w-6xl p-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
            About DoneEZ
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Making auto care simple, transparent, and accessible for everyone
          </p>
        </div>

        {/* Mission Statement */}
        <section className="mb-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We believe getting your vehicle serviced should be easy, transparent, and stress-free. 
              DoneEZ connects customers with trusted automotive professionals, making quality auto care 
              accessible to everyone while helping service providers grow their business.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Simplicity</h3>
                <p className="text-muted-foreground">
                  We make auto care easy and straightforward, removing complexity at every step.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Trust</h3>
                <p className="text-muted-foreground">
                  All professionals are verified and vetted to ensure quality and reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Community</h3>
                <p className="text-muted-foreground">
                  We support local businesses and build lasting relationships between customers and pros.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Excellence</h3>
                <p className="text-muted-foreground">
                  We're committed to providing the best experience for both customers and professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Story */}
        <section className="mb-16">
          <div className="bg-muted/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg max-w-3xl mx-auto text-muted-foreground">
              <p className="mb-4">
                DoneEZ was born from a simple frustration: getting quality auto service shouldn't be complicated. 
                Too often, customers struggled to find reliable professionals, compare prices, and schedule services 
                that fit their needs.
              </p>
              <p className="mb-4">
                At the same time, skilled automotive professionals were looking for better ways to connect with 
                customers and grow their business without the overhead of traditional advertising.
              </p>
              <p>
                We created DoneEZ to solve both problems—a platform that makes it easy for customers to find and 
                book quality auto services while helping professionals reach more customers and build their reputation. 
                Today, we're proud to serve thousands of customers and professionals across the country.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join the DoneEZ Community</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Whether you need service or provide it, we're here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
