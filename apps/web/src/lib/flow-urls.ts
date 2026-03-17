export function getFlowBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL no está configurada. ' +
      'Esta variable es requerida para los pagos con Flow.'
    );
  }
  
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    console.warn('[Flow] ADVERTENCIA: Usando localhost como URL base. Los pagos no funcionarán correctamente en producción.');
  }
  
  // Remover slash final si existe
  return baseUrl.replace(/\/+$/, '');
}
