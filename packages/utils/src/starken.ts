/**
 * Starken API Integration Service
 * APIs: Ciudades Origen/Destino, Cotización de Tarifas
 * Documentation: https://restservices-qa.starken.cl/apiqa/starkenservices/rest/
 */

// ============ Configuration ============

export interface StarkenConfig {
  rut: string;           // RUT for authentication header
  clave: string;         // API key/password
  baseUrl: string;       // Base URL (QA: https://restservices-qa.starken.cl)
  originCityCode: number; // Origin city code (e.g., 73 for PUCON)
  originComunaCode: number; // Origin comuna code (e.g., 2982 for PUCON)
}

// ============ City/Comuna Interfaces ============

export interface StarkenComuna {
  codigoComuna: number;
  nombreComuna: string;
}

export interface StarkenCity {
  codigoCiudad: number;
  codigoRegion: number;
  codigoZonaGeografica: number;
  nombreCiudad: string;
  listaComunas: StarkenComuna[];
}

export interface StarkenCitiesResponse {
  type: string;
  codigoRespuesta: number;
  mensajeRespuesta: string;
  listaCiudadesOrigen?: StarkenCity[];
  listaCiudadesDestino?: StarkenCity[];
}

// ============ Quote/Tariff Interfaces ============

export interface StarkenTipoEntrega {
  codigoTipoEntrega: number;  // 1 = AGENCIA, 2 = DOMICILIO
  descripcionTipoEntrega: string;
}

export interface StarkenTipoServicio {
  codigoTipoServicio: number; // 0 = NORMAL, 1 = EXPRESS
  descripcionTipoServicio: string;
}

export interface StarkenTariff {
  costoTotal: number;
  diasEntrega: number;
  tipoEntrega: StarkenTipoEntrega;
  tipoServicio: StarkenTipoServicio;
}

export interface StarkenQuoteRequest {
  codigoCiudadOrigen: number;
  codigoCiudadDestino: number;
  codigoAgenciaDestino: number;  // Always 0 for quotes
  codigoAgenciaOrigen: number;   // Always 0 for quotes
  alto: number;    // Height in cm
  ancho: number;   // Width in cm
  largo: number;   // Length in cm
  kilos: number;   // Weight in kg
  cuentaCorriente: string;
  cuentaCorrienteDV: string;
  rutCliente: string;
}

export interface StarkenQuoteResponse {
  type: string;
  codigoRespuesta: number;
  mensajeRespuesta: string;
  listaTarifas: StarkenTariff[];
}

// ============ Unified Shipping Option ============

export interface StarkenShippingOption {
  code: string;           // Unique code combining service + delivery type
  name: string;           // Display name
  price: number;          // Total cost in CLP
  estimatedDays: number;  // Delivery days
  deliveryType: 'AGENCIA' | 'DOMICILIO';
  serviceType: 'NORMAL' | 'EXPRESS';
}

// ============ Service Class ============

export class StarkenService {
  private config: StarkenConfig;

  constructor(config: StarkenConfig) {
    this.config = config;
  }

  /**
   * Makes a request to Starken API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, any>
  ): Promise<T> {
    const baseUrlSanitized = this.config.baseUrl.replace(/\/$/, '');
    const url = `${baseUrlSanitized}/apiqa/starkenservices/rest/${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Rut': this.config.rut,
        'Clave': this.config.clave,
      },
    };

    console.log('Starken API Request:', { 
      url,
      method, 
      headers: options.headers,
      body: JSON.stringify(body) 
    });

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    console.log('Starken API Response:', { 
      status: response.status, 
      codigoRespuesta: data.codigoRespuesta,
      mensajeRespuesta: data.mensajeRespuesta,
      data: JSON.stringify(data).substring(0, 500)
    });

    if (!response.ok) {
      throw new Error(data.mensajeRespuesta || `HTTP ${response.status}`);
    }

    // codigoRespuesta 0 with empty mensajeRespuesta means "no results", not an error
    // Only throw if there's an actual error message
    if (data.codigoRespuesta !== 1 && data.mensajeRespuesta) {
      throw new Error(data.mensajeRespuesta);
    }

    return data;
  }

  // ============ Cities API ============

  /**
   * Get all origin cities with their comunas
   */
  async getCitiesOrigin(): Promise<StarkenCity[]> {
    const response = await this.request<StarkenCitiesResponse>(
      'listarCiudadesOrigen',
      'GET'
    );
    return response.listaCiudadesOrigen || [];
  }

  /**
   * Get all destination cities with their comunas
   */
  async getCitiesDestination(): Promise<StarkenCity[]> {
    const response = await this.request<StarkenCitiesResponse>(
      'listarCiudadesDestino',
      'GET'
    );
    return response.listaCiudadesDestino || [];
  }

  /**
   * Find city code by comuna name
   */
  async findCityCodeByComuna(comunaName: string, type: 'origin' | 'destination' = 'destination'): Promise<number | null> {
    try {
      const cities = type === 'origin' 
        ? await this.getCitiesOrigin() 
        : await this.getCitiesDestination();
      
      const normalizedSearch = comunaName.toUpperCase().trim();
      
      for (const city of cities) {
        const comuna = city.listaComunas.find(
          c => c.nombreComuna.toUpperCase() === normalizedSearch
        );
        if (comuna) {
          return city.codigoCiudad;
        }
      }
      
      // Also search by city name
      const city = cities.find(c => c.nombreCiudad.toUpperCase() === normalizedSearch);
      if (city) {
        return city.codigoCiudad;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding city code:', error);
      return null;
    }
  }

  // ============ Quote API ============

  /**
   * Get shipping quotes/tariffs
   */
  async getQuote(params: StarkenQuoteRequest): Promise<StarkenTariff[]> {
    const response = await this.request<StarkenQuoteResponse>(
      'consultarTarifas',
      'POST',
      params
    );
    return response.listaTarifas || [];
  }

  /**
   * Simplified quote using origin from config
   */
  async getShippingOptions(
    destinationCityCode: number,
    weightKg: number,
    dimensions?: { height: number; width: number; length: number }
  ): Promise<StarkenShippingOption[]> {
    const tariffs = await this.getQuote({
      codigoCiudadOrigen: this.config.originCityCode,
      codigoCiudadDestino: destinationCityCode,
      codigoAgenciaDestino: 0,
      codigoAgenciaOrigen: 0,
      alto: dimensions?.height || 10,
      ancho: dimensions?.width || 10,
      largo: dimensions?.length || 10,
      kilos: weightKg,
      cuentaCorriente: '',
      cuentaCorrienteDV: '',
      rutCliente: this.config.rut, // Use RUT from credentials
    });

    // Map to unified format
    return tariffs.map((tariff): StarkenShippingOption => {
      const deliveryType = tariff.tipoEntrega.codigoTipoEntrega === 1 ? 'AGENCIA' : 'DOMICILIO';
      const serviceType = tariff.tipoServicio.codigoTipoServicio === 0 ? 'NORMAL' : 'EXPRESS';
      
      return {
        code: `STARKEN_${deliveryType}_${serviceType}`,
        name: `Starken ${serviceType} - ${deliveryType}`,
        price: tariff.costoTotal,
        estimatedDays: tariff.diasEntrega,
        deliveryType,
        serviceType,
      };
    });
  }
}

// ============ Factory Function ============

export function createStarkenService(): StarkenService {
  const rut = process.env.STARKEN_RUT;
  const clave = process.env.STARKEN_CLAVE;
  const baseUrl = process.env.STARKEN_BASE_URL || 'https://restservices-qa.starken.cl';
  const originCityCode = parseInt(process.env.STARKEN_ORIGIN_CITY_CODE || '73', 10); // PUCON
  const originComunaCode = parseInt(process.env.STARKEN_ORIGIN_COMUNA_CODE || '2982', 10); // PUCON

  if (!rut || !clave) {
    throw new Error('Starken API credentials are required (STARKEN_RUT, STARKEN_CLAVE)');
  }

  return new StarkenService({
    rut,
    clave,
    baseUrl,
    originCityCode,
    originComunaCode,
  });
}
