'use client';

import React from 'react';
import styled from 'styled-components';
import type { Territory, TerritoryControl } from '../../lib/supabase/territory-types';
import { TERRITORY_TYPE_CONFIG } from '../../lib/supabase/territory-types';

interface WarStatus {
  phase: string;
  attacking_family: string;
  defending_family: string;
  control_bar_position: number;
}

interface TerritoryTileProps {
  territory: Territory;
  control?: TerritoryControl;
  isSelected: boolean;
  isAdjacent: boolean;
  warStatus?: WarStatus;
  showIncomeOverlay?: boolean;
  showWarOverlay?: boolean;
  onClick: () => void;
}

const TileContainer = styled.div<{
  territoryColor: string;
  familyColor?: string;
  isSelected: boolean;
  isAdjacent: boolean;
  isUnderAttack: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 80px;
  background: ${props =>
    props.familyColor
      ? `linear-gradient(135deg, ${props.familyColor}88, ${props.territoryColor}66)`
      : props.territoryColor
  };
  border: 2px solid ${props => {
    if (props.isSelected) return '#d4af37';
    if (props.isAdjacent) return '#ffa500';
    if (props.isUnderAttack) return '#ff0000';
    return '#666';
  }};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    border-color: ${props => props.isSelected ? '#f4d03f' : '#888'};
    z-index: 10;
  }

  ${props => props.isSelected && `
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    z-index: 5;
  `}

  ${props => props.isUnderAttack && `
    animation: pulse-red 2s infinite;
  `}

  @keyframes pulse-red {
    0%, 100% {
      box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
    }
    50% {
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
    }
  }
`;

const TileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
`;

const TerritoryIcon = styled.div`
  font-size: 16px;
  line-height: 1;
`;

const TerritoryName = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin: 0 2px;
`;

const ControlIndicator = styled.div<{ controlPercentage: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.controlPercentage >= 80) return '#00ff00';
    if (props.controlPercentage >= 60) return '#ffff00';
    if (props.controlPercentage >= 40) return '#ffa500';
    return '#ff0000';
  }};
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
`;

const TileBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 30px;
`;

const IncomeOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  padding: 2px 4px;
  font-size: 0.6rem;
  color: #00ff00;
  font-weight: 600;
  text-align: center;
`;

const WarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(255, 0, 0, 0.9), transparent);
  padding: 2px 4px;
  font-size: 0.6rem;
  color: #fff;
  font-weight: 600;
  text-align: center;
`;

const FortificationLevel = styled.div<{ level: number }>`
  display: flex;
  gap: 1px;
  margin-top: 2px;
`;

const FortificationDot = styled.div<{ filled: boolean }>`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${props => props.filled ? '#d4af37' : '#666'};
`;

const ResourceIcons = styled.div`
  display: flex;
  gap: 1px;
  margin-top: 2px;
`;

const ResourceIcon = styled.span`
  font-size: 0.6rem;
  opacity: 0.8;
`;

const TerritoryTile: React.FC<TerritoryTileProps> = ({
  territory,
  control,
  isSelected,
  isAdjacent,
  warStatus,
  showIncomeOverlay = false,
  showWarOverlay = false,
  onClick,
}) => {
  const territoryConfig = TERRITORY_TYPE_CONFIG[territory.territory_type];
  const isUnderAttack = !!warStatus;
  const controlPercentage = control?.control_percentage || 0;

  // Calculate estimated hourly income
  const estimatedIncome = Math.round(
    territory.base_income_per_hour *
    (controlPercentage / 100) *
    (control?.income_modifier || 1.0)
  );

  // Resource type icons
  const resourceIconMap = {
    cash: '💰',
    contraband: '📦',
    weapons: '🔫',
    influence: '🎭',
    information: '🕵️',
  };

  return (
    <TileContainer
      territoryColor={territoryConfig.color}
      familyColor={control?.controlling_family?.color_hex}
      isSelected={isSelected}
      isAdjacent={isAdjacent}
      isUnderAttack={isUnderAttack}
      onClick={onClick}
    >
      <TileHeader>
        <TerritoryIcon>{territoryConfig.icon}</TerritoryIcon>
        {control && (
          <ControlIndicator controlPercentage={controlPercentage} />
        )}
      </TileHeader>

      <TileBody>
        <TerritoryName>{territory.display_name}</TerritoryName>

        {control && control.fortification_level > 0 && (
          <FortificationLevel level={control.fortification_level}>
            {Array.from({ length: 5 }, (_, i) => (
              <FortificationDot
                key={i}
                filled={i < control.fortification_level}
              />
            ))}
          </FortificationLevel>
        )}

        {territory.resource_types.length > 0 && (
          <ResourceIcons>
            {territory.resource_types.slice(0, 3).map((resource, i) => (
              <ResourceIcon key={i}>
                {resourceIconMap[resource] || '❓'}
              </ResourceIcon>
            ))}
          </ResourceIcons>
        )}
      </TileBody>

      {showIncomeOverlay && control && (
        <IncomeOverlay>
          ${estimatedIncome}/hr
        </IncomeOverlay>
      )}

      {showWarOverlay && warStatus && (
        <WarOverlay>
          {warStatus.phase.toUpperCase()}
        </WarOverlay>
      )}
    </TileContainer>
  );
};

export default TerritoryTile;