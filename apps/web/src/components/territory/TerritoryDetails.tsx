'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { PermissionGuard, useFamilyPermissions } from '../family';
import type {
  Territory,
  TerritoryControl,
  TerritoryWar,
} from '../../lib/supabase/territory-types';
import {
  TERRITORY_TYPE_CONFIG,
  RESOURCE_TYPE_CONFIG,
} from '../../lib/supabase/territory-types';

interface TerritoryDetailsProps {
  territory: Territory;
  control?: TerritoryControl;
  canManage: boolean;
  activeWar?: TerritoryWar;
}

const DetailsContainer = styled.div`
  background: linear-gradient(135deg, #2c1810 0%, #3d2317 100%);
  border-radius: 12px;
  border: 2px solid #8b7355;
  padding: 20px;
  margin-bottom: 20px;
`;

const TerritoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #8b7355;
`;

const TerritoryIcon = styled.div`
  font-size: 2.5rem;
  line-height: 1;
`;

const TerritoryInfo = styled.div`
  flex: 1;
`;

const TerritoryName = styled.h3`
  color: #d4af37;
  margin: 0 0 5px 0;
  font-size: 1.4rem;
  font-weight: 600;
`;

const TerritoryType = styled.div`
  color: #b8941f;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 5px;
`;

const TerritoryDescription = styled.div`
  color: #e0e0e0;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ControlStatus = styled.div<{ controlPercentage: number }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: ${props => {
    if (props.controlPercentage >= 80) return 'rgba(0, 255, 0, 0.1)';
    if (props.controlPercentage >= 60) return 'rgba(255, 255, 0, 0.1)';
    if (props.controlPercentage >= 40) return 'rgba(255, 165, 0, 0.1)';
    return 'rgba(255, 0, 0, 0.1)';
  }};
  border-radius: 8px;
  border: 1px solid ${props => {
    if (props.controlPercentage >= 80) return '#00ff0066';
    if (props.controlPercentage >= 60) return '#ffff0066';
    if (props.controlPercentage >= 40) return '#ffa50066';
    return '#ff000066';
  }};
  margin-bottom: 15px;
`;

const ControlBar = styled.div`
  flex: 1;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
`;

const ControlFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  transition: width 0.3s ease;
`;

const ControlText = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 600;
`;

const DetailSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #555;
`;

const InfoLabel = styled.div`
  color: #b8941f;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 3px;
`;

const InfoValue = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 600;
`;

const ResourceList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ResourceTag = styled.div<{ resourceColor: string }>`
  display: flex;
  align-items: center;
  gap: 5px;
  background: ${props => `${props.resourceColor}20`};
  color: ${props => props.resourceColor};
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid ${props => `${props.resourceColor}66`};
  font-size: 0.8rem;
  font-weight: 500;
`;

const FamilyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #555;
`;

const FamilyColorIndicator = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.color};
  border: 2px solid #333;
`;

const FamilyName = styled.div`
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  flex: 1;
  padding: 10px 16px;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#8b0000';
      case 'primary': return '#d4af37';
      default: return '#4a4a4a';
    }
  }};
  color: ${props => props.variant === 'primary' ? '#000' : '#fff'};
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return '#a50000';
        case 'primary': return '#b8941f';
        default: return '#5a5a5a';
      }
    }};
  }

  &:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
  }
`;

const WarAlert = styled.div`
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.2), rgba(139, 0, 0, 0.2));
  border: 2px solid #ff0000;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 15px;
  text-align: center;
`;

const WarAlertText = styled.div`
  color: #ff6666;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
`;

const WarPhase = styled.div`
  color: #fff;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const TerritoryDetails: React.FC<TerritoryDetailsProps> = ({
  territory,
  control,
  canManage,
  activeWar,
}) => {
  const { membership } = useFamilyPermissions();
  const [isManaging, setIsManaging] = useState(false);

  const territoryConfig = TERRITORY_TYPE_CONFIG[territory.territory_type];
  const controlPercentage = control?.control_percentage || 0;

  const getControlColor = (percentage: number) => {
    if (percentage >= 80) return '#00ff00';
    if (percentage >= 60) return '#ffff00';
    if (percentage >= 40) return '#ffa500';
    return '#ff0000';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateHourlyIncome = () => {
    if (!control) return 0;
    return Math.round(
      territory.base_income_per_hour *
      (controlPercentage / 100) *
      (control.income_modifier || 1.0)
    );
  };

  const calculateMaintenanceCost = () => {
    return territory.maintenance_cost_per_hour;
  };

  const calculateNetIncome = () => {
    return calculateHourlyIncome() - calculateMaintenanceCost();
  };

  return (
    <DetailsContainer>
      <TerritoryHeader>
        <TerritoryIcon>{territoryConfig.icon}</TerritoryIcon>
        <TerritoryInfo>
          <TerritoryName>{territory.display_name}</TerritoryName>
          <TerritoryType>{territoryConfig.name}</TerritoryType>
          {territory.description && (
            <TerritoryDescription>{territory.description}</TerritoryDescription>
          )}
        </TerritoryInfo>
      </TerritoryHeader>

      {activeWar && (
        <WarAlert>
          <WarAlertText>⚔️ Territory Under Attack!</WarAlertText>
          <WarPhase>Current Phase: {activeWar.current_phase}</WarPhase>
        </WarAlert>
      )}

      {control && (
        <>
          <ControlStatus controlPercentage={controlPercentage}>
            <ControlBar>
              <ControlFill
                percentage={controlPercentage}
                color={getControlColor(controlPercentage)}
              />
            </ControlBar>
            <ControlText>{controlPercentage}%</ControlText>
          </ControlStatus>

          <DetailSection>
            <SectionTitle>👑 Controlling Family</SectionTitle>
            <FamilyInfo>
              <FamilyColorIndicator color={control.controlling_family?.color_hex || '#666'} />
              <FamilyName>
                {control.controlling_family?.display_name || 'Unknown Family'}
              </FamilyName>
            </FamilyInfo>
          </DetailSection>
        </>
      )}

      <DetailSection>
        <SectionTitle>💰 Economics</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Hourly Income</InfoLabel>
            <InfoValue>${calculateHourlyIncome().toLocaleString()}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Maintenance</InfoLabel>
            <InfoValue>-${calculateMaintenanceCost().toLocaleString()}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Net Income</InfoLabel>
            <InfoValue style={{ color: calculateNetIncome() >= 0 ? '#00ff00' : '#ff0000' }}>
              ${calculateNetIncome().toLocaleString()}/hr
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Control Difficulty</InfoLabel>
            <InfoValue>{territory.control_difficulty}/10</InfoValue>
          </InfoItem>
        </InfoGrid>
      </DetailSection>

      {control && (
        <DetailSection>
          <SectionTitle>🛡️ Defense Status</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Defense Points</InfoLabel>
              <InfoValue>{control.defense_points.toLocaleString()}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Guard Count</InfoLabel>
              <InfoValue>{control.guard_count}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Fortification Level</InfoLabel>
              <InfoValue>{control.fortification_level}/5</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Controlled Since</InfoLabel>
              <InfoValue>{formatDate(control.controlled_since)}</InfoValue>
            </InfoItem>
          </InfoGrid>
        </DetailSection>
      )}

      {territory.resource_types.length > 0 && (
        <DetailSection>
          <SectionTitle>📦 Resources</SectionTitle>
          <ResourceList>
            {territory.resource_types.map((resource, index) => (
              <ResourceTag key={index} resourceColor={RESOURCE_TYPE_CONFIG[resource].color}>
                <span>{RESOURCE_TYPE_CONFIG[resource].icon}</span>
                <span>{RESOURCE_TYPE_CONFIG[resource].name}</span>
              </ResourceTag>
            ))}
          </ResourceList>
        </DetailSection>
      )}

      <DetailSection>
        <SectionTitle>📍 Location</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Map Position</InfoLabel>
            <InfoValue>({territory.map_x}, {territory.map_y})</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Strategic Value</InfoLabel>
            <InfoValue>{territory.is_strategic ? 'High' : 'Standard'}</InfoValue>
          </InfoItem>
        </InfoGrid>
      </DetailSection>

      <PermissionGuard permission="can_manage_territories" fallback={null}>
        {canManage && control && !activeWar && (
          <ActionButtons>
            <ActionButton
              variant="primary"
              onClick={() => setIsManaging(true)}
              disabled={isManaging}
            >
              Manage Territory
            </ActionButton>
            <ActionButton
              onClick={() => {
                // TODO: Implement fortification upgrade
                console.log('Upgrade fortifications');
              }}
              disabled={control.fortification_level >= 5}
            >
              Upgrade Defense
            </ActionButton>
          </ActionButtons>
        )}
      </PermissionGuard>

      <PermissionGuard permission="can_declare_wars" fallback={null}>
        {!control && (
          <ActionButtons>
            <ActionButton
              variant="danger"
              onClick={() => {
                // TODO: Implement war declaration
                console.log('Declare war on territory');
              }}
              disabled={!!activeWar}
            >
              {activeWar ? 'War in Progress' : 'Declare War'}
            </ActionButton>
          </ActionButtons>
        )}
      </PermissionGuard>
    </DetailsContainer>
  );
};

export default TerritoryDetails;