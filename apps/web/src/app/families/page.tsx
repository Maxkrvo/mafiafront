"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FamilyBrowser,
  FamilyDashboard,
  FamilyCreationModal,
  useFamilyPermissions,
} from "@/components/family";

const Container = styled.div`
  min-height: calc(100vh - 70px);
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary.dark} 0%,
    ${({ theme }) => theme.colors.primary.charcoal} 100%
  );
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["3xl"]};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin: ${({ theme }) => theme.spacing.sm} 0 0 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary.gold : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.dark : theme.colors.neutral.silver};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary.gold : theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
    border-color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primary.gold : theme.colors.primary.gold + "20"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.sm}
      ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const CreateFamilyButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.primary.gold},
    #f4d03f
  );
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

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.sm}
      ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

type ActiveTab = "browse" | "dashboard";

export default function FamiliesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { membership, loading: membershipLoading } = useFamilyPermissions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("browse");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Set initial tab based on family membership
  useEffect(() => {
    if (!membershipLoading) {
      if (membership) {
        setActiveTab("dashboard");
      } else {
        setActiveTab("browse");
      }
    }
  }, [membership, membershipLoading]);

  const handleFamilyCreated = (familyId: string) => {
    // Switch to dashboard after family creation
    setActiveTab("dashboard");
  };

  if (authLoading || membershipLoading) {
    return (
      <Container>
        <LoadingContainer>Loading families...</LoadingContainer>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <div>
            <Title>Crime Families</Title>
            <Subtitle>
              {membership
                ? `Managing your family operations and territory`
                : "Join a family or establish your own criminal empire"}
            </Subtitle>
          </div>

          <TabContainer>
            <Tab
              $active={activeTab === "browse"}
              onClick={() => setActiveTab("browse")}
            >
              Browse Families
            </Tab>

            {membership ? (
              <Tab
                $active={activeTab === "dashboard"}
                onClick={() => setActiveTab("dashboard")}
              >
                My Family
              </Tab>
            ) : (
              <CreateFamilyButton onClick={() => setShowCreateModal(true)}>
                Establish Family
              </CreateFamilyButton>
            )}
          </TabContainer>
        </HeaderContent>
      </Header>

      {activeTab === "browse" ? (
        <FamilyBrowser />
      ) : activeTab === "dashboard" && membership ? (
        <FamilyDashboard onCreateFamily={() => setShowCreateModal(true)} />
      ) : (
        <Container>
          <LoadingContainer>Loading...</LoadingContainer>
        </Container>
      )}

      <FamilyCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFamilyCreated}
      />
    </Container>
  );
}
