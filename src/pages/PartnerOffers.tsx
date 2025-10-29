import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Tag, ExternalLink } from 'lucide-react';
import { MOCK_PARTNER_OFFERS, PartnerOffer } from '@/data/mockPartnerOffers';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerOffers() {
  const { user } = useAuth();
  const { isPro, loading } = useRole();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Redirect if not authenticated or not a pro
  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  if (!loading && !isPro) {
    navigate('/');
    return null;
  }

  const filteredOffers = useMemo(() => {
    let offers = MOCK_PARTNER_OFFERS;

    // Apply category filter
    if (filterCategory !== 'all') {
      offers = offers.filter(offer => offer.category === filterCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      offers = offers.filter(
        offer =>
          offer.name.toLowerCase().includes(query) ||
          offer.title.toLowerCase().includes(query) ||
          offer.description.toLowerCase().includes(query) ||
          offer.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return offers;
  }, [searchQuery, filterCategory]);

  const featuredOffers = filteredOffers.filter(offer => offer.category === 'featured');
  const softwareOffers = filteredOffers.filter(offer => offer.category === 'software');
  const businessOffers = filteredOffers.filter(offer => offer.category === 'business');
  const perksOffers = filteredOffers.filter(offer => offer.category === 'perks');

  const scrollToOffers = () => {
    document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 text-center">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Partner Offers
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Access exclusive offers on apps and services to help your business grow.
            </p>
            <Button size="lg" onClick={scrollToOffers}>
              Browse Offers
            </Button>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section id="offers-section" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search partners or offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="All Offers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offers</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="software">Software Tools</SelectItem>
                <SelectItem value="business">Business Services</SelectItem>
                <SelectItem value="perks">Pro Perks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Featured Offers */}
        {featuredOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Offers</h2>
              <p className="text-muted-foreground">Exclusive deals curated for Pro members</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Software Tools */}
        {softwareOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Software Tools</h2>
              <p className="text-muted-foreground">
                Discover apps to manage scheduling, communication, invoicing, and customer retention
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {softwareOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Business Services */}
        {businessOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Business Services</h2>
              <p className="text-muted-foreground">
                Access financing, insurance, and business growth tools from trusted partners
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businessOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Pro Member Perks */}
        {perksOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Pro Member Perks</h2>
              <p className="text-muted-foreground">
                Exclusive and limited-time deals available only to Pro members
              </p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {perksOffers.map((offer) => (
                <div key={offer.id} className="min-w-[320px] snap-start">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {filteredOffers.length === 0 && (
          <section className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No offers found matching your search criteria.
            </p>
          </section>
        )}

        {/* Footer Text */}
        <section className="text-center py-8 text-muted-foreground">
          <p>
            All offers are exclusive to Pro members. New partner deals are added regularly — check back often!
          </p>
        </section>
      </main>
    </div>
  );
}

// Offer Card Component
function OfferCard({ offer }: { offer: PartnerOffer }) {
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl">{offer.logo}</div>
          {offer.badge && (
            <Badge variant="secondary" className="text-xs">
              {offer.badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{offer.title}</CardTitle>
        <CardDescription className="text-sm font-medium text-foreground/70">
          {offer.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
        <div className="flex flex-wrap gap-2">
          {offer.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <a href={offer.ctaLink} target="_blank" rel="noopener noreferrer">
            {offer.ctaText}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
