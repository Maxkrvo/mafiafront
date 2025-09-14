'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import {
  StatPointAllocation,
  PlayerStatPoints,
  calculateStatBonuses,
  validateAllocation,
  getStatPointSummary,
  STAT_ALLOCATION_PRESETS
} from '@/lib/stat-points';

const StatContainer = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
`;

const UnspentPoints = styled.div`
  background: linear-gradient(45deg, #4682b4, #6495ed);
  color: white;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StatName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.neutral.cream};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AllocateControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AllocateButton = styled.button<{ $variant?: 'subtract' | 'add' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${({ $variant, theme }) =>
    $variant === 'subtract'
      ? theme.colors.semantic.error
      : theme.colors.semantic.success
  };
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const AllocateInput = styled.input`
  width: 60px;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  background: ${({ theme }) => theme.colors.primary.charcoal};
  color: ${({ theme }) => theme.colors.neutral.cream};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  border: none;

  ${({ $variant, theme }) =>
    $variant === 'primary'
      ? `
    background: linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f);
    color: ${theme.colors.primary.dark};

    &:hover:not(:disabled) {
      background: ${theme.colors.neutral.cream};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.lg};
    }
  `
      : `
    background: transparent;
    color: ${theme.colors.primary.gold};
    border: 1px solid ${theme.colors.primary.gold};

    &:hover:not(:disabled) {
      background: ${theme.colors.primary.gold}20;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PresetButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const PresetButton = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.gold};
    color: ${({ theme }) => theme.colors.primary.gold};
  }
`;

interface StatAllocationProps {
  playerStatPoints: PlayerStatPoints;
  onAllocate: (allocation: StatPointAllocation) => Promise<boolean>;
  isAllocating: boolean;
}

export function StatAllocation({ playerStatPoints, onAllocate, isAllocating }: StatAllocationProps) {
  const [pendingAllocation, setPendingAllocation] = useState<StatPointAllocation>({
    health: 0,
    energy: 0,
    attack: 0,
    defense: 0
  });

  const [validationError, setValidationError] = useState<string>('');

  const currentBonuses = calculateStatBonuses(playerStatPoints.allocated);
  const pendingBonuses = calculateStatBonuses(pendingAllocation);
  const totalPendingPoints = Object.values(pendingAllocation).reduce((sum, val) => sum + val, 0);

  useEffect(() => {
    const validation = validateAllocation(
      playerStatPoints.allocated,
      playerStatPoints.unspent,
      pendingAllocation
    );
    setValidationError(validation.valid ? '' : validation.error || '');
  }, [pendingAllocation, playerStatPoints]);

  const updatePendingAllocation = (stat: keyof StatPointAllocation, delta: number) => {
    setPendingAllocation(prev => ({
      ...prev,
      [stat]: Math.max(0, prev[stat] + delta)
    }));
  };

  const setPendingValue = (stat: keyof StatPointAllocation, value: number) => {
    setPendingAllocation(prev => ({
      ...prev,
      [stat]: Math.max(0, value)
    }));
  };

  const handleAllocate = async () => {
    if (totalPendingPoints === 0 || validationError) return;

    const success = await onAllocate(pendingAllocation);
    if (success) {
      setPendingAllocation({ health: 0, energy: 0, attack: 0, defense: 0 });
    }
  };

  const resetPending = () => {
    setPendingAllocation({ health: 0, energy: 0, attack: 0, defense: 0 });
  };

  const applyPreset = (presetKey: keyof typeof STAT_ALLOCATION_PRESETS) => {
    const preset = STAT_ALLOCATION_PRESETS[presetKey];
    const allocation = preset.allocation(playerStatPoints.unspent);
    setPendingAllocation(allocation);
  };

  const statCards = [
    {
      key: 'health' as const,
      name: 'Health Points',
      current: playerStatPoints.allocated.health,
      currentBonus: currentBonuses.healthBonus,
      pendingBonus: pendingBonuses.healthBonus,
      description: '+10 Max Health per point'
    },
    {
      key: 'energy' as const,
      name: 'Energy Points',
      current: playerStatPoints.allocated.energy,
      currentBonus: currentBonuses.energyBonus,
      pendingBonus: pendingBonuses.energyBonus,
      description: '+10 Max Energy per point'
    },
    {
      key: 'attack' as const,
      name: 'Attack Points',
      current: playerStatPoints.allocated.attack,
      currentBonus: currentBonuses.attackBonus,
      pendingBonus: pendingBonuses.attackBonus,
      description: '+10 Attack Power per point'
    },
    {
      key: 'defense' as const,
      name: 'Defense Points',
      current: playerStatPoints.allocated.defense,
      currentBonus: currentBonuses.defenseBonus,
      pendingBonus: pendingBonuses.defenseBonus,
      description: '+10 Defense Power per point'
    }
  ];

  return (
    <StatContainer>
      <StatHeader>
        <StatTitle>Stat Point Allocation</StatTitle>
        <UnspentPoints>
          {playerStatPoints.unspent - totalPendingPoints} Available Points
        </UnspentPoints>
      </StatHeader>

      {playerStatPoints.unspent > 0 && (
        <PresetButtons>
          <span style={{ color: '#888', marginRight: '1rem', fontSize: '0.9rem' }}>Quick builds:</span>
          {Object.entries(STAT_ALLOCATION_PRESETS).map(([key, preset]) => (
            <PresetButton
              key={key}
              onClick={() => applyPreset(key as keyof typeof STAT_ALLOCATION_PRESETS)}
              title={preset.description}
            >
              {preset.name}
            </PresetButton>
          ))}
        </PresetButtons>
      )}

      <StatGrid>
        {statCards.map(stat => (
          <StatCard key={stat.key}>
            <StatName>{stat.name}</StatName>
            <StatValue>
              Allocated: {stat.current} points (+{stat.currentBonus} bonus)
              {pendingAllocation[stat.key] > 0 && (
                <div style={{ color: '#32cd32', marginTop: '0.25rem' }}>
                  Pending: +{pendingAllocation[stat.key]} points (+{stat.pendingBonus} bonus)
                </div>
              )}
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.7 }}>
                {stat.description}
              </div>
            </StatValue>

            {playerStatPoints.unspent > 0 && (
              <AllocateControls>
                <AllocateButton
                  $variant="subtract"
                  onClick={() => updatePendingAllocation(stat.key, -1)}
                  disabled={pendingAllocation[stat.key] <= 0}
                >
                  −
                </AllocateButton>

                <AllocateInput
                  type="number"
                  min="0"
                  max={playerStatPoints.unspent}
                  value={pendingAllocation[stat.key]}
                  onChange={(e) => setPendingValue(stat.key, parseInt(e.target.value) || 0)}
                />

                <AllocateButton
                  $variant="add"
                  onClick={() => updatePendingAllocation(stat.key, 1)}
                  disabled={totalPendingPoints >= playerStatPoints.unspent}
                >
                  +
                </AllocateButton>
              </AllocateControls>
            )}
          </StatCard>
        ))}
      </StatGrid>

      {validationError && (
        <div style={{
          color: '#dc143c',
          textAlign: 'center',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: 'rgba(220, 20, 60, 0.1)',
          borderRadius: '4px'
        }}>
          {validationError}
        </div>
      )}

      {playerStatPoints.unspent > 0 && (
        <ActionButtons>
          <ActionButton
            $variant="secondary"
            onClick={resetPending}
            disabled={totalPendingPoints === 0 || isAllocating}
          >
            Reset
          </ActionButton>
          <ActionButton
            $variant="primary"
            onClick={handleAllocate}
            disabled={totalPendingPoints === 0 || validationError !== '' || isAllocating}
          >
            {isAllocating ? 'Allocating...' : `Allocate ${totalPendingPoints} Points`}
          </ActionButton>
        </ActionButtons>
      )}

      {playerStatPoints.unspent === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#888',
          fontStyle: 'italic',
          padding: '1rem'
        }}>
          No stat points available. Level up to earn more!
        </div>
      )}
    </StatContainer>
  );
}