"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface StarkenCity {
  codigoCiudad: number
  codigoRegion: number
  nombreCiudad: string
  listaComunas: StarkenComuna[]
}

interface StarkenComuna {
  codigoComuna: number
  nombreComuna: string
}

interface AddressSelectorProps {
  selectedRegion: string
  selectedComuna: string
  selectedComunaCode: string
  onRegionChange: (regionId: string, regionName: string) => void
  onComunaChange: (comunaName: string, comunaCode: string, cityCode: string) => void
  disabled?: boolean
}

// Chilean regions mapping (region code to name)
const REGION_MAP: Record<number, string> = {
  15: "ARICA Y PARINACOTA",
  1: "TARAPACÁ",
  2: "ANTOFAGASTA",
  3: "ATACAMA",
  4: "COQUIMBO",
  5: "VALPARAÍSO",
  6: "O'HIGGINS",
  7: "MAULE",
  8: "BIOBÍO",
  9: "LA ARAUCANÍA",
  10: "LOS LAGOS",
  11: "AYSÉN",
  12: "MAGALLANES",
  13: "METROPOLITANA",
  14: "LOS RÍOS",
  16: "ÑUBLE",
}

export function AddressSelector({
  selectedRegion,
  selectedComuna,
  selectedComunaCode,
  onRegionChange,
  onComunaChange,
  disabled = false,
}: AddressSelectorProps) {
  const [cities, setCities] = useState<StarkenCity[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Group cities by region
  const [regionGroups, setRegionGroups] = useState<Record<string, StarkenCity[]>>({})
  const [comunas, setComunas] = useState<{cityCode: number, comuna: StarkenComuna}[]>([])

  // Fetch all destination cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true)
      setError(null)
      try {
        const response = await fetch('/api/shipping/starken/cities?type=destination')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error de API')
        }
        
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities)
          
          // Group cities by region
          const groups: Record<string, StarkenCity[]> = {}
          for (const city of data.cities) {
            const regionName = REGION_MAP[city.codigoRegion] || `Región ${city.codigoRegion}`
            if (!groups[regionName]) {
              groups[regionName] = []
            }
            groups[regionName].push(city)
          }
          
          // Sort regions and cities within each region
          const sortedGroups: Record<string, StarkenCity[]> = {}
          Object.keys(groups).sort().forEach(key => {
            sortedGroups[key] = groups[key].sort((a, b) => 
              a.nombreCiudad.localeCompare(b.nombreCiudad)
            )
          })
          
          setRegionGroups(sortedGroups)
        } else {
          setError('No hay ciudades disponibles')
        }
      } catch (err: any) {
        console.error("Error fetching cities:", err)
        setError(err.message || 'Error al cargar ciudades')
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [])

  // Update comunas when region changes
  useEffect(() => {
    if (!selectedRegion || !regionGroups[selectedRegion]) {
      setComunas([])
      return
    }
    
    const citiesInRegion = regionGroups[selectedRegion]
    const allComunas: {cityCode: number, comuna: StarkenComuna}[] = []
    
    for (const city of citiesInRegion) {
      for (const comuna of city.listaComunas) {
        allComunas.push({ cityCode: city.codigoCiudad, comuna })
      }
    }
    
    // Sort comunas alphabetically
    allComunas.sort((a, b) => a.comuna.nombreComuna.localeCompare(b.comuna.nombreComuna))
    setComunas(allComunas)
  }, [selectedRegion, regionGroups])

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionName = e.target.value
    onRegionChange(regionName, regionName)
    // Reset comuna when region changes
    onComunaChange("", "", "")
  }

  const handleComunaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value // Format: "cityCode:comunaCode"
    if (!value) return
    
    const [cityCode, comunaCode] = value.split(':').map(Number)
    const comunaData = comunas.find(c => c.cityCode === cityCode && c.comuna.codigoComuna === comunaCode)
    
    if (comunaData) {
      onComunaChange(
        comunaData.comuna.nombreComuna, 
        String(comunaData.comuna.codigoComuna),
        String(comunaData.cityCode)
      )
    }
  }

  if (loadingCities) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando ubicaciones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm">
        {error}
      </div>
    )
  }

  // Get available regions
  const availableRegions = Object.keys(regionGroups).sort()

  return (
    <>
      {/* Region Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Región
        </label>
        <select
          value={selectedRegion}
          onChange={handleRegionChange}
          disabled={disabled}
          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-calmar-ocean focus:border-transparent disabled:opacity-50"
          required
        >
          <option value="">Selecciona una región</option>
          {availableRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Comuna Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Comuna
        </label>
        <div className="relative">
          <select
            value={selectedComunaCode ? `${comunas.find(c => String(c.comuna.codigoComuna) === selectedComunaCode)?.cityCode}:${selectedComunaCode}` : ""}
            onChange={handleComunaChange}
            disabled={disabled || !selectedRegion}
            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-calmar-ocean focus:border-transparent disabled:opacity-50"
            required
          >
            <option value="">
              {selectedRegion 
                ? "Selecciona una comuna" 
                : "Primero selecciona una región"
              }
            </option>
            {comunas.map((item) => (
              <option 
                key={`${item.cityCode}:${item.comuna.codigoComuna}`} 
                value={`${item.cityCode}:${item.comuna.codigoComuna}`}
              >
                {item.comuna.nombreComuna}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
