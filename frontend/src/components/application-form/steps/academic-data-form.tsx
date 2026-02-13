'use client';

import { Application, Shift, GRADE_LEVELS } from '@/types/application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { checkQuotaAvailability } from '@/lib/api-applications';
import { SCHOOLS } from '@/lib/data/schools';

interface AcademicDataFormProps {
  data: Partial<Application>;
  onChange: (data: Partial<Application>) => void;
}

export function AcademicDataForm({ data, onChange }: AcademicDataFormProps) {
  const { data: session } = useSession();
  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;
  const [quotaInfo, setQuotaInfo] = useState<{ status: string; available: number } | null>(null);

  useEffect(() => {
    async function checkQuota() {
      if (!data.gradeLevel || !data.shift || !token) {
        setQuotaInfo(null);
        return;
      }
      try {
        const info = await checkQuotaAvailability(token, data.gradeLevel, data.shift);
        setQuotaInfo(info);
      } catch (error) {
        console.error('Failed to check quota', error);
      }
    }
    checkQuota();
  }, [data.gradeLevel, data.shift, token]);

  const handleChange = (field: keyof Application, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Grado y Jornada */}
      {/* Grado y Jornada */}
      <div>
        <h3 className="text-lg font-medium mb-4">Grado a Cursar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grado Solicitado *</Label>
            <Select
              value={data.gradeLevel || ''}
              onValueChange={(value) => {
                const isBGU = ['1ero BGU', '2do BGU', '3ro BGU'].includes(value);
                // Si cambia de nivel y ya no es BGU, limpiar especialidad
                handleChange('gradeLevel', value);
                if (!isBGU) {
                   handleChange('specialty', undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Jornada Preferida *</Label>
            <Select
              value={data.shift || ''}
              onValueChange={(value) => handleChange('shift', value as Shift)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">Matutina</SelectItem>
                <SelectItem value="AFTERNOON">Vespertina</SelectItem>
              </SelectContent>
            </Select>
            {quotaInfo && (
              <div className={`text-xs px-2 py-1 rounded-md border mt-2 flex items-center justify-between
                ${quotaInfo.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 
                  quotaInfo.status === 'LIMITED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                  'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <span className="font-medium">
                  {quotaInfo.status === 'AVAILABLE' ? 'Cupos Disponibles' : 
                   quotaInfo.status === 'LIMITED' ? 'Cupos Limitados' : 'Cupos Agotados'}
                </span>
                <span>{quotaInfo.available} disponibles</span>
              </div>
            )}
          </div>

          {/* Selector de Especialidad - Solo para BGU */}
          {['1ero BGU', '2do BGU', '3ro BGU'].includes(data.gradeLevel || '') && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="specialty">Especialidad de Bachillerato *</Label>
              <Select
                value={data.specialty || ''}
                onValueChange={(value) => handleChange('specialty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIENCIAS">BGU Ciencias</SelectItem>
                  <SelectItem value="TECNICO_INFORMATICA">BGU Técnico Informática</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Institución de Procedencia */}
      <div>
        <h3 className="text-lg font-medium mb-4">Institución de Procedencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="previousSchool">Nombre de la Institución Anterior</Label>
            <Input
              id="previousSchool"
              list="schools-list"
              value={data.previousSchool || ''}
              onChange={(e) => handleChange('previousSchool', e.target.value)}
              placeholder="Nombre de la escuela o colegio anterior"
            />
            <datalist id="schools-list">
              {SCHOOLS.map((school) => (
                <option key={school} value={school} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastYearAverage">Promedio del Último Año</Label>
            <Input
              id="lastYearAverage"
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={data.lastYearAverage || ''}
              onChange={(e) => handleChange('lastYearAverage', parseFloat(e.target.value))}
              placeholder="8.5"
              className={data.lastYearAverage && data.lastYearAverage < 7 ? "border-red-500 bg-red-50" : ""}
            />
            {data.lastYearAverage && data.lastYearAverage < 7 && (
               <p className="text-xs text-red-600 font-medium">El promedio mínimo requerido es 7/10</p>
            )}
            <p className="text-xs text-muted-foreground">En escala de 0 a 10</p>
          </div>
        </div>
      </div>

      {/* Historial de Repetición */}
      <div>
        <h3 className="text-lg font-medium mb-4">Historial Académico</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>¿Ha repetido algún año escolar?</Label>
              <p className="text-sm text-muted-foreground">Indique si el estudiante ha repetido algún grado</p>
            </div>
            <Switch
              checked={data.hasRepeatedYear || false}
              onCheckedChange={(checked) => handleChange('hasRepeatedYear', checked)}
            />
          </div>

          {data.hasRepeatedYear && (
            <div className="space-y-2">
              <Label htmlFor="repeatedYearDetail">Detalle del año repetido</Label>
              <Textarea
                id="repeatedYearDetail"
                value={data.repeatedYearDetail || ''}
                onChange={(e) => handleChange('repeatedYearDetail', e.target.value)}
                placeholder="Indique qué año(s) repitió y el motivo"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
