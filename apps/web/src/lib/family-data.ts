'use client';

import { supabase } from './supabase/client';
import {
  Family,
  FamilyMember,
  FamilyEconomics,
  FamilyActivity,
  FamilyDashboardData,
  FamilyStats,
  CreateFamilyRequest,
  CreateFamilyResponse,
  FamilyCreationFee,
  JoinFamilyRequest,
  FamilyMemberAction,
  UpdatePermissionsRequest,
  FamilyTreasuryTransaction,
  FamilySearchParams,
  FamilyListResponse,
  FamilyValidationResult,
  PermissionCheck,
  FamilyRank,
  FamilyPermissions,
  DEFAULT_FAMILY_PERMISSIONS,
  FAMILY_RANK_HIERARCHY,
  FAMILY_RANK_LIMITS,
  FAMILY_CONSTANTS,
} from './supabase/family-types';

// Type for either regular supabase client or authenticated client
type SupabaseClientType = typeof supabase | any;

// ============================================================================
// FAMILY MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get family creation fee (dynamic pricing)
 */
export async function getFamilyCreationFee(): Promise<FamilyCreationFee> {
  try {
    const { data, error } = await supabase.rpc('calculate_family_creation_fee');

    if (error) throw error;

    const familyCount = await getFamilyCount();

    return {
      base_fee: FAMILY_CONSTANTS.BASE_CREATION_FEE,
      existing_families_count: familyCount,
      demand_multiplier: 1 + (familyCount * 0.05),
      final_fee: data || FAMILY_CONSTANTS.BASE_CREATION_FEE,
    };
  } catch (error) {
    console.error('Error calculating family creation fee:', error);
    return {
      base_fee: FAMILY_CONSTANTS.BASE_CREATION_FEE,
      existing_families_count: 0,
      demand_multiplier: 1,
      final_fee: FAMILY_CONSTANTS.BASE_CREATION_FEE,
    };
  }
}

/**
 * Create a new family
 */
export async function createFamily(
  creatorId: string,
  familyData: CreateFamilyRequest,
  authSupabase: SupabaseClientType = supabase
): Promise<CreateFamilyResponse> {
  try {
    // Validate family name
    const nameValidation = await validateFamilyName(familyData.name);
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error };
    }

    // Get creation fee
    const creationFee = await getFamilyCreationFee();

    // Create family using database function
    const { data, error } = await authSupabase.rpc('create_family', {
      p_creator_id: creatorId,
      p_name: familyData.name,
      p_display_name: familyData.display_name,
      p_creation_fee: creationFee.final_fee,
      p_description: familyData.description || null,
      p_motto: familyData.motto || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch the created family
    const family = await getFamilyById(data);
    if (!family) {
      return { success: false, error: 'Failed to retrieve created family' };
    }

    return { success: true, family };
  } catch (error) {
    console.error('Error creating family:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create family'
    };
  }
}

/**
 * Get family by ID
 */
export async function getFamilyById(familyId: string): Promise<Family | null> {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching family by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching family by ID:', error);
    return null;
  }
}

/**
 * Get family by name
 */
export async function getFamilyByName(name: string): Promise<Family | null> {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching family by name:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching family by name:', error);
    return null;
  }
}

/**
 * Search families with filters
 */
export async function searchFamilies(params: FamilySearchParams = {}): Promise<FamilyListResponse> {
  try {
    let query = supabase
      .from('families')
      .select(`
        *,
        family_members!inner(count),
        territory_control(count)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
    }

    if (params.is_recruiting !== undefined) {
      query = query.eq('is_recruiting', params.is_recruiting);
    }

    // Apply sorting
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      families: data || [],
      total_count: count || 0,
      has_more: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Error searching families:', error);
    return {
      families: [],
      total_count: 0,
      has_more: false,
    };
  }
}

// ============================================================================
// FAMILY MEMBERSHIP FUNCTIONS
// ============================================================================

/**
 * Get player's family membership
 */
export async function getPlayerFamilyMembership(playerId: string): Promise<FamilyMember | null> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        player:players(id, nickname, username, rank, avatar_url),
        family:families(*)
      `)
      .eq('player_id', playerId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching player family membership:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching player family membership:', error);
    return null;
  }
}

/**
 * Get family members
 */
export async function getFamilyMembers(
  familyId: string,
  options: { active_only?: boolean; exclude_boss?: boolean } = {}
): Promise<FamilyMember[]> {
  try {
    let query = supabase
      .from('family_members')
      .select(`
        *,
        player:players(id, nickname, username, rank, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('family_rank', { ascending: false })
      .order('joined_at', { ascending: true });

    if (options.active_only) {
      query = query.eq('is_active', true);
    }

    if (options.exclude_boss) {
      query = query.neq('family_rank', 'boss');
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching family members:', error);
    return [];
  }
}

/**
 * Request to join family
 */
export async function requestJoinFamily(
  playerId: string,
  request: JoinFamilyRequest,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    // Check if player is already in a family
    const existingMembership = await getPlayerFamilyMembership(playerId);
    if (existingMembership) {
      return { valid: false, error: 'Already a member of a family' };
    }

    // Check if family exists and is recruiting
    const family = await getFamilyById(request.family_id);
    if (!family) {
      return { valid: false, error: 'Family not found' };
    }

    if (!family.is_recruiting) {
      return { valid: false, error: 'Family is not currently recruiting' };
    }

    // Check if family is at max capacity
    const currentMembers = await getFamilyMembers(request.family_id, { active_only: true });
    if (currentMembers.length >= family.max_members) {
      return { valid: false, error: 'Family is at maximum capacity' };
    }

    // Create join request
    const { error } = await authSupabase
      .from('family_members')
      .insert({
        family_id: request.family_id,
        player_id: playerId,
        family_rank: 'associate',
        join_requested_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        is_active: false, // Will be activated when approved
      });

    if (error) throw error;

    // Log activity
    await logFamilyActivity({
      family_id: request.family_id,
      player_id: playerId,
      activity_type: 'member_joined',
      activity_title: 'Join Request Submitted',
      activity_description: `Player requested to join the family`,
      is_public: false,
    });

    return { valid: true };
  } catch (error) {
    console.error('Error requesting to join family:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to submit join request'
    };
  }
}

/**
 * Approve family join request
 */
export async function approveFamilyJoinRequest(
  approverId: string,
  familyId: string,
  playerId: string,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    // Check permissions
    const permissionCheck = await checkFamilyPermission(approverId, 'can_approve_requests');
    if (!permissionCheck.has_permission) {
      return { valid: false, error: permissionCheck.error_message || 'Insufficient permissions' };
    }

    // Activate the membership
    const { error } = await authSupabase
      .from('family_members')
      .update({
        is_active: true,
        joined_at: new Date().toISOString(),
      })
      .eq('family_id', familyId)
      .eq('player_id', playerId);

    if (error) throw error;

    // Update member permissions based on rank
    await authSupabase.rpc('update_member_permissions_by_rank', {
      member_id: playerId,
      new_rank: 'associate'
    });

    // Log activity
    await logFamilyActivity({
      family_id: familyId,
      player_id: playerId,
      activity_type: 'member_joined',
      activity_title: 'Member Approved',
      activity_description: `Join request approved`,
    });

    return { valid: true };
  } catch (error) {
    console.error('Error approving family join request:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to approve join request'
    };
  }
}

/**
 * Leave family
 */
export async function leaveFamily(
  playerId: string,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    const membership = await getPlayerFamilyMembership(playerId);
    if (!membership) {
      return { valid: false, error: 'Not a member of any family' };
    }

    // Boss cannot leave (must transfer leadership first)
    if (membership.family_rank === 'boss') {
      return { valid: false, error: 'Boss must transfer leadership before leaving' };
    }

    // Remove from family
    const { error } = await authSupabase
      .from('family_members')
      .delete()
      .eq('player_id', playerId);

    if (error) throw error;

    // Log activity
    await logFamilyActivity({
      family_id: membership.family_id,
      player_id: playerId,
      activity_type: 'member_left',
      activity_title: 'Member Left',
      activity_description: `${membership.player?.nickname || 'Member'} left the family`,
    });

    return { valid: true };
  } catch (error) {
    console.error('Error leaving family:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to leave family'
    };
  }
}

/**
 * Kick family member
 */
export async function kickFamilyMember(
  kickerId: string,
  action: FamilyMemberAction,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    // Check permissions
    const permissionCheck = await checkFamilyPermission(kickerId, 'can_kick_members');
    if (!permissionCheck.has_permission) {
      return { valid: false, error: permissionCheck.error_message || 'Insufficient permissions' };
    }

    // Additional validation: can't kick higher or equal rank
    const kicker = await getPlayerFamilyMembership(kickerId);
    const target = await getPlayerFamilyMembership(action.target_player_id);

    if (!kicker || !target || kicker.family_id !== target.family_id) {
      return { valid: false, error: 'Invalid kick operation' };
    }

    const kickerLevel = FAMILY_RANK_HIERARCHY[kicker.family_rank].level;
    const targetLevel = FAMILY_RANK_HIERARCHY[target.family_rank].level;

    if (targetLevel >= kickerLevel) {
      return { valid: false, error: 'Cannot kick members of equal or higher rank' };
    }

    // Cannot kick boss
    if (target.family_rank === 'boss') {
      return { valid: false, error: 'Cannot kick the boss' };
    }

    // Remove from family
    const { error } = await authSupabase
      .from('family_members')
      .delete()
      .eq('player_id', action.target_player_id);

    if (error) throw error;

    // Log activity
    await logFamilyActivity({
      family_id: kicker.family_id,
      player_id: kickerId,
      activity_type: 'member_kicked',
      activity_title: 'Member Kicked',
      activity_description: `${target.player?.nickname || 'Member'} was kicked from the family`,
      metadata: { reason: action.reason, kicked_player_id: action.target_player_id },
    });

    return { valid: true };
  } catch (error) {
    console.error('Error kicking family member:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to kick member'
    };
  }
}

/**
 * Promote/demote family member
 */
export async function updateFamilyMemberRank(
  promoterId: string,
  action: FamilyMemberAction,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    if (!action.new_rank) {
      return { valid: false, error: 'New rank is required' };
    }

    // Check permissions
    const permissionCheck = await checkFamilyPermission(promoterId, 'can_promote_demote');
    if (!permissionCheck.has_permission) {
      return { valid: false, error: permissionCheck.error_message || 'Insufficient permissions' };
    }

    // Get current memberships
    const promoter = await getPlayerFamilyMembership(promoterId);
    const target = await getPlayerFamilyMembership(action.target_player_id);

    if (!promoter || !target || promoter.family_id !== target.family_id) {
      return { valid: false, error: 'Invalid promotion operation' };
    }

    // Validate promotion path
    const currentRank = target.family_rank;
    const newRank = action.new_rank;

    // Check if rank change is valid
    const isPromotion = FAMILY_RANK_HIERARCHY[newRank].level > FAMILY_RANK_HIERARCHY[currentRank].level;
    const isDemotion = FAMILY_RANK_HIERARCHY[newRank].level < FAMILY_RANK_HIERARCHY[currentRank].level;

    if (isPromotion) {
      // Check if promotion path is allowed
      const allowedPromotions = FAMILY_RANK_HIERARCHY[currentRank].maxPromoteTo;
      if (!allowedPromotions.includes(newRank)) {
        return { valid: false, error: `Cannot promote ${currentRank} directly to ${newRank}` };
      }

      // Check family rank limits
      const isSlotAvailable = await checkFamilyRankSlotAvailable(promoter.family_id, newRank);
      if (!isSlotAvailable) {
        const limit = FAMILY_RANK_LIMITS[newRank];
        return { valid: false, error: `Family has reached the limit for ${newRank} (${limit})` };
      }
    }

    // Promoter must be higher rank than target's new rank
    const promoterLevel = FAMILY_RANK_HIERARCHY[promoter.family_rank].level;
    const newRankLevel = FAMILY_RANK_HIERARCHY[newRank].level;

    if (newRankLevel >= promoterLevel) {
      return { valid: false, error: 'Cannot promote to equal or higher rank than your own' };
    }

    // Update member rank and permissions
    await authSupabase.rpc('update_member_permissions_by_rank', {
      member_id: target.id,
      new_rank: newRank
    });

    // Log activity
    await logFamilyActivity({
      family_id: promoter.family_id,
      player_id: promoterId,
      activity_type: isPromotion ? 'member_promoted' : 'member_demoted',
      activity_title: isPromotion ? 'Member Promoted' : 'Member Demoted',
      activity_description: `${target.player?.nickname} ${isPromotion ? 'promoted to' : 'demoted to'} ${newRank}`,
      metadata: {
        target_player_id: action.target_player_id,
        old_rank: currentRank,
        new_rank: newRank,
        reason: action.reason
      },
    });

    return { valid: true };
  } catch (error) {
    console.error('Error updating family member rank:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to update member rank'
    };
  }
}

// ============================================================================
// PERMISSION FUNCTIONS
// ============================================================================

/**
 * Check if player has specific family permission
 */
export async function checkFamilyPermission(
  playerId: string,
  permission: keyof FamilyPermissions
): Promise<PermissionCheck> {
  try {
    const membership = await getPlayerFamilyMembership(playerId);

    if (!membership || !membership.is_active) {
      return {
        has_permission: false,
        required_permission: permission,
        current_rank: 'associate',
        error_message: 'Not an active family member',
      };
    }

    const hasPermission = membership.permissions[permission] === true;

    return {
      has_permission: hasPermission,
      required_permission: permission,
      current_rank: membership.family_rank,
      error_message: hasPermission ? undefined : `Missing permission: ${permission}`,
    };
  } catch (error) {
    console.error('Error checking family permission:', error);
    return {
      has_permission: false,
      required_permission: permission,
      current_rank: 'associate',
      error_message: 'Permission check failed',
    };
  }
}

/**
 * Update member permissions
 */
export async function updateMemberPermissions(
  updaterId: string,
  request: UpdatePermissionsRequest,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    // Check if updater has permission to manage permissions
    const permissionCheck = await checkFamilyPermission(updaterId, 'can_manage_permissions');
    if (!permissionCheck.has_permission) {
      return { valid: false, error: permissionCheck.error_message || 'Insufficient permissions' };
    }

    // Get target member
    const { data: targetMember, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', request.target_member_id)
      .single();

    if (fetchError || !targetMember) {
      return { valid: false, error: 'Target member not found' };
    }

    // Merge current permissions with updates
    const updatedPermissions = { ...targetMember.permissions, ...request.permissions };

    // Update permissions
    const { error } = await authSupabase
      .from('family_members')
      .update({ permissions: updatedPermissions })
      .eq('id', request.target_member_id);

    if (error) throw error;

    return { valid: true };
  } catch (error) {
    console.error('Error updating member permissions:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to update permissions'
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate family name availability and format
 */
export async function validateFamilyName(name: string): Promise<FamilyValidationResult> {
  // Length validation
  if (name.length < FAMILY_CONSTANTS.MIN_FAMILY_NAME_LENGTH) {
    return { valid: false, error: `Family name must be at least ${FAMILY_CONSTANTS.MIN_FAMILY_NAME_LENGTH} characters` };
  }

  if (name.length > FAMILY_CONSTANTS.MAX_FAMILY_NAME_LENGTH) {
    return { valid: false, error: `Family name must not exceed ${FAMILY_CONSTANTS.MAX_FAMILY_NAME_LENGTH} characters` };
  }

  // Format validation
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Family name can only contain letters, numbers, underscores, and hyphens' };
  }

  // Availability check
  const existingFamily = await getFamilyByName(name);
  if (existingFamily) {
    return { valid: false, error: 'Family name is already taken' };
  }

  return { valid: true };
}

/**
 * Get total number of active families
 */
export async function getFamilyCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting family count:', error);
    return 0;
  }
}

/**
 * Check if family rank slot is available
 */
export async function checkFamilyRankSlotAvailable(
  familyId: string,
  rank: FamilyRank
): Promise<boolean> {
  try {
    const limit = FAMILY_RANK_LIMITS[rank];
    if (limit === -1) return true; // Unlimited

    const { count, error } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .eq('family_rank', rank)
      .eq('is_active', true);

    if (error) throw error;

    return (count || 0) < limit;
  } catch (error) {
    console.error('Error checking family rank slot availability:', error);
    return false;
  }
}

/**
 * Log family activity
 */
export async function logFamilyActivity(
  activity: Omit<FamilyActivity, 'id' | 'created_at'>,
  authSupabase: SupabaseClientType = supabase
): Promise<void> {
  try {
    const { error } = await authSupabase
      .from('family_activities')
      .insert(activity);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging family activity:', error);
  }
}

/**
 * Get family activities
 */
export async function getFamilyActivities(
  familyId: string,
  limit: number = 20
): Promise<FamilyActivity[]> {
  try {
    const { data, error } = await supabase
      .from('family_activities')
      .select(`
        *,
        player:players(id, nickname, avatar_url),
        territory:territories(name, display_name),
        target_family:families(name, display_name)
      `)
      .eq('family_id', familyId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching family activities:', error);
    return [];
  }
}

/**
 * Get family statistics
 */
export async function getFamilyStats(familyId: string): Promise<FamilyStats> {
  try {
    // Get members count by rank
    const members = await getFamilyMembers(familyId, { active_only: true });

    const membersByRank = members.reduce((acc, member) => {
      acc[member.family_rank] = (acc[member.family_rank] || 0) + 1;
      return acc;
    }, {} as Record<FamilyRank, number>);

    // Get territory count
    const { count: territoryCount } = await supabase
      .from('territory_control')
      .select('*', { count: 'exact', head: true })
      .eq('controlling_family_id', familyId);

    // Calculate average loyalty
    const totalLoyalty = members.reduce((sum, member) => sum + member.loyalty_score, 0);
    const averageLoyalty = members.length > 0 ? Math.round(totalLoyalty / members.length) : 0;

    // Get economics to calculate income
    const economics = await getFamilyEconomics(familyId);
    const totalIncome = economics?.daily_income || await calculateFamilyTerritoryIncome(familyId);

    // Calculate rankings
    const [reputationRank, territoryRank, wealthRank] = await Promise.all([
      getFamilyRank(familyId, 'reputation'),
      getFamilyRank(familyId, 'territory'),
      getFamilyRank(familyId, 'wealth'),
    ]);

    return {
      total_members: members.length,
      members_by_rank: {
        associate: membersByRank.associate || 0,
        soldier: membersByRank.soldier || 0,
        caporegime: membersByRank.caporegime || 0,
        underboss: membersByRank.underboss || 0,
        boss: membersByRank.boss || 0,
      },
      total_territories: territoryCount || 0,
      total_income: totalIncome,
      average_loyalty: averageLoyalty,
      reputation_rank: reputationRank,
      territory_rank: territoryRank,
      wealth_rank: wealthRank,
    };
  } catch (error) {
    console.error('Error calculating family stats:', error);
    return {
      total_members: 0,
      members_by_rank: {
        associate: 0,
        soldier: 0,
        caporegime: 0,
        underboss: 0,
        boss: 0,
      },
      total_territories: 0,
      total_income: 0,
      average_loyalty: 0,
      reputation_rank: 0,
      territory_rank: 0,
      wealth_rank: 0,
    };
  }
}

/**
 * Get complete family dashboard data
 */
export async function getFamilyDashboardData(
  playerId: string,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyDashboardData | null> {
  try {
    const membership = await getPlayerFamilyMembership(playerId);
    if (!membership) return null;

    const family = await getFamilyById(membership.family_id);
    if (!family) return null;

    const [stats, activities, economics, territories] = await Promise.all([
      getFamilyStats(membership.family_id),
      getFamilyActivities(membership.family_id, 10),
      getFamilyEconomics(membership.family_id),
      getFamilyTerritories(membership.family_id),
    ]);

    // Get join requests (only if member can see them)
    let joinRequests: FamilyMember[] = [];
    if (membership.permissions.can_approve_requests) {
      joinRequests = await getFamilyJoinRequests(membership.family_id);
    }

    return {
      family,
      member: membership,
      stats,
      recent_activities: activities,
      economics: economics || getDefaultFamilyEconomics(membership.family_id),
      controlled_territories: territories,
      join_requests: joinRequests,
    };
  } catch (error) {
    console.error('Error fetching family dashboard data:', error);
    return null;
  }
}

/**
 * Get family economics
 */
export async function getFamilyEconomics(familyId: string): Promise<FamilyEconomics | null> {
  try {
    const { data, error } = await supabase
      .from('family_economics')
      .select('*')
      .eq('family_id', familyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching family economics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching family economics:', error);
    return null;
  }
}

/**
 * Get family join requests
 */
export async function getFamilyJoinRequests(familyId: string): Promise<FamilyMember[]> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        player:players(id, nickname, username, rank, avatar_url)
      `)
      .eq('family_id', familyId)
      .eq('is_active', false)
      .not('join_requested_at', 'is', null)
      .order('join_requested_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching family join requests:', error);
    return [];
  }
}

// ============================================================================
// TREASURY & ECONOMICS FUNCTIONS
// ============================================================================

/**
 * Make treasury transaction (deposit/withdrawal)
 */
export async function makeTreasuryTransaction(
  playerId: string,
  familyId: string,
  transaction: FamilyTreasuryTransaction,
  authSupabase: SupabaseClientType = supabase
): Promise<FamilyValidationResult> {
  try {
    // Check permissions
    const permissionCheck = await checkFamilyPermission(playerId, 'can_manage_treasury');
    if (!permissionCheck.has_permission) {
      return { valid: false, error: permissionCheck.error_message || 'Insufficient permissions' };
    }

    // Get current economics
    const economics = await getFamilyEconomics(familyId);
    if (!economics) {
      return { valid: false, error: 'Family economics not found' };
    }

    // Validate transaction
    if (transaction.transaction_type === 'withdrawal' && transaction.amount > economics.treasury_balance) {
      return { valid: false, error: 'Insufficient treasury funds' };
    }

    // Calculate new balance
    const balanceChange = transaction.transaction_type === 'deposit' ? transaction.amount : -transaction.amount;
    const newBalance = economics.treasury_balance + balanceChange;

    if (newBalance < 0) {
      return { valid: false, error: 'Transaction would result in negative balance' };
    }

    // Update treasury balance
    const { error } = await authSupabase
      .from('family_economics')
      .update({
        treasury_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('family_id', familyId);

    if (error) throw error;

    // Log activity
    await logFamilyActivity({
      family_id: familyId,
      player_id: playerId,
      activity_type: transaction.transaction_type === 'deposit' ? 'treasury_deposit' : 'treasury_withdrawal',
      activity_title: `Treasury ${transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}`,
      activity_description: transaction.description,
      treasury_impact: balanceChange,
      metadata: { amount: transaction.amount, transaction_type: transaction.transaction_type },
    });

    return { valid: true };
  } catch (error) {
    console.error('Error making treasury transaction:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to process transaction'
    };
  }
}

/**
 * Calculate and update family territory income
 */
export async function calculateFamilyTerritoryIncome(familyId: string): Promise<number> {
  try {
    // Get all territories controlled by family
    const { data: territories, error } = await supabase
      .from('territory_control')
      .select(`
        *,
        territory:territories(base_income_per_hour, maintenance_cost_per_hour)
      `)
      .eq('controlling_family_id', familyId);

    if (error) throw error;

    if (!territories || territories.length === 0) return 0;

    let totalIncome = 0;
    let totalMaintenance = 0;

    for (const control of territories) {
      if (!control.territory) continue;

      // Calculate territory income with modifiers
      const baseIncome = control.territory.base_income_per_hour * 24; // Daily income
      const controlBonus = control.control_percentage / 100;
      const incomeBonus = control.income_modifier;

      const territoryIncome = baseIncome * controlBonus * incomeBonus;
      const maintenance = control.territory.maintenance_cost_per_hour * 24 * controlBonus;

      totalIncome += territoryIncome;
      totalMaintenance += maintenance;
    }

    const netIncome = Math.max(0, totalIncome - totalMaintenance);

    // Update family economics
    await supabase
      .from('family_economics')
      .upsert({
        family_id: familyId,
        territory_income: netIncome,
        territory_maintenance: totalMaintenance,
        daily_income: netIncome, // Simplified for now
        updated_at: new Date().toISOString(),
      });

    return netIncome;
  } catch (error) {
    console.error('Error calculating family territory income:', error);
    return 0;
  }
}

/**
 * Process territory income for all families and deposit to treasury
 */
export async function processTerritoryIncomeForAllFamilies(): Promise<void> {
  try {
    // Get all active families with territories
    const { data: families, error } = await supabase
      .from('families')
      .select('id, name')
      .eq('is_active', true);

    if (error) throw error;

    if (!families || families.length === 0) return;

    for (const family of families) {
      await processFamilyTerritoryIncome(family.id);
    }

    console.log(`Processed territory income for ${families.length} families`);
  } catch (error) {
    console.error('Error processing territory income for all families:', error);
  }
}

/**
 * Process territory income for a specific family and deposit to treasury
 */
export async function processFamilyTerritoryIncome(familyId: string): Promise<number> {
  try {
    const netIncome = await calculateFamilyTerritoryIncome(familyId);

    if (netIncome <= 0) {
      return 0;
    }

    // Get family economics to update treasury
    const economics = await getFamilyEconomics(familyId);
    if (!economics) {
      console.error('Family economics not found for family:', familyId);
      return 0;
    }

    // Deposit income to treasury
    const newTreasuryBalance = economics.treasury_balance + netIncome;

    const { error } = await supabase
      .from('family_economics')
      .update({
        treasury_balance: newTreasuryBalance,
        territory_income: netIncome,
        daily_income: economics.daily_income + netIncome,
        total_income_lifetime: economics.total_income_lifetime + netIncome,
        updated_at: new Date().toISOString(),
      })
      .eq('family_id', familyId);

    if (error) throw error;

    // Log family activity
    await logFamilyActivity({
      family_id: familyId,
      activity_type: 'treasury_deposit',
      activity_title: 'Territory Income',
      activity_description: `Territory income of $${netIncome.toLocaleString()} deposited to family treasury`,
      treasury_impact: netIncome,
      metadata: {
        source: 'territory_income',
        amount: netIncome,
        territories_controlled: await getTerritoryCountForFamily(familyId),
      },
    });

    return netIncome;
  } catch (error) {
    console.error('Error processing family territory income:', error);
    return 0;
  }
}

/**
 * Get the number of territories controlled by a family
 */
export async function getTerritoryCountForFamily(familyId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('territory_control')
      .select('id', { count: 'exact' })
      .eq('controlling_family_id', familyId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting territory count:', error);
    return 0;
  }
}

/**
 * Get family rankings
 */
export async function getFamilyRankings(): Promise<{
  reputation: Family[],
  territory: Family[],
  wealth: Family[]
}> {
  try {
    const [reputationRanking, territoryRanking, wealthRanking] = await Promise.all([
      // Reputation ranking
      supabase
        .from('families')
        .select('*')
        .eq('is_active', true)
        .order('reputation_score', { ascending: false })
        .limit(10),

      // Territory ranking
      supabase
        .from('families')
        .select('*')
        .eq('is_active', true)
        .order('total_territories', { ascending: false })
        .limit(10),

      // Wealth ranking (treasury balance)
      supabase
        .from('families')
        .select(`
          *,
          family_economics(treasury_balance)
        `)
        .eq('is_active', true)
        .order('treasury_balance', { ascending: false, foreignTable: 'family_economics' })
        .limit(10)
    ]);

    return {
      reputation: reputationRanking.data || [],
      territory: territoryRanking.data || [],
      wealth: wealthRanking.data || [],
    };
  } catch (error) {
    console.error('Error fetching family rankings:', error);
    return { reputation: [], territory: [], wealth: [] };
  }
}

/**
 * Get family rank in specific category
 */
export async function getFamilyRank(familyId: string, category: 'reputation' | 'territory' | 'wealth'): Promise<number> {
  try {
    let query;

    switch (category) {
      case 'reputation':
        query = supabase
          .from('families')
          .select('id, reputation_score')
          .eq('is_active', true)
          .order('reputation_score', { ascending: false });
        break;

      case 'territory':
        query = supabase
          .from('families')
          .select('id, total_territories')
          .eq('is_active', true)
          .order('total_territories', { ascending: false });
        break;

      case 'wealth':
        query = supabase
          .from('families')
          .select(`
            id,
            family_economics(treasury_balance)
          `)
          .eq('is_active', true)
          .order('treasury_balance', { ascending: false, foreignTable: 'family_economics' });
        break;
    }

    const { data, error } = await query;
    if (error) throw error;

    const familyIndex = data?.findIndex(family => family.id === familyId);
    return familyIndex !== undefined && familyIndex >= 0 ? familyIndex + 1 : 0;
  } catch (error) {
    console.error(`Error fetching family rank for ${category}:`, error);
    return 0;
  }
}

// ============================================================================
// TERRITORY INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get family controlled territories
 */
export async function getFamilyTerritories(familyId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('territory_control')
      .select(`
        *,
        territory:territories(*)
      `)
      .eq('controlling_family_id', familyId)
      .order('controlled_since', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching family territories:', error);
    return [];
  }
}

/**
 * Get default family economics structure
 */
function getDefaultFamilyEconomics(familyId: string): FamilyEconomics {
  return {
    family_id: familyId,
    treasury_balance: 0,
    daily_income: 0,
    daily_expenses: 0,
    territory_income: 0,
    job_income: 0,
    member_contributions: 0,
    other_income: 0,
    territory_maintenance: 0,
    war_expenses: 0,
    recruitment_expenses: 0,
    other_expenses: 0,
    tax_rate: 0.10,
    minimum_contribution: 0,
    total_income_lifetime: 0,
    total_expenses_lifetime: 0,
    biggest_single_income: 0,
    last_income_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}