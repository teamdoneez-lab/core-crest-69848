import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { accordionsData } from "@/data/serviceslist-detailed";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [selectedSubItemIndex, setSelectedSubItemIndex] = useState<number | null>(null);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onServicesChange(selectedServices.filter((id) => id !== serviceId));
    } else {
      onServicesChange([...selectedServices, serviceId]);
    }
  };

  const handleBack = () => {
    if (selectedSubItemIndex !== null) {
      setSelectedSubItemIndex(null);
    } else if (selectedCategoryIndex !== null) {
      setSelectedCategoryIndex(null);
    }
  };

  const handleCategorySelect = (index: number) => {
    setSelectedCategoryIndex(index);
    setSelectedSubItemIndex(null);
  };

  const handleSubItemSelect = (index: number) => {
    setSelectedSubItemIndex(index);
  };

  // Show category selection
  if (selectedCategoryIndex === null) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Select Service Category</h2>
            <div className="space-y-3">
              {accordionsData.map((category, index) => (
                <Card
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCategorySelect(index)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{category.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.subItems.length} service groups available
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-6">
                <Button onClick={onComplete} className="w-full">
                  Continue with {selectedServices.length} Selected Service{selectedServices.length > 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show subcategory selection
  if (selectedSubItemIndex === null) {
    const selectedCategory = accordionsData[selectedCategoryIndex];
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setSelectedCategoryIndex(null)} className="cursor-pointer">
                Categories
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedCategory.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="p-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <h2 className="text-2xl font-semibold mb-6">Select Service Type</h2>
            <div className="space-y-3">
              {selectedCategory.subItems.map((subItem, index) => (
                <Card
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleSubItemSelect(index)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{subItem.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subItem.services.length} services available
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-6">
                <Button onClick={onComplete} className="w-full">
                  Continue with {selectedServices.length} Selected Service{selectedServices.length > 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show service selection
  const selectedCategory = accordionsData[selectedCategoryIndex];
  const selectedSubItem = selectedCategory.subItems[selectedSubItemIndex];

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => setSelectedCategoryIndex(null)} className="cursor-pointer">
              Categories
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => setSelectedSubItemIndex(null)} className="cursor-pointer">
              {selectedCategory.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{selectedSubItem.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardContent className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <h2 className="text-2xl font-semibold mb-6">Select Services</h2>
          <div className="space-y-2">
            {selectedSubItem.services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => toggleService(service.id)}
                >
                  <Checkbox
                    id={service.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <label
                    htmlFor={service.id}
                    className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {service.name}
                  </label>
                </div>
              );
            })}
          </div>
          {selectedServices.length > 0 && (
            <div className="mt-6">
              <Button onClick={onComplete} className="w-full">
                Continue with {selectedServices.length} Selected Service{selectedServices.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
