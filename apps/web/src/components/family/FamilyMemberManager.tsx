"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFamilyMembers,
  getFamilyJoinRequests,
  approveFamilyJoinRequest,
  kickFamilyMember,
  updateFamilyMemberRank,
  getPlayerFamilyMembership,
} from "@/lib/family-data";
import { FAMILY_RANK_HIERARCHY } from "@/lib/supabase/family-types";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary.gold : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.dark : theme.colors.neutral.silver};
  border: none;
  border-bottom: 2px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary.gold : "transparent"};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
  }
`;

const MemberGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MemberCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 1;
`;

const MemberDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const MemberName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.neutral.cream};
`;

const MemberMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const RankBadge = styled.div<{ $rank: FamilyRank }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $rank }) => {
    switch ($rank) {
      case "boss":
        return theme.colors.semantic.error;
      case "underboss":
        return theme.colors.semantic.warning;
      case "caporegime":
        return theme.colors.primary.gold;
      case "soldier":
        return theme.colors.semantic.info;
      default:
        return theme.colors.neutral.smoke;
    }
  }}20;
  border: 1px solid
    ${({ theme, $rank }) => {
      switch ($rank) {
        case "boss":
          return theme.colors.semantic.error;
        case "underboss":
          return theme.colors.semantic.warning;
        case "caporegime":
          return theme.colors.primary.gold;
        case "soldier":
          return theme.colors.semantic.info;
        default:
          return theme.colors.neutral.smoke;
      }
    }};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: capitalize;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: nowrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
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

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  color: ${({ theme }) => theme.colors.neutral.cream};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.error}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.success};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.success}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.success};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

type TabType = "members" | "requests";

interface FamilyMemberManagerProps {
  familyId?: string;
}

export function FamilyMemberManager({ familyId }: FamilyMemberManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<FamilyMember[]>([]);
  const [userMembership, setUserMembership] = useState<FamilyMember | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, familyId]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's membership to determine permissions
      const membership = await getPlayerFamilyMembership(user.id);
      if (!membership) {
        setError("You are not a member of any family");
        return;
      }

      setUserMembership(membership);
      const targetFamilyId = familyId || membership.family_id;

      // Load members and join requests in parallel
      const [membersData, requestsData] = await Promise.all([
        getFamilyMembers(targetFamilyId, { active_only: true }),
        membership.permissions.can_approve_requests
          ? getFamilyJoinRequests(targetFamilyId)
          : Promise.resolve([]),
      ]);

      setMembers(membersData);
      setJoinRequests(requestsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load member data"
      );
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  const handleApproveRequest = async (playerId: string, playerName: string) => {
    if (!user || !userMembership) return;

    setActionLoading(`approve-${playerId}`);
    try {
      const result = await approveFamilyJoinRequest(
        user.id,
        userMembership.family_id,
        playerId
      );

      if (result.valid) {
        showMessage(`${playerName} has been approved and joined the family`);
        loadData(); // Refresh data
      } else {
        showMessage(result.error || "Failed to approve request", true);
      }
    } catch (error) {
      showMessage("Error approving request", true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickMember = async (playerId: string, playerName: string) => {
    if (
      !user ||
      !confirm(`Are you sure you want to kick ${playerName} from the family?`)
    )
      return;

    setActionLoading(`kick-${playerId}`);
    try {
      const result = await kickFamilyMember(user.id, {
        target_player_id: playerId,
        action: "kick",
        reason: "Kicked by family leadership",
      });

      if (result.valid) {
        showMessage(`${playerName} has been kicked from the family`);
        loadData(); // Refresh data
      } else {
        showMessage(result.error || "Failed to kick member", true);
      }
    } catch (error) {
      showMessage("Error kicking member", true);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteDemote = async (
    playerId: string,
    playerName: string,
    newRank: FamilyRank
  ) => {
    if (!user) return;

    setActionLoading(`rank-${playerId}`);
    try {
      const result = await updateFamilyMemberRank(user.id, {
        target_player_id: playerId,
        action: "promote",
        new_rank: newRank,
        reason: `Rank changed to ${newRank}`,
      });

      if (result.valid) {
        const action =
          FAMILY_RANK_HIERARCHY[newRank].level >
          FAMILY_RANK_HIERARCHY[
            members.find((m) => m.player_id === playerId)?.family_rank ||
              "associate"
          ].level
            ? "promoted"
            : "demoted";
        showMessage(`${playerName} has been ${action} to ${newRank}`);
        loadData(); // Refresh data
      } else {
        showMessage(result.error || "Failed to change rank", true);
      }
    } catch (error) {
      showMessage("Error changing rank", true);
    } finally {
      setActionLoading(null);
    }
  };

  const canManageMember = (memberRank: FamilyRank): boolean => {
    if (!userMembership) return false;

    const userLevel = FAMILY_RANK_HIERARCHY[userMembership.family_rank].level;
    const memberLevel = FAMILY_RANK_HIERARCHY[memberRank].level;

    return userLevel > memberLevel;
  };

  const getAvailableRanks = (currentRank: FamilyRank): FamilyRank[] => {
    if (!userMembership) return [];

    const userLevel = FAMILY_RANK_HIERARCHY[userMembership.family_rank].level;
    const ranks: FamilyRank[] = [
      "associate",
      "soldier",
      "caporegime",
      "underboss",
      "boss",
    ];

    return ranks.filter((rank) => {
      const rankLevel = FAMILY_RANK_HIERARCHY[rank].level;
      return rankLevel < userLevel && rank !== currentRank;
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading member data...</LoadingSpinner>
      </Container>
    );
  }

  if (!userMembership) {
    return (
      <Container>
        <ErrorMessage>
          You must be a member of a family to manage members
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Family Member Management</Title>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <TabContainer>
        <Tab
          $active={activeTab === "members"}
          onClick={() => setActiveTab("members")}
        >
          Members ({members.length})
        </Tab>
        {userMembership.permissions.can_approve_requests && (
          <Tab
            $active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
          >
            Join Requests ({joinRequests.length})
          </Tab>
        )}
      </TabContainer>

      <MemberGrid>
        {activeTab === "members" ? (
          members.length > 0 ? (
            members.map((member) => (
              <MemberCard key={member.id}>
                <MemberInfo>
                  <MemberDetails>
                    <MemberName>
                      {member.player?.nickname || "Unknown Player"}
                    </MemberName>
                    <MemberMeta>
                      Joined {formatDate(member.joined_at)} • Loyalty:{" "}
                      {member.loyalty_score}% • Contribution: $
                      {member.contribution_total.toLocaleString()}
                    </MemberMeta>
                  </MemberDetails>
                </MemberInfo>

                <RankBadge $rank={member.family_rank}>
                  {member.family_rank}
                  {member.title && ` • ${member.title}`}
                </RankBadge>

                {canManageMember(member.family_rank) && (
                  <ActionButtons>
                    {getAvailableRanks(member.family_rank).length > 0 && (
                      <Select
                        onChange={(e) => {
                          if (e.target.value) {
                            handlePromoteDemote(
                              member.player_id,
                              member.player?.nickname || "Player",
                              e.target.value as FamilyRank
                            );
                            e.target.value = ""; // Reset select
                          }
                        }}
                        disabled={actionLoading === `rank-${member.player_id}`}
                      >
                        <option value="">Change Rank</option>
                        {getAvailableRanks(member.family_rank).map((rank) => (
                          <option key={rank} value={rank}>
                            {rank.charAt(0).toUpperCase() + rank.slice(1)}
                          </option>
                        ))}
                      </Select>
                    )}

                    {userMembership.permissions.can_kick_members && (
                      <ActionButton
                        $variant="danger"
                        onClick={() =>
                          handleKickMember(
                            member.player_id,
                            member.player?.nickname || "Player"
                          )
                        }
                        disabled={actionLoading === `kick-${member.player_id}`}
                      >
                        {actionLoading === `kick-${member.player_id}`
                          ? "Kicking..."
                          : "Kick"}
                      </ActionButton>
                    )}
                  </ActionButtons>
                )}
              </MemberCard>
            ))
          ) : (
            <EmptyState>No family members found</EmptyState>
          )
        ) : joinRequests.length > 0 ? (
          joinRequests.map((request) => (
            <MemberCard key={request.id}>
              <MemberInfo>
                <MemberDetails>
                  <MemberName>
                    {request.player?.nickname || "Unknown Player"}
                  </MemberName>
                  <MemberMeta>
                    Requested{" "}
                    {request.join_requested_at &&
                      formatDate(request.join_requested_at)}
                  </MemberMeta>
                </MemberDetails>
              </MemberInfo>

              <ActionButtons>
                <ActionButton
                  onClick={() =>
                    handleApproveRequest(
                      request.player_id,
                      request.player?.nickname || "Player"
                    )
                  }
                  disabled={actionLoading === `approve-${request.player_id}`}
                >
                  {actionLoading === `approve-${request.player_id}`
                    ? "Approving..."
                    : "Approve"}
                </ActionButton>
              </ActionButtons>
            </MemberCard>
          ))
        ) : (
          <EmptyState>No pending join requests</EmptyState>
        )}
      </MemberGrid>
    </Container>
  );
}
