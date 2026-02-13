export function validateCedulaEcuatoriana(cedula: string): boolean {
  if (!cedula || cedula.length !== 10) {
    return false;
  }

  // Check if it only contains numbers
  if (!/^\d+$/.test(cedula)) {
    return false;
  }

  const provincia = parseInt(cedula.substring(0, 2), 10);
  const tercerDigito = parseInt(cedula.substring(2, 3), 10);

  if (provincia < 1 || provincia > 24) {
    return false;
  }

  if (tercerDigito >= 6) {
    return false;
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  const modulo = suma % 10;
  let resultado = 0;

  if (modulo !== 0) {
    resultado = 10 - modulo;
  }

  return resultado === digitoVerificador;
}
