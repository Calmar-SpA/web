import { StarkenService } from '@calmar/utils'

// Lazy initialization to avoid build-time errors
let starkenInstance: StarkenService | null = null

export function getStarkenService(): StarkenService {
  if (!starkenInstance) {
    const rut = process.env.STARKEN_RUT;
    const clave = process.env.STARKEN_CLAVE;
    const baseUrl = process.env.STARKEN_BASE_URL || 'https://restservices-qa.starken.cl';
    const originCityCode = parseInt(process.env.STARKEN_ORIGIN_CITY_CODE || '73', 10); // PUCON city code
    const originComunaCode = parseInt(process.env.STARKEN_ORIGIN_COMUNA_CODE || '2982', 10); // PUCON comuna
    
    if (!rut || !clave) {
      throw new Error('Missing Starken API credentials. Required: STARKEN_RUT, STARKEN_CLAVE');
    }
    
    starkenInstance = new StarkenService({
      rut,
      clave,
      baseUrl,
      originCityCode,
      originComunaCode,
    });
  }
  
  return starkenInstance;
}

// Convenience export for direct usage
export const starken = {
  getCitiesOrigin: () => getStarkenService().getCitiesOrigin(),
  getCitiesDestination: () => getStarkenService().getCitiesDestination(),
  findCityCodeByComuna: (...args: Parameters<StarkenService['findCityCodeByComuna']>) => 
    getStarkenService().findCityCodeByComuna(...args),
  getQuote: (...args: Parameters<StarkenService['getQuote']>) => 
    getStarkenService().getQuote(...args),
  getShippingOptions: (...args: Parameters<StarkenService['getShippingOptions']>) => 
    getStarkenService().getShippingOptions(...args),
};
