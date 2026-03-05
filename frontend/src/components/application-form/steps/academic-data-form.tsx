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

/** Determina si una institución es la UEFDB (no requiere cursillo) */
function isUEFDB(school: string | null | undefined): boolean {
  if (!school) return false;
  const s = school.toUpperCase();
  return ['DON BOSCO', 'UEFDB', 'FISCOMISIONAL DON BOSCO'].some((kw) => s.includes(kw));
}

const BGU_GRADES = ['1ero BGU', '2do BGU', '3ro BGU', '1ro_bachillerato', '2do_bachillerato', '3ro_bachillerato'];
const CURSILLO_GRADES = ['8vo EGB', '1ero BGU', '8vo_basico', '1ro_bachillerato'];

export function AcademicDataForm({ data, onChange }: AcademicDataFormProps) {
  const { data: session } = useSession();
  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;
  const [quotaInfo, setQuotaInfo] = useState<{ status: string; available: number; requiresCursillo?: boolean } | null>(null);

  useEffect(() => {
    async function checkQuota() {
      if (!data.gradeLevel || !data.shift || !token) {
        setQuotaInfo(null);
        return;
      }
      try {
        const info = await checkQuotaAvailability(token, data.gradeLevel, data.shift, data.specialty, data.previousSchool);
        setQuotaInfo(info);
      } catch (error) {
        console.error('Failed to check quota', error);
      }
    }
    checkQuota();
  }, [data.gradeLevel, data.shift, data.specialty, data.previousSchool, token]);

  const handleChange = (field: keyof Application, value: any) => {
    onChange({ [field]: value });
  };

  const isBGU = BGU_GRADES.includes(data.gradeLevel || '');
  // El cursillo aplica únicamente si el grado lo requiere Y la escuela NO es la UEFDB
  const gradeRequiresCursillo = CURSILLO_GRADES.includes(data.gradeLevel || '');
  const comesFromOtherSchool = !isUEFDB(data.previousSchool);
  const needsCursillo = quotaInfo?.requiresCursillo ?? false;

  // Para mostrar el aviso anticipado (antes de que la API responda) cuando ya hay info suficiente
  const showCursilloHint = gradeRequiresCursillo && !!data.previousSchool && comesFromOtherSchool;

  return (
    <div className="space-y-8">

      {/* ─── 1. INSTITUCIÓN DE PROCEDENCIA (va PRIMERO) ─────────────────── */}
      <div>
        <h3 className="text-lg font-medium mb-1">Institución de Procedencia</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Información del establecimiento educativo anterior del estudiante.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="previousSchool">Nombre de la Institución Anterior</Label>
            <Input
              id="previousSchool"
              list="schools-list"
              value={data.previousSchool || ''}
              onChange={(e) => handleChange('previousSchool', e.target.value)}
              placeholder="Nombre de la escuela o colegio anterior"
              autoComplete="off"
            />
            <datalist id="schools-list">
              {SCHOOLS.map((school) => (
                <option key={school} value={school} />
              ))}
            </datalist>
            {/* Indicador cuando viene de UEFDB */}
            {data.previousSchool && isUEFDB(data.previousSchool) && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                Estudiante de la UEFDB — no requiere cursillo de nivelacion para continuar.
              </p>
            )}
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
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                const rounded = isNaN(raw) ? undefined : Math.round(raw * 100) / 100;
                handleChange('lastYearAverage', rounded);
              }}
              placeholder="8.5"
            />
            <p className="text-xs text-muted-foreground">En escala de 0 a 10</p>
          </div>
        </div>
      </div>

      {/* ─── 2. GRADO A CURSAR (va SEGUNDO) ─────────────────────────────── */}
      <div>
        <h3 className="text-lg font-medium mb-1">Grado a Cursar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Seleccione el nivel educativo al que aspira el estudiante.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Grado */}
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grado Solicitado *</Label>
            <Select
              value={data.gradeLevel || ''}
              onValueChange={(value) => {
                const isBGUValue = BGU_GRADES.includes(value);
                handleChange('gradeLevel', value);
                if (!isBGUValue) {
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

          {/* Especialidad — solo BGU */}
          {isBGU && (
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad de Bachillerato *</Label>
              <Select
                value={data.specialty || ''}
                onValueChange={(value) => {
                  handleChange('specialty', value);
                  if (value === 'TECNICO_INFORMATICA') {
                    handleChange('shift', 'AFTERNOON');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIENCIAS">BGU Ciencias</SelectItem>
                  <SelectItem value="TECNICO_INFORMATICA">BT Informática</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Jornada */}
          <div className="space-y-2">
            <Label htmlFor="shift">Jornada Preferida *</Label>
            <Select
              value={data.shift || ''}
              onValueChange={(value) => handleChange('shift', value as Shift)}
              disabled={data.specialty === 'TECNICO_INFORMATICA'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar jornada" />
              </SelectTrigger>
              <SelectContent>
                {data.specialty !== 'TECNICO_INFORMATICA' && (
                  <SelectItem value="MORNING">Matutina</SelectItem>
                )}
                <SelectItem value="AFTERNOON">Vespertina</SelectItem>
              </SelectContent>
            </Select>
            {data.specialty === 'TECNICO_INFORMATICA' && (
              <p className="text-xs text-muted-foreground mt-1">
                La especialidad 'BT Informática' se imparte únicamente en la jornada Vespertina.
              </p>
            )}

            {/* Cupos disponibles */}
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

            {/* Nota de cursillo requerido (confirmado por API) */}
            {needsCursillo && (
              <div className="text-xs px-2 py-1 rounded-md border mt-2 bg-amber-50 text-amber-700 border-amber-200">
                <span className="font-medium">Importante:</span> Este grado requiere la aprobación de un cursillo de nivelación para estudiantes de otras instituciones.
              </div>
            )}
          </div>
        </div>

        {/* Banner de cursillo — aparece cuando ya hay institución ingresada + grado que lo requiere + no es UEFDB */}
        {showCursilloHint && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-amber-800 mb-1">
              Cursillo de Admisión Requerido
            </p>
            <p className="text-amber-700">
              Para <strong>{GRADE_LEVELS.find((g) => g.value === data.gradeLevel)?.label}</strong>, los estudiantes
              provenientes de otra institución deben aprobar un cursillo de nivelación antes de la matriculación.
              Una vez aprobada la solicitud, secretaría le programará el cursillo y le enviará los detalles de fechas, horarios y materias.
            </p>
          </div>
        )}
      </div>

      {/* ─── 3. HISTORIAL ACADÉMICO ──────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-medium mb-1">Historial Académico</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Información adicional relevante para el proceso de admisión.
        </p>
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
