'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  username: string;
  rank: string;
  reputation_score: number;
  avatar_url: string | null;
  total_games: number;
  games_won: number;
  survival_rate: number;
  total_eliminations: number;
  position: number;
  win_rate?: number;
  eliminations_per_game?: number;
  longest_survival_streak?: number;
}

const LeaderboardContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth.xl};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.dark} 0%,
    ${({ theme }) => theme.colors.primary.charcoal} 100%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-shadow: ${({ theme }) => theme.shadows.glow};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary.gold : 'transparent'
  };
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary.dark : theme.colors.neutral.silver
  };
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.neutral.cream : theme.colors.primary.gold + '20'
    };
    color: ${({ $active, theme }) => 
      $active ? theme.colors.primary.dark : theme.colors.primary.gold
    };
  }
`;

const LeaderboardTable = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 60px 1fr auto auto auto;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary.dark};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.gold};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 50px 1fr auto;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const HeaderCell = styled.div<{ $hideOnMobile?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ $hideOnMobile }) => $hideOnMobile ? 'none' : 'flex'};
  }
`;

const TableRow = styled.div<{ $isCurrentUser?: boolean; $position: number }>`
  display: grid;
  grid-template-columns: 60px 60px 1fr auto auto auto;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  align-items: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ $isCurrentUser, $position, theme }) => {
    if ($isCurrentUser) return theme.colors.primary.gold + '15';
    if ($position <= 3) return theme.colors.primary.wine + '10';
    return 'transparent';
  }};
  border-left: ${({ $isCurrentUser, $position, theme }) => {
    if ($isCurrentUser) return `3px solid ${theme.colors.primary.gold}`;
    if ($position === 1) return `3px solid #FFD700`;
    if ($position === 2) return `3px solid #C0C0C0`;
    if ($position === 3) return `3px solid #CD7F32`;
    return '3px solid transparent';
  }};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.smoke + '20'};
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 50px 1fr auto;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const Position = styled.div<{ $position: number }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $position, theme }) => {
    if ($position === 1) return '#FFD700';
    if ($position === 2) return '#C0C0C0';
    if ($position === 3) return '#CD7F32';
    return theme.colors.neutral.cream;
  }};
  text-align: center;
`;

const PlayerAvatar = styled.div<{ $avatarUrl?: string | null }>`
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
  margin: 0 auto;
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const PlayerName = styled.div`
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const PlayerRank = styled.div<{ $rank: string }>`
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
  width: fit-content;
`;

const StatCell = styled.div<{ $highlight?: boolean; $hideOnMobile?: boolean }>`
  text-align: center;
  color: ${({ $highlight, theme }) => 
    $highlight ? theme.colors.primary.gold : theme.colors.neutral.cream
  };
  font-weight: ${({ $highlight, theme }) => 
    $highlight ? theme.typography.fontWeight.bold : theme.typography.fontWeight.normal
  };
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ $hideOnMobile }) => $hideOnMobile ? 'none' : 'block'};
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['4xl']};
  color: ${({ theme }) => theme.colors.neutral.silver};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['4xl']};
  color: ${({ theme }) => theme.colors.neutral.ash};
`;

const YourRank = styled.div`
  background: ${({ theme }) => theme.colors.primary.gold + '15'};
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.neutral.cream};
`;

type LeaderboardCategory = 'reputation' | 'eliminations' | 'survival' | 'winrate' | 'activity';

const categoryConfig = {
  reputation: {
    title: 'Reputation Kings',
    description: 'Most Feared Members',
    mainStat: 'reputation_score',
    suffix: ' rep'
  },
  eliminations: {
    title: 'Elimination Masters',
    description: 'Most Deadly Assassins',
    mainStat: 'total_eliminations',
    suffix: ' kills'
  },
  survival: {
    title: 'Survival Experts', 
    description: 'Hardest to Eliminate',
    mainStat: 'survival_rate',
    suffix: '%'
  },
  winrate: {
    title: 'Victory Champions',
    description: 'Highest Win Rate',
    mainStat: 'win_rate',
    suffix: '%'
  },
  activity: {
    title: 'Most Active',
    description: 'Frequent Players',
    mainStat: 'total_games',
    suffix: ' games'
  }
};

export function Leaderboard() {
  const { player } = useAuth();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('reputation');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      const viewName = `${activeCategory}_leaderboard`;
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(50);

      if (error) {
        console.error(`Error fetching ${activeCategory} leaderboard:`, error);
        return;
      }

      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Unexpected error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);


  const getInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderStatHeaders = () => {
    switch (activeCategory) {
      case 'reputation':
        return (
          <>
            <HeaderCell>Reputation</HeaderCell>
            <HeaderCell $hideOnMobile>Games Won</HeaderCell>
            <HeaderCell $hideOnMobile>Games Played</HeaderCell>
          </>
        );
      case 'eliminations':
        return (
          <>
            <HeaderCell>Eliminations</HeaderCell>
            <HeaderCell $hideOnMobile>Per Game</HeaderCell>
            <HeaderCell $hideOnMobile>Total Games</HeaderCell>
          </>
        );
      case 'survival':
        return (
          <>
            <HeaderCell>Survival Rate</HeaderCell>
            <HeaderCell $hideOnMobile>Best Streak</HeaderCell>
            <HeaderCell $hideOnMobile>Total Games</HeaderCell>
          </>
        );
      case 'winrate':
        return (
          <>
            <HeaderCell>Win Rate</HeaderCell>
            <HeaderCell $hideOnMobile>Games Won</HeaderCell>
            <HeaderCell $hideOnMobile>Total Games</HeaderCell>
          </>
        );
      case 'activity':
        return (
          <>
            <HeaderCell>Total Games</HeaderCell>
            <HeaderCell $hideOnMobile>Games Won</HeaderCell>
            <HeaderCell $hideOnMobile>Win Rate</HeaderCell>
          </>
        );
      default:
        return null;
    }
  };

  const renderStatCells = (entry: LeaderboardEntry) => {
    switch (activeCategory) {
      case 'reputation':
        return (
          <>
            <StatCell $highlight>{entry.reputation_score.toLocaleString()}</StatCell>
            <StatCell $hideOnMobile>{entry.games_won}</StatCell>
            <StatCell $hideOnMobile>{entry.total_games}</StatCell>
          </>
        );
      case 'eliminations':
        return (
          <>
            <StatCell $highlight>{entry.total_eliminations}</StatCell>
            <StatCell $hideOnMobile>{entry.eliminations_per_game || '0.00'}</StatCell>
            <StatCell $hideOnMobile>{entry.total_games}</StatCell>
          </>
        );
      case 'survival':
        return (
          <>
            <StatCell $highlight>{entry.survival_rate.toFixed(1)}%</StatCell>
            <StatCell $hideOnMobile>{entry.longest_survival_streak || 0}</StatCell>
            <StatCell $hideOnMobile>{entry.total_games}</StatCell>
          </>
        );
      case 'winrate':
        return (
          <>
            <StatCell $highlight>{entry.win_rate || 0}%</StatCell>
            <StatCell $hideOnMobile>{entry.games_won}</StatCell>
            <StatCell $hideOnMobile>{entry.total_games}</StatCell>
          </>
        );
      case 'activity':
        return (
          <>
            <StatCell $highlight>{entry.total_games}</StatCell>
            <StatCell $hideOnMobile>{entry.games_won}</StatCell>
            <StatCell $hideOnMobile>
              {entry.total_games > 0 ? ((entry.games_won / entry.total_games) * 100).toFixed(1) : 0}%
            </StatCell>
          </>
        );
      default:
        return null;
    }
  };

  const currentPlayerEntry = leaderboardData.find(entry => entry.id === player?.id);
  const config = categoryConfig[activeCategory];

  return (
    <LeaderboardContainer>
      <Header>
        <Title>Hall of Honor</Title>
        <Subtitle>The most distinguished members of MafiaFront</Subtitle>
      </Header>

      <TabContainer>
        {(Object.keys(categoryConfig) as LeaderboardCategory[]).map((category) => (
          <Tab
            key={category}
            $active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {categoryConfig[category].title}
          </Tab>
        ))}
      </TabContainer>

      {currentPlayerEntry && (
        <YourRank>
          Your rank in {config.title}: <strong>#{currentPlayerEntry.position}</strong> with{' '}
          <strong>
            {currentPlayerEntry[config.mainStat as keyof LeaderboardEntry]}{config.suffix}
          </strong>
        </YourRank>
      )}

      <LeaderboardTable>
        <TableHeader>
          <HeaderCell>Rank</HeaderCell>
          <HeaderCell>Player</HeaderCell>
          <HeaderCell>Member</HeaderCell>
          {renderStatHeaders()}
        </TableHeader>

        {loading ? (
          <LoadingState>Loading {config.title}...</LoadingState>
        ) : leaderboardData.length === 0 ? (
          <EmptyState>No data available for {config.title}</EmptyState>
        ) : (
          leaderboardData.map((entry) => (
            <TableRow
              key={entry.id}
              $isCurrentUser={entry.id === player?.id}
              $position={entry.position}
            >
              <Position $position={entry.position}>
                {entry.position}
              </Position>
              
              <PlayerAvatar $avatarUrl={entry.avatar_url}>
                {!entry.avatar_url && getInitials(entry.nickname)}
              </PlayerAvatar>
              
              <PlayerInfo>
                <PlayerName>
                  {entry.nickname}
                  {entry.id === player?.id && ' (You)'}
                </PlayerName>
                <PlayerRank $rank={entry.rank}>{entry.rank}</PlayerRank>
              </PlayerInfo>
              
              {renderStatCells(entry)}
            </TableRow>
          ))
        )}
      </LeaderboardTable>
    </LeaderboardContainer>
  );
}