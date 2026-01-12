import { ChilexpressService } from '@calmar/utils'

// Lazy initialization to avoid build-time errors
let chilexpressInstance: ChilexpressService | null = null

export function getChilexpressService(): ChilexpressService {
  if (!chilexpressInstance) {
    const ratingApiKey = process.env.CHILEXPRESS_RATING_API_KEY;
    const transportApiKey = process.env.CHILEXPRESS_TRANSPORT_API_KEY;
    const georeferenceApiKey = process.env.CHILEXPRESS_GEOREFERENCE_API_KEY;
    
    if (!ratingApiKey || !transportApiKey || !georeferenceApiKey) {
      throw new Error('Missing Chilexpress API keys. Required: CHILEXPRESS_RATING_API_KEY, CHILEXPRESS_TRANSPORT_API_KEY, CHILEXPRESS_GEOREFERENCE_API_KEY');
    }
    
    chilexpressInstance = new ChilexpressService({
      ratingApiKey,
      transportApiKey,
      georeferenceApiKey,
      baseUrl: process.env.CHILEXPRESS_BASE_URL || 'http://testservices.wschilexpress.com',
      tcc: process.env.CHILEXPRESS_TCC || '18578680',
      originCoverageCode: process.env.CHILEXPRESS_ORIGIN_CODE || 'PUCO',
    });
  }
  
  return chilexpressInstance;
}


// Convenience export for direct usage
export const chilexpress = {
  getQuote: (...args: Parameters<ChilexpressService['getQuote']>) => 
    getChilexpressService().getQuote(...args),
  getShippingOptions: (...args: Parameters<ChilexpressService['getShippingOptions']>) => 
    getChilexpressService().getShippingOptions(...args),
  findCoverageCode: (...args: Parameters<ChilexpressService['findCoverageCode']>) => 
    getChilexpressService().findCoverageCode(...args),
  createShippingOrder: (...args: Parameters<ChilexpressService['createShippingOrder']>) => 
    getChilexpressService().createShippingOrder(...args),
  getTracking: (...args: Parameters<ChilexpressService['getTracking']>) => 
    getChilexpressService().getTracking(...args),
  getCoverageAreas: (...args: Parameters<ChilexpressService['getCoverageAreas']>) => 
    getChilexpressService().getCoverageAreas(...args),
};
