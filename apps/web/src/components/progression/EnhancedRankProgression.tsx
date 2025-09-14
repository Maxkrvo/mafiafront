"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { getLevelInfo } from "@/lib/levels";
import {
  getPlayerRankStatus,
  getRanksByCategory,
  getMilestoneRanks,
  getRankStatistics,
  formatRankDisplay,
  getRankCategoryColor,
  getRankCategoryName,
  calculateCategoryProgress,
  isRankUnlockable,
  type EnhancedLevelRank,
  type PlayerRankStatus,
  type RankCategory,
} from "@/lib/enhanced-level-ranks";
import { fetchPlayerEconomics } from "@/lib/jobs-data";

const ProgressionContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth.xl};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary.dark} 0%,
    ${({ theme }) => theme.colors.primary.charcoal} 100%
  );
  min-height: calc(100vh - 70px);
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

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Tab = styled.button<{ $active: boolean; $category: string }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  background: ${({ $active, $category }) =>
    $active ? getRankCategoryColor($category) : "rgba(255, 255, 255, 0.1)"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.neutral.cream : theme.colors.neutral.silver};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:hover {
    background: ${({ $category }) => getRankCategoryColor($category)}AA;
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

const CurrentRankCard = styled.div<{ $category: string }>`
  background: linear-gradient(
    135deg,
    ${({ $category }) => getRankCategoryColor($category)}20,
    ${({ theme }) => theme.colors.primary.charcoal}
  );
  border: 2px solid ${({ $category }) => getRankCategoryColor($category)};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const RankTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
`;

const RankDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DetailItem = styled.div`
  text-align: center;
`;

const DetailValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DetailLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing.md} 0;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const ProgressFill = styled.div<{ $progress: number; $category: string }>`
  width: ${({ $progress }) => $progress}%;
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ $category }) => getRankCategoryColor($category)},
    ${({ $category }) => getRankCategoryColor($category)}AA
  );
  transition: width ${({ theme }) => theme.transitions.normal};
  position: relative;

  &::after {
    content: "${({ $progress }) => Math.round($progress)}%";
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-weight: bold;
    font-size: 12px;
  }
`;

const RankGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const RankCard = styled.div<{
  $category: string;
  $unlocked: boolean;
  $milestone: boolean;
  $current?: boolean;
}>`
  background: ${({ theme, $unlocked }) =>
    $unlocked
      ? theme.colors.primary.charcoal
      : `${theme.colors.primary.dark}80`};
  border: 2px solid
    ${({ $category, $milestone, $current }) =>
      $current
        ? "#FFD700"
        : $milestone
        ? getRankCategoryColor($category)
        : `${getRankCategoryColor($category)}60`};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.6)};
  position: relative;

  ${({ $milestone }) =>
    $milestone &&
    `
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);

    &::before {
      content: '⭐';
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 24px;
      background: #FFD700;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `}

  ${({ $current }) =>
    $current &&
    `
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);

    &::after {
      content: '👑';
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 32px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }
  `}

  &:hover {
    transform: ${({ $unlocked }) => ($unlocked ? "translateY(-5px)" : "none")};
    box-shadow: ${({ theme, $unlocked }) =>
      $unlocked ? theme.shadows.xl : "none"};
  }
`;

const RankCardTitle = styled.h3<{ $category: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ $category }) => getRankCategoryColor($category)};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const RankLevel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const RankReward = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.primary.gold};
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const UnlockRequirement = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.semantic.error};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-style: italic;
`;

const CategoryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled.div<{ $category: string }>`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ $category }) => getRankCategoryColor($category)};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

type TabType =
  | "overview"
  | "street"
  | "family"
  | "elite"
  | "legendary"
  | "milestones";

export function EnhancedRankProgression() {
  const { player } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [playerRankStatus, setPlayerRankStatus] =
    useState<PlayerRankStatus | null>(null);
  const [categoryRanks, setCategoryRanks] = useState<EnhancedLevelRank[]>([]);
  const [milestoneRanks, setMilestoneRanks] = useState<EnhancedLevelRank[]>([]);
  const [rankStats, setRankStats] = useState<RankCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (player) {
      loadData();
    }
  }, [player]);

  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "milestones") {
      loadCategoryRanks(activeTab);
    } else if (activeTab === "milestones") {
      loadMilestoneRanks();
    }
  }, [activeTab]);

  const loadData = async () => {
    if (!player) return;

    try {
      setLoading(true);

      // Get player level info
      const economics = await getPlayerEconomics();
      const levelInfo = getLevelInfo(economics?.experience_points || 0);

      // Load player rank status and statistics in parallel
      const [rankStatus, stats] = await Promise.all([
        getPlayerRankStatus(
          levelInfo.level,
          levelInfo.currentXP,
          player.reputation_score
        ),
        getRankStatistics(),
      ]);

      setPlayerRankStatus(rankStatus);
      setRankStats(stats);
    } catch (error) {
      console.error("Error loading rank data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryRanks = async (
    category: "street" | "family" | "elite" | "legendary"
  ) => {
    const ranks = await getRanksByCategory(category);
    setCategoryRanks(ranks);
  };

  const loadMilestoneRanks = async () => {
    const milestones = await getMilestoneRanks();
    setMilestoneRanks(milestones);
  };

  const getPlayerEconomics = async () => {
    if (!player) return;

    const economicsData = await fetchPlayerEconomics(player?.id);

    return economicsData;
  };

  const isRankCurrent = (rank: EnhancedLevelRank): boolean => {
    return playerRankStatus?.currentRank?.level === rank.level;
  };

  const isRankUnlocked = async (rank: EnhancedLevelRank): Promise<boolean> => {
    if (!player || !playerRankStatus) return false;
    const economicsData = await fetchPlayerEconomics(player.id);

    // Calculate level info from experience points
    const levelData = getLevelInfo(economicsData?.experience_points || 0);
    const unlockStatus = isRankUnlockable(
      rank,
      levelData.level,
      player.reputation_score
    );
    return unlockStatus.unlockable;
  };

  if (loading || !player || !playerRankStatus) {
    return (
      <ProgressionContainer>
        <Header>
          <Title>Loading Rank Progression...</Title>
        </Header>
      </ProgressionContainer>
    );
  }

  console.log(rankStats, "rankStats");

  const { currentRank, nextRank, progressToNext } = playerRankStatus;

  return (
    <ProgressionContainer>
      <Header>
        <Title>Criminal Empire Progression</Title>
      </Header>
      {currentRank && (
        <CurrentRankCard $category={currentRank.category}>
          <RankTitle>
            {formatRankDisplay(currentRank)} -{" "}
            {getRankCategoryName(currentRank.category)}
          </RankTitle>

          <RankDetails>
            <DetailItem>
              <DetailValue>Level {currentRank.level}</DetailValue>
              <DetailLabel>Current Level</DetailLabel>
            </DetailItem>
            <DetailItem>
              <DetailValue>Tier {currentRank.tier}</DetailValue>
              <DetailLabel>Category Tier</DetailLabel>
            </DetailItem>
            <DetailItem>
              <DetailValue>
                ${currentRank.money_reward.toLocaleString()}
              </DetailValue>
              <DetailLabel>Level Reward</DetailLabel>
            </DetailItem>
            <DetailItem>
              <DetailValue>
                {player.reputation_score.toLocaleString()}
              </DetailValue>
              <DetailLabel>Reputation</DetailLabel>
            </DetailItem>
          </RankDetails>

          {nextRank && (
            <>
              <h3
                style={{
                  color: "#FFD700",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                Next: {formatRankDisplay(nextRank)} (Level {nextRank.level})
              </h3>
              <ProgressBar>
                <ProgressFill
                  $progress={progressToNext * 100}
                  $category={currentRank.category}
                />
              </ProgressBar>
              {playerRankStatus.reputationNeeded > 0 && (
                <div
                  style={{
                    color: "#FF6B6B",
                    textAlign: "center",
                    fontSize: "0.9rem",
                  }}
                >
                  Need {playerRankStatus.reputationNeeded.toLocaleString()} more
                  reputation
                </div>
              )}
            </>
          )}
        </CurrentRankCard>
      )}
      <CategoryStats>
        {rankStats
          .sort((a, b) => a.min_level - b.min_level)
          .map((stat) => (
            <StatCard key={stat.category} $category={stat.category}>
              <h3
                style={{
                  color: getRankCategoryColor(stat.category),
                  marginBottom: "1rem",
                }}
              >
                {getRankCategoryName(stat.category)}
              </h3>
              <DetailValue>{stat.total_ranks} Ranks</DetailValue>
              <DetailLabel>
                Levels {stat.min_level} - {stat.max_level}
              </DetailLabel>
              <div style={{ marginTop: "0.5rem" }}>
                <DetailValue>{stat.milestone_count} Milestones</DetailValue>
                <DetailLabel>Major Achievements</DetailLabel>
              </div>
            </StatCard>
          ))}
      </CategoryStats>
      <TabContainer>
        {(
          [
            "overview",
            "street",
            "family",
            "elite",
            "legendary",
            "milestones",
          ] as TabType[]
        ).map((tab) => (
          <Tab
            key={tab}
            $active={activeTab === tab}
            $category={
              tab === "overview" || tab === "milestones" ? "street" : tab
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview"
              ? "Overview"
              : tab === "milestones"
              ? "Milestones"
              : getRankCategoryName(tab)}
          </Tab>
        ))}
      </TabContainer>
      {activeTab === "milestones" && (
        <RankGrid>
          {milestoneRanks.map((rank) => (
            <RankCard
              key={rank.level}
              $category={rank.category}
              $unlocked={isRankUnlocked(rank)}
              $milestone={true}
              $current={isRankCurrent(rank)}
            >
              <RankCardTitle $category={rank.category}>
                {formatRankDisplay(rank)}
              </RankCardTitle>
              <RankLevel>
                Level {rank.level} • {getRankCategoryName(rank.category)}
              </RankLevel>
              <RankReward>
                ${rank.money_reward.toLocaleString()} Reward
              </RankReward>
              {!isRankUnlocked(rank) && (
                <UnlockRequirement>
                  {
                    isRankUnlockable(
                      rank,
                      getLevelInfo(1500).level,
                      player.reputation_score
                    ).reason
                  }
                </UnlockRequirement>
              )}
            </RankCard>
          ))}
        </RankGrid>
      )}
      {activeTab !== "overview" && activeTab !== "milestones" && (
        <RankGrid>
          {categoryRanks.map((rank) => (
            <RankCard
              key={rank.level}
              $category={rank.category}
              $unlocked={isRankUnlocked(rank)}
              $milestone={rank.is_milestone}
              $current={isRankCurrent(rank)}
            >
              <RankCardTitle $category={rank.category}>
                {formatRankDisplay(rank)}
              </RankCardTitle>
              <RankLevel>
                Level {rank.level} • Tier {rank.tier}
              </RankLevel>
              <RankReward>
                ${rank.money_reward.toLocaleString()} Reward
              </RankReward>
              {!isRankUnlocked(rank) && (
                <UnlockRequirement>
                  {
                    isRankUnlockable(
                      rank,
                      getLevelInfo(1500).level,
                      player.reputation_score
                    ).reason
                  }
                </UnlockRequirement>
              )}
            </RankCard>
          ))}
        </RankGrid>
      )}
    </ProgressionContainer>
  );
}
