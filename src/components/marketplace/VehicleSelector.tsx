import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Save, X } from 'lucide-react';
import { MOCK_YEARS, MOCK_MAKES, MOCK_MODELS, MOCK_ENGINES, Vehicle } from '@/data/mockVehicles';
import { useToast } from '@/hooks/use-toast';

interface VehicleSelectorProps {
  onVehicleSelect: (vehicle: Vehicle | null) => void;
}

export function VehicleSelector({ onVehicleSelect }: VehicleSelectorProps) {
  const [year, setYear] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [engine, setEngine] = useState<string>('');
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  // Load saved vehicles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('myGarage');
    if (saved) {
      const vehicles = JSON.parse(saved);
      setSavedVehicles(vehicles);
      if (vehicles.length > 0) {
        const active = vehicles[0];
        setActiveVehicle(active);
        setYear(active.year.toString());
        setMake(active.make);
        setModel(active.model);
        if (active.engine) setEngine(active.engine);
        onVehicleSelect(active);
      }
    }
  }, []);

  const handleYearChange = (value: string) => {
    setYear(value);
    setMake('');
    setModel('');
    setEngine('');
  };

  const handleMakeChange = (value: string) => {
    setMake(value);
    setModel('');
    setEngine('');
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    setEngine('');
  };

  const handleEngineChange = (value: string) => {
    setEngine(value);
    const vehicle: Vehicle = {
      id: `${year}-${make}-${model}-${value}`,
      year: parseInt(year),
      make,
      model,
      engine: value,
    };
    setActiveVehicle(vehicle);
    onVehicleSelect(vehicle);
  };

  const handleSaveVehicle = () => {
    if (!year || !make || !model) {
      toast({
        title: 'Incomplete Selection',
        description: 'Please select at least Year, Make, and Model.',
        variant: 'destructive',
      });
      return;
    }

    const vehicle: Vehicle = {
      id: `${year}-${make}-${model}${engine ? `-${engine}` : ''}`,
      year: parseInt(year),
      make,
      model,
      engine: engine || undefined,
    };

    const updated = [...savedVehicles, vehicle];
    setSavedVehicles(updated);
    localStorage.setItem('myGarage', JSON.stringify(updated));
    setActiveVehicle(vehicle);
    onVehicleSelect(vehicle);

    toast({
      title: 'Vehicle Saved',
      description: `${vehicle.year} ${vehicle.make} ${vehicle.model} added to My Garage.`,
    });
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    const updated = savedVehicles.filter(v => v.id !== vehicleId);
    setSavedVehicles(updated);
    localStorage.setItem('myGarage', JSON.stringify(updated));
    
    if (activeVehicle?.id === vehicleId) {
      setActiveVehicle(null);
      setYear('');
      setMake('');
      setModel('');
      setEngine('');
      onVehicleSelect(null);
    }

    toast({
      title: 'Vehicle Removed',
      description: 'Vehicle removed from My Garage.',
    });
  };

  const handleSelectSavedVehicle = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setYear(vehicle.year.toString());
    setMake(vehicle.make);
    setModel(vehicle.model);
    setEngine(vehicle.engine || '');
    onVehicleSelect(vehicle);
  };

  const availableMakes = year ? MOCK_MAKES[year] || [] : [];
  const availableModels = make ? MOCK_MODELS[make] || [] : [];
  const availableEngines = model ? MOCK_ENGINES[model] || [] : [];

  const canSetActiveVehicle = year && make && model;
  const isVehicleActive = activeVehicle !== null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {isVehicleActive && activeVehicle ? (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  Active Vehicle: {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveVehicle(null);
                    setYear('');
                    setMake('');
                    setModel('');
                    setEngine('');
                    onVehicleSelect(null);
                  }}
                  className="text-xs"
                >
                  [Change]
                </Button>
              </div>
            ) : (
              <h3 className="font-semibold text-lg">Select Your Vehicle</h3>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className={!year ? 'bg-muted/50' : ''}>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {MOCK_YEARS.map(y => (
                <SelectItem key={y.id} value={y.id}>
                  {y.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={make} onValueChange={handleMakeChange} disabled={!year}>
            <SelectTrigger className={!make && year ? 'bg-muted/50' : ''}>
              <SelectValue placeholder="Make" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {availableMakes.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={model} onValueChange={handleModelChange} disabled={!make}>
            <SelectTrigger className={!model && make ? 'bg-muted/50' : ''}>
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {availableModels.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={engine} onValueChange={handleEngineChange} disabled={!model}>
            <SelectTrigger>
              <SelectValue placeholder="Engine (Optional)" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {availableEngines.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSaveVehicle}
            disabled={!canSetActiveVehicle}
            variant="secondary"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Set Active Vehicle
          </Button>
        </div>

        {savedVehicles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">My Garage</h4>
            <div className="flex flex-wrap gap-2">
              {savedVehicles.map(vehicle => (
                <Badge
                  key={vehicle.id}
                  variant={activeVehicle?.id === vehicle.id ? 'default' : 'secondary'}
                  className="px-3 py-1.5 cursor-pointer group"
                  onClick={() => handleSelectSavedVehicle(vehicle)}
                >
                  <span className="mr-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                    {vehicle.engine ? ` (${vehicle.engine})` : ''}
                  </span>
                  <X
                    className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVehicle(vehicle.id);
                    }}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
