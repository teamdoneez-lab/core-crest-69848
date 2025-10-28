import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Check } from "lucide-react";
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
      { id: "diagnosis", name: "Diagnosis & Inspections", description: "Identify issues, test systems, or get certified inspections" },
      { id: "maintenance", name: "Maintenance", description: "Routine services to keep your vehicle running smoothly" },
      { id: "repairs", name: "Repairs", description: "Fix mechanical or electrical issues and restore vehicle performance" },
      { id: "body", name: "Auto Body", description: "Cosmetic, collision, and structural body repairs" },
      { id: "customization", name: "Customization", description: "Style, performance, and interior personalization" },
      { id: "detail", name: "Detailing", description: "Deep cleaning and protection for interior and exterior" },
    ],
  },
  
  // ===== DIAGNOSIS & INSPECTIONS =====
  diagnosis: {
    question: "What type of diagnosis or inspection do you need?",
    options: [
      { id: "diagnosis-general", name: "General Diagnostics", description: "Identify and troubleshoot vehicle issues" },
      { id: "diagnosis-inspections", name: "Inspections & Testing", description: "Pre-purchase, rideshare, emissions, and safety inspections" },
      { id: "diagnosis-specialized", name: "Specialized Diagnostics", description: "Advanced system testing and diagnostics" },
      { id: "diagnosis-roadside", name: "Roadside & Emergency", description: "Towing and emergency assistance" },
      { id: "diagnosis-other", name: "Other / Not Sure", description: "Help me identify the issue" },
    ],
  },
  "diagnosis-general": {
    question: "What general diagnostic service do you need?",
    options: [
      { id: "diag-001", name: "Identify and troubleshoot vehicle issues" },
      { id: "diag-002", name: "Check Engine Light Diagnosis" },
      { id: "diag-003", name: "Vehicle Starting Issues Diagnosis" },
      { id: "diag-004", name: "No Start / Stalling Diagnosis" },
      { id: "diag-005", name: "Electrical System Diagnostics" },
      { id: "diag-006", name: "Battery & Charging System Testing" },
    ],
  },
  "diagnosis-inspections": {
    question: "What inspection or test do you need?",
    options: [
      { id: "diag-101", name: "Pre-Purchase Vehicle Inspection" },
      { id: "diag-102", name: "Rideshare Inspection (Uber, Lyft, Turo)" },
      { id: "diag-103", name: "Emissions Testing / Smog Check" },
      { id: "diag-104", name: "State Safety Inspection / Vehicle Checkup" },
      { id: "diag-105", name: "Brake System Inspection" },
      { id: "diag-106", name: "Tire & Suspension Inspection" },
    ],
  },
  "diagnosis-specialized": {
    question: "What specialized diagnostic do you need?",
    options: [
      { id: "diag-201", name: "Transmission & Drivetrain Diagnostics" },
      { id: "diag-202", name: "Engine Performance Testing" },
      { id: "diag-203", name: "AC / Climate System Diagnosis" },
      { id: "diag-204", name: "Steering & Suspension Diagnostics" },
      { id: "diag-205", name: "Exhaust & Emissions Diagnostics" },
    ],
  },
  "diagnosis-roadside": {
    question: "What roadside service do you need?",
    options: [
      { id: "diag-301", name: "Towing & Roadside Assistance" },
      { id: "diag-302", name: "Jump Start / Battery Boost" },
      { id: "diag-303", name: "Flat Tire Assistance" },
      { id: "diag-304", name: "Lockout Service" },
    ],
  },
  "diagnosis-other": {
    question: "Tell us what you need help with",
    options: [
      { id: "not-sure", name: "Not Sure — Help me identify the issue" },
      { id: "other", name: "Other — Describe your problem" },
    ],
  },

  // ===== MAINTENANCE =====
  maintenance: {
    question: "What maintenance service do you need?",
    options: [
      { id: "maint-engine", name: "Engine & Fluids", description: "Oil changes and fluid services" },
      { id: "maint-filters", name: "Filters", description: "Air and cabin filter replacement" },
      { id: "maint-brakes", name: "Brakes", description: "Brake fluid and pad services" },
      { id: "maint-tires", name: "Tires & Wheels", description: "Rotation, balance, alignment, and replacement" },
      { id: "maint-electrical", name: "Electrical & Battery", description: "Battery and spark plug services" },
      { id: "maint-general", name: "General Maintenance", description: "Wipers, timing belt, and more" },
    ],
  },
  "maint-engine": {
    question: "What engine or fluid service do you need?",
    options: [
      { id: "maint-001", name: "Oil Change" },
      { id: "maint-002", name: "Coolant System Service" },
      { id: "maint-003", name: "Power Steering Fluid Service" },
      { id: "maint-004", name: "Transmission Fluid Change" },
      { id: "maint-005", name: "Fuel System Service" },
    ],
  },
  "maint-filters": {
    question: "What filter needs replacement?",
    options: [
      { id: "maint-101", name: "Air Filter Replacement" },
      { id: "maint-102", name: "Cabin Air Filter Replacement" },
    ],
  },
  "maint-brakes": {
    question: "What brake maintenance do you need?",
    options: [
      { id: "maint-201", name: "Brake Fluid Service" },
      { id: "maint-202", name: "Brake Pad Replacement" },
    ],
  },
  "maint-tires": {
    question: "What tire or wheel service do you need?",
    options: [
      { id: "maint-301", name: "Tire Rotation" },
      { id: "maint-302", name: "Tire Balance & Alignment" },
      { id: "maint-303", name: "Tire Replacement" },
      { id: "maint-304", name: "Flat Tire Repair" },
    ],
  },
  "maint-electrical": {
    question: "What electrical maintenance do you need?",
    options: [
      { id: "maint-401", name: "Battery Service" },
      { id: "maint-402", name: "Spark Plug Replacement" },
    ],
  },
  "maint-general": {
    question: "What general maintenance do you need?",
    options: [
      { id: "maint-501", name: "Wiper Blade Replacement" },
      { id: "maint-502", name: "Timing Belt/Chain Replacement" },
    ],
  },

  // ===== REPAIRS =====
  repairs: {
    question: "What type of repair do you need?",
    options: [
      { id: "repair-engine", name: "Engine Repairs", description: "Engine diagnostics, tune-ups, and component repairs" },
      { id: "repair-brakes", name: "Brakes", description: "Brake system repairs and replacements" },
      { id: "repair-electrical", name: "Battery & Electrical", description: "Electrical components and wiring" },
      { id: "repair-hvac", name: "Heating & Air Conditioning", description: "Climate control repairs" },
      { id: "repair-steering", name: "Steering & Suspension", description: "Steering and ride quality repairs" },
      { id: "repair-transmission", name: "Transmission & Drivetrain", description: "Transmission and drivetrain repairs" },
      { id: "repair-exhaust", name: "Exhaust & Emissions", description: "Exhaust system and emissions repairs" },
      { id: "repair-ev", name: "EV & Hybrid Vehicles", description: "Electric and hybrid system repairs" },
      { id: "repair-other", name: "Other / Not Sure", description: "Help me diagnose the issue" },
    ],
  },
  "repair-engine": {
    question: "What engine repair do you need?",
    options: [
      { id: "rep-001", name: "Engine Diagnostics" },
      { id: "rep-002", name: "Engine Tune-Up / Repair" },
      { id: "rep-003", name: "Timing Belt / Chain Replacement" },
      { id: "rep-004", name: "Oil Leaks / Gasket Repair" },
      { id: "rep-005", name: "Cooling System Repair (Radiator, Water Pump, Hoses)" },
      { id: "rep-006", name: "Fuel System Repairs (Injectors, Fuel Pump, Filters)" },
    ],
  },
  "repair-brakes": {
    question: "What brake repair do you need?",
    options: [
      { id: "rep-101", name: "Brake Pad / Shoe Replacement" },
      { id: "rep-102", name: "Brake Rotor / Drum Replacement" },
      { id: "rep-103", name: "Brake Fluid Flush" },
      { id: "rep-104", name: "Brake Lines & Hoses Repair" },
      { id: "rep-105", name: "ABS System Repair" },
    ],
  },
  "repair-electrical": {
    question: "What electrical repair do you need?",
    options: [
      { id: "rep-201", name: "Battery Replacement & Testing" },
      { id: "rep-202", name: "Starter / Alternator Repair" },
      { id: "rep-203", name: "Wiring & Fuses Repair" },
      { id: "rep-204", name: "Lighting Repair (Headlights, Taillights, Interior)" },
      { id: "rep-205", name: "Sensor Diagnostics" },
    ],
  },
  "repair-hvac": {
    question: "What heating or AC repair do you need?",
    options: [
      { id: "rep-301", name: "AC Recharge / Repair" },
      { id: "rep-302", name: "Heater Core Replacement" },
      { id: "rep-303", name: "Climate Control Diagnostics" },
      { id: "rep-304", name: "Cabin Airflow / Blower Motor Repair" },
    ],
  },
  "repair-steering": {
    question: "What steering or suspension repair do you need?",
    options: [
      { id: "rep-401", name: "Shock & Strut Replacement" },
      { id: "rep-402", name: "Steering Rack / Power Steering Repair" },
      { id: "rep-403", name: "Ball Joints / Tie Rods Replacement" },
      { id: "rep-404", name: "Wheel Alignment & Suspension Diagnostics" },
    ],
  },
  "repair-transmission": {
    question: "What transmission or drivetrain repair do you need?",
    options: [
      { id: "rep-501", name: "Transmission Repair / Replacement" },
      { id: "rep-502", name: "Clutch Replacement (Manual)" },
      { id: "rep-503", name: "Drive Shaft / Axle Repair" },
      { id: "rep-504", name: "Differential / Transfer Case Service" },
    ],
  },
  "repair-exhaust": {
    question: "What exhaust or emissions repair do you need?",
    options: [
      { id: "rep-601", name: "Muffler / Exhaust Pipe Repair" },
      { id: "rep-602", name: "Catalytic Converter Replacement" },
      { id: "rep-603", name: "Oxygen Sensor Replacement" },
      { id: "rep-604", name: "Emissions Diagnostics / Repairs" },
    ],
  },
  "repair-ev": {
    question: "What EV or hybrid repair do you need?",
    options: [
      { id: "rep-701", name: "Battery Pack Diagnostics & Repair" },
      { id: "rep-702", name: "Electric Motor Service" },
      { id: "rep-703", name: "Regenerative Braking System Repair" },
      { id: "rep-704", name: "Charging System Repair" },
    ],
  },
  "repair-other": {
    question: "Tell us what repair you need",
    options: [
      { id: "not-sure", name: "Not Sure — Help me diagnose the issue" },
      { id: "other", name: "Other — Describe your issue" },
    ],
  },

  // ===== AUTO BODY =====
  body: {
    question: "What auto body service do you need?",
    options: [
      { id: "body-cosmetic", name: "Minor Cosmetic Repairs", description: "Dents, scratches, and touch-ups" },
      { id: "body-collision", name: "Collision & Structural Repairs", description: "Major collision and frame repairs" },
      { id: "body-paint", name: "Paint & Finish", description: "Repainting and refinishing" },
      { id: "body-glass", name: "Glass & Exterior Components", description: "Windows, mirrors, and bumpers" },
      { id: "body-adas", name: "ADAS Calibration", description: "Advanced driver assistance system calibration" },
    ],
  },
  "body-cosmetic": {
    question: "What cosmetic repair do you need?",
    options: [
      { id: "body-001", name: "Dent Repair" },
      { id: "body-002", name: "Paintless Dent Repair (PDR)" },
      { id: "body-003", name: "Scratch or Scuff Repair" },
      { id: "body-004", name: "Paint Touch-Up" },
      { id: "body-005", name: "Bumper Scratch Repair" },
    ],
  },
  "body-collision": {
    question: "What collision or structural repair do you need?",
    options: [
      { id: "body-101", name: "Full Collision Repair" },
      { id: "body-102", name: "Panel Replacement (Door, Fender, Hood, etc.)" },
      { id: "body-103", name: "Frame Straightening / Structural Repair" },
      { id: "body-104", name: "Paint & Blend Panel Refinishing" },
    ],
  },
  "body-paint": {
    question: "What paint service do you need?",
    options: [
      { id: "body-201", name: "Full Vehicle Repaint" },
      { id: "body-202", name: "Partial Panel Repaint" },
      { id: "body-203", name: "Clear Coat Restoration / Buffing" },
    ],
  },
  "body-glass": {
    question: "What glass or exterior service do you need?",
    options: [
      { id: "body-301", name: "Windshield Replacement" },
      { id: "body-302", name: "Windshield Repair" },
      { id: "body-303", name: "Side or Rear Window Replacement" },
      { id: "body-304", name: "Mirror Replacement" },
      { id: "body-305", name: "Bumper Replacement" },
    ],
  },
  "body-adas": {
    question: "ADAS calibration service",
    options: [
      { id: "body-401", name: "ADAS Calibration" },
    ],
  },

  // ===== CUSTOMIZATION =====
  customization: {
    question: "What customization service do you need?",
    options: [
      { id: "custom-exterior", name: "Exterior Styling & Appearance", description: "Wraps, tinting, body kits, and more" },
      { id: "custom-performance", name: "Performance & Handling", description: "Upgrades for power and handling" },
      { id: "custom-audio", name: "Audio, Tech & Electronics", description: "Sound systems and tech upgrades" },
      { id: "custom-interior", name: "Interior Customization", description: "Custom interior work and trim" },
    ],
  },
  "custom-exterior": {
    question: "What exterior customization do you need?",
    options: [
      { id: "cust-001", name: "Custom Paint Job" },
      { id: "cust-002", name: "Vinyl Wrap Installation" },
      { id: "cust-003", name: "Decals & Graphics" },
      { id: "cust-004", name: "Chrome Delete / Blackout Trim" },
      { id: "cust-005", name: "Window Tinting" },
      { id: "cust-006", name: "Headlight & Taillight Tint" },
      { id: "cust-007", name: "Body Kit Installation" },
      { id: "cust-008", name: "Custom Badging & Emblems" },
    ],
  },
  "custom-performance": {
    question: "What performance upgrade do you need?",
    options: [
      { id: "cust-101", name: "Performance Upgrades" },
      { id: "cust-102", name: "Suspension Lowering / Lifting" },
      { id: "cust-103", name: "Brake Upgrades" },
      { id: "cust-104", name: "Wheel & Tire Upgrades" },
      { id: "cust-105", name: "Aerodynamic Enhancements" },
    ],
  },
  "custom-audio": {
    question: "What audio or tech upgrade do you need?",
    options: [
      { id: "cust-201", name: "Audio System Installation" },
      { id: "cust-202", name: "Custom Lighting" },
      { id: "cust-203", name: "Remote Start / Security System" },
      { id: "cust-204", name: "Backup Camera / Parking Sensors" },
      { id: "cust-205", name: "Infotainment Upgrade" },
    ],
  },
  "custom-interior": {
    question: "What interior customization do you need?",
    options: [
      { id: "cust-301", name: "Custom Interior Work" },
      { id: "cust-302", name: "Custom Steering Wheel / Shift Knob" },
      { id: "cust-303", name: "Dashboard Trim Upgrade" },
      { id: "cust-304", name: "Custom Floor Mats / Headliner" },
    ],
  },

  // ===== DETAILING =====
  detail: {
    question: "What detailing service do you need?",
    options: [
      { id: "detail-exterior", name: "Exterior Detailing", description: "Wash, wax, protection, and restoration" },
      { id: "detail-interior", name: "Interior Detailing", description: "Deep cleaning and conditioning" },
      { id: "detail-packages", name: "Full Detailing Packages", description: "Complete interior and exterior services" },
    ],
  },
  "detail-exterior": {
    question: "What exterior detailing service do you need?",
    options: [
      { id: "det-001", name: "Exterior Wash & Wax" },
      { id: "det-002", name: "Paint Correction & Polishing" },
      { id: "det-003", name: "Ceramic Coating Application" },
      { id: "det-004", name: "Headlight Restoration" },
      { id: "det-005", name: "Tire & Wheel Cleaning" },
      { id: "det-006", name: "Paint Protection Film (PPF) Installation" },
    ],
  },
  "detail-interior": {
    question: "What interior detailing service do you need?",
    options: [
      { id: "det-101", name: "Interior Deep Clean" },
      { id: "det-102", name: "Leather Conditioning" },
      { id: "det-103", name: "Carpet & Upholstery Shampoo" },
      { id: "det-104", name: "Odor Removal Treatment / Deodorizing" },
      { id: "det-105", name: "Dashboard & Trim Conditioning" },
    ],
  },
  "detail-packages": {
    question: "What detailing package do you need?",
    options: [
      { id: "det-201", name: "Full Detail (Interior + Exterior)" },
      { id: "det-202", name: "Deluxe Detailing Package (Interior + Exterior + Engine Bay)" },
      { id: "det-203", name: "Engine Bay Cleaning" },
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
    // Check if this is a final service (has patterns like "diag-001", "maint-001", etc.)
    const isFinalService = /^(diag|maint|rep|body|cust|det)-\d+$/.test(optionId) || optionId === "not-sure" || optionId === "other";

    if (isFinalService) {
      // Multiple selection - toggle service in array
      if (selectedServices.includes(optionId)) {
        // Remove from selection
        onServicesChange(selectedServices.filter(id => id !== optionId));
      } else {
        // Add to selection
        onServicesChange([...selectedServices, optionId]);
      }
      // Store the final selection name
      setBreadcrumbNames({ ...breadcrumbNames, [optionId]: optionName });
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
            const isFinalService = /^(diag|maint|rep|body|cust|det)-\d+$/.test(option.id) || option.id === "not-sure" || option.id === "other";
            
            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative",
                  isSelected && isFinalService && "bg-primary/10 border-primary"
                )}
                onClick={() => handleOptionSelect(option.id, option.name)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{option.name}</h3>
                      {option.description && <p className="text-sm text-muted-foreground">{option.description}</p>}
                    </div>
                    {isSelected && isFinalService && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue button for multiple selections */}
        {selectedServices.length > 0 && (
          <div className="flex justify-end pt-4">
            <Button onClick={onComplete} size="lg">
              Continue with {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
