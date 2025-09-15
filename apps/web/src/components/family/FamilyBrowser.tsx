"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import {
  useFamilySearch,
  useFamilyMembership,
  useRequestJoinFamily,
} from "@/lib/hooks/useFamily";
import { FamilySearchParams } from "@/lib/supabase/family-types";

const Container = styled.div`
  max-width: 1000px;
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

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const SearchControls = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.ash};
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  color: ${({ theme }) => theme.colors.neutral.cream};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
  }

  option {
    background: ${({ theme }) => theme.colors.primary.dark};
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

const FilterToggle = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  align-self: center;
`;

const Checkbox = styled.input`
  accent-color: ${({ theme }) => theme.colors.primary.gold};
`;

const SearchButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary.gold};
  color: ${({ theme }) => theme.colors.primary.dark};
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.neutral.cream};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FamilyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FamilyCard = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.gold};
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const FamilyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FamilyColor = styled.div<{ $color: string }>`
  width: 50px;
  height: 50px;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  background: ${({ $color }) => $color};
  border: 2px solid ${({ theme }) => theme.colors.neutral.smoke};
  flex-shrink: 0;
`;

const FamilyInfo = styled.div`
  flex: 1;
`;

const FamilyName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

const FamilyMotto = styled.p`
  font-style: italic;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0;
`;

const FamilyDescription = styled.p`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FamilyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
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
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-transform: uppercase;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RecruitingBadge = styled.div<{ $recruiting: boolean }>`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $recruiting, theme }) =>
    $recruiting ? theme.colors.semantic.success : theme.colors.neutral.smoke}20;
  color: ${({ $recruiting, theme }) =>
    $recruiting ? theme.colors.semantic.success : theme.colors.neutral.silver};
  border: 1px solid
    ${({ $recruiting, theme }) =>
      $recruiting ? theme.colors.semantic.success : theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const JoinButton = styled.button<{ $variant?: "primary" | "disabled" }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ $variant, theme }) =>
    $variant === "disabled"
      ? theme.colors.neutral.smoke
      : theme.colors.primary.gold};
  color: ${({ $variant, theme }) =>
    $variant === "disabled"
      ? theme.colors.neutral.silver
      : theme.colors.primary.dark};
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: ${({ $variant }) =>
    $variant === "disabled" ? "not-allowed" : "pointer"};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.neutral.cream};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing["2xl"]};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing["2xl"]};
  color: ${({ theme }) => theme.colors.neutral.silver};
  grid-column: 1 / -1;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const PaginationButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary.gold};
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary.gold}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.error}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.success};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.success}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.success};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export function FamilyBrowser() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState<FamilySearchParams>({
    search: "",
    is_recruiting: undefined,
    sort_by: "reputation_score",
    sort_order: "desc",
    limit: 12,
    offset: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use TanStack Query hooks for data fetching and mutations
  const { data: familyListResponse, isLoading: loading } =
    useFamilySearch(searchParams);
  const { data: userMembership } = useFamilyMembership(user?.id || "");
  const requestJoinMutation = useRequestJoinFamily();

  // Extract data from the query result
  const families = familyListResponse?.families || [];
  const totalCount = familyListResponse?.totalCount || 0;
  const hasMore = families.length < totalCount;

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, offset: 0 }));
    // TanStack Query will automatically refetch when searchParams changes
  };

  const handleJoinRequest = (familyId: string, familyName: string) => {
    if (!user || userMembership) return;

    requestJoinMutation.mutate(
      {
        playerId: user.id,
        request: { family_id: familyId },
      },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setSuccess(`Join request sent to ${familyName}`);
            setError(null);
          } else {
            setError(result.error || "Failed to send join request");
            setSuccess(null);
          }
        },
        onError: () => {
          setError("Error sending join request");
          setSuccess(null);
        },
      }
    );
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newOffset =
      direction === "next"
        ? searchParams.offset + searchParams.limit
        : Math.max(0, searchParams.offset - searchParams.limit);

    setSearchParams((prev) => ({ ...prev, offset: newOffset }));
    // TanStack Query will automatically refetch when searchParams changes
  };

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  useEffect(() => {
    if (error || success) {
      clearMessages();
    }
  }, [error, success]);

  return (
    <Container>
      <Header>
        <Title>Browse Crime Families</Title>
        <Subtitle>
          Discover active crime families and request to join their ranks
        </Subtitle>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <SearchControls>
        <SearchInput
          type="text"
          placeholder="Search family names..."
          value={searchParams.search || ""}
          onChange={(e) =>
            setSearchParams((prev) => ({ ...prev, search: e.target.value }))
          }
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />

        <Select
          value={searchParams.sort_by || "reputation_score"}
          onChange={(e) =>
            setSearchParams((prev) => ({
              ...prev,
              sort_by: e.target.value as any,
            }))
          }
        >
          <option value="reputation_score">Reputation</option>
          <option value="total_territories">Territories</option>
          <option value="created_at">Newest</option>
          <option value="name">Name</option>
        </Select>

        <FilterToggle>
          <Checkbox
            type="checkbox"
            checked={searchParams.is_recruiting === true}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                is_recruiting: e.target.checked ? true : undefined,
              }))
            }
          />
          Recruiting Only
        </FilterToggle>

        <SearchButton onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </SearchButton>
      </SearchControls>

      {loading ? (
        <LoadingSpinner>Loading families...</LoadingSpinner>
      ) : (
        <>
          <FamilyGrid>
            {families.length > 0 ? (
              families.map((family) => (
                <FamilyCard key={family.id}>
                  <RecruitingBadge $recruiting={family.is_recruiting}>
                    {family.is_recruiting ? "Recruiting" : "Closed"}
                  </RecruitingBadge>

                  <FamilyHeader>
                    <FamilyColor $color={family.color_hex} />
                    <FamilyInfo>
                      <FamilyName>{family.display_name}</FamilyName>
                      {family.motto && (
                        <FamilyMotto>"{family.motto}"</FamilyMotto>
                      )}
                    </FamilyInfo>
                  </FamilyHeader>

                  {family.description && (
                    <FamilyDescription>
                      {family.description.length > 150
                        ? `${family.description.substring(0, 150)}...`
                        : family.description}
                    </FamilyDescription>
                  )}

                  <FamilyStats>
                    <StatItem>
                      <StatValue>{family.reputation_score}</StatValue>
                      <StatLabel>Reputation</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{family.total_territories}</StatValue>
                      <StatLabel>Territories</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>
                        ${family.treasury_balance.toLocaleString()}
                      </StatValue>
                      <StatLabel>Treasury</StatLabel>
                    </StatItem>
                  </FamilyStats>

                  <JoinButton
                    onClick={() =>
                      handleJoinRequest(family.id, family.display_name)
                    }
                    disabled={
                      !!userMembership ||
                      !family.is_recruiting ||
                      requestJoinMutation.isPending
                    }
                    $variant={
                      userMembership || !family.is_recruiting
                        ? "disabled"
                        : "primary"
                    }
                  >
                    {userMembership
                      ? "Already in Family"
                      : !family.is_recruiting
                      ? "Not Recruiting"
                      : requestJoinMutation.isPending
                      ? "Sending Request..."
                      : "Request to Join"}
                  </JoinButton>
                </FamilyCard>
              ))
            ) : (
              <EmptyState>No families found matching your criteria.</EmptyState>
            )}
          </FamilyGrid>

          {(searchParams.offset > 0 || hasMore) && (
            <Pagination>
              <PaginationButton
                onClick={() => handlePageChange("prev")}
                disabled={searchParams.offset === 0}
              >
                Previous
              </PaginationButton>

              <span style={{ color: "#a8a8a8" }}>
                Showing {searchParams.offset + 1}-
                {Math.min(searchParams.offset + searchParams.limit, totalCount)}{" "}
                of {totalCount}
              </span>

              <PaginationButton
                onClick={() => handlePageChange("next")}
                disabled={!hasMore}
              >
                Next
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}
