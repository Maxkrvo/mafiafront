'use client';

import React from 'react';
import styled from 'styled-components';
import { usePresence, OnlineUser } from '@/contexts/PresenceContext';
import { useAuth } from '@/contexts/AuthContext';

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  max-width: 90vw;
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-left: 2px solid ${({ theme }) => theme.colors.primary.gold};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform ${({ theme }) => theme.transitions.normal};
  display: flex;
  flex-direction: column;
  z-index: 1000;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100vw;
    max-width: 100vw;
  }
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  background: ${({ theme }) => theme.colors.primary.dark};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const OnlineCount = styled.div`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OnlineIndicator = styled.div`
  width: 8px;
  height: 8px;
  background: ${({ theme }) => theme.colors.semantic.success};
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.smoke};
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

const UsersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

const UserCard = styled.div<{ $isCurrentUser?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  background: ${({ $isCurrentUser, theme }) => 
    $isCurrentUser ? theme.colors.primary.gold + '15' : theme.colors.primary.dark
  };
  border: 1px solid ${({ $isCurrentUser, theme }) => 
    $isCurrentUser ? theme.colors.primary.gold : theme.colors.neutral.smoke
  };
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.smoke}20;
    border-color: ${({ theme }) => theme.colors.primary.gold};
  }
`;

const Avatar = styled.div<{ $avatarUrl?: string | null }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $avatarUrl, theme }) => 
    $avatarUrl 
      ? `url(${$avatarUrl}) center/cover`
      : `linear-gradient(45deg, ${theme.colors.primary.gold}, ${theme.colors.primary.wine})`
  };
  border: 2px solid ${({ theme }) => theme.colors.neutral.smoke};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary.dark};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  position: relative;
`;

const OnlineStatus = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: ${({ theme }) => theme.colors.semantic.success};
  border: 2px solid ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: 50%;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserNickname = styled.div`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const VitalsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
  width: 100%;
`;

const VitalBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const VitalLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.ash};
  text-transform: uppercase;
  min-width: 20px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const VitalBarContainer = styled.div`
  flex: 1;
  height: 4px;
  background: ${({ theme }) => theme.colors.primary.dark};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
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
  min-width: 30px;
  text-align: right;
`;

const UserRank = styled.span<{ $rank: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ $rank, theme }) => {
    switch ($rank) {
      case 'Don': return theme.colors.primary.crimson;
      case 'Capo': return theme.colors.primary.wine;
      case 'Soldier': return theme.colors.neutral.ash;
      default: return theme.colors.neutral.smoke;
    }
  }};
  color: ${({ theme }) => theme.colors.neutral.cream};
`;

const UserReputation = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const UserLocation = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.ash};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.neutral.ash};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnlineUsersModal({ isOpen, onClose }: OnlineUsersModalProps) {
  const { onlineUsers, onlineCount, loading } = usePresence();
  const { player } = useAuth();

  const formatLocation = (page: string | null) => {
    if (!page) return 'Unknown';
    
    const locationMap: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/lobbies': 'Game Lobbies',
      '/leaderboard': 'Leaderboard',
    };
    
    return locationMap[page] || page;
  };

  const getInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={handleOverlayClick} />
      <Modal $isOpen={isOpen}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Header>
          <Title>Online Members</Title>
          <OnlineCount>
            <OnlineIndicator />
            {onlineCount} members online
          </OnlineCount>
        </Header>

        <UsersList>
          {loading ? (
            <LoadingState>Loading online members...</LoadingState>
          ) : onlineUsers.length === 0 ? (
            <EmptyState>No members are currently online.</EmptyState>
          ) : (
            onlineUsers.map((user) => {
              const hpPercentage = (user.hp / user.max_hp) * 100;
              const energyPercentage = (user.energy / user.max_energy) * 100;
              
              return (
                <UserCard 
                  key={user.id} 
                  $isCurrentUser={user.id === player?.id}
                >
                  <Avatar $avatarUrl={user.avatar_url}>
                    {!user.avatar_url && getInitials(user.nickname)}
                    <OnlineStatus />
                  </Avatar>
                  
                  <UserInfo>
                    <UserNickname>
                      {user.nickname}
                      {user.id === player?.id && ' (You)'}
                    </UserNickname>
                    
                    <UserDetails>
                      <UserRank $rank={user.rank}>{user.rank}</UserRank>
                      <UserReputation>{user.reputation_score} rep</UserReputation>
                    </UserDetails>
                    
                    <VitalsContainer>
                      <VitalBar>
                        <VitalLabel>HP</VitalLabel>
                        <VitalBarContainer>
                          <VitalBarFill $percentage={hpPercentage} $color="#dc143c" />
                        </VitalBarContainer>
                        <VitalValue>{user.hp}/{user.max_hp}</VitalValue>
                      </VitalBar>
                      
                      <VitalBar>
                        <VitalLabel>EN</VitalLabel>
                        <VitalBarContainer>
                          <VitalBarFill $percentage={energyPercentage} $color="#4682b4" />
                        </VitalBarContainer>
                        <VitalValue>{user.energy}/{user.max_energy}</VitalValue>
                      </VitalBar>
                    </VitalsContainer>
                    
                    <UserLocation>
                      Currently in: {formatLocation(user.current_page)}
                    </UserLocation>
                  </UserInfo>
                </UserCard>
              );
            })
          )}
        </UsersList>
      </Modal>
    </>
  );
}