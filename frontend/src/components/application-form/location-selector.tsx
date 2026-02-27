import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BirthPlace } from '@/types/application';
import { ECUADOR_LOCATIONS } from '@/lib/data/ecuador-locations';

interface LocationSelectorProps {
  value?: BirthPlace;
  onChange: (value: BirthPlace) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  // Default country to Ecuador if not present, but respect existing data
  const [country, setCountry] = useState(value?.country || 'ECUADOR');
  const [province, setProvince] = useState(value?.province || '');
  const [canton, setCanton] = useState(value?.canton || '');
  const [parish, setParish] = useState(value?.parish || '');

  // Update internal state if external value changes (and is different)
  useEffect(() => {
    if (value?.country && value.country !== country) setCountry(value.country);
    if (value?.province && value.province !== province) setProvince(value.province);
    if (value?.canton && value.canton !== canton) setCanton(value.canton);
    if (value?.parish && value.parish !== parish) setParish(value.parish);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    // Reset child fields when country changes
    const newValue = { country: newCountry, province: '', canton: '', parish: '' };
    setProvince('');
    setCanton('');
    setParish('');
    onChange(newValue);
  };

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    // Reset child fields
    const newValue = { ...value, country: 'ECUADOR', province: newProvince, canton: '', parish: '' };
    setCanton('');
    setParish('');
    onChange(newValue);
  };

  const handleCantonChange = (newCanton: string) => {
    setCanton(newCanton);
    // Reset child field
    const newValue = { ...value, country: 'ECUADOR', province, canton: newCanton, parish: '' };
    setParish('');
    onChange(newValue);
  };

  const handleParishChange = (newParish: string) => {
    setParish(newParish);
    onChange({ ...value, country: 'ECUADOR', province, canton, parish: newParish });
  };

  // Logic for subsets
  const selectedProvinceData = ECUADOR_LOCATIONS.provinces.find(p => p.name === province);
  const selectedCantonData = selectedProvinceData?.cantons.find(c => c.name === canton);

  const isEcuador = country === 'ECUADOR';

  return (
    <div className="space-y-4 border p-4 rounded-md bg-slate-50">
      <h3 className="font-medium text-sm text-gray-700">Lugar de Nacimiento</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Selector */}
        <div className="space-y-2">
          <Label>País</Label>
          <div className="flex flex-col gap-2">
            <Select 
              value={isEcuador ? 'ECUADOR' : 'OTRO'} 
              onValueChange={(val) => {
                if(val === 'ECUADOR') handleCountryChange('ECUADOR');
                else handleCountryChange('OTRO');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ECUADOR">Ecuador</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
            
            {!isEcuador && (
              <Input 
                value={country === 'OTRO' ? '' : country} 
                onChange={(e) => {
                  const newCountry = e.target.value;
                  setCountry(newCountry);
                  // Don't reset other fields here, just update country
                  onChange({ country: newCountry, province, canton, parish: '' });
                }} 
                placeholder="Especifique el País" 
              />
            )}
          </div>
        </div>

        {isEcuador ? (
          <>
            {/* Province Selector */}
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Select value={province} onValueChange={handleProvinceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Provincia" />
                </SelectTrigger>
                <SelectContent>
                  {ECUADOR_LOCATIONS.provinces.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Canton Selector */}
            <div className="space-y-2">
              <Label>Cantón</Label>
              <Select 
                value={canton} 
                onValueChange={handleCantonChange}
                disabled={!province}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Cantón" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvinceData?.cantons.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parish Selector */}
            <div className="space-y-2">
              <Label>Parroquia</Label>
              <Select 
                value={parish} 
                onValueChange={handleParishChange}
                disabled={!canton}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Parroquia" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCantonData?.parishes.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            {/* Free text inputs for non-Ecuador */}
            <div className="space-y-2">
              <Label>Estado/Provincia</Label>
              <Input 
                value={province} 
                onChange={(e) => {
                  setProvince(e.target.value);
                  onChange({ country, province: e.target.value, canton, parish: '' });
                  // Note: pass current 'country' from state, which might be typed by user
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input 
                value={canton} 
                onChange={(e) => {
                  setCanton(e.target.value);
                  onChange({ country, province, canton: e.target.value, parish: '' });
                }} 
              />
            </div>
             {/* Note: Parish might not apply internationally or can be optional */}
          </>
        )}
      </div>
    </div>
  );
}
