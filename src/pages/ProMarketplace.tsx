import { Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { ProductFilterSidebar } from '@/components/marketplace/ProductFilterSidebar';
import { VehicleSelector } from '@/components/marketplace/VehicleSelector';
import { useCart } from '@/contexts/CartContext';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Vehicle } from '@/data/mockVehicles';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProMarketplace() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPartTypes, setSelectedPartTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  
  // Debounce search query (300ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not a pro user
  if (!roleLoading && !isPro) {
    return <Navigate to="/" replace />;
  }

  const handleAddToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    addToCart(product);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePartTypeChange = (typeId: string) => {
    setSelectedPartTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleBrandChange = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedPartTypes([]);
    setSelectedBrands([]);
  };

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = MOCK_PRODUCTS;

    // Apply search filter (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category.toLowerCase().replace(/\s+/g, '-'))
      );
    }

    // Apply part type filter (mock implementation)
    if (selectedPartTypes.length > 0) {
      // In a real app, products would have a 'condition' field
      // For now, we'll just show all products if any type is selected
    }

    // Apply brand filter (mock implementation)
    if (selectedBrands.length > 0) {
      // In a real app, products would have a 'brand' field
      // For now, we'll just show all products if any brand is selected
    }

    // Apply vehicle filter (mock implementation)
    if (selectedVehicle) {
      // In a real app, we'd filter by vehicle compatibility
      // For now, we'll just show all products
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-low-high':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [selectedCategories, selectedPartTypes, selectedBrands, selectedVehicle, debouncedSearchQuery, sortBy]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Banner */}
        <section 
          className="bg-gradient-primary rounded-lg p-8 md:p-12 mb-8 text-primary-foreground"
          role="banner"
        >
          <div className="flex items-start gap-4">
            <Package className="h-12 w-12 flex-shrink-0" aria-hidden="true" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Pro Marketplace
              </h1>
              <p className="text-lg md:text-xl opacity-95 max-w-3xl">
                Shop trusted parts, tools, and supplies for your next job. 
                Professional-grade equipment at competitive prices.
              </p>
            </div>
          </div>
        </section>

        {/* Vehicle Selector */}
        <VehicleSelector onVehicleSelect={handleVehicleSelect} />

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low-high">Price: Low to High</SelectItem>
              <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              <SelectItem value="name-az">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <ProductFilterSidebar
            selectedCategories={selectedCategories}
            selectedPartTypes={selectedPartTypes}
            selectedBrands={selectedBrands}
            onCategoryChange={handleCategoryChange}
            onPartTypeChange={handlePartTypeChange}
            onBrandChange={handleBrandChange}
            onClearFilters={handleClearFilters}
          />

          {/* Product Grid */}
          <div className="flex-1">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={handleAddToCart}
              isLoading={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
