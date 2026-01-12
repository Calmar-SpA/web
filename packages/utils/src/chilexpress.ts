/**
 * Chilexpress API Integration Service
 * APIs: Cobertura (Georeference), Cotizador (Rating), Envíos (Transport Orders)
 */

export interface ChilexpressConfig {
  ratingApiKey: string;      // API key for Cotizador (rating)
  transportApiKey: string;   // API key for Envíos (transport-orders)
  georeferenceApiKey: string; // API key for Coberturas (georeference)
  baseUrl: string; // testservices.wschilexpress.com or services.wschilexpress.com
  tcc: string; // Tarjeta Cliente Chilexpress
  originCoverageCode: string; // e.g., "PUCO" for Pucón
}


export interface ShippingQuoteParams {
  originCountyCode: string;
  destinationCountyCode: string;
  package: {
    weight: string; // in kg
    height: string; // in cm
    width: string;  // in cm
    length: string; // in cm
  };
  productType: number; // 3 = Encomienda
  declaredWorth: string;
  deliveryTime?: number; // 0 = All, 1 = Priority, 2 = Non-priority
}

export interface ShippingOption {
  serviceTypeCode: number; // 2=PRIORITARIO, 3=EXPRESS, 4=EXTENDIDO
  serviceDescription: string;
  serviceValue: number; // Price in CLP
  finalWeight: string;
  deliveryType: number;
}

export interface CoverageArea {
  countyCode: string;
  countyName: string;
  regionCode: string;
  coverageName: string;
}

export interface CreateShippingOrderParams {
  destinationCoverageCode: string;
  destinationStreet: string;
  destinationNumber: string;
  destinationSupplement?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  packages: Array<{
    weight: string;
    height: string;
    width: string;
    length: string;
    serviceDeliveryCode: string; // From quote
    declaredValue: string;
    deliveryReference: string; // Order ID
  }>;
}

export interface ShippingOrderResult {
  certificateNumber: string;
  transportOrderNumber: string;
  reference: string;
  serviceDescription: string;
  barcode: string;
  labelData: string; // Binary label
  labelType: string;
}

export class ChilexpressService {
  private config: ChilexpressConfig;

  constructor(config: ChilexpressConfig) {
    this.config = config;
  }

  /**
   * Get the API key for a specific endpoint
   */
  private getApiKeyForEndpoint(endpoint: string): string {
    if (endpoint.startsWith('rating/')) {
      return this.config.ratingApiKey;
    } else if (endpoint.startsWith('transport-orders/')) {
      return this.config.transportApiKey;
    } else if (endpoint.startsWith('georeference/')) {
      return this.config.georeferenceApiKey;
    }
    // Default to rating API key
    return this.config.ratingApiKey;
  }

  /**
   * Makes a request to Chilexpress API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${this.config.baseUrl}/${endpoint}`;
    const apiKey = this.getApiKeyForEndpoint(endpoint);
    
    console.log('Chilexpress API Request:', { endpoint, method, body });

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    console.log('Chilexpress API Response:', { status: response.status, data });

    if (!response.ok || data.statusCode !== 0) {
      throw new Error(data.statusDescription || data.errors?.[0] || 'Error in Chilexpress API');
    }

    return data;
  }

  // ============ COBERTURA (Georeference) API ============

  /**
   * Get all regions
   */
  async getRegions(): Promise<{ regions: Array<{ regionId: string; regionName: string }> }> {
    return this.request('georeference/api/v1.0/regions', 'GET');
  }

  /**
   * Get coverage areas (comunas) for a region
   * Use regionCode "99" to get all coverages
   */
  async getCoverageAreas(regionCode: string, type: number = 1): Promise<{ coverageAreas: CoverageArea[] }> {
    return this.request(
      `georeference/api/v1.0/coverage-areas?RegionCode=${regionCode}&type=${type}`,
      'GET'
    );
  }

  /**
   * Find coverage code by comuna name
   */
  async findCoverageCode(comunaName: string): Promise<string | null> {
    try {
      const response = await this.getCoverageAreas('99', 1); // 99 = all regions
      const area = response.coverageAreas.find(
        (a) => a.countyName.toUpperCase() === comunaName.toUpperCase() ||
               a.coverageName.toUpperCase() === comunaName.toUpperCase()
      );
      return area?.countyCode || null;
    } catch (error) {
      console.error('Error finding coverage code:', error);
      return null;
    }
  }

  // ============ COTIZADOR (Rating) API ============

  /**
   * Get shipping quotes for a package
   */
  async getQuote(params: ShippingQuoteParams): Promise<ShippingOption[]> {
    const body = {
      originCountyCode: params.originCountyCode,
      destinationCountyCode: params.destinationCountyCode,
      package: params.package,
      productType: params.productType,
      contentType: 1,
      declaredWorth: params.declaredWorth,
      deliveryTime: params.deliveryTime ?? 0,
    };

    const response = await this.request<{
      data: { courierServiceOptions: ShippingOption[] };
    }>('rating/api/v1.0/rates/courier', 'POST', body);

    return response.data.courierServiceOptions.map((opt) => ({
      ...opt,
      serviceValue: Number(opt.serviceValue),
    }));
  }

  /**
   * Simplified quote using origin from config
   */
  async getShippingOptions(
    destinationCoverageCode: string,
    weightKg: number,
    declaredValue: number,
    dimensions?: { height: number; width: number; length: number }
  ): Promise<ShippingOption[]> {
    return this.getQuote({
      originCountyCode: this.config.originCoverageCode,
      destinationCountyCode: destinationCoverageCode,
      package: {
        weight: weightKg.toFixed(2),
        height: String(dimensions?.height || 10),
        width: String(dimensions?.width || 10),
        length: String(dimensions?.length || 10),
      },
      productType: 3, // Encomienda
      declaredWorth: String(declaredValue),
      deliveryTime: 0, // All services
    });
  }

  // ============ ENVÍOS (Transport Orders) API ============

  /**
   * Create a shipping order (Orden de Transporte)
   */
  async createShippingOrder(params: CreateShippingOrderParams): Promise<ShippingOrderResult> {
    const body = {
      header: {
        certificateNumber: 0, // Will create new certificate
        customerCardNumber: this.config.tcc,
        countyOfOriginCoverageCode: this.config.originCoverageCode,
        labelType: 2, // Binary image + data
      },
      details: [
        {
          addresses: [
            {
              addressId: 0,
              countyCoverageCode: params.destinationCoverageCode,
              streetName: params.destinationStreet,
              streetNumber: params.destinationNumber,
              supplement: params.destinationSupplement || '',
              addressType: 'DEST',
              deliveryOnCommercialOffice: false,
              observation: '',
            },
          ],
          contacts: [
            {
              name: params.senderName,
              phoneNumber: params.senderPhone,
              mail: params.senderEmail,
              contactType: 'R', // Remitente
            },
            {
              name: params.recipientName,
              phoneNumber: params.recipientPhone,
              mail: params.recipientEmail,
              contactType: 'D', // Destinatario
            },
          ],
          packages: params.packages.map((pkg) => ({
            weight: pkg.weight,
            height: pkg.height,
            width: pkg.width,
            length: pkg.length,
            serviceDeliveryCode: pkg.serviceDeliveryCode,
            productCode: '3', // Encomienda
            deliveryReference: pkg.deliveryReference,
            groupReference: pkg.deliveryReference,
            declaredValue: pkg.declaredValue,
            declaredContent: '5', // Otros
          })),
        },
      ],
    };

    const response = await this.request<{
      data: {
        header: { certificateNumber: number };
        detail: Array<{
          transportOrderNumber: number;
          reference: string;
          serviceDescription: string;
          barcode: string;
          label: { labelData: string; labelType: string };
        }>;
      };
    }>('transport-orders/api/v1.0/transport-orders', 'POST', body);

    const detail = response.data.detail[0];
    return {
      certificateNumber: String(response.data.header.certificateNumber),
      transportOrderNumber: String(detail.transportOrderNumber),
      reference: detail.reference,
      serviceDescription: detail.serviceDescription,
      barcode: detail.barcode,
      labelData: detail.label?.labelData || '',
      labelType: detail.label?.labelType || '',
    };
  }

  /**
   * Get tracking info for a transport order
   */
  async getTracking(
    transportOrderNumber: string,
    reference?: string,
    showAllEvents: boolean = true
  ): Promise<any> {
    const body = {
      transportOrderNumber: Number(transportOrderNumber),
      reference: reference || '',
      rut: 0,
      showTrackingEvents: showAllEvents ? 1 : 0,
    };

    return this.request('transport-orders/api/v1.0/tracking', 'POST', body);
  }
}

// Create singleton instance from environment variables
export function createChilexpressService(): ChilexpressService {
  const ratingApiKey = process.env.CHILEXPRESS_RATING_API_KEY;
  const transportApiKey = process.env.CHILEXPRESS_TRANSPORT_API_KEY;
  const georeferenceApiKey = process.env.CHILEXPRESS_GEOREFERENCE_API_KEY;
  const baseUrl = process.env.CHILEXPRESS_BASE_URL || 'http://testservices.wschilexpress.com';
  const tcc = process.env.CHILEXPRESS_TCC || '18578680';
  const originCoverageCode = process.env.CHILEXPRESS_ORIGIN_CODE || 'PUCO';

  if (!ratingApiKey || !transportApiKey || !georeferenceApiKey) {
    throw new Error('All Chilexpress API keys are required (CHILEXPRESS_RATING_API_KEY, CHILEXPRESS_TRANSPORT_API_KEY, CHILEXPRESS_GEOREFERENCE_API_KEY)');
  }

  return new ChilexpressService({
    ratingApiKey,
    transportApiKey,
    georeferenceApiKey,
    baseUrl,
    tcc,
    originCoverageCode,
  });
}
