"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/contexts/PresenceContext";
import { useRouter, usePathname } from "next/navigation";
import { OnlineUsersModal } from "@/components/presence/OnlineUsersModal";
import { StatsBar } from "./StatsBar";

const HeaderContainer = styled.header`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary.gold};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  max-width: ${({ theme }) => theme.layout.maxWidth.xl};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
`;

const LogoText = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0;
  text-shadow: ${({ theme }) => theme.shadows.glow};
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const NavLink = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.gold : theme.colors.neutral.silver};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ theme }) => theme.colors.primary.gold}15;
  }

  ${({ $active, theme }) =>
    $active &&
    `
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: ${theme.colors.primary.gold};
      border-radius: 1px;
    }
  `}
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const OnlineCounter = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ theme }) => theme.colors.primary.gold}15;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const OnlineIndicator = styled.div`
  width: 8px;
  height: 8px;
  background: ${({ theme }) => theme.colors.semantic.success};
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const OnlineText = styled.span`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const OnlineCount = styled.span`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ theme }) => theme.colors.primary.gold}15;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.primary.charcoal};
    border-bottom: 2px solid ${({ theme }) => theme.colors.primary.gold};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const MobileNavLink = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.gold : theme.colors.neutral.silver};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.gold};
    background: ${({ theme }) => theme.colors.primary.gold}15;
  }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  color: ${({ theme }) => theme.colors.primary.gold};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.gold};
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

export function Header() {
  const { user, player, signOut } = useAuth();
  const { onlineCount } = usePresence();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  // Don't show header if user is not logged in
  if (!user || !player) {
    return null;
  }

  return (
    <HeaderContainer>
      <Nav>
        <Logo onClick={() => handleNavigation("/")}>
          <LogoText>MafiaFront</LogoText>
        </Logo>

        <NavLinks>
          <NavLink
            $active={pathname === "/dashboard"}
            onClick={() => handleNavigation("/dashboard")}
          >
            Player
          </NavLink>
          <NavLink
            $active={pathname === "/jobs"}
            onClick={() => handleNavigation("/jobs")}
          >
            Jobs
          </NavLink>
          <NavLink
            $active={pathname === "/inventory"}
            onClick={() => handleNavigation("/inventory")}
          >
            Inventory
          </NavLink>
          <NavLink
            $active={pathname === "/families"}
            onClick={() => handleNavigation("/families")}
          >
            Families
          </NavLink>
          <NavLink
            $active={pathname === "/leaderboard"}
            onClick={() => handleNavigation("/leaderboard")}
          >
            Leaderboard
          </NavLink>
        </NavLinks>

        <UserSection>
          <OnlineCounter onClick={() => setIsOnlineUsersModalOpen(true)}>
            <OnlineIndicator />
            <OnlineText>
              <OnlineCount>{onlineCount}</OnlineCount> online
            </OnlineText>
          </OnlineCounter>

          {/* <VitalsBar>
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
          </VitalsBar> */}

          {/* <UserInfo>
            <UserName>{player.nickname}</UserName>
            <UserRank>{player.rank}</UserRank>
          </UserInfo> */}

          <LogoutButton onClick={handleSignOut}>Sign Out</LogoutButton>

          <MenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            ☰
          </MenuButton>
        </UserSection>
      </Nav>
      <StatsBar />

      <MobileMenu $isOpen={isMobileMenuOpen}>
        <MobileNavLink
          $active={pathname === "/"}
          onClick={() => handleNavigation("/")}
        >
          Home
        </MobileNavLink>
        <MobileNavLink
          $active={pathname === "/dashboard"}
          onClick={() => handleNavigation("/dashboard")}
        >
          Dashboard
        </MobileNavLink>
        <MobileNavLink
          $active={pathname === "/jobs"}
          onClick={() => handleNavigation("/jobs")}
        >
          Jobs
        </MobileNavLink>
        <MobileNavLink
          $active={pathname === "/inventory"}
          onClick={() => handleNavigation("/inventory")}
        >
          Inventory
        </MobileNavLink>
        <MobileNavLink
          $active={pathname === "/families"}
          onClick={() => handleNavigation("/families")}
        >
          Families
        </MobileNavLink>
        <MobileNavLink
          $active={pathname === "/leaderboard"}
          onClick={() => handleNavigation("/leaderboard")}
        >
          Leaderboard
        </MobileNavLink>
        <LogoutButton onClick={handleSignOut} style={{ marginTop: "1rem" }}>
          Sign Out
        </LogoutButton>
      </MobileMenu>

      <OnlineUsersModal
        isOpen={isOnlineUsersModalOpen}
        onClose={() => setIsOnlineUsersModalOpen(false)}
      />
    </HeaderContainer>
  );
}
