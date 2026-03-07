'use client';

import { useState, useEffect } from 'react';
import { Application, ParentData, RepresentativeData } from '@/types/application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyDataFormProps {
  data: Partial<Application>;
  onChange: (data: Partial<Application>) => void;
}

export function FamilyDataForm({ data, onChange }: FamilyDataFormProps) {
  const [copyFrom, setCopyFrom] = useState<'father' | 'mother' | null>(null);
  const [formConfig, setFormConfig] = useState<any>({
    fatherOccupation: true, motherOccupation: true,
    fatherCompany: true, motherCompany: true,
    showExtraContacts: true
  });

  const [formRelationships, setFormRelationships] = useState<string[]>(['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Tutor Legal', 'Otro']);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public-config`)
      .then(res => res.json())
      .then(d => {
        if (d.FORM_CONFIG) {
          try {
            const parsed = JSON.parse(d.FORM_CONFIG);
            setFormConfig(parsed);
          } catch { }
        }
        if (d.FORM_RELATIONSHIPS) {
          try {
            const parsedArray = JSON.parse(d.FORM_RELATIONSHIPS);
            if (Array.isArray(parsedArray)) {
              setFormRelationships(parsedArray);
            }
          } catch { }
        }
      })
      .catch(e => console.error("Error loading form config:", e));
  }, []);

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

  const extraContacts = data.extraContacts || [];

  const handleAddContact = () => {
    if (extraContacts.length >= 3) {
      toast.error('Solo se permiten hasta 3 contactos adicionales');
      return;
    }
    onChange({
      extraContacts: [...extraContacts, { firstName: '', lastName: '', phone: '', relationship: '' }]
    });
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = [...extraContacts];
    newContacts.splice(index, 1);
    onChange({ extraContacts: newContacts });
  };

  const handleContactChange = (index: number, field: string, value: any) => {
    const newContacts = [...extraContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    onChange({ extraContacts: newContacts });
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
            showOccupation={formConfig.fatherOccupation}
            showCompany={formConfig.fatherCompany}
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
            showOccupation={formConfig.motherOccupation}
            showCompany={formConfig.motherCompany}
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
              onValueChange={(value) => {
                if (
                  (data.representativeData?.relationship === 'Padre' && value !== 'Padre') ||
                  (data.representativeData?.relationship === 'Madre' && value !== 'Madre')
                ) {
                  // User is changing away from Father/Mother, let's clear data
                  onChange({
                    representativeData: {
                      relationship: value,
                    }
                  });
                } else {
                  handleRepresentativeChange('relationship', value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar parentesco" />
              </SelectTrigger>
              <SelectContent>
                {formRelationships.map((rel) => (
                  <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                ))}
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

      {/* Contactos de Emergencia (Configurable) */}
      {formConfig.showExtraContacts && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Contactos Adicionales de Emergencia</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                disabled={extraContacts.length >= 3}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir Contacto
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Opcional. Máximo 3 contactos que podamos llamar en caso de que los principales no respondan.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {extraContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No se han añadido contactos de emergencia adicionales.</p>
            ) : (
              extraContacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="space-y-2">
                    <Label>Nombres *</Label>
                    <Input
                      value={contact.firstName || ''}
                      onChange={(e) => handleContactChange(index, 'firstName', e.target.value)}
                      placeholder="Nombres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos *</Label>
                    <Input
                      value={contact.lastName || ''}
                      onChange={(e) => handleContactChange(index, 'lastName', e.target.value)}
                      placeholder="Apellidos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono *</Label>
                    <Input
                      value={contact.phone || ''}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      placeholder="Número telefónico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parentesco *</Label>
                    <Input
                      value={contact.relationship || ''}
                      onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                      placeholder="Tío/a, Abuelo/a, Amigo/a, etc."
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente reutilizable para campos de padre/madre/representante
function ParentFields({
  data,
  onChange,
  showOccupation = true,
  showCompany = true,
}: {
  data: ParentData;
  onChange: (field: keyof ParentData, value: any) => void;
  showOccupation?: boolean;
  showCompany?: boolean;
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

      {showOccupation && (
        <div className="space-y-2">
          <Label>Ocupación / Profesión</Label>
          <Input
            value={data.occupation || ''}
            onChange={(e) => onChange('occupation', e.target.value)}
            placeholder="Profesión u ocupación"
          />
        </div>
      )}

      {showCompany && (
        <>
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
        </>
      )}

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
