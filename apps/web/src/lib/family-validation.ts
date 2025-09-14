'use client';

import {
  FamilyRank,
  FamilyPermissions,
  FAMILY_RANK_HIERARCHY,
  FAMILY_RANK_LIMITS,
  FAMILY_CONSTANTS,
  DEFAULT_FAMILY_PERMISSIONS,
  type FamilyValidationResult,
  type CreateFamilyRequest
} from './supabase/family-types';
import { getFamilyMembers, checkFamilyPermission, getPlayerFamilyMembership } from './family-data';

// ============================================================================
// FAMILY CREATION VALIDATION
// ============================================================================

/**
 * Comprehensive family creation validation
 */
export async function validateFamilyCreation(
  creatorId: string,
  familyData: CreateFamilyRequest
): Promise<FamilyValidationResult> {
  // Check if user is already in a family
  const existingMembership = await getPlayerFamilyMembership(creatorId);
  if (existingMembership) {
    return { valid: false, error: 'You are already a member of a family' };
  }

  // Validate family name
  const nameValidation = validateFamilyName(familyData.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  // Validate display name
  const displayNameValidation = validateDisplayName(familyData.display_name);
  if (!displayNameValidation.valid) {
    return displayNameValidation;
  }

  // Validate optional fields
  if (familyData.description) {
    const descValidation = validateDescription(familyData.description);
    if (!descValidation.valid) return descValidation;
  }

  if (familyData.motto) {
    const mottoValidation = validateMotto(familyData.motto);
    if (!mottoValidation.valid) return mottoValidation;
  }

  if (familyData.color_hex) {
    const colorValidation = validateColorHex(familyData.color_hex);
    if (!colorValidation.valid) return colorValidation;
  }

  return { valid: true };
}

/**
 * Validate family name format and constraints
 */
export function validateFamilyName(name: string): FamilyValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Family name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < FAMILY_CONSTANTS.MIN_FAMILY_NAME_LENGTH) {
    return {
      valid: false,
      error: `Family name must be at least ${FAMILY_CONSTANTS.MIN_FAMILY_NAME_LENGTH} characters long`
    };
  }

  if (trimmedName.length > FAMILY_CONSTANTS.MAX_FAMILY_NAME_LENGTH) {
    return {
      valid: false,
      error: `Family name must not exceed ${FAMILY_CONSTANTS.MAX_FAMILY_NAME_LENGTH} characters`
    };
  }

  // Check for valid characters (alphanumeric, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Family name can only contain letters, numbers, underscores, and hyphens'
    };
  }

  // Check for reserved words
  const reservedWords = ['admin', 'system', 'famiglia', 'family', 'test', 'debug'];
  if (reservedWords.includes(trimmedName.toLowerCase())) {
    return { valid: false, error: 'This family name is reserved and cannot be used' };
  }

  return { valid: true };
}

/**
 * Validate display name
 */
export function validateDisplayName(displayName: string): FamilyValidationResult {
  if (!displayName || displayName.trim().length === 0) {
    return { valid: false, error: 'Display name is required' };
  }

  const trimmed = displayName.trim();

  if (trimmed.length < FAMILY_CONSTANTS.MIN_DISPLAY_NAME_LENGTH) {
    return {
      valid: false,
      error: `Display name must be at least ${FAMILY_CONSTANTS.MIN_DISPLAY_NAME_LENGTH} characters long`
    };
  }

  if (trimmed.length > FAMILY_CONSTANTS.MAX_DISPLAY_NAME_LENGTH) {
    return {
      valid: false,
      error: `Display name must not exceed ${FAMILY_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate family description
 */
export function validateDescription(description: string): FamilyValidationResult {
  if (description.length > FAMILY_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description must not exceed ${FAMILY_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate family motto
 */
export function validateMotto(motto: string): FamilyValidationResult {
  if (motto.length > FAMILY_CONSTANTS.MAX_MOTTO_LENGTH) {
    return {
      valid: false,
      error: `Motto must not exceed ${FAMILY_CONSTANTS.MAX_MOTTO_LENGTH} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate hex color
 */
export function validateColorHex(color: string): FamilyValidationResult {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { valid: false, error: 'Invalid color format. Must be a valid hex color (e.g., #FF0000)' };
  }

  return { valid: true };
}

// ============================================================================
// RANK AND PERMISSION VALIDATION
// ============================================================================

/**
 * Validate if a promotion/demotion is allowed
 */
export async function validateRankChange(
  promoterId: string,
  targetPlayerId: string,
  newRank: FamilyRank
): Promise<FamilyValidationResult> {
  try {
    // Get both players' memberships
    const [promoterMembership, targetMembership] = await Promise.all([
      getPlayerFamilyMembership(promoterId),
      getPlayerFamilyMembership(targetPlayerId)
    ]);

    if (!promoterMembership || !targetMembership) {
      return { valid: false, error: 'Player membership not found' };
    }

    if (promoterMembership.family_id !== targetMembership.family_id) {
      return { valid: false, error: 'Players are not in the same family' };
    }

    // Check if promoter has permission
    if (!promoterMembership.permissions.can_promote_demote) {
      return { valid: false, error: 'You do not have permission to promote or demote members' };
    }

    const promoterLevel = FAMILY_RANK_HIERARCHY[promoterMembership.family_rank].level;
    const currentTargetLevel = FAMILY_RANK_HIERARCHY[targetMembership.family_rank].level;
    const newRankLevel = FAMILY_RANK_HIERARCHY[newRank].level;

    // Promoter must be higher rank than both current and new rank
    if (promoterLevel <= Math.max(currentTargetLevel, newRankLevel)) {
      return {
        valid: false,
        error: 'You cannot promote/demote to a rank equal to or higher than your own'
      };
    }

    // Check if rank change follows hierarchy rules
    if (newRankLevel > currentTargetLevel) {
      // Promotion - check if it's a valid progression
      const allowedPromotions = FAMILY_RANK_HIERARCHY[targetMembership.family_rank].maxPromoteTo;
      if (!allowedPromotions.includes(newRank)) {
        return {
          valid: false,
          error: `Cannot promote ${targetMembership.family_rank} directly to ${newRank}`
        };
      }
    }

    // Check family rank limits
    if (newRankLevel > currentTargetLevel) {
      const isSlotAvailable = await checkRankSlotAvailable(promoterMembership.family_id, newRank);
      if (!isSlotAvailable) {
        const limit = FAMILY_RANK_LIMITS[newRank];
        return {
          valid: false,
          error: `Family has reached the maximum number of ${newRank} positions (${limit})`
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

/**
 * Check if a rank slot is available in the family
 */
export async function checkRankSlotAvailable(
  familyId: string,
  rank: FamilyRank
): Promise<boolean> {
  const limit = FAMILY_RANK_LIMITS[rank];
  if (limit === -1) return true; // Unlimited

  try {
    const members = await getFamilyMembers(familyId, { active_only: true });
    const currentCount = members.filter(member => member.family_rank === rank).length;
    return currentCount < limit;
  } catch (error) {
    console.error('Error checking rank slot availability:', error);
    return false;
  }
}

/**
 * Validate if a member can be kicked
 */
export async function validateMemberKick(
  kickerId: string,
  targetPlayerId: string
): Promise<FamilyValidationResult> {
  try {
    const [kickerMembership, targetMembership] = await Promise.all([
      getPlayerFamilyMembership(kickerId),
      getPlayerFamilyMembership(targetPlayerId)
    ]);

    if (!kickerMembership || !targetMembership) {
      return { valid: false, error: 'Player membership not found' };
    }

    if (kickerMembership.family_id !== targetMembership.family_id) {
      return { valid: false, error: 'Players are not in the same family' };
    }

    // Check permissions
    if (!kickerMembership.permissions.can_kick_members) {
      return { valid: false, error: 'You do not have permission to kick members' };
    }

    // Cannot kick yourself
    if (kickerId === targetPlayerId) {
      return { valid: false, error: 'You cannot kick yourself' };
    }

    // Cannot kick boss
    if (targetMembership.family_rank === 'boss') {
      return { valid: false, error: 'Cannot kick the family boss' };
    }

    // Cannot kick equal or higher rank
    const kickerLevel = FAMILY_RANK_HIERARCHY[kickerMembership.family_rank].level;
    const targetLevel = FAMILY_RANK_HIERARCHY[targetMembership.family_rank].level;

    if (targetLevel >= kickerLevel) {
      return { valid: false, error: 'You cannot kick members of equal or higher rank' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Get default permissions for a rank
 */
export function getDefaultPermissionsForRank(rank: FamilyRank): FamilyPermissions {
  return { ...DEFAULT_FAMILY_PERMISSIONS[rank] };
}

/**
 * Validate custom permissions don't exceed rank capabilities
 */
export function validatePermissions(
  rank: FamilyRank,
  permissions: Partial<FamilyPermissions>
): FamilyValidationResult {
  const defaultPermissions = DEFAULT_FAMILY_PERMISSIONS[rank];

  for (const [permission, value] of Object.entries(permissions)) {
    // Can only grant permissions that the rank normally has
    if (value === true && !defaultPermissions[permission as keyof FamilyPermissions]) {
      return {
        valid: false,
        error: `Permission '${permission}' cannot be granted to ${rank} rank`
      };
    }
  }

  return { valid: true };
}

/**
 * Check if user has required permissions for an action
 */
export async function requirePermission(
  playerId: string,
  permission: keyof FamilyPermissions
): Promise<FamilyValidationResult> {
  try {
    const permissionCheck = await checkFamilyPermission(playerId, permission);

    if (!permissionCheck.has_permission) {
      return {
        valid: false,
        error: permissionCheck.error_message || `Missing required permission: ${permission}`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Permission check failed'
    };
  }
}

// ============================================================================
// FAMILY LIMITS AND CONSTRAINTS
// ============================================================================

/**
 * Check if family can accept new members
 */
export async function canAcceptNewMember(familyId: string): Promise<FamilyValidationResult> {
  try {
    const members = await getFamilyMembers(familyId, { active_only: true });

    // This would need family data to get max_members
    // For now, use default limit
    const maxMembers = FAMILY_CONSTANTS.MAX_MEMBERS_DEFAULT;

    if (members.length >= maxMembers) {
      return {
        valid: false,
        error: `Family is at maximum capacity (${maxMembers} members)`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to check member capacity'
    };
  }
}

/**
 * Validate loyalty score
 */
export function validateLoyaltyScore(score: number): FamilyValidationResult {
  if (score < FAMILY_CONSTANTS.MIN_LOYALTY_SCORE || score > FAMILY_CONSTANTS.MAX_LOYALTY_SCORE) {
    return {
      valid: false,
      error: `Loyalty score must be between ${FAMILY_CONSTANTS.MIN_LOYALTY_SCORE} and ${FAMILY_CONSTANTS.MAX_LOYALTY_SCORE}`
    };
  }

  return { valid: true };
}

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize family name for database storage
 */
export function sanitizeFamilyName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Sanitize display name
 */
export function sanitizeDisplayName(displayName: string): string {
  return displayName.trim();
}

/**
 * Sanitize and validate all family creation data
 */
export function sanitizeFamilyCreationData(data: CreateFamilyRequest): CreateFamilyRequest {
  return {
    name: sanitizeFamilyName(data.name),
    display_name: sanitizeDisplayName(data.display_name),
    description: data.description?.trim() || undefined,
    motto: data.motto?.trim() || undefined,
    color_hex: data.color_hex?.toUpperCase() || '#D4AF37'
  };
}