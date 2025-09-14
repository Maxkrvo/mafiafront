'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFamilyDashboardData,
  approveFamilyJoinRequest,
  type FamilyDashboardData,
  type FamilyRank
} from '@/lib/family-data';
import { FamilyMemberManager } from './FamilyMemberManager';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FamilyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FamilyColor = styled.div<{ $color: string }>`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  background: ${({ $color }) => $color};
  border: 2px solid ${({ theme }) => theme.colors.neutral.smoke};
  flex-shrink: 0;
`;

const FamilyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FamilyName = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
`;

const FamilyMotto = styled.p`
  font-style: italic;
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PlayerRank = styled.div<{ $rank: FamilyRank }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $rank }) => {
    switch ($rank) {
      case 'boss': return theme.colors.semantic.error;
      case 'underboss': return theme.colors.semantic.warning;
      case 'caporegime': return theme.colors.primary.gold;
      case 'soldier': return theme.colors.semantic.info;
      default: return theme.colors.neutral.smoke;
    }
  }}20;
  border: 1px solid ${({ theme, $rank }) => {
    switch ($rank) {
      case 'boss': return theme.colors.semantic.error;
      case 'underboss': return theme.colors.semantic.warning;
      case 'caporegime': return theme.colors.primary.gold;
      case 'soldier': return theme.colors.semantic.info;
      default: return theme.colors.neutral.smoke;
    }
  }};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: capitalize;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.cream};
  margin: 0;
`;

const StatSubtitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MemberName = styled.div`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.primary.dark};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.neutral.smoke};
    border-radius: 3px;

    &:hover {
      background: ${({ theme }) => theme.colors.neutral.silver};
    }
  }
`;

const ActivityItem = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const ActivityTitle = styled.div`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ActivityMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.silver};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.semantic.error}20;
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
`;

const NoFamilyMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.neutral.silver};

  h2 {
    color: ${({ theme }) => theme.colors.primary.gold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    line-height: 1.6;
  }
`;

const CreateFamilyButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(45deg, ${({ theme }) => theme.colors.primary.gold}, #f4d03f);
  color: ${({ theme }) => theme.colors.primary.dark};
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.cream};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const RankDistribution = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RankRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
`;

const RankName = styled.span`
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-transform: capitalize;
`;

const RankCount = styled.span`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ActionButton = styled.button<{
  $variant?: "primary" | "secondary" | "danger";
}>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-transform: capitalize;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "danger":
        return `
          background: ${theme.colors.semantic.error}20;
          color: ${theme.colors.semantic.error};
          border: 1px solid ${theme.colors.semantic.error};

          &:hover:not(:disabled) {
            background: ${theme.colors.semantic.error};
            color: ${theme.colors.neutral.cream};
          }
        `;
      case "secondary":
        return `
          background: transparent;
          color: ${theme.colors.primary.gold};
          border: 1px solid ${theme.colors.primary.gold};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary.gold}20;
          }
        `;
      default:
        return `
          background: ${theme.colors.primary.gold}20;
          color: ${theme.colors.primary.gold};
          border: 1px solid ${theme.colors.primary.gold};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary.gold};
            color: ${theme.colors.primary.dark};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ManagementSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ManagementButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  cursor: pointer;
  z-index: 1001;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

interface FamilyDashboardProps {
  onCreateFamily?: () => void;
}

export function FamilyDashboard({ onCreateFamily }: FamilyDashboardProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<FamilyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getFamilyDashboardData(user.id);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const handleApproveRequest = async (playerId: string, playerName: string) => {
    if (!user || !dashboardData) return;

    setActionLoading(`approve-${playerId}`);
    try {
      const result = await approveFamilyJoinRequest(
        user.id,
        dashboardData.family.id,
        playerId
      );

      if (result.valid) {
        // Refresh dashboard data to show updated join requests
        await loadDashboardData();
      } else {
        setError(result.error || 'Failed to approve request');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError('Error approving request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading family dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorMessage>Error: {error}</ErrorMessage>
      </DashboardContainer>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardContainer>
        <NoFamilyMessage>
          <h2>No Family Affiliation</h2>
          <p>
            You are not currently a member of any crime family. Establish your own family
            or seek membership in an existing organization to access territories, engage in
            warfare, and build your criminal empire.
          </p>
          <CreateFamilyButton onClick={onCreateFamily}>
            Establish Your Family
          </CreateFamilyButton>
        </NoFamilyMessage>
      </DashboardContainer>
    );
  }

  const { family, member, stats, recent_activities, economics } = dashboardData;

  return (
    <DashboardContainer>
      <DashboardHeader>
        <FamilyInfo>
          <FamilyColor $color={family.color_hex} />
          <FamilyDetails>
            <FamilyName>{family.display_name}</FamilyName>
            {family.motto && <FamilyMotto>"{family.motto}"</FamilyMotto>}
          </FamilyDetails>
        </FamilyInfo>
        <PlayerRank $rank={member.family_rank}>
          {member.family_rank}
          {member.title && ` • ${member.title}`}
        </PlayerRank>
      </DashboardHeader>

      {(member.permissions.can_approve_requests ||
        member.permissions.can_kick_members ||
        member.permissions.can_promote_demote) && (
        <ManagementSection>
          <div>
            <h3 style={{ color: '#D4AF37', margin: 0, fontSize: '18px' }}>
              Family Management
            </h3>
          </div>
          <ManagementButtons>
            <ActionButton
              onClick={() => setShowMemberManager(true)}
            >
              Manage Members
            </ActionButton>
          </ManagementButtons>
        </ManagementSection>
      )}

      <StatsGrid>
        <StatCard>
          <StatTitle>Family Treasury</StatTitle>
          <StatValue>{formatCurrency(economics.treasury_balance)}</StatValue>
          <StatSubtitle>
            Daily Income: {formatCurrency(economics.daily_income)} |
            Daily Expenses: {formatCurrency(economics.daily_expenses)}
          </StatSubtitle>
        </StatCard>

        <StatCard>
          <StatTitle>Territory Control</StatTitle>
          <StatValue>{stats.total_territories}</StatValue>
          <StatSubtitle>
            Rank #{stats.territory_rank} | Income: {formatCurrency(stats.total_income)}/day
          </StatSubtitle>
        </StatCard>

        <StatCard>
          <StatTitle>Family Reputation</StatTitle>
          <StatValue>{family.reputation_score}</StatValue>
          <StatSubtitle>
            Rank #{stats.reputation_rank} | Heat Level: {family.heat_level}
          </StatSubtitle>
        </StatCard>

        <StatCard>
          <StatTitle>Family Members</StatTitle>
          <StatValue>{stats.total_members}</StatValue>
          <StatSubtitle>
            Loyalty: {stats.average_loyalty}% | Max: {family.max_members}
          </StatSubtitle>
          <RankDistribution>
            {Object.entries(stats.members_by_rank).map(([rank, count]) => (
              count > 0 && (
                <RankRow key={rank}>
                  <RankName>{rank}</RankName>
                  <RankCount>{count}</RankCount>
                </RankRow>
              )
            ))}
          </RankDistribution>
        </StatCard>

        <StatCard>
          <StatTitle>Recent Activity</StatTitle>
          <ActivityList>
            {recent_activities.length > 0 ? (
              recent_activities.map((activity) => (
                <ActivityItem key={activity.id}>
                  <ActivityTitle>{activity.activity_title}</ActivityTitle>
                  {activity.activity_description && (
                    <div style={{ fontSize: '14px', color: '#a8a8a8', marginBottom: '8px' }}>
                      {activity.activity_description}
                    </div>
                  )}
                  <ActivityMeta>
                    <span>
                      {activity.player?.nickname || 'System'}
                    </span>
                    <span>{formatDate(activity.created_at)}</span>
                  </ActivityMeta>
                </ActivityItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No recent activity
              </div>
            )}
          </ActivityList>
        </StatCard>

        {member.permissions.can_approve_requests && dashboardData.join_requests.length > 0 && (
          <StatCard>
            <StatTitle>Join Requests</StatTitle>
            <MembersList>
              {dashboardData.join_requests.map((request) => (
                <MemberItem key={request.id}>
                  <MemberInfo>
                    <MemberName>
                      {request.player?.nickname || 'Unknown Player'}
                    </MemberName>
                    <div style={{ fontSize: '12px', color: '#a8a8a8' }}>
                      {request.join_requested_at && formatDate(request.join_requested_at)}
                    </div>
                  </MemberInfo>
                  <ActionButton
                    onClick={() =>
                      handleApproveRequest(
                        request.player_id,
                        request.player?.nickname || 'Player'
                      )
                    }
                    disabled={actionLoading === `approve-${request.player_id}`}
                  >
                    {actionLoading === `approve-${request.player_id}`
                      ? 'Approving...'
                      : 'Approve'}
                  </ActionButton>
                </MemberItem>
              ))}
            </MembersList>
          </StatCard>
        )}
      </StatsGrid>

      {/* Member Management Modal */}
      {showMemberManager && (
        <ModalOverlay onClick={() => setShowMemberManager(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowMemberManager(false)}>
              ×
            </CloseButton>
            <FamilyMemberManager />
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
}