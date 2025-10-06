import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ServiceOption {
  id: string;
  name: string;
  description?: string;
}

interface CategoryLevel {
  question: string;
  options: ServiceOption[];
}

// Guided service selection data structure
const serviceFlow: Record<string, CategoryLevel> = {
  root: {
    question: "What type of auto service do you need?",
    options: [
      { id: "diagnosis", name: "Diagnosis and Inspection", description: "Identify issues with your vehicle" },
      { id: "maintenance", name: "Maintenance", description: "Regular upkeep and preventive care" },
      { id: "repairs", name: "Repairs", description: "Fix specific problems" },
      { id: "body", name: "Auto Body", description: "Cosmetic and structural repairs" },
    ],
  },
  diagnosis: {
    question: "What type of diagnosis do you need?",
    options: [
      { id: "1-6-1", name: "Pre-Purchase Vehicle Inspection" },
      { id: "1-6-2", name: "Check Engine Light Diagnosis" },
      { id: "1-6-3", name: "Vehicle Starting Issues Diagnosis" },
      { id: "1-6-4", name: "No Start Diagnosis" },
      { id: "1-6-5", name: "Emissions Testing (Smog Check)" },
      { id: "1-6-6", name: "Towing and Roadside Assistance" },
    ],
  },
  maintenance: {
    question: "What maintenance service do you need?",
    options: [
      { id: "1-7-1", name: "Oil Change (Engine Oil and Filter Change)" },
      { id: "1-7-2", name: "Coolant System Service" },
      { id: "1-7-3", name: "Brake Fluid Service" },
      { id: "1-7-4", name: "Power Steering Fluid Service" },
      { id: "1-7-5", name: "Transmission Fluid Change" },
      { id: "1-7-6", name: "Fuel System Service" },
      { id: "1-7-7", name: "Air Filter Replacement" },
      { id: "1-7-8", name: "Cabin Air Filter Replacement" },
      { id: "1-7-9", name: "Tire Rotation" },
      { id: "1-7-10", name: "Tire Balance and Alignment" },
      { id: "1-7-11", name: "Brake Pad Replacement" },
      { id: "1-7-12", name: "Battery Service (Check and Clean Terminals)" },
      { id: "1-7-13", name: "Wiper Blade Replacement" },
      { id: "1-7-14", name: "Spark Plug Replacement" },
      { id: "1-7-15", name: "Timing Belt/Chain Replacement" },
    ],
  },
  repairs: {
    question: "What repair do you need?",
    options: [
      { id: "engine", name: "Engine", description: "Engine-related issues" },
      { id: "brakes", name: "Brakes", description: "Brake system repairs" },
      { id: "electrical", name: "Battery & Electrical System", description: "Electrical components" },
      { id: "hvac", name: "Heating & Air Conditioning", description: "Climate control systems" },
      { id: "steering", name: "Steering & Suspension", description: "Steering and ride quality" },
      { id: "transmission", name: "Transmission", description: "Transmission and drivetrain" },
      { id: "exhaust", name: "Exhaust System", description: "Exhaust and emissions" },
      { id: "hybrid", name: "EV & Hybrid", description: "Electric and hybrid vehicles" },
    ],
  },
  brakes: {
    question: "What part of your brakes needs repair?",
    options: [
      { id: "1-1-1", name: "Brake Safety Inspection" },
      { id: "1-1-2", name: "Brake Pad Replacement" },
      { id: "1-1-3", name: "Brake Rotor Replacement" },
      { id: "1-1-4", name: "Brake Fluid Flush" },
      { id: "1-1-5", name: "Brake Caliper Repair" },
      { id: "1-1-6", name: "Brake Master Cylinder Replacement" },
      { id: "1-1-7", name: "Brake Adjustment" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  engine: {
    question: "What engine service do you need?",
    options: [
      { id: "1-3-1", name: "Engine Oil and Filter Change" },
      { id: "1-3-2", name: "Timing Belt Replacement" },
      { id: "1-3-3", name: "Cylinder Head Gasket Replacement" },
      { id: "1-3-4", name: "Spark Plug Replacement" },
      { id: "1-3-5", name: "Fuel Injector Replacement" },
      { id: "1-3-6", name: "Crankshaft Position Sensor Replacement" },
      { id: "1-3-7", name: "Valve Cover Gasket Replacement" },
      { id: "1-3-8", name: "Fuel Pump Replacement" },
      { id: "1-3-9", name: "Engine Overhaul/Rebuild" },
      { id: "1-3-22", name: "Engine Diagnostics and Code Reading" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  electrical: {
    question: "What electrical service do you need?",
    options: [
      { id: "1-2-1", name: "Wiring and Electrical System Diagnosis" },
      { id: "1-2-2", name: "Ignition Switch Replacement" },
      { id: "1-2-3", name: "Ignition Lock Cylinder Replacement" },
      { id: "1-2-4", name: "Battery Replacement" },
      { id: "1-2-5", name: "Battery Cable Replacement" },
      { id: "1-2-6", name: "Battery Terminal End Service" },
      { id: "1-2-7", name: "Alternator Belt Replacement" },
      { id: "1-2-8", name: "Alternator Replacement" },
      { id: "1-2-9", name: "Starter Replacement" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  hvac: {
    question: "What heating or AC service do you need?",
    options: [
      { id: "1-5-1", name: "AC Compressor Replacement" },
      { id: "1-5-4", name: "Cooling System Drain and Fill" },
      { id: "1-5-6", name: "Cooling Fan Replacement" },
      { id: "1-5-7", name: "Radiator Replacement" },
      { id: "1-5-10", name: "Radiator Hose Replacement" },
      { id: "1-5-11", name: "Thermostat Replacement" },
      { id: "1-5-12", name: "Water Pump Replacement" },
      { id: "1-5-13", name: "Coolant Drain and Fill" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  steering: {
    question: "What steering or suspension service do you need?",
    options: [
      { id: "1-8-1", name: "Power Steering Fluid Service" },
      { id: "1-8-2", name: "Power Steering Pump Replacement" },
      { id: "1-8-3", name: "Steering Rack Replacement" },
      { id: "1-8-5", name: "Tie Rod Replacement" },
      { id: "1-8-7", name: "Steering Wheel Alignment" },
      { id: "1-8-8", name: "Shock Absorber Replacement" },
      { id: "1-8-9", name: "Strut Replacement" },
      { id: "1-8-13", name: "Ball Joint Replacement" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  transmission: {
    question: "What transmission service do you need?",
    options: [
      { id: "1-9-1", name: "Transmission Fluid Change" },
      { id: "1-9-2", name: "Transmission Filter Replacement" },
      { id: "1-9-3", name: "Transmission Repair" },
      { id: "1-9-4", name: "Transmission Rebuild" },
      { id: "1-9-6", name: "Clutch Replacement (Manual Transmission)" },
      { id: "1-9-13", name: "CV Joint Replacement" },
      { id: "1-9-15", name: "Driveshaft Replacement" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  exhaust: {
    question: "What exhaust service do you need?",
    options: [
      { id: "1-4-1", name: "Front Pipe Replacement" },
      { id: "1-4-2", name: "EGR Valve Replacement" },
      { id: "1-4-3", name: "Exhaust Manifold Gasket Replacement" },
      { id: "1-4-5", name: "Exhaust System Replacement" },
      { id: "1-4-6", name: "Emissions Failure Repair" },
      { id: "1-4-7", name: "Catalytic Converter Replacement" },
      { id: "1-4-8", name: "Muffler Replacement" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  hybrid: {
    question: "What EV or Hybrid service do you need?",
    options: [
      { id: "1-10-1", name: "Tire Rotation and Balance" },
      { id: "1-10-2", name: "Brake Fluid Service" },
      { id: "1-10-4", name: "Air Conditioning Service" },
      { id: "1-10-5", name: "Coolant System Service" },
      { id: "1-10-7", name: "Brake Pad Replacement (Regenerative Brakes)" },
      { id: "1-12-1", name: "Battery Charging and Maintenance" },
      { id: "1-12-3", name: "Battery Replacement (EV and Hybrid)" },
      { id: "1-13-1", name: "Hybrid System Diagnostics" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
  body: {
    question: "What auto body service do you need?",
    options: [
      { id: "2-1-1", name: "Dent Repair" },
      { id: "2-1-2", name: "Paintless Dent Repair (PDR)" },
      { id: "2-2-1", name: "Full Collision Repair" },
      { id: "2-3-1", name: "Full Vehicle Repaint" },
      { id: "2-4-1", name: "Bumper Replacement" },
      { id: "2-5-1", name: "Windshield Replacement" },
      { id: "not-sure", name: "Not Sure" },
      { id: "other", name: "Other" },
    ],
  },
};

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
  const [navigationPath, setNavigationPath] = useState<string[]>(["root"]);
  const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({ root: "Service Type" });

  const currentLevel = navigationPath[navigationPath.length - 1];
  const currentData = serviceFlow[currentLevel];

  const handleOptionSelect = (optionId: string, optionName: string) => {
    // Check if this is a final service (has numeric ID pattern like "1-1-1")
    const isFinalService = /^\d+-\d+-\d+$/.test(optionId) || optionId === "not-sure" || optionId === "other";

    if (isFinalService) {
      // Single selection - replace any existing selection
      onServicesChange([optionId]);
      // Store the final selection name
      setBreadcrumbNames({ ...breadcrumbNames, [optionId]: optionName });
      // Auto-proceed to next step
      setTimeout(() => onComplete(), 300);
    } else {
      // Navigate to next level
      if (serviceFlow[optionId]) {
        setNavigationPath([...navigationPath, optionId]);
        setBreadcrumbNames({ ...breadcrumbNames, [optionId]: optionName });
      }
    }
  };

  const handleBack = () => {
    if (navigationPath.length > 1) {
      setNavigationPath(navigationPath.slice(0, -1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          {navigationPath.map((level, index) => (
            <div key={level} className="flex items-center">
              <BreadcrumbItem>
                {index === navigationPath.length - 1 ? (
                  <BreadcrumbPage>{breadcrumbNames[level] || "Service Type"}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="cursor-default">
                    {breadcrumbNames[level] || "Service Type"}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < navigationPath.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main question and options */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {navigationPath.length > 1 && (
            <Button variant="outline" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-2xl font-semibold">{currentData.question}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {currentData.options.map((option) => {
            const isSelected = selectedServices.includes(option.id);
            const isFinalService = /^\d+-\d+-\d+$/.test(option.id) || option.id === "not-sure" || option.id === "other";
            
            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                  isSelected && isFinalService && "bg-primary/10 border-primary"
                )}
                onClick={() => handleOptionSelect(option.id, option.name)}
              >
                <CardContent className="p-6">
                  <h3 className="font-medium mb-1">{option.name}</h3>
                  {option.description && <p className="text-sm text-muted-foreground">{option.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
