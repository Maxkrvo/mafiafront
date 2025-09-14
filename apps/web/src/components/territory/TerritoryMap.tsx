"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import TerritoryTile from "./TerritoryTile";
import TerritoryDetails from "./TerritoryDetails";
import WarStatus from "./WarStatus";
import {
  getAllTerritories,
  getAllTerritoryControls,
  getActiveWars,
} from "../../lib/territory-data";
import { useFamilyPermissions } from "../family";
import type {
  Territory,
  TerritoryControl,
  TerritoryWar,
  TerritoryType,
} from "../../lib/supabase/territory-types";
import { TERRITORY_CONSTANTS } from "../../lib/supabase/territory-types";

interface TerritoryMapProps {
  selectedTerritory?: string;
  onTerritorySelect: (territoryId: string) => void;
  showIncomeOverlay?: boolean;
  showWarOverlay?: boolean;
  playerFamilyId?: string;
}

const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #2c1810 0%, #3d2317 100%);
  border-radius: 10px;
  border: 2px solid #8b7355;
`;

const MapTitle = styled.h2`
  color: #d4af37;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const MapControls = styled.div`
  display: flex;
  gap: 10px;
`;

const ControlButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${(props) => (props.active ? "#d4af37" : "#4a4a4a")};
  color: ${(props) => (props.active ? "#000" : "#fff")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.active ? "#b8941f" : "#5a5a5a")};
  }
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${TERRITORY_CONSTANTS.MAP_WIDTH}, 1fr);
  grid-template-rows: repeat(${TERRITORY_CONSTANTS.MAP_HEIGHT}, 1fr);
  gap: 2px;
  background-color: #1a1a1a;
  border-radius: 10px;
  padding: 10px;
  aspect-ratio: 1;
  max-width: 800px;
  margin: 0 auto;
`;

const MapLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #2c1810 0%, #3d2317 100%);
  border-radius: 10px;
  border: 2px solid #8b7355;
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #e0e0e0;

  &::before {
    content: "";
    width: 16px;
    height: 16px;
    background: ${(props) => props.color};
    border-radius: 3px;
    border: 1px solid #666;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #d4af37;
  font-size: 1.2rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #ff6b6b;
  font-size: 1.1rem;
  text-align: center;
`;

const ContentArea = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MapSection = styled.div`
  flex: 1;
`;

const DetailsSection = styled.div`
  width: 350px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TerritoryMap: React.FC<TerritoryMapProps> = ({
  selectedTerritory,
  onTerritorySelect,
  showIncomeOverlay = false,
  showWarOverlay = true,
  playerFamilyId,
}) => {
  const { membership, hasPermission } = useFamilyPermissions();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [territoryControls, setTerritoryControls] = useState<
    Record<string, TerritoryControl>
  >({});
  const [activeWars, setActiveWars] = useState<TerritoryWar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomeOverlay, setIncomeOverlay] = useState(showIncomeOverlay);
  const [warOverlay, setWarOverlay] = useState(showWarOverlay);

  // Use family membership for territory management permissions
  const effectivePlayerFamilyId = playerFamilyId || membership?.family_id;

  // Load territory data
  useEffect(() => {
    loadTerritoryData();
  }, []);

  const loadTerritoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [territoriesData, controlsData, warsData] = await Promise.all([
        getAllTerritories(),
        getAllTerritoryControls(),
        getActiveWars(),
      ]);

      setTerritories(territoriesData);
      setActiveWars(warsData);

      // Convert controls to lookup map
      const controlsMap: Record<string, TerritoryControl> = {};
      controlsData.forEach((control) => {
        controlsMap[control.territory_id] = control;
      });
      setTerritoryControls(controlsMap);
    } catch (err) {
      console.error("Error loading territory data:", err);
      setError("Failed to load territory data");
    } finally {
      setLoading(false);
    }
  };

  // Create grid layout with territories positioned by map coordinates
  const gridTerritories = useMemo(() => {
    const grid: (Territory | null)[][] = Array(TERRITORY_CONSTANTS.MAP_HEIGHT)
      .fill(null)
      .map(() => Array(TERRITORY_CONSTANTS.MAP_WIDTH).fill(null));

    territories.forEach((territory) => {
      if (
        territory.map_x >= 0 &&
        territory.map_x < TERRITORY_CONSTANTS.MAP_WIDTH &&
        territory.map_y >= 0 &&
        territory.map_y < TERRITORY_CONSTANTS.MAP_HEIGHT
      ) {
        grid[territory.map_y][territory.map_x] = territory;
      }
    });

    return grid;
  }, [territories]);

  // Get selected territory data
  const selectedTerritoryData = selectedTerritory
    ? territories.find((t) => t.id === selectedTerritory)
    : null;
  const selectedTerritoryControl = selectedTerritory
    ? territoryControls[selectedTerritory]
    : null;

  // Get war status for selected territory
  const selectedTerritoryWar = selectedTerritory
    ? activeWars.find((war) => war.territory_id === selectedTerritory)
    : null;

  // Territory type colors for legend
  const territoryTypeColors: Record<TerritoryType, string> = {
    downtown: "#ffd700",
    docks: "#4682b4",
    warehouse: "#8b4513",
    casino: "#dc143c",
    neighborhood: "#32cd32",
    industrial: "#696969",
    smuggling: "#8b0000",
    political: "#4b0082",
  };

  console.log(gridTerritories, "gridTerritories");

  if (loading) {
    return (
      <MapContainer>
        <LoadingContainer>Loading territory map...</LoadingContainer>
      </MapContainer>
    );
  }

  if (error) {
    return (
      <MapContainer>
        <ErrorContainer>
          {error}
          <br />
          <button
            onClick={loadTerritoryData}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#d4af37",
              color: "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </ErrorContainer>
      </MapContainer>
    );
  }

  return (
    <MapContainer>
      <MapHeader>
        <MapTitle>Territory Control Map</MapTitle>
        <MapControls>
          <ControlButton
            active={incomeOverlay}
            onClick={() => setIncomeOverlay(!incomeOverlay)}
          >
            Income View
          </ControlButton>
          <ControlButton
            active={warOverlay}
            onClick={() => setWarOverlay(!warOverlay)}
          >
            War Status
          </ControlButton>
        </MapControls>
      </MapHeader>

      <ContentArea>
        <MapSection>
          <MapGrid>
            {gridTerritories.flat().map((territory, index) => {
              const y = Math.floor(index / TERRITORY_CONSTANTS.MAP_WIDTH);
              const x = index % TERRITORY_CONSTANTS.MAP_WIDTH;

              if (!territory) {
                return (
                  <div
                    key={`empty-${x}-${y}`}
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      borderRadius: "5px",
                    }}
                  />
                );
              }

              const control = territoryControls[territory.id];
              const war = activeWars.find(
                (w) => w.territory_id === territory.id
              );
              const isSelected = selectedTerritory === territory.id;
              const isAdjacent =
                selectedTerritoryData?.adjacent_territories.includes(
                  territory.id
                ) || false;

              return (
                <TerritoryTile
                  key={territory.id}
                  territory={territory}
                  control={control}
                  isSelected={isSelected}
                  isAdjacent={isAdjacent}
                  warStatus={
                    war
                      ? {
                          phase: war.current_phase,
                          attacking_family:
                            war.attacking_family?.name || "Unknown",
                          defending_family:
                            war.defending_family?.name || "Unknown",
                          control_bar_position: war.control_bar_position,
                        }
                      : undefined
                  }
                  showIncomeOverlay={incomeOverlay}
                  showWarOverlay={warOverlay}
                  onClick={() => onTerritorySelect(territory.id)}
                />
              );
            })}
          </MapGrid>

          <MapLegend>
            {Object.entries(territoryTypeColors).map(([type, color]) => (
              <LegendItem key={type} color={color}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
              </LegendItem>
            ))}
          </MapLegend>
        </MapSection>

        <DetailsSection>
          {selectedTerritoryData && (
            <>
              <TerritoryDetails
                territory={selectedTerritoryData}
                control={selectedTerritoryControl || undefined}
                canManage={
                  effectivePlayerFamilyId ===
                  selectedTerritoryControl?.controlling_family_id
                }
                activeWar={selectedTerritoryWar || undefined}
              />

              {selectedTerritoryWar && (
                <WarStatus
                  war={selectedTerritoryWar}
                  playerFamilyId={effectivePlayerFamilyId}
                />
              )}
            </>
          )}
        </DetailsSection>
      </ContentArea>
    </MapContainer>
  );
};

export default TerritoryMap;
