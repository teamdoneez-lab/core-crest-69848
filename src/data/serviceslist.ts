import { AccordionData } from '@/types/services';

export const accordionsData: AccordionData[] = [
    {
        title: '1. Auto Repair',
        subItems: [
            // Brakes
            {
                title: 'Brakes',
                services: [
                    { id: '1-1-1', name: 'Brake Safety Inspection' },
                    { id: '1-1-2', name: 'Brake Pad Replacement' },
                    { id: '1-1-3', name: 'Brake Rotor Replacement' },
                    { id: '1-1-4', name: 'Brake Fluid Flush' },
                    { id: '1-1-5', name: 'Brake Caliper Repair' },
                    { id: '1-1-6', name: 'Brake Master Cylinder Replacement' },
                    { id: '1-1-7', name: 'Brake Adjustment' },
                ],
            },
            // Electrical
            {
                title: 'Electrical',
                services: [
                    {
                        id: '1-2-1',
                        name: 'Wiring and Electrical System Diagnosis',
                    },
                    { id: '1-2-2', name: 'Ignition Switch Replacement' },
                    { id: '1-2-3', name: 'Ignition Lock Cylinder Replacement' },
                    { id: '1-2-4', name: 'Battery Replacement' },
                    { id: '1-2-5', name: 'Battery Cable Replacement' },
                    { id: '1-2-6', name: 'Battery Terminal End Service' },
                    { id: '1-2-7', name: 'Alternator Belt Replacement' },
                    { id: '1-2-8', name: 'Alternator Replacement' },
                    { id: '1-2-9', name: 'Starter Replacement' },
                ],
            },
            // Engine (Full List)
            {
                title: 'Engine',
                services: [
                    { id: '1-3-1', name: 'Engine Oil and Filter Change' },
                    { id: '1-3-2', name: 'Timing Belt Replacement' },
                    { id: '1-3-3', name: 'Cylinder Head Gasket Replacement' },
                    { id: '1-3-4', name: 'Spark Plug Replacement' },
                    { id: '1-3-5', name: 'Fuel Injector Replacement' },
                    {
                        id: '1-3-6',
                        name: 'Crankshaft Position Sensor Replacement',
                    },
                    { id: '1-3-7', name: 'Valve Cover Gasket Replacement' },
                    { id: '1-3-8', name: 'Fuel Pump Replacement' },
                    { id: '1-3-9', name: 'Engine Overhaul/Rebuild' },
                    { id: '1-3-10', name: 'Piston Replacement' },
                    // Expanded services
                    { id: '1-3-11', name: 'Cylinder Head Replacement' },
                    { id: '1-3-12', name: 'Timing Chain Replacement' },
                    {
                        id: '1-3-13',
                        name: 'Timing Chain Tensioner Replacement',
                    },
                    { id: '1-3-14', name: 'Crankshaft Replacement' },
                    { id: '1-3-15', name: 'Connecting Rod Replacement' },
                    { id: '1-3-16', name: 'Valve Lash Adjustment' },
                    { id: '1-3-17', name: 'Valve Spring Replacement' },
                    { id: '1-3-18', name: 'Turbocharger Replacement' },
                    { id: '1-3-19', name: 'Supercharger Replacement' },
                    { id: '1-3-20', name: 'Oil Pump Replacement' },
                    { id: '1-3-21', name: 'VVT Sensor Replacement' },
                    {
                        id: '1-3-22',
                        name: 'Engine Diagnostics and Code Reading',
                    },
                    { id: '1-3-23', name: 'Compression Test' },
                    { id: '1-3-24', name: 'Engine Block Heater Installation' },
                    { id: '1-3-25', name: 'Cylinder Block Replacement' },
                    { id: '1-3-26', name: 'Timing Gear Replacement' },
                ],
            },
            // Exhaust
            {
                title: 'Exhaust',
                services: [
                    { id: '1-4-1', name: 'Front Pipe Replacement' },
                    { id: '1-4-2', name: 'EGR Valve Replacement' },
                    {
                        id: '1-4-3',
                        name: 'Exhaust Manifold Gasket Replacement',
                    },
                    { id: '1-4-4', name: 'Tail Pipe Replacement' },
                    { id: '1-4-5', name: 'Exhaust System Replacement' },
                    { id: '1-4-6', name: 'Emissions Failure Repair' },
                    { id: '1-4-7', name: 'Catalytic Converter Replacement' },
                    { id: '1-4-8', name: 'Muffler Replacement' },
                ],
            },
            // Heating & AC
            {
                title: 'Heating and Air Conditioning',
                services: [
                    { id: '1-5-1', name: 'AC Compressor Replacement' },
                    { id: '1-5-2', name: 'Fan Shroud Assembly Replacement' },
                    { id: '1-5-3', name: 'Fan Shroud Replacement' },
                    { id: '1-5-4', name: 'Cooling System Drain and Fill' },
                    { id: '1-5-5', name: 'Expansion Tank Replacement' },
                    { id: '1-5-6', name: 'Cooling Fan Replacement' },
                    { id: '1-5-7', name: 'Radiator Replacement' },
                    { id: '1-5-8', name: 'Radiator Fan Assembly Replacement' },
                    { id: '1-5-9', name: 'Radiator Fan Motor Replacement' },
                    { id: '1-5-10', name: 'Radiator Hose Replacement' },
                    { id: '1-5-11', name: 'Thermostat Replacement' },
                    { id: '1-5-12', name: 'Water Pump Replacement' },
                    { id: '1-5-13', name: 'Coolant Drain and Fill' },
                ],
            },
            // Diagnostics
            {
                title: 'Diagnostic and Inspection',
                services: [
                    { id: '1-6-1', name: 'Pre-Purchase Vehicle Inspection' },
                    { id: '1-6-2', name: 'Check Engine Light Diagnosis' },
                    { id: '1-6-3', name: 'Vehicle Starting Issues Diagnosis' },
                    { id: '1-6-4', name: 'No Start Diagnosis' },
                    { id: '1-6-5', name: 'Emissions Testing (Smog Check)' },
                    { id: '1-6-6', name: 'Towing and Roadside Assistance' },
                ],
            },
            // Auto Maintenance (Full List)
            {
                title: 'Auto Maintenance',
                services: [
                    {
                        id: '1-7-1',
                        name: 'Oil Change (Engine Oil and Filter Change)',
                    },
                    { id: '1-7-2', name: 'Coolant System Service' },
                    { id: '1-7-3', name: 'Brake Fluid Service' },
                    { id: '1-7-4', name: 'Power Steering Fluid Service' },
                    { id: '1-7-5', name: 'Transmission Fluid Change' },
                    { id: '1-7-6', name: 'Fuel System Service' },
                    { id: '1-7-7', name: 'Air Filter Replacement' },
                    { id: '1-7-8', name: 'Cabin Air Filter Replacement' },
                    { id: '1-7-9', name: 'Tire Rotation' },
                    { id: '1-7-10', name: 'Tire Balance and Alignment' },
                    // Expanded services
                    { id: '1-7-11', name: 'Brake Pad Replacement' },
                    {
                        id: '1-7-12',
                        name: 'Battery Service (Check and Clean Terminals)',
                    },
                    { id: '1-7-13', name: 'Wiper Blade Replacement' },
                    { id: '1-7-14', name: 'Spark Plug Replacement' },
                    { id: '1-7-15', name: 'Timing Belt/Chain Replacement' },
                    { id: '1-7-16', name: 'Differential Fluid Change' },
                    { id: '1-7-17', name: 'Suspension System Maintenance' },
                    { id: '1-7-18', name: 'Windshield Washer Fluid Refill' },
                    {
                        id: '1-7-19',
                        name: 'Serpentine Belt/Drive Belt Replacement',
                    },
                    { id: '1-7-20', name: 'Transfer Case Fluid Change' },
                    { id: '1-7-21', name: 'Tire Replacement' },
                    { id: '1-7-22', name: 'Flat Tire Repair' },
                ],
            },
            // Steering & Suspension (Full List)
            {
                title: 'Steering & Suspension',
                services: [
                    { id: '1-8-1', name: 'Power Steering Fluid Service' },
                    { id: '1-8-2', name: 'Power Steering Pump Replacement' },
                    { id: '1-8-3', name: 'Steering Rack Replacement' },
                    { id: '1-8-4', name: 'Steering Gearbox Replacement' },
                    { id: '1-8-5', name: 'Tie Rod Replacement' },
                    { id: '1-8-6', name: 'Steering Column Repair/Replacement' },
                    { id: '1-8-7', name: 'Steering Wheel Alignment' },
                    { id: '1-8-8', name: 'Shock Absorber Replacement' },
                    { id: '1-8-9', name: 'Strut Replacement' },
                    { id: '1-8-10', name: 'Coil Spring Replacement' },
                    // Expanded services
                    { id: '1-8-11', name: 'Leaf Spring Replacement' },
                    {
                        id: '1-8-12',
                        name: 'Suspension Arm/Bushing Replacement',
                    },
                    { id: '1-8-13', name: 'Ball Joint Replacement' },
                    { id: '1-8-14', name: 'Control Arm Replacement' },
                    { id: '1-8-15', name: 'Sway Bar Link Replacement' },
                    { id: '1-8-16', name: 'Suspension Mount Replacement' },
                    { id: '1-8-17', name: 'Suspension System Inspection' },
                ],
            },
            // Transmission & Drivetrain (Full List)
            {
                title: 'Transmission & Drivetrain',
                services: [
                    { id: '1-9-1', name: 'Transmission Fluid Change' },
                    { id: '1-9-2', name: 'Transmission Filter Replacement' },
                    { id: '1-9-3', name: 'Transmission Repair' },
                    { id: '1-9-4', name: 'Transmission Rebuild' },
                    { id: '1-9-5', name: 'Transmission Overhaul' },
                    {
                        id: '1-9-6',
                        name: 'Clutch Replacement (Manual Transmission)',
                    },
                    { id: '1-9-7', name: 'CVT Fluid Change' },
                    { id: '1-9-8', name: 'Gearbox Replacement' },
                    { id: '1-9-9', name: 'Shift Linkage Repair' },
                    { id: '1-9-10', name: 'Differential Fluid Change' },
                    // Expanded services
                    { id: '1-9-11', name: 'Differential Repair/Replacement' },
                    { id: '1-9-12', name: 'Axle Shaft Replacement' },
                    { id: '1-9-13', name: 'CV Joint Replacement' },
                    { id: '1-9-14', name: 'U-Joint Replacement' },
                    { id: '1-9-15', name: 'Driveshaft Replacement' },
                    { id: '1-9-16', name: 'Transfer Case Fluid Change' },
                    { id: '1-9-17', name: 'Transfer Case Repair/Replacement' },
                    { id: '1-9-18', name: '4WD/AWD System Inspection' },
                    {
                        id: '1-9-19',
                        name: 'Front/Rear Wheel Drive System Service',
                    },
                    { id: '1-9-20', name: 'Wheel Hub Bearing Replacement' },
                ],
            },
            // EV & Hybrid
            {
                title: 'EV & Hybrid Maintenance',
                services: [
                    { id: '1-10-1', name: 'Tire Rotation and Balance' },
                    { id: '1-10-2', name: 'Brake Fluid Service' },
                    { id: '1-10-3', name: 'Cabin Air Filter Replacement' },
                    { id: '1-10-4', name: 'Air Conditioning Service' },
                    { id: '1-10-5', name: 'Coolant System Service' },
                    { id: '1-10-6', name: 'Oil Change (Hybrid Vehicles)' },
                    {
                        id: '1-10-7',
                        name: 'Brake Pad Replacement (Regenerative Brakes)',
                    },
                    { id: '1-10-8', name: 'Suspension System Maintenance' },
                    { id: '1-10-9', name: 'Fluid Flush and Replacement' },
                ],
            },
            // Software Updates
            {
                title: 'Software & Firmware Updates',
                services: [
                    {
                        id: '1-11-1',
                        name: 'EV Battery Management System Update',
                    },
                    { id: '1-11-2', name: 'Infotainment System Update' },
                    { id: '1-11-3', name: 'Diagnostic Software Update' },
                    { id: '1-11-4', name: 'Powertrain Software Update' },
                    { id: '1-11-5', name: 'ECU and Control Module Updates' },
                ],
            },
            // Battery Services
            {
                title: 'Battery Services',
                services: [
                    { id: '1-12-1', name: 'Battery Charging and Maintenance' },
                    { id: '1-12-2', name: 'Battery Capacity Test' },
                    {
                        id: '1-12-3',
                        name: 'Battery Replacement (EV and Hybrid)',
                    },
                    { id: '1-12-4', name: 'Battery Conditioning' },
                    { id: '1-12-5', name: 'Battery Coolant System Service' },
                    { id: '1-12-6', name: 'DC Fast Charging Service' },
                    { id: '1-12-7', name: 'Battery Pack Rebuilding' },
                    { id: '1-12-8', name: 'Battery Monitoring System Service' },
                ],
            },
            // Hybrid Diagnostics
            {
                title: 'Hybrid Diagnostics',
                services: [
                    { id: '1-13-1', name: 'Hybrid System Diagnostics' },
                    { id: '1-13-2', name: 'Battery Diagnostics' },
                    {
                        id: '1-13-3',
                        name: 'Regenerative Braking System Diagnosis',
                    },
                    { id: '1-13-4', name: 'High Voltage System Inspection' },
                    { id: '1-13-5', name: 'Powertrain Diagnostics' },
                    { id: '1-13-6', name: 'Fault Code Reading and Reset' },
                    { id: '1-13-7', name: 'Battery Health Check' },
                    { id: '1-13-8', name: 'Electric Motor Diagnostics' },
                ],
            },
            // Electric Motor Repairs
            {
                title: 'Electric Motor & Powertrain Repairs',
                services: [
                    { id: '1-14-1', name: 'Electric Motor Repair/Replacement' },
                    { id: '1-14-2', name: 'Power Inverter Repair/Replacement' },
                    {
                        id: '1-14-3',
                        name: 'High Voltage Cable Inspection and Repair',
                    },
                    {
                        id: '1-14-4',
                        name: 'Transmission/Gearbox Repair/Replacement',
                    },
                    { id: '1-14-5', name: 'Powertrain Overhaul' },
                ],
            },
            // Performance Tuning
            {
                title: 'Performance Tuning & Customization',
                services: [
                    {
                        id: '1-15-1',
                        name: 'Performance Tuning for EV & Hybrid Powertrains',
                    },
                    { id: '1-15-2', name: 'Custom Electric Motor Upgrades' },
                    {
                        id: '1-15-3',
                        name: 'Software Tuning for Improved Efficiency',
                    },
                    {
                        id: '1-15-4',
                        name: 'Performance Exhaust Installation (Hybrid)',
                    },
                    { id: '1-15-5', name: 'Suspension Upgrades for EVs' },
                    {
                        id: '1-15-6',
                        name: 'Custom Wheel and Tire Packages for EVs',
                    },
                    { id: '1-15-7', name: 'Aerodynamic Enhancements' },
                ],
            },
        ],
    },
    {
        title: '2. Auto Body',
        subItems: [
            // Dent Repair (Completed)
            {
                title: 'Dent Repair',
                services: [
                    { id: '2-1-1', name: 'Dent Repair' },
                    { id: '2-1-2', name: 'Paintless Dent Repair (PDR)' },
                    {
                        id: '2-1-3',
                        name: 'Traditional Dent Repair (with Body Filler)',
                    },
                    { id: '2-1-4', name: 'Hail Damage Repair' },
                    { id: '2-1-5', name: 'Fender Dent Repair' },
                    { id: '2-1-6', name: 'Door Ding Repair' },
                    { id: '2-1-7', name: 'Minor Collision Dent Repair' },
                    { id: '2-1-8', name: 'Bumper Dent Repair' },
                    { id: '2-1-9', name: 'Panel and Side Panel Dent Repair' },
                    { id: '2-1-10', name: 'Fender Flare Dent Repair' },
                    { id: '2-1-11', name: 'Bumper Cover Dent Repair' },
                ],
            },
            // Collision Repair
            {
                title: 'Collision Repair',
                services: [
                    { id: '2-2-1', name: 'Full Collision Repair' },
                    { id: '2-2-2', name: 'Accident Damage Assessment' },
                    { id: '2-2-3', name: 'Frame Straightening' },
                    { id: '2-2-4', name: 'Airbag Replacement' },
                    { id: '2-2-5', name: 'Bumper Repair/Replacement' },
                    { id: '2-2-6', name: 'Structural Frame Repair' },
                    { id: '2-2-7', name: 'Alignment of Impacted Parts' },
                    {
                        id: '2-2-8',
                        name: 'Windshield Replacement After Collision',
                    },
                    { id: '2-2-9', name: 'Structural Reinforcement' },
                    { id: '2-2-10', name: 'Chassis Repair' },
                ],
            },
            // Bumper Repair/Replacement
            {
                title: 'Bumper Repair/Replacement',
                services: [
                    { id: '2-3-1', name: 'Plastic Bumper Repair' },
                    { id: '2-3-2', name: 'Bumper Crack Repair' },
                    {
                        id: '2-3-3',
                        name: 'Bumper Replacement (OEM and Aftermarket)',
                    },
                    { id: '2-3-4', name: 'Rear Bumper Replacement' },
                    { id: '2-3-5', name: 'Front Bumper Repair/Replacement' },
                    { id: '2-3-6', name: 'Bumper Cover Replacement' },
                    { id: '2-3-7', name: 'Bumper Reinforcement Repair' },
                    { id: '2-3-8', name: 'Bumper Paint Repair' },
                    { id: '2-3-9', name: 'Bumper Dent Repair' },
                    { id: '2-3-10', name: 'Bumper Reattachment and Alignment' },
                ],
            },
            // Auto Body Painting
            {
                title: 'Auto Body Painting',
                services: [
                    { id: '2-4-1', name: 'Full Vehicle Respray' },
                    { id: '2-4-2', name: 'Custom Paint Jobs' },
                    { id: '2-4-3', name: 'Clear Coat Application' },
                    { id: '2-4-4', name: 'Matte and Gloss Finish Options' },
                    { id: '2-4-5', name: 'Auto Paint Correction' },
                    { id: '2-4-6', name: 'Color Matching' },
                    {
                        id: '2-4-7',
                        name: 'Paint Protection Film (PPF) Installation',
                    },
                    {
                        id: '2-4-8',
                        name: 'Ceramic Coating for Paint Protection',
                    },
                    {
                        id: '2-4-9',
                        name: 'Vinyl Wrapping (for Custom Graphics)',
                    },
                    { id: '2-4-10', name: 'Touch-up Paint Service' },
                ],
            },
            // Hail Damage Repair
            {
                title: 'Hail Damage Repair',
                services: [
                    {
                        id: '2-5-1',
                        name: 'Paintless Dent Repair (PDR) for Hail Damage',
                    },
                    {
                        id: '2-5-2',
                        name: 'Traditional Dent Repair (with Body Filler)',
                    },
                    { id: '2-5-3', name: 'Windshield Chip Repair' },
                    { id: '2-5-4', name: 'Hail Damage Respray' },
                    {
                        id: '2-5-5',
                        name: 'Hail Damage Assessment and Estimation',
                    },
                    { id: '2-5-6', name: 'Full Hail Damage Restoration' },
                    { id: '2-5-7', name: 'Roof Dent Repair' },
                    { id: '2-5-8', name: 'Side Panel Hail Damage Repair' },
                    { id: '2-5-9', name: 'Fender Hail Damage Repair' },
                ],
            },
            // Fender Repair/Replacement
            {
                title: 'Fender Repair/Replacement',
                services: [
                    { id: '2-6-1', name: 'Fender Dent Repair' },
                    { id: '2-6-2', name: 'Fender Replacement (OEM or Custom)' },
                    { id: '2-6-3', name: 'Fender Flare Installation' },
                    { id: '2-6-4', name: 'Fender Respray' },
                    { id: '2-6-5', name: 'Fender Trim Repair' },
                    { id: '2-6-6', name: 'Fender Alignment and Adjustment' },
                    { id: '2-6-7', name: 'Fender Damage Assessment' },
                    { id: '2-6-8', name: 'Plastic Fender Repair' },
                    { id: '2-6-9', name: 'Fender Welding' },
                    { id: '2-6-10', name: 'Custom Fender Modifications' },
                ],
            },
            // Quarter Panel Repair/Replacement
            {
                title: 'Quarter Panel Repair/Replacement',
                services: [
                    { id: '2-7-1', name: 'Quarter Panel Dent Repair' },
                    { id: '2-7-2', name: 'Quarter Panel Rust Repair' },
                    { id: '2-7-3', name: 'Quarter Panel Replacement' },
                    { id: '2-7-4', name: 'Quarter Panel Alignment' },
                    { id: '2-7-5', name: 'Quarter Panel Welding' },
                    { id: '2-7-6', name: 'Custom Quarter Panel Modifications' },
                    { id: '2-7-7', name: 'Quarter Panel Repainting' },
                    { id: '2-7-8', name: 'Rear Quarter Panel Damage Repair' },
                    { id: '2-7-9', name: 'Rear Quarter Panel Rust Treatment' },
                    { id: '2-7-10', name: 'Quarter Panel Reinforcement' },
                ],
            },
            // Additional Auto Body Services
            {
                title: 'Additional Auto Body Services',
                services: [
                    { id: '2-8-1', name: 'Auto Body Kit Installation' },
                    { id: '2-8-2', name: 'Window and Glass Replacement' },
                    { id: '2-8-3', name: 'Windshield Chip Repair' },
                    { id: '2-8-4', name: 'Headlight Restoration' },
                    { id: '2-8-5', name: 'Trim Repair/Replacement' },
                    { id: '2-8-6', name: 'Body Panel Alignment' },
                    { id: '2-8-7', name: 'Undercoating Service' },
                    { id: '2-8-8', name: 'Rust Proofing and Prevention' },
                    { id: '2-8-9', name: 'Custom Body Modifications' },
                    {
                        id: '2-8-10',
                        name: 'Car Detailing (Interior and Exterior)',
                    },
                    { id: '2-8-11', name: 'Clear Coat Application' },
                    { id: '2-8-12', name: 'Powder Coating' },
                    {
                        id: '2-8-13',
                        name: 'Paint Protection Film (PPF) Installation',
                    },
                    { id: '2-8-14', name: 'Molding and Trim Replacement' },
                    { id: '2-8-15', name: 'Door Handle Replacement' },
                    {
                        id: '2-8-16',
                        name: 'Sunroof and Moonroof Repair/Replacement',
                    },
                    { id: '2-8-17', name: 'Exhaust Tip Replacement' },
                    { id: '2-8-18', name: 'Wheel Arch Repair' },
                    { id: '2-8-19', name: 'Hood and Trunk Alignment' },
                    {
                        id: '2-8-20',
                        name: 'Vehicle Wrapping (Custom Graphics)',
                    },
                    { id: '2-8-21', name: 'External Vehicle Parts' },
                    { id: '2-8-22', name: 'Antenna Mast Replacement' },
                    { id: '2-8-23', name: 'Mirror Glass Replacement' },
                    { id: '2-8-24', name: 'Door Lock Replacement' },
                    { id: '2-8-25', name: 'Headlight Door Replacement' },
                    { id: '2-8-26', name: 'Header Panel Replacement' },
                    { id: '2-8-27', name: 'License Plate Bracket Replacement' },
                    { id: '2-8-28', name: 'Emblem Replacement' },
                    { id: '2-8-29', name: 'Trunk Strut Replacement' },
                    { id: '2-8-30', name: 'Grille Insert Replacement' },
                    { id: '2-8-31', name: 'Fuel Tank Cap Replacement' },
                    { id: '2-8-32', name: 'Hood Strut Replacement' },
                    {
                        id: '2-8-33',
                        name: 'Splash Guard Backing Plate Replacement',
                    },
                    { id: '2-8-34', name: 'Rear Lift Gate Locking Mechanism' },
                    { id: '2-8-35', name: 'Rear Distance Sensor Replacement' },
                    {
                        id: '2-8-36',
                        name: 'Door Weather Stripping Replacement',
                    },
                    { id: '2-8-37', name: 'Power Seat Switch Replacement' },
                    { id: '2-8-38', name: 'Energy Absorber Replacement' },
                ],
            },
        ],
    },
    {
        title: '3. Auto Customization',
        subItems: [
            {
                title: 'Exterior Modifications',
                services: [
                    { id: '3-1-1', name: 'Custom Body Kits' },
                    {
                        id: '3-1-2',
                        name: 'Aftermarket Bumpers (Front and Rear)',
                    },
                    { id: '3-1-3', name: 'Custom Grilles and Grille Guards' },
                    {
                        id: '3-1-4',
                        name: 'Fender Flares and Wheel Arch Extensions',
                    },
                    { id: '3-1-5', name: 'Custom Spoilers and Roof Scoops' },
                    { id: '3-1-6', name: 'Hood Vents and Custom Hoods' },
                    {
                        id: '3-1-7',
                        name: 'Custom Side Steps and Running Boards',
                    },
                    { id: '3-1-8', name: 'Vehicle Wrapping (Custom Graphics)' },
                    { id: '3-1-9', name: 'Custom Rims and Wheels' },
                    { id: '3-1-10', name: 'Window Tinting and Vinyl Film' },
                ],
            },
            {
                title: 'Overland Accessories',
                services: [
                    { id: '3-2-1', name: 'Roof Racks and Roof Boxes' },
                    { id: '3-2-2', name: 'Roof Top Tents' },
                    { id: '3-2-3', name: 'Off-Road Bumpers' },
                    { id: '3-2-4', name: 'Winch and Tow Hooks' },
                    { id: '3-2-5', name: 'Snorkel Installation' },
                    {
                        id: '3-2-6',
                        name: 'Overland Lighting (LED Light Bars, Spotlights)',
                    },
                    { id: '3-2-7', name: 'Off-Road Tires and Wheels' },
                    { id: '3-2-8', name: 'Rock Sliders and Skid Plates' },
                    { id: '3-2-9', name: 'Portable Power Solutions' },
                    { id: '3-2-10', name: 'Awning and Shade Installations' },
                    { id: '3-2-11', name: 'Onboard Air Systems' },
                ],
            },
            {
                title: 'Suspension Upgrades',
                services: [
                    { id: '3-3-1', name: 'Lift Kit Installation' },
                    { id: '3-3-2', name: 'Lowering Kit Installation' },
                    { id: '3-3-3', name: 'Shock Absorber and Strut Upgrades' },
                    { id: '3-3-4', name: 'Air Suspension Kits' },
                    { id: '3-3-5', name: 'Coilover Suspension Upgrades' },
                    { id: '3-3-6', name: 'Sway Bar Kits' },
                    {
                        id: '3-3-7',
                        name: 'Suspension Bushings and Arm Upgrades',
                    },
                    { id: '3-3-8', name: 'Adjustable Ride Height Kits' },
                    { id: '3-3-9', name: 'Leaf Spring Upgrades' },
                    { id: '3-3-10', name: 'Off-Road Suspension Kits' },
                ],
            },
            {
                title: 'Interior Modifications',
                services: [
                    {
                        id: '3-4-1',
                        name: 'Custom Upholstery (Leather, Suede, Fabric)',
                    },
                    {
                        id: '3-4-2',
                        name: 'Seat Replacement (Heated and Cooled Seats)',
                    },
                    {
                        id: '3-4-3',
                        name: 'Custom Dashboard and Console Modifications',
                    },
                    { id: '3-4-4', name: 'Steering Wheel Upgrades' },
                    { id: '3-4-5', name: 'Floor Mats and Liners (Custom Fit)' },
                    {
                        id: '3-4-6',
                        name: 'Interior Lighting (LED Kits, Ambient Lighting)',
                    },
                    { id: '3-4-7', name: 'Soundproofing and Insulation' },
                    {
                        id: '3-4-8',
                        name: 'Custom Interior Trim (Wood, Carbon Fiber, Aluminum)',
                    },
                    { id: '3-4-9', name: 'Custom Seat Covers' },
                    {
                        id: '3-4-10',
                        name: 'Aftermarket Entertainment System Installation',
                    },
                ],
            },
            {
                title: 'Performance Enhancements',
                services: [
                    { id: '3-5-1', name: 'Cold Air Intake Installation' },
                    {
                        id: '3-5-2',
                        name: 'Turbocharger and Supercharger Upgrades',
                    },
                    {
                        id: '3-5-3',
                        name: 'Performance Exhaust System (Cat-back, Axle-back)',
                    },
                    {
                        id: '3-5-4',
                        name: 'Performance Tuning and ECU Remapping',
                    },
                    { id: '3-5-5', name: 'High-Performance Brakes' },
                    { id: '3-5-6', name: 'Upgraded Intercoolers' },
                    { id: '3-5-7', name: 'Fuel System Upgrades' },
                    {
                        id: '3-5-8',
                        name: 'Performance Camshaft and Crankshaft Replacement',
                    },
                    {
                        id: '3-5-9',
                        name: 'Headers and High-Flow Catalytic Converters',
                    },
                    {
                        id: '3-5-10',
                        name: 'Upgraded Radiators and Oil Coolers',
                    },
                ],
            },
            {
                title: 'Technology Upgrades',
                services: [
                    { id: '3-6-1', name: 'Navigation System Installation' },
                    {
                        id: '3-6-2',
                        name: 'Advanced Infotainment Systems (Apple CarPlay, Android Auto)',
                    },
                    { id: '3-6-3', name: 'Dash Cam Installation' },
                    { id: '3-6-4', name: 'Blind Spot Detection System' },
                    { id: '3-6-5', name: 'Parking Sensors and Backup Cameras' },
                    { id: '3-6-6', name: 'Remote Start Systems' },
                    {
                        id: '3-6-7',
                        name: 'Aftermarket Stereo Systems and Speakers',
                    },
                    { id: '3-6-8', name: 'LED and HID Headlight Upgrades' },
                    {
                        id: '3-6-9',
                        name: 'Smartphone Integration and Bluetooth',
                    },
                    {
                        id: '3-6-10',
                        name: 'Adaptive Cruise Control Installation',
                    },
                ],
            },
            {
                title: 'Protection and Maintenance',
                services: [
                    {
                        id: '3-7-1',
                        name: 'Ceramic Coating for Paint Protection',
                    },
                    {
                        id: '3-7-2',
                        name: 'Paint Protection Film (PPF) Installation',
                    },
                    { id: '3-7-3', name: 'Rust Proofing and Undercoating' },
                    {
                        id: '3-7-4',
                        name: 'Clear Bra Installation (Front End Protection)',
                    },
                    { id: '3-7-5', name: 'UV Protection Window Tinting' },
                    { id: '3-7-6', name: 'Windshield Protection Film' },
                    { id: '3-7-7', name: 'All-Weather Floor Mats and Liners' },
                    { id: '3-7-8', name: 'Custom Seat Covers (Protective)' },
                    { id: '3-7-9', name: 'Custom Car Covers' },
                    { id: '3-7-10', name: 'Off-Road Protective Coatings' },
                ],
            },
            {
                title: 'Restoration and Classics',
                services: [
                    { id: '3-8-1', name: 'Classic Car Restoration' },
                    { id: '3-8-2', name: 'Engine Rebuild for Classic Cars' },
                    { id: '3-8-3', name: 'Classic Car Custom Paint Jobs' },
                    {
                        id: '3-8-4',
                        name: 'Vintage Upholstery and Interior Restoration',
                    },
                    {
                        id: '3-8-5',
                        name: 'Restoration of Classic Car Trim and Chrome',
                    },
                    {
                        id: '3-8-6',
                        name: 'Body Panel Repair and Replacement for Classic Cars',
                    },
                    {
                        id: '3-8-7',
                        name: 'Rebuild and Restore Classic Suspensions',
                    },
                    {
                        id: '3-8-8',
                        name: 'Restoration of Classic Wheels and Rims',
                    },
                    {
                        id: '3-8-9',
                        name: 'Upgrading Classic Car Electronics (Custom Radios, Gauges)',
                    },
                    {
                        id: '3-8-10',
                        name: 'Classic Car Re-Painting and Refinishing',
                    },
                ],
            },
            // "Click to See More..." Services
            {
                title: 'Additional Customization Services',
                services: [
                    {
                        id: '3-9-1',
                        name: 'Custom Lighting (Underbody, Off-Road, LED)',
                    },
                    {
                        id: '3-9-2',
                        name: 'Aftermarket Grills and Front Fascia Customization',
                    },
                    { id: '3-9-3', name: 'Performance Clutch Upgrades' },
                    { id: '3-9-4', name: 'Custom Exhaust Tips and Mufflers' },
                    {
                        id: '3-9-5',
                        name: 'Aftermarket Rear Bumper and Tow Bar Installations',
                    },
                    {
                        id: '3-9-6',
                        name: 'Aftermarket Sunroof or Moonroof Installation',
                    },
                    { id: '3-9-7', name: 'Custom Fenders and Wheel Wells' },
                    { id: '3-9-8', name: 'Vehicle Lift and Jacking Systems' },
                    {
                        id: '3-9-9',
                        name: 'Customized Floorboard and Pedal Kits',
                    },
                    {
                        id: '3-9-10',
                        name: 'Body Armor and Off-Road Protection Accessories',
                    },
                ],
            },
        ],
    },

    // 4. Auto Detail
    {
        title: '4. Auto Detail',
        subItems: [
            {
                title: 'Exterior Detailing',
                services: [
                    { id: '4-1-1', name: 'Hand Wash and Dry' },
                    { id: '4-1-2', name: 'Clay Bar Treatment' },
                    { id: '4-1-3', name: 'Paint Correction' },
                    { id: '4-1-4', name: 'Waxing and Sealing' },
                    {
                        id: '4-1-5',
                        name: 'Paint Protection Film (PPF) Application',
                    },
                    {
                        id: '4-1-6',
                        name: 'Ceramic Coating for Exterior Protection',
                    },
                    { id: '4-1-7', name: 'Headlight Restoration' },
                    { id: '4-1-8', name: 'Tar and Bug Removal' },
                    {
                        id: '4-1-9',
                        name: 'Wheel and Tire Cleaning and Protection',
                    },
                    {
                        id: '4-1-10',
                        name: 'Wheel Well Cleaning and Protection',
                    },
                    { id: '4-1-11', name: 'Engine Bay Cleaning' },
                ],
            },
            {
                title: 'Interior Detailing',
                services: [
                    { id: '4-2-1', name: 'Vacuuming and Deep Cleaning' },
                    {
                        id: '4-2-2',
                        name: 'Carpet and Upholstery Cleaning (Fabric or Leather)',
                    },
                    { id: '4-2-3', name: 'Leather Cleaning and Conditioning' },
                    { id: '4-2-4', name: 'Dashboard and Console Cleaning' },
                    {
                        id: '4-2-5',
                        name: 'Interior Window and Mirror Cleaning',
                    },
                    { id: '4-2-6', name: 'Door Panel Cleaning' },
                    { id: '4-2-7', name: 'Seat and Floor Mat Cleaning' },
                    { id: '4-2-8', name: 'Odor Removal and Air Freshening' },
                    {
                        id: '4-2-9',
                        name: 'Interior Plastic and Vinyl Restoration',
                    },
                    { id: '4-2-10', name: 'Cabin Filter Replacement' },
                ],
            },
            {
                title: 'Engine Bay Detailing',
                services: [
                    { id: '4-3-1', name: 'Engine Cleaning and Degreasing' },
                    { id: '4-3-2', name: 'Engine Bay Dressing and Protection' },
                    { id: '4-3-3', name: 'Under Hood Detailing' },
                    {
                        id: '4-3-4',
                        name: 'Battery Cleaning and Terminals Check',
                    },
                    {
                        id: '4-3-5',
                        name: 'Radiator Grill and Engine Surface Cleaning',
                    },
                ],
            },
            {
                title: 'Wheel and Tire Detailing',
                services: [
                    { id: '4-4-1', name: 'Wheel Cleaning and Polishing' },
                    { id: '4-4-2', name: 'Tire Cleaning and Conditioning' },
                    { id: '4-4-3', name: 'Tire Shine Application' },
                    { id: '4-4-4', name: 'Rim Polishing' },
                    { id: '4-4-5', name: 'Brake Dust Removal' },
                    {
                        id: '4-4-6',
                        name: 'Wheel Protection Application (Ceramic Coating or Sealant)',
                    },
                ],
            },
            {
                title: 'Glass and Mirror Detailing',
                services: [
                    {
                        id: '4-5-1',
                        name: 'Exterior Window Cleaning and Polishing',
                    },
                    { id: '4-5-2', name: 'Interior Window Cleaning' },
                    {
                        id: '4-5-3',
                        name: 'Windshield Treatment (Water Repellent)',
                    },
                    { id: '4-5-4', name: 'Mirror Polishing and Cleaning' },
                    { id: '4-5-5', name: 'Headlight and Taillight Polishing' },
                ],
            },
            {
                title: 'Trim and Plastic Detailing',
                services: [
                    { id: '4-6-1', name: 'Exterior Trim Restoration' },
                    { id: '4-6-2', name: 'Plastic and Vinyl Restoration' },
                    { id: '4-6-3', name: 'Plastic Polishing' },
                    { id: '4-6-4', name: 'Trim Painting and Protection' },
                    { id: '4-6-5', name: 'Rubber Seal Conditioning' },
                ],
            },
            {
                title: 'Paint Protection',
                services: [
                    {
                        id: '4-7-1',
                        name: 'Paint Protection Film (PPF) Installation',
                    },
                    {
                        id: '4-7-2',
                        name: 'Ceramic Coating for Paint Protection',
                    },
                    { id: '4-7-3', name: 'Clear Coat Application' },
                    { id: '4-7-4', name: 'Paint Sealant Application' },
                    { id: '4-7-5', name: 'Scratch and Chip Repair' },
                    { id: '4-7-6', name: 'Paint Touch-up Service' },
                    { id: '4-7-7', name: 'Paint Correction and Polishing' },
                ],
            },
            {
                title: 'Specialized Detailing Services',
                services: [
                    { id: '4-8-1', name: 'Pet Hair Removal' },
                    { id: '4-8-2', name: 'Engine Detailing and Degreasing' },
                    { id: '4-8-3', name: 'Odor Removal (Smoke, Pet, Mold)' },
                    { id: '4-8-4', name: 'Heavy Stain Removal' },
                    { id: '4-8-5', name: 'Headlight Restoration' },
                    {
                        id: '4-8-6',
                        name: 'Detailing for Classic and Vintage Cars',
                    },
                    { id: '4-8-7', name: 'Mobile Detailing Service' },
                ],
            },
            {
                title: 'Car Wash Services',
                services: [
                    { id: '4-9-1', name: 'Hand Wash and Dry' },
                    { id: '4-9-2', name: 'Touchless Car Wash' },
                    { id: '4-9-3', name: 'Exterior Only Wash' },
                    { id: '4-9-4', name: 'Express Wash' },
                    { id: '4-9-5', name: 'Pre-Wash Foam Treatment' },
                    { id: '4-9-6', name: 'Soft Cloth Car Wash' },
                    { id: '4-9-7', name: 'Waterless Wash' },
                    { id: '4-9-8', name: 'Rinseless Wash' },
                ],
            },
        ],
    },
    {
        title: '5. Wheels and Tires',
        subItems: [
            // Tire Services
            {
                title: 'Tire Services',
                services: [
                    { id: '5-1-1', name: 'Tire Installation' },
                    { id: '5-1-2', name: 'Tire Replacement' },
                    { id: '5-1-3', name: 'Tire Repair (Puncture Repair)' },
                    { id: '5-1-4', name: 'Tire Rotation' },
                    { id: '5-1-5', name: 'Tire Balancing' },
                    { id: '5-1-6', name: 'Tire Alignment' },
                    { id: '5-1-7', name: 'Seasonal Tire Changeover' },
                    { id: '5-1-8', name: 'Run-Flat Tire Service' },
                    { id: '5-1-9', name: 'Tire Pressure Check' },
                    {
                        id: '5-1-10',
                        name: 'TPMS (Tire Pressure Monitoring System) Service',
                    },
                ],
            },
            // Wheel Services
            {
                title: 'Wheel Services',
                services: [
                    { id: '5-2-1', name: 'Wheel Installation' },
                    { id: '5-2-2', name: 'Wheel Alignment' },
                    { id: '5-2-3', name: 'Wheel Balancing' },
                    { id: '5-2-4', name: 'Wheel Repair' },
                    { id: '5-2-5', name: 'Wheel Lug Nut Replacement' },
                    { id: '5-2-6', name: 'Wheel Refinishing and Polishing' },
                    { id: '5-2-7', name: 'Wheel Straightening' },
                    { id: '5-2-8', name: 'Custom Wheel Installation' },
                ],
            },
            // Tire and Wheel Maintenance
            {
                title: 'Tire and Wheel Maintenance',
                services: [
                    { id: '5-3-1', name: 'Tire and Wheel Cleaning' },
                    {
                        id: '5-3-2',
                        name: 'Wheel and Tire Protection Application (Ceramic Coating)',
                    },
                    { id: '5-3-3', name: 'Tire Shine Application' },
                    {
                        id: '5-3-4',
                        name: 'Tire Pressure Monitoring System (TPMS) Sensor Replacement',
                    },
                    { id: '5-3-5', name: 'Valve Stem Replacement' },
                    {
                        id: '5-3-6',
                        name: 'Wheel Hub and Bearing Inspection/Replacement',
                    },
                ],
            },
            // Tire and Wheel Customization
            {
                title: 'Tire and Wheel Customization',
                services: [
                    {
                        id: '5-4-1',
                        name: 'Custom Tires (Performance/Off-road)',
                    },
                    { id: '5-4-2', name: 'Custom Wheel Installation' },
                    { id: '5-4-3', name: 'Aftermarket Wheels' },
                    { id: '5-4-4', name: 'Wheel Painting and Customization' },
                    {
                        id: '5-4-5',
                        name: 'Tire and Wheel Accessories (Rims, Valve Caps, etc.)',
                    },
                ],
            },
        ],
    },
];
