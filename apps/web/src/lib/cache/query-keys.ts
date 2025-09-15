// Query key factory for hierarchical cache invalidation
// Based on TanStack Query best practices

export const queryKeys = {
  // Base keys for broad invalidation
  all: ['cache'] as const,

  // Player queries
  player: {
    all: ['player'] as const,
    profile: (playerId: string) => ['player', 'profile', playerId] as const,
    stats: (playerId: string) => ['player', 'stats', playerId] as const,
    economics: (playerId: string) => ['player', 'economics', playerId] as const,
    dashboard: (playerId: string) => ['player', 'dashboard', playerId] as const,
    statPoints: (playerId: string) => ['player', 'statPoints', playerId] as const,
  },

  // Family queries
  families: {
    all: ['families'] as const,
    lists: () => ['families', 'list'] as const,
    list: (filters: string) => ['families', 'list', filters] as const,
    details: () => ['families', 'detail'] as const,
    detail: (familyId: string) => ['families', 'detail', familyId] as const,

    // Family dashboard and related data
    dashboard: (playerId: string) => ['families', 'dashboard', playerId] as const,
    members: (familyId: string) => ['families', 'members', familyId] as const,
    joinRequests: (familyId: string) => ['families', 'joinRequests', familyId] as const,
    activities: (familyId: string) => ['families', 'activities', familyId] as const,
    economics: (familyId: string) => ['families', 'economics', familyId] as const,
    stats: (familyId: string) => ['families', 'stats', familyId] as const,

    // Family membership
    membership: (playerId: string) => ['families', 'membership', playerId] as const,
    permissions: (playerId: string) => ['families', 'permissions', playerId] as const,
  },

  // Territory queries
  territories: {
    all: ['territories'] as const,
    lists: () => ['territories', 'list'] as const,
    list: (filters: string) => ['territories', 'list', filters] as const,
    details: () => ['territories', 'detail'] as const,
    detail: (territoryId: string) => ['territories', 'detail', territoryId] as const,

    // Territory control
    controls: () => ['territories', 'controls'] as const,
    control: (territoryId: string) => ['territories', 'control', territoryId] as const,
    byFamily: (familyId: string) => ['territories', 'family', familyId] as const,

    // Territory wars
    wars: () => ['territories', 'wars'] as const,
    war: (warId: string) => ['territories', 'war', warId] as const,
    activeWars: () => ['territories', 'wars', 'active'] as const,
    warsByFamily: (familyId: string) => ['territories', 'wars', 'family', familyId] as const,
    warForTerritory: (territoryId: string) => ['territories', 'wars', 'territory', territoryId] as const,
    battleParticipants: (warId: string) => ['territories', 'battleParticipants', warId] as const,

    // Territory income
    income: (territoryId: string) => ['territories', 'income', territoryId] as const,
    incomeHistory: (territoryId: string, days: number) => ['territories', 'income', territoryId, days] as const,
    familyIncomeReport: (familyId: string) => ['territories', 'familyIncomeReport', familyId] as const,
    familyTerritoryReport: (familyId: string) => ['territories', 'familyTerritoryReport', familyId] as const,

    // Sabotage missions
    sabotageHistory: (territoryId: string) => ['territories', 'sabotageHistory', territoryId] as const,
    missionExecutions: (missionId: string) => ['territories', 'missionExecutions', missionId] as const,

    // Contest phases and pressure events
    contestPhases: (territoryId: string) => ['territories', 'contestPhases', territoryId] as const,
    pressureEvents: (territoryId: string) => ['territories', 'pressureEvents', territoryId] as const,
  },

  // Jobs and economics
  jobs: {
    all: ['jobs'] as const,
    templates: () => ['jobs', 'templates'] as const,
    pageData: (playerId: string) => ['jobs', 'pageData', playerId] as const,
    available: (playerId: string) => ['jobs', 'available', playerId] as const,
    playerHistory: (playerId: string) => ['jobs', 'history', playerId] as const,
    lootDetails: (lootIds: string[]) => ['jobs', 'lootDetails', lootIds.sort().join(',')] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    player: (playerId: string) => ['inventory', 'player', playerId] as const,
    items: () => ['inventory', 'items'] as const,
  },

  // Leaderboards
  leaderboards: {
    all: ['leaderboards'] as const,
    global: () => ['leaderboards', 'global'] as const,
    family: () => ['leaderboards', 'family'] as const,
  },
} as const;

// Type helpers for better type safety
export type QueryKey = typeof queryKeys;

// Helper functions for cache invalidation
export const invalidationHelpers = {
  // Invalidate all family-related data for a player
  invalidatePlayerFamilyData: (playerId: string) => [
    queryKeys.families.dashboard(playerId),
    queryKeys.families.membership(playerId),
    queryKeys.families.permissions(playerId),
  ],

  // Invalidate all data for a specific family
  invalidateFamilyData: (familyId: string) => [
    queryKeys.families.detail(familyId),
    queryKeys.families.members(familyId),
    queryKeys.families.joinRequests(familyId),
    queryKeys.families.activities(familyId),
    queryKeys.families.economics(familyId),
    queryKeys.families.stats(familyId),
    queryKeys.territories.byFamily(familyId),
    queryKeys.territories.warsByFamily(familyId),
    queryKeys.territories.familyIncomeReport(familyId),
  ],

  // Invalidate all player-related data
  invalidatePlayerData: (playerId: string) => [
    queryKeys.player.profile(playerId),
    queryKeys.player.stats(playerId),
    queryKeys.player.economics(playerId),
    queryKeys.player.dashboard(playerId),
    queryKeys.player.statPoints(playerId),
    queryKeys.jobs.available(playerId),
    queryKeys.jobs.playerHistory(playerId),
    queryKeys.inventory.player(playerId),
  ],

  // Invalidate territory-related data
  invalidateTerritoryData: (territoryId: string) => [
    queryKeys.territories.detail(territoryId),
    queryKeys.territories.control(territoryId),
    queryKeys.territories.warForTerritory(territoryId),
    queryKeys.territories.income(territoryId),
  ],
};