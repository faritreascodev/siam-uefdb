/**
 * Validador de cédula ecuatoriana
 * Implementa el algoritmo de verificación del dígito verificador
 */
export function validateEcuadorianCedula(cedula: string): boolean {
  // Debe tener exactamente 10 dígitos
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Validar código de provincia (01-24)
  const province = parseInt(cedula.substring(0, 2), 10);
  if (province < 1 || province > 24) {
    return false;
  }

  // Validar tercer dígito (debe ser menor a 6 para personas naturales)
  const thirdDigit = parseInt(cedula.charAt(2), 10);
  if (thirdDigit >= 6) {
    return false;
  }

  // Algoritmo de verificación del módulo 10
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digits = cedula.split('').map(Number);
  const verifier = digits.pop();

  const sum = digits.reduce((acc, digit, index) => {
    let value = digit * coefficients[index];
    if (value > 9) {
      value -= 9;
    }
    return acc + value;
  }, 0);

  const calculatedVerifier = (10 - (sum % 10)) % 10;
  return calculatedVerifier === verifier;
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Rangos de edad válidos por grado escolar
 */
export const GRADE_AGE_RANGES: Record<string, { min: number; max: number }> = {
  'inicial_1': { min: 3, max: 4 },
  'inicial_2': { min: 4, max: 5 },
  '1ro_basico': { min: 5, max: 7 },
  '2do_basico': { min: 6, max: 8 },
  '3ro_basico': { min: 7, max: 9 },
  '4to_basico': { min: 8, max: 10 },
  '5to_basico': { min: 9, max: 11 },
  '6to_basico': { min: 10, max: 12 },
  '7mo_basico': { min: 11, max: 13 },
  '8vo_basico': { min: 12, max: 14 },
  '9no_basico': { min: 13, max: 15 },
  '10mo_basico': { min: 14, max: 16 },
  '1ro_bachillerato': { min: 15, max: 17 },
  '2do_bachillerato': { min: 16, max: 18 },
  '3ro_bachillerato': { min: 17, max: 19 },
};

/**
 * Valida si la edad corresponde al grado solicitado
 */
export function validateAgeForGrade(birthDate: Date, grade: string): boolean {
  const age = calculateAge(birthDate);
  const range = GRADE_AGE_RANGES[grade];
  
  if (!range) {
    // Si el grado no está definido, no validamos la edad
    return true;
  }
  
  return age >= range.min && age <= range.max;
}
