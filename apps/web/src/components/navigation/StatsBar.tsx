"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { formatXP, getLevelTitle } from "@/lib/levels";
import { OnlineUsersModal } from "../presence/OnlineUsersModal";
import { getLevelInfo } from "@/lib/levels";
import { usePlayerEconomics } from "@/lib/hooks/usePlayer";
import { useRealtimePlayerUpdates } from "@/lib/hooks/useRealtime";

const StatsBarContainer = styled.div`
  background: ${({ theme }) => theme.colors.primary.dark};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.primary.dark}40;
  position: sticky;
  top: 70px;
  z-index: 90;
  height: 75px;
`;

const StatsContent = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth.xl};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  overflow-x: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: flex-start;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlayerName = styled.div`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
`;

const PlayerLevel = styled.div`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const FamilyName = styled.div`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-style: italic;
`;

const XPSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 120px;
`;

const XPBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const XPBarFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, #4682b4, #6495ed);
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const XPText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const LevelBadge = styled.div`
  background: linear-gradient(45deg, #4682b4, #6495ed);
  color: white;
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
  min-width: 30px;
`;

const XPValue = styled.span`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const VitalStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const VitalDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const VitalLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.ash};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  min-width: 18px;
`;

const VitalBarContainer = styled.div`
  width: 60px;
  height: 4px;
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const VitalBarFill = styled.div<{ $percentage: number; $color: string }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: ${({ $color }) => $color};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const VitalValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  min-width: 35px;
  text-align: center;
`;

const CriminalStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StatValue = styled.span`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
`;

const StatLabel = styled.span`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const HeatIndicator = styled.div<{ $heat: number }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ $heat }) => {
    if ($heat < 25) return "#228b22"; // Green
    if ($heat < 50) return "#ff8c00"; // Orange
    if ($heat < 75) return "#ff4500"; // Red-Orange
    return "#dc143c"; // Crimson
  }};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.neutral.smoke};
  opacity: 0.5;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export function StatsBar() {
  const { user, player } = useAuth();
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);

  // Use TanStack Query hook for cached data fetching
  const { data: economics } = usePlayerEconomics(player?.id || "");
  useRealtimePlayerUpdates(player?.id || null);

  // Calculate level info from experience points
  const levelInfo = economics?.experience_points !== undefined
    ? getLevelInfo(economics.experience_points)
    : getLevelInfo(0);

  // Don't show if user is not logged in
  if (!user || !player) {
    return null;
  }

  const energyPercentage = (player.energy / player.max_energy) * 100;
  const hpPercentage = (player.hp / player.max_hp) * 100;

  return (
    <StatsBarContainer>
      <StatsContent>
        <StatGroup>
          <PlayerInfo>
            <div>
              <PlayerName>{player.nickname}</PlayerName>
              <PlayerLevel>
                {levelInfo && ` ${getLevelTitle(levelInfo.level)}`}
              </PlayerLevel>
            </div>
            {levelInfo && <LevelBadge>Lv.{levelInfo.level}</LevelBadge>}
          </PlayerInfo>

          <Separator />

          {levelInfo && (
            <XPSection>
              <XPText>
                <span>XP</span>
                <XPValue>{formatXP(levelInfo.xpToNext)} to next</XPValue>
              </XPText>
              <XPBar>
                <XPBarFill $percentage={levelInfo.progress * 100} />
              </XPBar>
            </XPSection>
          )}

          <Separator />

          <FamilyName>{player.famiglia_name}</FamilyName>
        </StatGroup>

        <StatGroup>
          <VitalStats>
            <VitalDisplay>
              <VitalLabel>HP</VitalLabel>
              <VitalBarContainer>
                <VitalBarFill $percentage={hpPercentage} $color="#dc143c" />
              </VitalBarContainer>
              <VitalValue>
                {player.hp}/{player.max_hp}
              </VitalValue>
            </VitalDisplay>

            <VitalDisplay>
              <VitalLabel>EN</VitalLabel>
              <VitalBarContainer>
                <VitalBarFill $percentage={energyPercentage} $color="#4682b4" />
              </VitalBarContainer>
              <VitalValue>
                {player.energy}/{player.max_energy}
              </VitalValue>
            </VitalDisplay>
          </VitalStats>
        </StatGroup>

        {economics && (
          <StatGroup>
            <Separator />

            <CriminalStats>
              <StatItem>
                <StatValue>
                  ${(economics.cash_on_hand / 1000).toFixed(0)}k
                </StatValue>
                <StatLabel>Cash</StatLabel>
              </StatItem>

              <StatItem>
                <HeatIndicator $heat={economics.heat_level}>
                  🔥 {economics.heat_level}
                </HeatIndicator>
                <StatLabel>Heat</StatLabel>
              </StatItem>
            </CriminalStats>
          </StatGroup>
        )}
      </StatsContent>
      <OnlineUsersModal
        isOpen={isOnlineUsersModalOpen}
        onClose={() => setIsOnlineUsersModalOpen(false)}
      />
    </StatsBarContainer>
  );
}
