"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "./ProfileEditor";
import { StatAllocation } from "./StatAllocation";
import { LevelProgressCard } from "../level/LevelProgressCard";
import { calculateEffectiveStats } from "@/lib/player-stats";
import { EnhancedRankProgression } from "../progression/EnhancedRankProgression";
import { FamilyStatusCard } from "../family/FamilyStatusCard";
import {
  usePlayerDashboard,
  useAllocateStatPoints,
} from "@/lib/hooks/usePlayer";
import { useRealtimePlayerUpdates } from "@/lib/hooks/useRealtime";
import type { StatPointAllocation } from "@/lib/stat-points";

const DashboardContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth.xl};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: calc(100vh - 70px);
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary.dark} 0%,
    ${({ theme }) => theme.colors.primary.charcoal} 100%
  );
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["4xl"]};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const VitalBar = styled.div<{ $current: number; $max: number; $color: string }>`
  width: 100%;
  height: 24px;
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};

  &::after {
    content: "";
    display: block;
    width: ${({ $current, $max }) => ($current / $max) * 100}%;
    height: 100%;
    background: linear-gradient(
      90deg,
      ${({ $color }) => $color},
      ${({ $color }) => $color}AA
    );
    transition: width ${({ theme }) => theme.transitions.normal};
  }
`;

const VitalInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const VitalLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.neutral.cream};
`;

const VitalValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.gold};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StatItem = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.gold};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const RegenTimer = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.ash};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const RankBadge = styled.div<{ $rank: string }>`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ $rank, theme }) => {
    switch ($rank) {
      case "Don":
        return theme.colors.primary.crimson;
      case "Capo":
        return theme.colors.primary.wine;
      case "Soldier":
        return theme.colors.neutral.ash;
      default:
        return theme.colors.neutral.smoke;
    }
  }};
  color: ${({ theme }) => theme.colors.neutral.cream};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $variant, theme }) =>
    $variant === "secondary"
      ? `
    background: transparent;
    color: ${theme.colors.primary.gold};
    border: 1px solid ${theme.colors.primary.gold};
    
    &:hover {
      background: ${theme.colors.primary.gold}20;
    }
  `
      : `
    background: linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f);
    color: ${theme.colors.primary.dark};
    border: none;
    
    &:hover {
      background: ${theme.colors.neutral.cream};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.lg};
    }
  `}
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing["2xl"]};
  flex-wrap: wrap;
`;

const EditButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral.silver};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ theme }) => theme.colors.primary.dark};
  }
`;

export function PlayerDashboard() {
  const { player, regenerateEnergy, supabase: authSupabase } = useAuth();
  const [nextRegenTime, setNextRegenTime] = useState<number>(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Use cached query hook instead of manual state management
  const {
    data: dashboardData,
    isLoading,
    error,
  } = usePlayerDashboard(player?.id || "", authSupabase);

  // Use mutation hook for stat allocation
  const allocateStatsMutation = useAllocateStatPoints();

  // Enable real-time updates for player data
  useRealtimePlayerUpdates(player?.id || null);

  const handleStatAllocation = useCallback(
    async (allocation: StatPointAllocation): Promise<boolean> => {
      if (!player?.id) return false;

      try {
        await allocateStatsMutation.mutateAsync({
          playerId: player.id,
          allocation,
          authSupabase,
        });
        return true;
      } catch (error) {
        console.error("Error allocating stat points:", error);
        return false;
      }
    },
    [player?.id, authSupabase, allocateStatsMutation]
  );

  // Extract data from cached response
  const stats = dashboardData?.stats || null;
  const statPoints = dashboardData?.statPoints || {
    unspent: 0,
    allocated: { health: 0, energy: 0, attack: 0, defense: 0 },
    totalEarned: 0,
  };
  const economics = dashboardData?.economics || null;

  useEffect(() => {
    if (player?.last_energy_regen) {
      const interval = setInterval(() => {
        const lastRegen = new Date(player.last_energy_regen).getTime();
        const now = Date.now();
        const nextRegen = lastRegen + 60000; // 1 minute
        const timeUntilNext = Math.max(0, nextRegen - now);

        setNextRegenTime(timeUntilNext);

        if (timeUntilNext === 0) {
          regenerateEnergy();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [player?.last_energy_regen, regenerateEnergy]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  if (!player) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Loading Dashboard...</Title>
        </Header>
      </DashboardContainer>
    );
  }

  // Calculate effective stats including stat point bonuses
  const effectiveStats = calculateEffectiveStats(player, statPoints);

  if (isLoading) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Loading Dashboard...</Title>
        </Header>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Error Loading Dashboard</Title>
          <Subtitle>{error.message}</Subtitle>
        </Header>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Family Dashboard</Title>
        <Subtitle>Welcome back, {player?.nickname}</Subtitle>
        <RankBadge $rank={player?.rank || "Associate"}>
          {player?.rank}
        </RankBadge>
      </Header>

      <Grid>
        <LevelProgressCard />
        <StatAllocation
          playerStatPoints={statPoints}
          onAllocate={handleStatAllocation}
          isAllocating={allocateStatsMutation.isPending}
        />
      </Grid>
      <EnhancedRankProgression />

      <Grid>
        {/* Player Vitals */}
        <Card>
          <CardTitle>Vitals</CardTitle>

          <VitalInfo>
            <VitalLabel>Energy</VitalLabel>
            <VitalValue>
              {effectiveStats.currentEnergy}/{effectiveStats.maxEnergy}
            </VitalValue>
          </VitalInfo>
          <VitalBar
            $current={effectiveStats.currentEnergy}
            $max={effectiveStats.maxEnergy}
            $color="#4682b4"
          />

          <VitalInfo>
            <VitalLabel>Health Points</VitalLabel>
            <VitalValue>
              {effectiveStats.currentHealth}/{effectiveStats.maxHealth}
            </VitalValue>
          </VitalInfo>
          <VitalBar
            $current={effectiveStats.currentHealth}
            $max={effectiveStats.maxHealth}
            $color="#dc143c"
          />

          <RegenTimer>
            Next energy: {nextRegenTime > 0 ? formatTime(nextRegenTime) : "Now"}
          </RegenTimer>
        </Card>

        {/* Family Status - New integrated component */}
        <FamilyStatusCard />

        {/* Player Info */}
        <Card style={{ position: "relative" }}>
          <EditButton
            onClick={() => setIsEditingProfile(true)}
            title="Edit Profile"
          >
            ✏️
          </EditButton>
          <CardTitle>Player Status</CardTitle>
          <StatGrid>
            <StatItem>
              <StatValue>{player.reputation_score}</StatValue>
              <StatLabel>Reputation</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{player.energy_regen_rate}/min</StatValue>
              <StatLabel>Energy Regen</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{player.rank}</StatValue>
              <StatLabel>Rank</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>
                {economics?.cash_on_hand?.toLocaleString() ?? "0"}
              </StatValue>
              <StatLabel>Cash</StatLabel>
            </StatItem>
          </StatGrid>
        </Card>

        {/* Game Statistics */}
        <Card>
          <CardTitle>Combat Record</CardTitle>
          {stats ? (
            <StatGrid>
              <StatItem>
                <StatValue>{stats.total_games}</StatValue>
                <StatLabel>Total Games</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.games_won}</StatValue>
                <StatLabel>Victories</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.total_eliminations}</StatValue>
                <StatLabel>Eliminations</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.survival_rate.toFixed(1)}%</StatValue>
                <StatLabel>Survival Rate</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.current_streak}</StatValue>
                <StatLabel>Current Streak</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.longest_survival_streak}</StatValue>
                <StatLabel>Best Streak</StatLabel>
              </StatItem>
            </StatGrid>
          ) : (
            <StatItem>
              <StatValue>No games played</StatValue>
              <StatLabel>Join your first game!</StatLabel>
            </StatItem>
          )}
        </Card>

        {/* Battle Statistics */}
        {stats && (
          <Card>
            <CardTitle>Battle Stats</CardTitle>
            <StatGrid>
              <StatItem>
                <StatValue>{stats.total_damage_dealt}</StatValue>
                <StatLabel>Damage Dealt</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.total_healing_done}</StatValue>
                <StatLabel>Healing Done</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.energy_spent}</StatValue>
                <StatLabel>Energy Spent</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.favorite_role || "None"}</StatValue>
                <StatLabel>Favorite Role</StatLabel>
              </StatItem>
            </StatGrid>
          </Card>
        )}
      </Grid>

      <ButtonContainer>
        <Button onClick={regenerateEnergy}>Regenerate Energy</Button>
        <Button $variant="secondary" onClick={() => setIsEditingProfile(true)}>
          Edit Profile
        </Button>
      </ButtonContainer>

      <ProfileEditor
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
      />
    </DashboardContainer>
  );
}
