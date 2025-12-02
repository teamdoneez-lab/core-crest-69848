import { useState, useMemo, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerOffer {
  id: string;
  partner_name: string;
  offer_title: string;
  description: string;
  offer_type: 'pro_perk' | 'exclusive' | 'limited_time';
  cta_label: string;
  cta_url: string;
  tags: string[];
  promo_code: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export default function PartnerOffers() {
  const { user } = useAuth();
  const { isPro, loading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [fetchingOffers, setFetchingOffers] = useState(true);

  // Fetch offers from database
  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('partner_offers')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOffers(data || []);
      } catch (error: any) {
        console.error('Error fetching partner offers:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load partner offers. Please try again.',
        });
      } finally {
        setFetchingOffers(false);
      }
    };

    fetchOffers();
  }, [user, toast]);

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
    let filtered = offers;

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(offer => offer.offer_type === filterCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        offer =>
          offer.partner_name.toLowerCase().includes(query) ||
          offer.offer_title.toLowerCase().includes(query) ||
          offer.description.toLowerCase().includes(query) ||
          offer.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [offers, searchQuery, filterCategory]);

  const featuredOffers = filteredOffers.filter(offer => offer.is_featured);
  const proPerkOffers = filteredOffers.filter(offer => offer.offer_type === 'pro_perk');
  const exclusiveOffers = filteredOffers.filter(offer => offer.offer_type === 'exclusive');
  const limitedTimeOffers = filteredOffers.filter(offer => offer.offer_type === 'limited_time');

  const scrollToOffers = () => {
    document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || fetchingOffers) {
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
                <SelectItem value="pro_perk">Pro Perks</SelectItem>
                <SelectItem value="exclusive">Exclusive</SelectItem>
                <SelectItem value="limited_time">Limited Time</SelectItem>
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

        {/* Exclusive Offers */}
        {exclusiveOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Exclusive Offers</h2>
              <p className="text-muted-foreground">
                Special partner deals available exclusively to Pro members
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exclusiveOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Limited Time Offers */}
        {limitedTimeOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Limited Time Offers</h2>
              <p className="text-muted-foreground">
                Act fast! These deals won't last long
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {limitedTimeOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Pro Member Perks */}
        {proPerkOffers.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Pro Member Perks</h2>
              <p className="text-muted-foreground">
                Exclusive and limited-time deals available only to Pro members
              </p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {proPerkOffers.map((offer) => (
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
  const offerTypeBadge = {
    pro_perk: 'Pro Perk',
    exclusive: 'Exclusive',
    limited_time: 'Limited Time',
  }[offer.offer_type];

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          {offer.image_url ? (
            <img 
              src={offer.image_url} 
              alt={offer.partner_name}
              className="h-12 w-12 object-contain rounded"
            />
          ) : (
            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-2xl">
              {offer.partner_name.charAt(0)}
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            {offerTypeBadge}
          </Badge>
        </div>
        <CardTitle className="text-xl">{offer.offer_title}</CardTitle>
        <CardDescription className="text-sm font-medium text-foreground/70">
          {offer.partner_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
        {offer.promo_code && (
          <div className="mb-4 p-2 bg-muted rounded text-center">
            <p className="text-xs text-muted-foreground">Promo Code</p>
            <p className="font-mono font-bold">{offer.promo_code}</p>
          </div>
        )}
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
          <a href={offer.cta_url} target="_blank" rel="noopener noreferrer">
            {offer.cta_label}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
