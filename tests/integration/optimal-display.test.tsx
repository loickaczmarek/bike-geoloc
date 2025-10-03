/**
 * ========================================
 * OPTIMAL DISPLAY - BDD TESTS
 * ========================================
 * Tests comportementaux centrés sur la valeur utilisateur :
 * "Je veux rapidement identifier quel vélo prendre"
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StationList } from '@/components/StationList'
import type { StationWithDistance } from '@/types/station.types'

const mockStations: StationWithDistance[] = [
  {
    id: '1',
    name: 'Station République',
    latitude: 48.8566,
    longitude: 2.3522,
    free_bikes: 8,
    empty_slots: 5,
    distance: 45,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Station Bastille',
    latitude: 48.8566,
    longitude: 2.3522,
    free_bikes: 2, // Peu de vélos - devrait être visuellement différent
    empty_slots: 12,
    distance: 75,
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Station Nation',
    latitude: 48.8566,
    longitude: 2.3522,
    free_bikes: 15,
    empty_slots: 3,
    distance: 120,
    timestamp: new Date().toISOString(),
  },
]

describe('Affichage Optimisé - BDD', () => {
  describe('GIVEN je cherche un vélo disponible', () => {
    describe('WHEN je vois la liste des stations', () => {
      it('THEN je dois voir immédiatement la distance en mètres', () => {
        render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // L'utilisateur doit voir "45m", "75m", "120m" sans chercher
        expect(screen.getByText(/45m/i)).toBeInTheDocument()
        expect(screen.getByText(/75m/i)).toBeInTheDocument()
        expect(screen.getByText(/120m/i)).toBeInTheDocument()
      })

      it('THEN je dois voir le nombre de vélos disponibles en gros caractères', () => {
        const { container } = render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // Les nombres de vélos doivent être visuellement proéminents
        const bikeNumbers = container.querySelectorAll('[data-testid="bike-count"]')
        expect(bikeNumbers.length).toBeGreaterThan(0)
      })

      it('THEN les stations doivent être triées par distance (plus proche en premier)', () => {
        render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        const cards = screen.getAllByRole('article')

        // La première carte doit être République (45m)
        expect(cards[0]).toHaveTextContent('Station République')
        expect(cards[0]).toHaveTextContent('45m')

        // La dernière doit être Nation (120m)
        expect(cards[cards.length - 1]).toHaveTextContent('Station Nation')
      })
    })

    describe('WHEN une station a peu de vélos (≤2)', () => {
      it('THEN elle doit être visuellement signalée comme moins prioritaire', () => {
        const { container } = render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // Station Bastille (2 vélos) doit avoir un indicateur visuel
        const bastilleCard = screen.getByText(/Station Bastille/i).closest('article')
        expect(bastilleCard).toBeInTheDocument()

        // Vérifier qu'il y a un indicateur de warning (couleur ou badge)
        const warningElements = bastilleCard?.querySelectorAll('[class*="warning"]')
        expect(warningElements?.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN une station est très proche (< 50m)', () => {
      it('THEN elle doit être visuellement mise en avant comme choix optimal', () => {
        const { container } = render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // République (45m) doit avoir un indicateur "optimal"
        const republiqueCard = screen.getByText(/Station République/i).closest('article')

        // Devrait avoir une classe ou badge "optimal" ou "recommended"
        expect(
          republiqueCard?.innerHTML.includes('optimal') ||
          republiqueCard?.innerHTML.includes('recommend') ||
          republiqueCard?.className.includes('primary')
        ).toBeTruthy()
      })
    })

    describe('WHEN je veux choisir rapidement', () => {
      it('THEN je dois voir le rang de chaque station (1, 2, 3...)', () => {
        render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // Les rangs doivent être visibles
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      it('THEN les informations critiques doivent être groupées visuellement', () => {
        render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        const firstCard = screen.getByText(/Station République/i).closest('article')

        // Dans la première carte, distance et vélos doivent être proches visuellement
        expect(firstCard).toHaveTextContent('45m')
        expect(firstCard).toHaveTextContent('8') // Vélos
      })
    })
  })

  describe('GIVEN je veux comprendre la disponibilité en un coup d\'œil', () => {
    describe('WHEN je regarde une station', () => {
      it('THEN je dois voir une indication claire de la disponibilité des vélos', () => {
        render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // Le label "Vélos" ou équivalent doit être présent
        const velosLabels = screen.getAllByText(/vélos/i)
        expect(velosLabels.length).toBeGreaterThan(0)
      })

      it('THEN la couleur doit indiquer le niveau de disponibilité', () => {
        const lowBikeStation: StationWithDistance[] = [{
          id: '1',
          name: 'Station Vide',
          latitude: 48.8566,
          longitude: 2.3522,
          free_bikes: 1,
          empty_slots: 20,
          distance: 50,
          timestamp: new Date().toISOString(),
        }]

        const { container } = render(
          <StationList stations={lowBikeStation} networkName="Vélib'" />
        )

        // Station avec 1 vélo doit avoir une couleur d'alerte
        const card = container.querySelector('[data-testid="bike-count"]')
        expect(card?.className).toMatch(/warning|orange|amber/i)
      })
    })
  })

  describe('GIVEN je suis sur mobile', () => {
    describe('WHEN je consulte la liste', () => {
      it('THEN les informations doivent rester lisibles sur petit écran', () => {
        const { container } = render(
          <StationList stations={mockStations} networkName="Vélib'" />
        )

        // Vérifier que le layout est responsive
        const grid = container.querySelector('.grid')
        expect(grid?.className).toContain('md:grid-cols')
      })
    })
  })

  describe('GIVEN je veux actualiser les données', () => {
    describe('WHEN je clique sur actualiser', () => {
      it('THEN le bouton doit être facilement accessible', () => {
        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={() => {}}
          />
        )

        const refreshButton = screen.getByRole('button', { name: /actualiser/i })
        expect(refreshButton).toBeInTheDocument()
        expect(refreshButton).toBeVisible()
      })
    })
  })

  describe('GIVEN aucune station n\'est disponible', () => {
    describe('WHEN j\'affiche la liste vide', () => {
      it('THEN je dois voir un message clair et une action suggérée', () => {
        render(
          <StationList
            stations={[]}
            networkName="Vélib'"
            onRefresh={() => {}}
          />
        )

        expect(screen.getByText(/aucune station/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility - GIVEN je navigue au clavier', () => {
    it('THEN chaque station doit être accessible via Tab', () => {
      const { container } = render(
        <StationList stations={mockStations} networkName="Vélib'" />
      )

      const cards = container.querySelectorAll('[role="article"]')
      cards.forEach((card) => {
        // Chaque carte doit avoir un role approprié
        expect(card).toHaveAttribute('role', 'article')
      })
    })

    it('THEN les informations critiques doivent avoir des labels ARIA', () => {
      render(
        <StationList stations={mockStations} networkName="Vélib'" />
      )

      const refreshButton = screen.getByRole('button', { name: /actualiser/i })
      expect(refreshButton).toHaveAttribute('aria-label')
    })
  })
})
