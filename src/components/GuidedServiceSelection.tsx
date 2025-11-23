import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { accordionsData } from '@/data/serviceslist-detailed';

interface Service {
  id: string;
  name: string;
}

interface GuidedServiceSelectionProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  onComplete: () => void;
}

export function GuidedServiceSelection({
  selectedServices,
  onServicesChange,
  onComplete,
}: GuidedServiceSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onServicesChange(selectedServices.filter(id => id !== serviceId));
    } else {
      onServicesChange([...selectedServices, serviceId]);
    }
  };

  const clearServices = () => {
    onServicesChange([]);
  };

  // Filter services based on search term
  const filteredAccordions = accordionsData.map((category) => ({
    ...category,
    subItems: category.subItems.map((subItem) => ({
      ...subItem,
      services: subItem.services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    })).filter((subItem) => subItem.services.length > 0),
  })).filter((category) => category.subItems.length > 0);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selected services count */}
      {selectedServices.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearServices}>
              Clear All
            </Button>
            <Button size="sm" onClick={onComplete}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Service accordions */}
      <Accordion type="multiple" className="w-full">
        {filteredAccordions.map((category, categoryIndex) => (
          <AccordionItem key={categoryIndex} value={`category-${categoryIndex}`}>
            <AccordionTrigger className="text-lg font-semibold">
              {category.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {category.subItems.map((subItem, subIndex) => (
                  <div key={subIndex} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {subItem.title}
                    </h4>
                    <div className="grid gap-2">
                      {subItem.services.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <Card
                            key={service.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-sm hover:border-primary/50",
                              isSelected && "bg-primary/10 border-primary"
                            )}
                            onClick={() => toggleService(service.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm">{service.name}</span>
                                {isSelected && (
                                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Bottom continue button */}
      {selectedServices.length > 0 && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onComplete} size="lg">
            Continue with {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
