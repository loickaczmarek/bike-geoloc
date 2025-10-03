/**
 * ========================================
 * CITYBIKES API TYPES
 * ========================================
 * Types pour l'API CityBikes v2
 * Documentation: https://api.citybik.es/v2/
 */

export interface Network {
  id: string
  name: string
  href: string // URL pour récupérer les détails du réseau
  location: {
    city: string
    country: string
    latitude: number
    longitude: number
  }
  company?: string[]
}

export interface NetworksResponse {
  networks: Network[]
}

export interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  free_bikes: number
  empty_slots: number
  timestamp: string
  extra?: {
    uid?: string
    address?: string
    banking?: boolean
    bonus?: boolean
    status?: string
    [key: string]: unknown
  }
}

export interface NetworkDetails extends Network {
  stations: Station[]
}

export interface NetworkDetailsResponse {
  network: NetworkDetails
}
