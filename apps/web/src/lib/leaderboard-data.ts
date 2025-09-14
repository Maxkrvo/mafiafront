'use client';

import { supabase } from './supabase/client';

export interface LeaderboardEntry {
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

export type LeaderboardCategory = 'reputation' | 'eliminations' | 'survival' | 'winrate' | 'activity';

export const categoryConfig = {
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

/**
 * Fetch leaderboard data for a specific category
 */
export async function fetchLeaderboardData(category: LeaderboardCategory, limit: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const viewName = `${category}_leaderboard`;
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(limit);

    if (error) {
      console.error(`Error fetching ${category} leaderboard:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get player initials for avatar display
 */
export function getPlayerInitials(nickname: string): string {
  return nickname
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}