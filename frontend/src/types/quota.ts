export interface AdmissionQuota {
  id: string;
  level: string;
  parallel: string;
  shift: string;
  specialty?: string | null;
  totalQuota: number;
  // availableQuota and occupiedQuota might be computed in backend or frontend
  availableQuota?: number;
  occupiedQuota?: number;
  occupancyPercentage?: number;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotaDto {
  level: string;
  parallel: string;
  shift: string;
  specialty?: string;
  totalQuota: number;
  academicYear?: string;
}

export interface UpdateQuotaDto extends Partial<CreateQuotaDto> {}

export interface QuotaAvailability {
  available: boolean;
  totalQuotas: number;
  usedQuotas: number;
  remainingQuotas: number;
  requiresCursillo?: boolean;
}
