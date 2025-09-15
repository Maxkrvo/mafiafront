"use client";

import React from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { formatXP, getLevelMilestones, getLevelTitle } from "@/lib/levels";
import {
  useLevelProgressCard,
  useAdvancePlayerRank,
  useLevelFormatting,
} from "@/lib/hooks/useLevelProgression";
import { getNextLevelReward } from "@/lib/level-rewards";

const ProgressCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LevelTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
`;

const LevelBadge = styled.div`
  background: linear-gradient(45deg, #4682b4, #6495ed);
  color: white;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
`;

const LevelDescription = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-style: italic;
`;

const XPSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const XPHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const XPText = styled.span`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const XPValues = styled.span`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const XPBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const XPBarFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, #4682b4, #6495ed, #87ceeb);
  transition: width ${({ theme }) => theme.transitions.normal};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const BenefitsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const BenefitsTitle = styled.h4`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`;

const BenefitItem = styled.div`
  background: ${({ theme }) => theme.colors.primary.dark};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  text-align: center;
`;

const BenefitValue = styled.div`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const BenefitLabel = styled.div`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-transform: uppercase;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RankSection = styled.div<{ $canAdvance: boolean }>`
  background: ${({ $canAdvance, theme }) =>
    $canAdvance
      ? theme.colors.semantic.success + "20"
      : theme.colors.neutral.smoke + "20"};
  border: 1px solid
    ${({ $canAdvance, theme }) =>
      $canAdvance ? theme.colors.semantic.success : theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const RankTitle = styled.div`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const RankRequirements = styled.div`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const AdvanceButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.semantic.success},
    #4ade80
  );
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const MilestonesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const MilestonesTitle = styled.h4`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MilestonesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  max-height: 150px;
  overflow-y: auto;
`;

const MilestoneItem = styled.div<{ $achieved: boolean; $current: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $current, $achieved, theme }) => {
    if ($current) return theme.colors.primary.gold + "20";
    if ($achieved) return theme.colors.semantic.success + "15";
    return "transparent";
  }};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  border-left: 3px solid
    ${({ $current, $achieved, theme }) => {
      if ($current) return theme.colors.primary.gold;
      if ($achieved) return theme.colors.semantic.success;
      return "transparent";
    }};
`;

const MilestoneLevel = styled.span<{ $achieved: boolean }>`
  color: ${({ $achieved, theme }) =>
    $achieved ? theme.colors.semantic.success : theme.colors.neutral.ash};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const MilestoneDescription = styled.span<{ $achieved: boolean }>`
  color: ${({ $achieved, theme }) =>
    $achieved ? theme.colors.neutral.cream : theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

interface LevelProgressCardProps {
  className?: string;
  style?: React.CSSProperties;
}

export function LevelProgressCard({
  className,
  style,
}: LevelProgressCardProps) {
  const { player } = useAuth();

  // Use TanStack Query hooks for data fetching and mutations
  const { levelInfo, rankAdvancement, isLoading } = useLevelProgressCard(
    player || { id: "", rank: "", reputation_score: 0 },
    0 // We'll get this from economics data in the hook
  );

  const advanceRankMutation = useAdvancePlayerRank();
  const { formatLevel, formatRank } = useLevelFormatting();

  const handleAdvanceRank = () => {
    if (!rankAdvancement?.canAdvance || !player) return;

    advanceRankMutation.mutate(player.id, {
      onSuccess: (result) => {
        if (result.success) {
          console.log(result.message);
        } else {
          console.error(result.message);
        }
      },
      onError: (error) => {
        console.error("Failed to advance rank:", error);
      },
    });
  };

  if (isLoading || !levelInfo) {
    return (
      <ProgressCard className={className}>
        <LevelTitle>Loading level data...</LevelTitle>
      </ProgressCard>
    );
  }

  // milestones are now available from the hook, but we can still use the direct function
  const milestones = getLevelMilestones();
  const currentXP = levelInfo.currentXP;

  return (
    <ProgressCard className={className} style={style}>
      <ProgressHeader>
        <div>
          <LevelTitle>Character Progression</LevelTitle>
          <LevelDescription>
            &ldquo;{getLevelTitle(levelInfo.level)}&rdquo;
          </LevelDescription>
        </div>
        <LevelBadge>Level {levelInfo.level}</LevelBadge>
      </ProgressHeader>

      <XPSection>
        <XPHeader>
          <XPText>Experience Progress</XPText>
          <XPValues>
            {formatXP(currentXP)} /{" "}
            {formatXP(levelInfo.xpForCurrentLevel + (levelInfo.xpToNext || 0))}
          </XPValues>
        </XPHeader>
        <XPBar>
          <XPBarFill $percentage={levelInfo.progress * 100} />
        </XPBar>
        {levelInfo.xpToNext > 0 && (
          <XPValues style={{ marginTop: "4px", fontSize: "11px" }}>
            {formatXP(levelInfo.xpToNext)} XP needed for next level
          </XPValues>
        )}
      </XPSection>

      <BenefitsSection>
        <BenefitsTitle>Level Benefits</BenefitsTitle>
        <BenefitsGrid>
          <BenefitItem>
            <BenefitValue>+{levelInfo.benefits.attackBonus}</BenefitValue>
            <BenefitLabel>Attack Power</BenefitLabel>
          </BenefitItem>
          <BenefitItem>
            <BenefitValue>+{levelInfo.benefits.defenseBonus}</BenefitValue>
            <BenefitLabel>Defense Power</BenefitLabel>
          </BenefitItem>
          <BenefitItem>
            <BenefitValue>+{levelInfo.benefits.energyBonus}</BenefitValue>
            <BenefitLabel>Max Energy</BenefitLabel>
          </BenefitItem>
          <BenefitItem>
            <BenefitValue>+{levelInfo.benefits.hpBonus}</BenefitValue>
            <BenefitLabel>Max Health</BenefitLabel>
          </BenefitItem>
        </BenefitsGrid>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "linear-gradient(45deg, #228b22, #32cd32)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "white",
              marginBottom: "0.5rem",
            }}
          >
            Next Level Reward
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#FFD700",
            }}
          >
            ${getNextLevelReward(currentXP).toLocaleString()}
          </div>
        </div>
      </BenefitsSection>

      {rankAdvancement && (
        <RankSection $canAdvance={rankAdvancement.canAdvance}>
          <RankTitle>
            {rankAdvancement.canAdvance
              ? `Ready for promotion to ${rankAdvancement.nextRank}!`
              : `Next rank: ${rankAdvancement.nextRank || "Max rank achieved"}`}
          </RankTitle>
          {rankAdvancement.requirements && (
            <RankRequirements>{rankAdvancement.requirements}</RankRequirements>
          )}
          {rankAdvancement.canAdvance && (
            <AdvanceButton onClick={handleAdvanceRank}>
              Advance to {rankAdvancement.nextRank}
            </AdvanceButton>
          )}
        </RankSection>
      )}

      <MilestonesSection>
        <MilestonesTitle>Progression Milestones</MilestonesTitle>
        <MilestonesList>
          {milestones.map((milestone) => {
            const achieved = currentXP >= milestone.xp;
            const current = levelInfo.level === milestone.level;

            return (
              <MilestoneItem
                key={milestone.level}
                $achieved={achieved}
                $current={current}
              >
                <MilestoneLevel $achieved={achieved}>
                  Level {milestone.level}
                </MilestoneLevel>
                <MilestoneDescription $achieved={achieved}>
                  {milestone.description}
                </MilestoneDescription>
                {milestone.reward > 0 && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: achieved ? "#FFD700" : "#888",
                      marginTop: "0.25rem",
                    }}
                  >
                    💰 ${milestone.reward.toLocaleString()}
                  </div>
                )}
              </MilestoneItem>
            );
          })}
        </MilestonesList>
      </MilestonesSection>
    </ProgressCard>
  );
}
