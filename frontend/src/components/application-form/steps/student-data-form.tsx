import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Application, Gender } from '@/types/application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { searchByCedula } from '@/lib/api-cedula';
import { LocationSelector } from '../location-selector';

interface StudentDataFormProps {
  data: Partial<Application>;
  onChange: (data: Partial<Application>) => void;
}

export function StudentDataForm({ data, onChange }: StudentDataFormProps) {
  const { data: session } = useSession();
  const [searching, setSearching] = useState(false);

  const handleChange = (field: keyof Application, value: any) => {
    onChange({ [field]: value });
  };

  const handleSearchCedula = async () => {
    const cedula = data.studentCedula;
    if (!cedula || cedula.length !== 10) {
      toast.error('Ingrese una cédula válida de 10 dígitos');
      return;
    }

    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) return;

    try {
      setSearching(true);
      const result = await searchByCedula(cedula, token);
      
      if (result) {
        onChange({
          studentFirstName: result.firstName || '',
          studentLastName: result.lastName || '',
          studentGender: result.gender as Gender,
          studentBirthDate: result.birthDate ? new Date(result.birthDate).toISOString() : undefined,
          studentNationality: result.nationality || 'ECUATORIANA',
          studentAddress: result.address || '',
        });
        toast.success('Datos encontrados y completados');
      } else {
        toast.warning('No se encontraron datos para esta cédula');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al buscar datos de cédula');
    } finally {
      setSearching(false);
    }
  };

  const handleBirthPlaceChange = (field: string, value: string) => {
    onChange({
      studentBirthPlace: {
        ...data.studentBirthPlace,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Datos Personales */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentFirstName">Nombres *</Label>
            <Input
              id="studentFirstName"
              value={data.studentFirstName || ''}
              onChange={(e) => handleChange('studentFirstName', e.target.value)}
              placeholder="Nombres completos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentLastName">Apellidos *</Label>
            <Input
              id="studentLastName"
              value={data.studentLastName || ''}
              onChange={(e) => handleChange('studentLastName', e.target.value)}
              placeholder="Apellidos completos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentCedula">Cédula de Identidad *</Label>
            <Input
              id="studentCedula"
              value={data.studentCedula || ''}
              onChange={(e) => handleChange('studentCedula', e.target.value)}
              placeholder="1234567890"
              maxLength={10}
            />
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleSearchCedula}
                disabled={searching || !data.studentCedula || data.studentCedula.length < 10}
                className="mt-1"
              >
                {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Autocompletar Datos
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentGender">Género *</Label>
            <Select
              value={data.studentGender || ''}
              onValueChange={(value) => handleChange('studentGender', value as Gender)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentBirthDate">Fecha de Nacimiento *</Label>
            <Input
              id="studentBirthDate"
              type="date"
              value={data.studentBirthDate?.split('T')[0] || ''}
              onChange={(e) => handleChange('studentBirthDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentNationality">Nacionalidad *</Label>
            <Input
              id="studentNationality"
              value={data.studentNationality || ''}
              onChange={(e) => handleChange('studentNationality', e.target.value)}
              placeholder="Ecuatoriana"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Lugar de Nacimiento */}
      {/* Lugar de Nacimiento */}
      <LocationSelector 
        value={data.studentBirthPlace} 
        onChange={(newPlace) => onChange({ studentBirthPlace: newPlace })} 
      />

      <Separator />

      {/* Dirección y Contacto */}
      <div>
        <h3 className="text-lg font-medium mb-4">Dirección y Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="studentAddress">Dirección *</Label>
            <Textarea
              id="studentAddress"
              value={data.studentAddress || ''}
              onChange={(e) => handleChange('studentAddress', e.target.value)}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentSector">Sector / Barrio</Label>
            <Input
              id="studentSector"
              value={data.studentSector || ''}
              onChange={(e) => handleChange('studentSector', e.target.value)}
              placeholder="Nombre del sector"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentPhone">Teléfono de Contacto</Label>
            <Input
              id="studentPhone"
              value={data.studentPhone || ''}
              onChange={(e) => handleChange('studentPhone', e.target.value)}
              placeholder="0999999999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentEmail">Correo Electrónico</Label>
            <Input
              id="studentEmail"
              type="email"
              value={data.studentEmail || ''}
              onChange={(e) => handleChange('studentEmail', e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Datos Médicos */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos Médicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bloodType">Tipo de Sangre</Label>
            <Select
              value={data.bloodType || ''}
              onValueChange={(value) => handleChange('bloodType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>¿Tiene alguna discapacidad?</Label>
              <p className="text-sm text-muted-foreground">Marque si aplica</p>
            </div>
            <Switch
              checked={data.hasDisability || false}
              onCheckedChange={(checked) => handleChange('hasDisability', checked)}
            />
          </div>

          {data.hasDisability && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="disabilityDetail">Detalle de la discapacidad</Label>
              <Textarea
                id="disabilityDetail"
                value={data.disabilityDetail || ''}
                onChange={(e) => handleChange('disabilityDetail', e.target.value)}
                placeholder="Describa la discapacidad y necesidades especiales"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>¿Requiere atención especial?</Label>
              <p className="text-sm text-muted-foreground">Alergias, medicamentos, etc.</p>
            </div>
            <Switch
              checked={data.needsSpecialCare || false}
              onCheckedChange={(checked) => handleChange('needsSpecialCare', checked)}
            />
          </div>

          {data.needsSpecialCare && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="specialCareDetail">Detalle de atención especial</Label>
              <Textarea
                id="specialCareDetail"
                value={data.specialCareDetail || ''}
                onChange={(e) => handleChange('specialCareDetail', e.target.value)}
                placeholder="Describa las necesidades de atención especial"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
