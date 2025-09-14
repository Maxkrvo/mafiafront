'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyPermissions } from '../../components/family';
import TerritoryMap from '../../components/territory/TerritoryMap';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a0a 100%);
  padding: 20px;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #2c1810 0%, #3d2317 100%);
  border-radius: 15px;
  border: 3px solid #d4af37;
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
`;

const PageTitle = styled.h1`
  color: #d4af37;
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const PageSubtitle = styled.p`
  color: #e0e0e0;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  font-weight: 400;
  line-height: 1.4;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(184, 148, 31, 0.1));
  border: 2px solid #8b7355;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
  }
`;

const StatValue = styled.div`
  color: #d4af37;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MapSection = styled.div`
  margin-top: 40px;
`;

const AuthPrompt = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #e0e0e0;
`;

const AuthPromptTitle = styled.h2`
  color: #d4af37;
  font-size: 2rem;
  margin-bottom: 20px;
`;

const AuthPromptText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const TerritoryPage: React.FC = () => {
  const { user } = useAuth();
  const { membership, loading: familyLoading, isInFamily } = useFamilyPermissions();
  const [selectedTerritory, setSelectedTerritory] = useState<string | undefined>();

  // Get player's family ID for territory management
  const playerFamilyId = membership?.family_id;

  if (!user) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>🗺️ TERRITORY CONTROL</PageTitle>
          <PageSubtitle>
            Control territories across the city to expand your family's influence and generate income
          </PageSubtitle>
        </PageHeader>

        <AuthPrompt>
          <AuthPromptTitle>Authentication Required</AuthPromptTitle>
          <AuthPromptText>
            You must be logged in to view and interact with the territory system.
            <br />
            Join a family to participate in territorial warfare and claim your piece of the city.
          </AuthPromptText>
        </AuthPrompt>
      </PageContainer>
    );
  }

  if (familyLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>🗺️ TERRITORY CONTROL</PageTitle>
          <PageSubtitle>
            Loading family information...
          </PageSubtitle>
        </PageHeader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>🗺️ TERRITORY CONTROL</PageTitle>
        <PageSubtitle>
          Control territories across the city to expand your family&apos;s influence and generate income.
          Engage in multi-phase warfare to claim new districts and defend your existing holdings.
        </PageSubtitle>

        <StatsGrid>
          <StatCard>
            <StatValue>64</StatValue>
            <StatLabel>Total Territories</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>8×8</StatValue>
            <StatLabel>Map Grid</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>4</StatValue>
            <StatLabel>War Phases</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{isInFamily() ? membership?.family_rank.toUpperCase() : 'NONE'}</StatValue>
            <StatLabel>Family Status</StatLabel>
          </StatCard>
        </StatsGrid>
      </PageHeader>

      <MapSection>
        <TerritoryMap
          selectedTerritory={selectedTerritory}
          onTerritorySelect={setSelectedTerritory}
          showIncomeOverlay={false}
          showWarOverlay={true}
          playerFamilyId={playerFamilyId}
        />
      </MapSection>
    </PageContainer>
  );
};

export default TerritoryPage;