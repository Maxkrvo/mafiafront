'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkFamilyPermission,
  getPlayerFamilyMembership,
  type FamilyPermissions,
  type FamilyMember
} from '@/lib/family-data';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof FamilyPermissions;
  rank?: string | string[];
  requireFamilyMembership?: boolean;
  fallback?: React.ReactNode;
  onPermissionCheck?: (hasPermission: boolean) => void;
}

/**
 * Component that conditionally renders children based on family permissions
 */
export function PermissionGuard({
  children,
  permission,
  rank,
  requireFamilyMembership = false,
  fallback = null,
  onPermissionCheck
}: PermissionGuardProps) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<FamilyMember | null>(null);

  useEffect(() => {
    checkPermissions();
  }, [user, permission, rank, requireFamilyMembership]);

  const checkPermissions = async () => {
    if (!user) {
      setHasPermission(false);
      setLoading(false);
      onPermissionCheck?.(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's family membership
      const userMembership = await getPlayerFamilyMembership(user.id);
      setMembership(userMembership);

      // If family membership is required and user has none
      if (requireFamilyMembership && !userMembership) {
        setHasPermission(false);
        onPermissionCheck?.(false);
        return;
      }

      // If no specific permission or rank is required, just check family membership
      if (!permission && !rank) {
        const result = requireFamilyMembership ? !!userMembership : true;
        setHasPermission(result);
        onPermissionCheck?.(result);
        return;
      }

      let permissionGranted = true;

      // Check specific permission
      if (permission && userMembership) {
        const permissionCheck = await checkFamilyPermission(user.id, permission);
        permissionGranted = permissionGranted && permissionCheck.has_permission;
      }

      // Check rank requirement
      if (rank && userMembership) {
        const requiredRanks = Array.isArray(rank) ? rank : [rank];
        const hasRequiredRank = requiredRanks.includes(userMembership.family_rank);
        permissionGranted = permissionGranted && hasRequiredRank;
      }

      setHasPermission(permissionGranted);
      onPermissionCheck?.(permissionGranted);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
      onPermissionCheck?.(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook for checking family permissions programmatically
 */
export function useFamilyPermissions() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembership();
  }, [user]);

  const loadMembership = async () => {
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      const userMembership = await getPlayerFamilyMembership(user.id);
      setMembership(userMembership);
    } catch (error) {
      console.error('Error loading membership:', error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = async (permission: keyof FamilyPermissions): Promise<boolean> => {
    if (!user || !membership) return false;

    try {
      const result = await checkFamilyPermission(user.id, permission);
      return result.has_permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const hasRank = (requiredRank: string | string[]): boolean => {
    if (!membership) return false;

    const ranks = Array.isArray(requiredRank) ? requiredRank : [requiredRank];
    return ranks.includes(membership.family_rank);
  };

  const isInFamily = (): boolean => {
    return !!membership;
  };

  return {
    membership,
    loading,
    hasPermission,
    hasRank,
    isInFamily,
    refresh: loadMembership
  };
}

/**
 * Higher-order component for wrapping components with permission checks
 */
export function withPermissionGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardOptions: Omit<PermissionGuardProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard {...guardOptions}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}