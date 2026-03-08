// Tipos para el módulo de Admisiones

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUIRES_CORRECTION'
  | 'APPROVED'
  | 'PAYMENT_UPLOADED'
  | 'PAYMENT_VALIDATED'
  | 'MATRICULATED'
  | 'REJECTED'
  | 'CURSILLO_SCHEDULED'
  | 'CURSILLO_APPROVED'
  | 'CURSILLO_REJECTED';

export type Gender = 'M' | 'F' | 'OTHER';
export type Shift = 'MORNING' | 'AFTERNOON';

export type DocumentType =
  | 'STUDENT_ID'
  | 'REPRESENTATIVE_ID'
  | 'STUDENT_PHOTO'
  | 'GRADE_CERTIFICATE'
  | 'UTILITY_BILL'
  | 'PAYMENT_RECEIPT';

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

export interface ExtraContact {
  cedula?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  relationship: string;
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

  // Tipo de Estudiante
  enrollmentType?: 'NEW_STUDENT' | 'RETURNING_STUDENT';

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
  studentPhotoUrl?: string;

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
  extraContacts?: ExtraContact[];

  // Documentos
  documents?: ApplicationDocument[];

  // Ideario UEFDB
  acceptedIdeario?: boolean;
  acceptedAt?: string;

  // Datos de Pago de Matrícula
  paymentDate?: string;
  paymentReference?: string;
  paymentAmount?: number;

  // Usuario
  userId: string;

  // Asignación de Paralelo (Nuevo field)
  assignedParallel?: string;

  // Admin
  adminNotes?: string;
  rejectionReason?: string;
  correctionRequest?: string;
  internalComments?: InternalComment[];

  // Cursillos
  cursilloScheduled?: boolean;
  cursilloDate?: string;
  cursilloResult?: 'PENDING' | 'APPROVED' | 'REJECTED';
  cursilloNotes?: string;

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
  paymentValidated?: number;
  matriculated?: number;
  rejected: number;
}

// Labels para UI
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'En Revisión',
  REQUIRES_CORRECTION: 'Requiere Corrección',
  APPROVED: 'Aprobada',
  PAYMENT_UPLOADED: 'Pago Cargado',
  PAYMENT_VALIDATED: 'Pago Validado',
  MATRICULATED: 'Matriculada',
  REJECTED: 'Rechazada',
  CURSILLO_SCHEDULED: 'Cursillo Programado',
  CURSILLO_APPROVED: 'Cursillo Aprobado',
  CURSILLO_REJECTED: 'Cursillo Reprobado',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  REQUIRES_CORRECTION: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  APPROVED: 'bg-green-100 text-green-800 hover:bg-green-200',
  PAYMENT_UPLOADED: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
  PAYMENT_VALIDATED: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  MATRICULATED: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-200',
  CURSILLO_SCHEDULED: 'bg-blue-200 text-blue-800 hover:bg-blue-300',
  CURSILLO_APPROVED: 'bg-green-200 text-green-800 hover:bg-green-300',
  CURSILLO_REJECTED: 'bg-red-200 text-red-800 hover:bg-red-300',
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  STUDENT_ID: 'Cédula del Estudiante',
  REPRESENTATIVE_ID: 'Cédula del Representante',
  STUDENT_PHOTO: 'Foto del Estudiante',
  GRADE_CERTIFICATE: 'Certificado de Notas',
  UTILITY_BILL: 'Planilla de Servicios Básicos',
  PAYMENT_RECEIPT: 'Comprobante de Pago de Matrícula',
};

export const GRADE_LEVELS = [
  { value: 'Inicial 1', label: 'Inicial 1 (3 años)' },
  { value: 'Inicial 2', label: 'Inicial 2 (4 años)' },
  { value: '1ero EGB', label: '1ro Básico' },
  { value: '2do EGB', label: '2do Básico' },
  { value: '3ro EGB', label: '3ro Básico' },
  { value: '4to EGB', label: '4to Básico' },
  { value: '5to EGB', label: '5to Básico' },
  { value: '6to EGB', label: '6to Básico' },
  { value: '7mo EGB', label: '7mo Básico' },
  { value: '8vo EGB', label: '8vo Básico' },
  { value: '9no EGB', label: '9no Básico' },
  { value: '10mo EGB', label: '10mo Básico' },
  { value: '1ero BGU', label: '1ro Bachillerato' },
  { value: '2do BGU', label: '2do Bachillerato' },
  { value: '3ro BGU', label: '3ro Bachillerato' },
];

// Grados que requieren cursillo si el estudiante viene de otra institución
export const CURSILLO_GRADES = ['8vo EGB', '1ero BGU'];

// Grados de bachillerato que requieren especialidad
export const BGU_GRADES = ['1ero BGU', '2do BGU', '3ro BGU'];
