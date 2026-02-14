/**
 * Valida una cédula de identidad ecuatoriana (10 dígitos)
 * Algoritmo: Módulo 10
 * 
 * Reglas:
 * 1. Debe tener 10 dígitos numéricos
 * 2. Los dos primeros dígitos deben estar entre 01 y 24 (código de provincia)
 * 3. El tercer dígito debe ser menor a 6 (personas naturales)
 * 4. El último dígito es el dígito verificador calculado con módulo 10
 */
export function validateCedulaEcuatoriana(cedula: string): boolean {
  // 1. Validar longitud y que sean números
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // 2. Validar código de provincia (01-24)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // 3. Validar tercer dígito (0-5 para personas naturales)
  const tercerDigito = parseInt(cedula.substring(2, 3), 10);
  if (tercerDigito >= 6) {
    return false;
  }

  // 4. Algoritmo Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula.substring(9, 10), 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.substring(i, i + 1), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const modulo = suma % 10;
  let resultado = 0;
  
  if (modulo !== 0) {
    resultado = 10 - modulo;
  }

  return resultado === digitoVerificador;
}
