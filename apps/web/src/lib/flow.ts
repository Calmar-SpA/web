import { FlowService } from '@calmar/utils'

// Lazy initialization to avoid build-time errors
let flowInstance: FlowService | null = null

export function getFlowService(): FlowService {
  if (!flowInstance) {
    if (!process.env.FLOW_API_KEY || !process.env.FLOW_SECRET_KEY) {
      throw new Error('Missing Flow API credentials in environment variables');
    }
    
    flowInstance = new FlowService({
      apiKey: process.env.FLOW_API_KEY,
      secretKey: process.env.FLOW_SECRET_KEY,
      baseUrl: process.env.FLOW_BASE_URL || 'https://sandbox.flow.cl/api',
    });
  }
  
  return flowInstance;
}

// For backwards compatibility - but use getFlowService() for safety
export const flow = {
  createPayment: (...args: Parameters<FlowService['createPayment']>) => 
    getFlowService().createPayment(...args),
  getStatus: (...args: Parameters<FlowService['getStatus']>) => 
    getFlowService().getStatus(...args),
  getStatusByCommerceId: (...args: Parameters<FlowService['getStatusByCommerceId']>) => 
    getFlowService().getStatusByCommerceId(...args),
};
