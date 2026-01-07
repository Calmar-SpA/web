import { FlowService } from '@calmar/utils'

if (!process.env.FLOW_API_KEY || !process.env.FLOW_SECRET_KEY) {
  throw new Error('Missing Flow API credentials in environment variables');
}

export const flow = new FlowService({
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_SECRET_KEY,
  // Use sandbox by default unless explicitly in production
  baseUrl: process.env.FLOW_BASE_URL || 'https://sandbox.flow.cl/api',
});
