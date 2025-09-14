"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerFamilyMembership, getFamilyById } from "@/lib/family-data";
import { FamilyCreationModal } from "./FamilyCreationModal";
import { useRouter } from "next/navigation";
import { Family, FamilyMember } from "@/lib/supabase/family-types";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  position: relative;
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const FamilyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const FamilyColor = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  background: ${({ $color }) => $color};
  border: 2px solid ${({ theme }) => theme.colors.neutral.smoke};
`;

const FamilyName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.cream};
  text-align: center;
`;

const PlayerRank = styled.div<{ $rank: string }>`
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
  text-align: center;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const StatItem = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.md};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.gold};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const NoFamilyContent = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.neutral.silver};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ActionButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.md};
  width: 100%;

  ${({ $variant, theme }) =>
    $variant === "secondary"
      ? `
    background: transparent;
    color: ${theme.colors.primary.gold};
    border: 1px solid ${theme.colors.primary.gold};

    &:hover:not(:disabled) {
      background: ${theme.colors.primary.gold}20;
    }
  `
      : `
    background: linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f);
    color: ${theme.colors.primary.dark};
    border: none;

    &:hover:not(:disabled) {
      background: ${theme.colors.neutral.cream};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.md};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export function FamilyStatusCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [membership, setMembership] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadFamilyStatus();
    }
  }, [user]);

  const loadFamilyStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const membershipData = await getPlayerFamilyMembership(user.id);

      if (membershipData) {
        setMembership(membershipData);

        // Get full family details
        const familyData = await getFamilyById(membershipData.family_id);
        setFamily(familyData);
      }
    } catch (error) {
      console.error("Error loading family status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyCreated = (familyId: string) => {
    // Reload family status after successful creation
    loadFamilyStatus();
  };

  if (loading) {
    return (
      <Card>
        <CardTitle>Family Status</CardTitle>
        <LoadingSpinner>Loading...</LoadingSpinner>
      </Card>
    );
  }

  if (!membership || !family) {
    return (
      <>
        <Card>
          <CardTitle>Family Status</CardTitle>
          <NoFamilyContent>
            <StatItem>
              <StatValue>Independent</StatValue>
              <StatLabel>Status</StatLabel>
            </StatItem>
            <p
              style={{ margin: "16px 0", fontSize: "14px", lineHeight: "1.4" }}
            >
              Join a crime family to access territory control, coordinated
              operations, and shared resources.
            </p>
            <ActionButton onClick={() => setShowCreateModal(true)}>
              Establish Family
            </ActionButton>
            <ActionButton
              $variant="secondary"
              onClick={() => router.push("/families")}
              style={{ marginTop: "8px" }}
            >
              Browse Families
            </ActionButton>
          </NoFamilyContent>
        </Card>

        <FamilyCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFamilyCreated}
        />
      </>
    );
  }

  return (
    <Card>
      <CardTitle>Family Status</CardTitle>
      <FamilyInfo>
        <FamilyColor $color={family.color_hex} />
        <FamilyName>{family.display_name}</FamilyName>
        <PlayerRank $rank={membership.family_rank}>
          {membership.family_rank}
          {membership.title && ` • ${membership.title}`}
        </PlayerRank>
      </FamilyInfo>

      <Stats>
        <StatItem>
          <StatValue>{membership.loyalty_score}</StatValue>
          <StatLabel>Loyalty</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>
            {membership.contribution_total.toLocaleString()}
          </StatValue>
          <StatLabel>Contributed</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{family.reputation_score}</StatValue>
          <StatLabel>Reputation</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{family.total_territories}</StatValue>
          <StatLabel>Territories</StatLabel>
        </StatItem>
      </Stats>
    </Card>
  );
}
