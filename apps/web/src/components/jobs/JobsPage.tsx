"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import {
  JobExecutionResult,
  JOB_CATEGORIES,
  ITEM_RARITIES,
} from "@/lib/supabase/jobs-types";
import { formatXP } from "@/lib/levels";
import {
  isJobAvailable,
  meetsJobRequirements,
} from "@/lib/jobs-data";
import { useJobsPageData, useExecuteJob, useLootDetails } from "@/lib/hooks/useJobs";
import { useGrantLevelRewards } from "@/lib/hooks/useLevelProgression";

const JobsContainer = styled.div`
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
  text-shadow: ${({ theme }) => theme.shadows.glow};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
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
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const HeatBar = styled.div<{ $heat: number }>`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};

  &::after {
    content: "";
    display: block;
    width: ${({ $heat }) => $heat}%;
    height: 100%;
    background: ${({ $heat }) => {
      if ($heat < 25) return "#228b22"; // Green
      if ($heat < 50) return "#ff8c00"; // Orange
      if ($heat < 75) return "#ff4500"; // Red-Orange
      return "#dc143c"; // Crimson
    }};
    transition: width 0.3s ease;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;
`;

const CategoryTab = styled.button<{ $active: boolean; $color: string }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, $color }) => ($active ? $color : "transparent")};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.dark : theme.colors.neutral.silver};
  border: 1px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background: ${({ $active, $color }) => ($active ? $color : $color + "20")};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.primary.dark : theme.colors.neutral.cream};
  }
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const JobCard = styled.div<{ $available: boolean }>`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid
    ${({ $available, theme }) =>
      $available ? theme.colors.neutral.smoke : theme.colors.neutral.ash};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  opacity: ${({ $available }) => ($available ? 1 : 0.6)};
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    border-color: ${({ $available, theme }) =>
      $available ? theme.colors.primary.gold : theme.colors.neutral.ash};
    transform: ${({ $available }) =>
      $available ? "translateY(-2px)" : "none"};
    box-shadow: ${({ $available, theme }) =>
      $available ? theme.shadows.lg : "none"};
  }
`;

const JobIcon = styled.div`
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const JobTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const JobDescription = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const JobFlavorText = styled.p`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-style: italic;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-left: 2px solid ${({ theme }) => theme.colors.primary.gold};
  padding-left: ${({ theme }) => theme.spacing.md};
`;

const JobStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const JobStat = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
`;

const JobStatValue = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const JobStatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.ash};
  text-transform: uppercase;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RequirementsBadge = styled.div<{ $met: boolean }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $met, theme }) =>
    $met ? theme.colors.semantic.success : theme.colors.semantic.error};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ExecuteButton = styled.button<{ $available: boolean }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ $available, theme }) =>
    $available
      ? `linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f)`
      : theme.colors.neutral.ash};
  color: ${({ theme }) => theme.colors.primary.dark};
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: ${({ $available }) => ($available ? "pointer" : "not-allowed")};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ $available, theme }) =>
      $available ? theme.colors.neutral.cream : theme.colors.neutral.ash};
    transform: ${({ $available }) =>
      $available ? "translateY(-1px)" : "none"};
    box-shadow: ${({ $available, theme }) =>
      $available ? theme.shadows.md : "none"};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing["4xl"]};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const ResultModal = styled.div<{ $show: boolean; $success: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 2px solid
    ${({ $success, theme }) =>
      $success ? theme.colors.semantic.success : theme.colors.semantic.error};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing["2xl"]};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  z-index: 1000;
  min-width: 300px;
  text-align: center;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  visibility: ${({ $show }) => ($show ? "visible" : "hidden")};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const ResultIcon = styled.div<{ $success: boolean }>`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ $success, theme }) =>
    $success ? theme.colors.semantic.success : theme.colors.semantic.error};
`;

const ResultMessage = styled.p`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ResultDetails = styled.div`
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LootSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const LootTitle = styled.h4`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const LootGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const LootItem = styled.div<{ $rarity: string }>`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid
    ${({ $rarity }) =>
      ITEM_RARITIES[$rarity as keyof typeof ITEM_RARITIES]?.borderColor ||
      "#666666"};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const LootItemIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const LootItemName = styled.div<{ $rarity: string }>`
  color: ${({ $rarity }) =>
    ITEM_RARITIES[$rarity as keyof typeof ITEM_RARITIES]?.color || "#ffffff"};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const LootItemQuantity = styled.div`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

export function JobsPage() {
  const { player, executeRpc } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("street");
  const [executingJob, setExecutingJob] = useState<string | null>(null);
  const [result, setResult] = useState<JobExecutionResult | null>(null);
  const [recentLoot, setRecentLoot] = useState<
    { item_template_id: string; quantity: number }[]
  >([]);

  // Use TanStack Query hooks for data fetching
  const { data: jobsPageData, isLoading: loading } = useJobsPageData(player?.id || "");
  const executeJobMutation = useExecuteJob();
  const grantLevelRewardsMutation = useGrantLevelRewards();

  // Fetch detailed loot information when we have recent loot
  const { data: lootDetails = [] } = useLootDetails(recentLoot);

  // Extract data from the query result
  const jobs = jobsPageData?.jobs || [];
  const economics = jobsPageData?.economics;
  const levelInfo = jobsPageData?.levelInfo;

  const executeJob = async (jobId: string) => {
    if (!player || executingJob || executeJobMutation.isPending) return;

    setExecutingJob(jobId);

    try {
      const result = await executeJobMutation.mutateAsync({
        jobTemplateId: jobId,
        playerId: player.id,
        executeRpc,
      });

      if (!result) {
        setResult({
          success: false,
          error: "Failed to execute job. Please try again.",
        });
        return;
      }

      setResult(result);

      // Check for level-up and grant rewards if XP was gained
      if (
        result.success &&
        result.experience_gained &&
        result.experience_gained > 0 &&
        economics
      ) {
        try {
          const oldXP = economics.experience_points || 0;
          const newXP = oldXP + result.experience_gained;

          const levelUpResult = await grantLevelRewardsMutation.mutateAsync({
            playerId: player.id,
            newXP,
            oldXP,
          });

          if (levelUpResult.leveledUp) {
            // Add level-up info to the result to show in UI
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    levelUp: {
                      newLevel: levelUpResult.newLevel!,
                      oldLevel: levelUpResult.oldLevel!,
                      moneyEarned: levelUpResult.moneyEarned!,
                      statPointsEarned: levelUpResult.statPointsEarned!,
                    },
                  }
                : prev
            );
          }
        } catch (error) {
          console.error("Error processing level rewards:", error);
        }
      }

      // Set recent loot to trigger detailed loot fetch
      if (result.loot_gained && result.loot_gained.length > 0) {
        setRecentLoot(result.loot_gained);
      } else {
        setRecentLoot([]);
      }

      // TanStack Query will automatically refresh data through mutation's onSuccess
    } catch (error) {
      console.log(error, "error");

      console.error("Error executing job:", error);
      setResult({
        success: false,
        error: "Failed to execute job. Please try again.",
      });
    } finally {
      setExecutingJob(null);

      // Auto-hide result after 5 seconds
      setTimeout(() => {
        setResult(null);
        setRecentLoot([]); // Clear loot details when result is hidden
      }, 5000);
    }
  };


  const filteredJobs = jobs.filter((job) => job.category === selectedCategory);

  if (loading) {
    return (
      <JobsContainer>
        <LoadingState>Loading criminal operations...</LoadingState>
      </JobsContainer>
    );
  }

  return (
    <JobsContainer>
      <Header>
        <Title>Criminal Operations</Title>
        <Subtitle>Choose your next move carefully</Subtitle>
      </Header>

      {economics && (
        <StatsBar>
          <StatCard>
            <StatValue>${economics.cash_on_hand.toLocaleString()}</StatValue>
            <StatLabel>Cash on Hand</StatLabel>
          </StatCard>

          <StatCard>
            <StatValue>
              {levelInfo ? `Level ${levelInfo.level}` : "Level 1"}
            </StatValue>
            <StatLabel>
              {levelInfo && levelInfo.xpToNext > 0
                ? `${formatXP(levelInfo.xpToNext)} XP to next`
                : "Max Level"}
            </StatLabel>
          </StatCard>

          <StatCard>
            <StatValue>{economics.attack_power}</StatValue>
            <StatLabel>Attack Power</StatLabel>
          </StatCard>

          <StatCard>
            <StatValue>{economics.defense_power}</StatValue>
            <StatLabel>Defense Power</StatLabel>
          </StatCard>

          <StatCard>
            <StatValue>{economics.heat_level}/100</StatValue>
            <StatLabel>Heat Level</StatLabel>
            <HeatBar $heat={economics.heat_level} />
          </StatCard>
        </StatsBar>
      )}

      <CategoryTabs>
        {Object.entries(JOB_CATEGORIES).map(([key, category]) => (
          <CategoryTab
            key={key}
            $active={selectedCategory === key}
            $color={category.color}
            onClick={() => setSelectedCategory(key)}
          >
            <span>{category.icon}</span>
            {category.name}
          </CategoryTab>
        ))}
      </CategoryTabs>

      <JobsGrid>
        {filteredJobs.map((job) => {
          const available = player && economics ? isJobAvailable(job, player, economics) : false;
          const meetsReqs = player && economics ? meetsJobRequirements(job, player, economics) : false;

          return (
            <JobCard key={job.id} $available={available}>
              <RequirementsBadge $met={meetsReqs}>
                {meetsReqs ? "Available" : "Locked"}
              </RequirementsBadge>

              <JobIcon>{job.icon_name}</JobIcon>
              <JobTitle>{job.name}</JobTitle>
              <JobDescription>{job.description}</JobDescription>

              {job.flavor_text && (
                <JobFlavorText>&ldquo;{job.flavor_text}&rdquo;</JobFlavorText>
              )}

              <JobStats>
                <JobStat>
                  <JobStatValue>
                    ${job.base_payout_min}-${job.base_payout_max}
                  </JobStatValue>
                  <JobStatLabel>Payout</JobStatLabel>
                </JobStat>

                <JobStat>
                  <JobStatValue>{job.energy_cost}</JobStatValue>
                  <JobStatLabel>Energy Cost</JobStatLabel>
                </JobStat>

                <JobStat>
                  <JobStatValue>{job.success_rate_base}%</JobStatValue>
                  <JobStatLabel>Base Success</JobStatLabel>
                </JobStat>

                <JobStat>
                  <JobStatValue>Risk {job.risk_level}</JobStatValue>
                  <JobStatLabel>Heat Gain</JobStatLabel>
                </JobStat>
              </JobStats>

              <ExecuteButton
                $available={available}
                disabled={!available || executingJob === job.id}
                onClick={() => executeJob(job.id)}
              >
                {executingJob === job.id ? "Executing..." : "Execute Job"}
              </ExecuteButton>
            </JobCard>
          );
        })}
      </JobsGrid>

      {result && (
        <ResultModal
          $show={!!result}
          $success={!!(result.success && result.job_success)}
        >
          <ResultIcon $success={!!(result.success && result.job_success)}>
            {result.success && result.job_success ? "✅" : "❌"}
          </ResultIcon>

          <ResultMessage>{result.message || result.error}</ResultMessage>

          {result.success && result.job_success && (
            <ResultDetails>
              <p>Payout: ${result.payout}</p>
              <p>Experience: +{result.experience_gained}</p>
              <p>Reputation: +{result.reputation_gained}</p>
              <p>Heat: +{result.heat_gained}</p>

              {result.levelUp && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "linear-gradient(45deg, #FFD700, #FFA500)",
                    borderRadius: "8px",
                    color: "#000",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  🎉 LEVEL UP! 🎉
                  <p style={{ margin: "0.5rem 0" }}>
                    Level {result.levelUp.oldLevel} → {result.levelUp.newLevel}
                  </p>
                  <p style={{ margin: "0.5rem 0", fontSize: "1.2em" }}>
                    Money Bonus: ${result.levelUp.moneyEarned.toLocaleString()}
                  </p>
                  <p
                    style={{
                      margin: "0.5rem 0",
                      fontSize: "1.2em",
                      color: "#4682b4",
                    }}
                  >
                    🌟 +{result.levelUp.statPointsEarned} Stat Points Earned!
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.9em",
                      fontStyle: "italic",
                    }}
                  >
                    Visit your dashboard to allocate stat points
                  </p>
                </div>
              )}

              {lootDetails.length > 0 && (
                <LootSection>
                  <LootTitle>Loot Acquired</LootTitle>
                  <LootGrid>
                    {lootDetails.map((lootItem, index) => (
                      <LootItem key={index} $rarity={lootItem.rarity}>
                        <LootItemIcon>{lootItem.icon_name}</LootItemIcon>
                        <LootItemName $rarity={lootItem.rarity}>
                          {lootItem.name}
                        </LootItemName>
                        {lootItem.quantity > 1 && (
                          <LootItemQuantity>
                            x{lootItem.quantity}
                          </LootItemQuantity>
                        )}
                      </LootItem>
                    ))}
                  </LootGrid>
                </LootSection>
              )}
            </ResultDetails>
          )}
        </ResultModal>
      )}
    </JobsContainer>
  );
}
