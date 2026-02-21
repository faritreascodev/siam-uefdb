// Tipos para el módulo de Admisiones

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUIRES_CORRECTION'
  | 'APPROVED'
  | 'PAYMENT_VALIDATED'
  | 'MATRICULATED'
  | 'REJECTED';

export type Gender = 'M' | 'F';
export type Shift = 'MATUTINA' | 'VESPERTINA';

export type DocumentType =
  | 'STUDENT_ID'
  | 'REPRESENTATIVE_ID'
  | 'STUDENT_PHOTO'
  | 'GRADE_CERTIFICATE'
  | 'UTILITY_BILL';

export interface BirthPlace {
  country?: string;
  province?: string;
  city?: string;
  canton?: string;
  parish?: string;
}

export interface ParentData {
  names?: string;
  cedula?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  workPlace?: string;
  workAddress?: string;
  workPhone?: string;
  livesWithStudent?: boolean;
}

export interface RepresentativeData extends ParentData {
  relationship?: string;
  legalGuardianDocument?: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  submittedAt?: string;

  // Datos del Estudiante
  studentFirstName?: string;
  studentLastName?: string;
  studentCedula?: string;
  studentBirthDate?: string;
  studentBirthPlace?: BirthPlace;
  studentGender?: Gender;
  studentNationality?: string;
  studentAddress?: string;
  studentSector?: string;
  studentPhone?: string;
  studentEmail?: string;

  // Datos Médicos
  bloodType?: string;
  hasDisability?: boolean;
  disabilityDetail?: string;
  needsSpecialCare?: boolean;
  specialCareDetail?: string;

  // Datos Académicos
  gradeLevel?: string;
  shift?: Shift;
  specialty?: string;
  previousSchool?: string;
  lastYearAverage?: number;
  hasRepeatedYear?: boolean;
  repeatedYearDetail?: string;

  // Datos Familiares
  fatherData?: ParentData;
  motherData?: ParentData;
  representativeData?: RepresentativeData;

  // Documentos
  documents?: ApplicationDocument[];

  // Usuario
  userId: string;
  
  // Asignación de Paralelo (Nuevo field)
  assignedParallel?: string;

  // Admin
  adminNotes?: string;
  rejectionReason?: string;
  correctionRequest?: string;
  internalComments?: InternalComment[];
  
  // Asignación a Directivo
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  assignedAt?: string;
  processedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface InternalComment {
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface ApplicationStats {
  total: number;
  draft: number;
  submitted: number;
  underReview?: number;
  requiresCorrection: number;
  approved: number;
  rejected: number;
}

// Labels para UI
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'En Revisión',
  REQUIRES_CORRECTION: 'Requiere Corrección',
  APPROVED: 'Aprobada',
  PAYMENT_VALIDATED: 'Pago Validado',
  MATRICULATED: 'Matriculada',
  REJECTED: 'Rechazada',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  REQUIRES_CORRECTION: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  PAYMENT_VALIDATED: 'bg-indigo-100 text-indigo-800',
  MATRICULATED: 'bg-purple-100 text-purple-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  STUDENT_ID: 'Cédula del Estudiante',
  REPRESENTATIVE_ID: 'Cédula del Representante',
  STUDENT_PHOTO: 'Foto del Estudiante',
  GRADE_CERTIFICATE: 'Certificado de Notas',
  UTILITY_BILL: 'Planilla de Servicios Básicos',
};

export const GRADE_LEVELS = [
  { value: 'inicial_1', label: 'Inicial 1' },
  { value: 'inicial_2', label: 'Inicial 2' },
  { value: '1ro_basico', label: '1ro Básico' },
  { value: '2do_basico', label: '2do Básico' },
  { value: '3ro_basico', label: '3ro Básico' },
  { value: '4to_basico', label: '4to Básico' },
  { value: '5to_basico', label: '5to Básico' },
  { value: '6to_basico', label: '6to Básico' },
  { value: '7mo_basico', label: '7mo Básico' },
  { value: '8vo_basico', label: '8vo Básico' },
  { value: '9no_basico', label: '9no Básico' },
  { value: '10mo_basico', label: '10mo Básico' },
  { value: '1ro_bachillerato', label: '1ro Bachillerato' },
  { value: '2do_bachillerato', label: '2do Bachillerato' },
  { value: '3ro_bachillerato', label: '3ro Bachillerato' },
];
