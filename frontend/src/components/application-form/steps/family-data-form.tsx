'use client';

import { useState } from 'react';
import { Application, ParentData, RepresentativeData } from '@/types/application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyDataFormProps {
  data: Partial<Application>;
  onChange: (data: Partial<Application>) => void;
}

export function FamilyDataForm({ data, onChange }: FamilyDataFormProps) {
  const [copyFrom, setCopyFrom] = useState<'father' | 'mother' | null>(null);

  const handleParentChange = (parent: 'fatherData' | 'motherData', field: keyof ParentData, value: any) => {
    onChange({
      [parent]: {
        ...data[parent],
        [field]: value,
      },
    });
  };

  const handleRepresentativeChange = (field: keyof RepresentativeData, value: any) => {
    onChange({
      representativeData: {
        ...data.representativeData,
        [field]: value,
      },
    });
  };

  const copyDataToRepresentative = (from: 'father' | 'mother') => {
    const sourceData = from === 'father' ? data.fatherData : data.motherData;
    if (!sourceData) {
      toast.error('No hay datos para copiar');
      return;
    }

    onChange({
      representativeData: {
        ...sourceData,
        relationship: from === 'father' ? 'Padre' : 'Madre',
      },
    });
    toast.success(`Datos del ${from === 'father' ? 'padre' : 'la madre'} copiados al representante`);
  };

  return (
    <div className="space-y-6">
      {/* Datos del Padre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Padre</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentFields
            data={data.fatherData || {}}
            onChange={(field, value) => handleParentChange('fatherData', field, value)}
          />
        </CardContent>
      </Card>

      {/* Datos de la Madre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la Madre</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentFields
            data={data.motherData || {}}
            onChange={(field, value) => handleParentChange('motherData', field, value)}
          />
        </CardContent>
      </Card>

      {/* Datos del Representante Legal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Datos del Representante Legal *</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyDataToRepresentative('father')}
              >
                <Copy className="mr-2 h-3 w-3" />
                Copiar del Padre
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyDataToRepresentative('mother')}
              >
                <Copy className="mr-2 h-3 w-3" />
                Copiar de la Madre
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationship">Parentesco con el Estudiante *</Label>
            <Select
              value={data.representativeData?.relationship || ''}
              onValueChange={(value) => handleRepresentativeChange('relationship', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Padre">Padre</SelectItem>
                <SelectItem value="Madre">Madre</SelectItem>
                <SelectItem value="Abuelo/a">Abuelo/a</SelectItem>
                <SelectItem value="Tío/a">Tío/a</SelectItem>
                <SelectItem value="Tutor Legal">Tutor Legal</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ParentFields
            data={data.representativeData || {}}
            onChange={(field, value) => handleRepresentativeChange(field, value)}
          />

          {data.representativeData?.relationship === 'Tutor Legal' && (
            <div className="space-y-2">
              <Label htmlFor="legalGuardianDocument">Documento de Tutela Legal</Label>
              <Input
                id="legalGuardianDocument"
                value={data.representativeData?.legalGuardianDocument || ''}
                onChange={(e) => handleRepresentativeChange('legalGuardianDocument', e.target.value)}
                placeholder="Número de documento de tutela"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente reutilizable para campos de padre/madre/representante
function ParentFields({
  data,
  onChange,
}: {
  data: ParentData;
  onChange: (field: keyof ParentData, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Nombres Completos</Label>
        <Input
          value={data.names || ''}
          onChange={(e) => onChange('names', e.target.value)}
          placeholder="Nombres y apellidos"
        />
      </div>

      <div className="space-y-2">
        <Label>Cédula de Identidad</Label>
        <Input
          value={data.cedula || ''}
          onChange={(e) => onChange('cedula', e.target.value)}
          placeholder="1234567890"
          maxLength={10}
        />
      </div>

      <div className="space-y-2">
        <Label>Teléfono</Label>
        <Input
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="0999999999"
        />
      </div>

      <div className="space-y-2">
        <Label>Correo Electrónico</Label>
        <Input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Ocupación / Profesión</Label>
        <Input
          value={data.occupation || ''}
          onChange={(e) => onChange('occupation', e.target.value)}
          placeholder="Profesión u ocupación"
        />
      </div>

      <div className="space-y-2">
        <Label>Lugar de Trabajo</Label>
        <Input
          value={data.workPlace || ''}
          onChange={(e) => onChange('workPlace', e.target.value)}
          placeholder="Nombre de la empresa"
        />
      </div>

      <div className="space-y-2">
        <Label>Dirección de Trabajo</Label>
        <Input
          value={data.workAddress || ''}
          onChange={(e) => onChange('workAddress', e.target.value)}
          placeholder="Dirección del trabajo"
        />
      </div>

      <div className="space-y-2">
        <Label>Teléfono de Trabajo</Label>
        <Input
          value={data.workPhone || ''}
          onChange={(e) => onChange('workPhone', e.target.value)}
          placeholder="Teléfono del trabajo"
        />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg md:col-span-2">
        <Label>¿Vive con el estudiante?</Label>
        <Switch
          checked={data.livesWithStudent || false}
          onCheckedChange={(checked) => onChange('livesWithStudent', checked)}
        />
      </div>
    </div>
  );
}
