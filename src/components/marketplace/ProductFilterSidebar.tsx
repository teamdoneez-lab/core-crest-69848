import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MOCK_CATEGORIES, PART_TYPES, CategoryFilter } from '@/data/mockCategories';
import { ChevronRight, Filter, X } from 'lucide-react';

interface ProductFilterSidebarProps {
  selectedCategories: string[];
  selectedPartTypes: string[];
  selectedBrands: string[];
  onCategoryChange: (categoryId: string) => void;
  onPartTypeChange: (typeId: string) => void;
  onBrandChange: (brandId: string) => void;
  onClearFilters: () => void;
}

// Mock brands data
const MOCK_BRANDS = [
  { id: 'acdelco', name: 'ACDelco' },
  { id: 'bosch', name: 'Bosch' },
  { id: 'denso', name: 'Denso' },
  { id: 'gates', name: 'Gates' },
  { id: 'moog', name: 'Moog' },
  { id: 'ngk', name: 'NGK' },
  { id: 'mobil1', name: 'Mobil 1' },
  { id: 'castrol', name: 'Castrol' },
  { id: 'pennzoil', name: 'Pennzoil' },
  { id: 'valvoline', name: 'Valvoline' },
];

export function ProductFilterSidebar({
  selectedCategories,
  selectedPartTypes,
  selectedBrands,
  onCategoryChange,
  onPartTypeChange,
  onBrandChange,
  onClearFilters,
}: ProductFilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryLevel = (category: CategoryFilter, level: number) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.includes(category.id);
    const isSelected = selectedCategories.includes(category.id);

    // Level 3 (leaf nodes) can be selected
    if (level === 3) {
      return (
        <div key={category.id} className="flex items-center space-x-2 py-2 pl-8">
          <Checkbox
            id={category.id}
            checked={isSelected}
            onCheckedChange={() => onCategoryChange(category.id)}
          />
          <Label
            htmlFor={category.id}
            className="text-sm cursor-pointer hover:text-primary"
          >
            {category.name}
          </Label>
        </div>
      );
    }

    // Level 1 & 2 (parent nodes) are expandable but not selectable
    return (
      <div key={category.id}>
        <button
          onClick={() => toggleCategory(category.id)}
          className="flex items-center justify-between w-full py-2 px-2 hover:bg-accent rounded-md transition-colors"
          aria-expanded={isExpanded}
        >
          <span className={`text-sm font-medium ${level === 1 ? 'font-semibold' : ''}`}>
            {category.name}
          </span>
          {hasChildren && (
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l-2 border-border pl-2 mt-1">
            {category.children!.map(child => renderCategoryLevel(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedPartTypes.length > 0 || selectedBrands.length > 0;
  
  const filteredBrands = MOCK_BRANDS.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-64 bg-card border border-border rounded-lg p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      <ScrollArea className="h-[calc(100vh-200px)]">
        {/* Part Condition Filter */}
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-3">Part Condition</h3>
          <div className="space-y-2">
            {PART_TYPES.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedPartTypes.includes(type.id)}
                  onCheckedChange={() => onPartTypeChange(type.id)}
                />
                <Label
                  htmlFor={type.id}
                  className="text-sm cursor-pointer hover:text-primary"
                >
                  {type.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Brand Filter - Collapsible */}
        <Accordion type="single" collapsible className="mb-4">
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <h3 className="font-medium text-sm">Brand</h3>
            </AccordionTrigger>
            <AccordionContent>
              <input
                type="search"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md mb-2 bg-background"
              />
              <ScrollArea className="h-[150px]">
                <div className="space-y-2 pr-4">
                  {filteredBrands.map(brand => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={brand.id}
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => onBrandChange(brand.id)}
                      />
                      <Label
                        htmlFor={brand.id}
                        className="text-sm cursor-pointer hover:text-primary"
                      >
                        {brand.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator className="my-4" />

        {/* Hierarchical Category Filter */}
        <div>
          <h3 className="font-medium text-sm mb-3">Categories</h3>
          <div className="space-y-1">
            {MOCK_CATEGORIES.map(category => renderCategoryLevel(category, 1))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
