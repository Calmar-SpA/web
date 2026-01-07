import crypto from 'crypto';

export interface FlowConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export class FlowService {
  private config: FlowConfig;

  constructor(config: FlowConfig) {
    this.config = config;
  }

  /**
   * Generates a signature for Flow API requests.
   * Parameters are sorted alphabetically and concatenated (keyvaluekeyvalue...)
   * then signed using HMAC-SHA256.
   */
  public sign(params: Record<string, any>): string {
    const keys = Object.keys(params).sort();
    let toSign = '';
    
    for (const key of keys) {
      toSign += key + params[key];
    }

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(toSign)
      .digest('hex');
  }

  /**
   * Makes a request to the Flow API.
   */
  private async request(endpoint: string, method: 'GET' | 'POST', params: Record<string, any>) {
    // Convert all values to strings for proper signing and URLSearchParams
    const stringParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        stringParams[key] = String(value);
      }
    }
    
    // Add apiKey
    stringParams.apiKey = this.config.apiKey;

    // Generate signature
    const signature = this.sign(stringParams);
    
    // Build body with signature
    const bodyParams = { ...stringParams, s: signature };
    const body = new URLSearchParams(bodyParams);

    const url = `${this.config.baseUrl}/${endpoint}${method === 'GET' ? '?' + body.toString() : ''}`;
    
    // Debug logging
    console.log('Flow API Request:', {
      endpoint,
      method,
      url,
      params: { ...bodyParams, apiKey: '***HIDDEN***', s: '***HIDDEN***' }
    });
    
    const options: RequestInit = {
      method,
    };

    if (method === 'POST') {
      options.body = body.toString();
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }

    const response = await fetch(url, options);
    const data = await response.json();

    console.log('Flow API Response:', {
      status: response.status,
      data
    });

    if (!response.ok) {
      throw new Error(data.message || 'Error in Flow API request');
    }

    return data;
  }

  /**
   * Creates a new payment in Flow.
   */
  public async createPayment(params: {
    commerceOrder: string;
    subject: string;
    currency?: string;
    amount: number;
    email: string;
    urlConfirmation: string;
    urlReturn: string;
    paymentMethod?: number;
  }) {
    return this.request('payment/create', 'POST', params);
  }

  /**
   * Status of a payment by token.
   */
  public async getStatus(token: string) {
    return this.request('payment/getStatus', 'GET', { token });
  }
}
