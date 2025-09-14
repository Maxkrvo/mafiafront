-- Fix RLS policies to avoid infinite recursion
-- This script should be run to fix the family_members RLS policy issue

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Family members can view own family data" ON families;
DROP POLICY IF EXISTS "Family members can view family member data" ON family_members;

-- Create safe RLS policies that don't cause recursion

-- Policy for families table - can view families if they are a member
CREATE POLICY "Players can view families they belong to" ON families
    FOR SELECT
    USING (
        -- Direct join to avoid subquery recursion
        EXISTS (
            SELECT 1
            FROM family_members fm
            WHERE fm.family_id = families.id
            AND fm.player_id = auth.uid()
            AND fm.is_active = true
        )
    );

-- Policy for family_members table - simpler approach without recursive subquery
CREATE POLICY "Players can view family members from their family" ON family_members
    FOR SELECT
    USING (
        -- Allow if this is the player's own record
        player_id = auth.uid()
        OR
        -- Allow if player is in same family (using a safe subquery approach)
        family_id = (
            SELECT fm2.family_id
            FROM family_members fm2
            WHERE fm2.player_id = auth.uid()
            AND fm2.is_active = true
            LIMIT 1
        )
    );

-- Alternative safer approach - create a function to get player's family
CREATE OR REPLACE FUNCTION get_player_family_id(p_player_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT family_id
        FROM family_members
        WHERE player_id = p_player_id
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the problematic policy and recreate with function
DROP POLICY IF EXISTS "Players can view family members from their family" ON family_members;

CREATE POLICY "Family members can view same family data" ON family_members
    FOR SELECT
    USING (
        -- Own record
        player_id = auth.uid()
        OR
        -- Same family using function to avoid recursion
        family_id = get_player_family_id(auth.uid())
    );

-- Add policies for other operations

-- Insert policy for family_members (only family leaders can add members through approval)
CREATE POLICY "Family leaders can insert new members" ON family_members
    FOR INSERT
    WITH CHECK (
        -- Check if the inserting user has permission in the target family
        EXISTS (
            SELECT 1
            FROM family_members existing_member
            WHERE existing_member.family_id = family_members.family_id
            AND existing_member.player_id = auth.uid()
            AND existing_member.is_active = true
            AND (
                existing_member.permissions->>'can_approve_requests' = 'true'
                OR existing_member.family_rank IN ('boss', 'underboss', 'caporegime')
            )
        )
    );

-- Update policy for family_members (rank changes, permissions updates)
CREATE POLICY "Family members can update member data" ON family_members
    FOR UPDATE
    USING (
        -- Can update own non-critical fields
        (player_id = auth.uid() AND family_id = get_player_family_id(auth.uid()))
        OR
        -- Can update others if has permission
        EXISTS (
            SELECT 1
            FROM family_members manager
            WHERE manager.family_id = family_members.family_id
            AND manager.player_id = auth.uid()
            AND manager.is_active = true
            AND (
                manager.permissions->>'can_promote_demote' = 'true'
                OR manager.permissions->>'can_manage_permissions' = 'true'
                OR manager.family_rank IN ('boss', 'underboss')
            )
        )
    )
    WITH CHECK (
        -- Same conditions for what can be updated
        (player_id = auth.uid() AND family_id = get_player_family_id(auth.uid()))
        OR
        EXISTS (
            SELECT 1
            FROM family_members manager
            WHERE manager.family_id = family_members.family_id
            AND manager.player_id = auth.uid()
            AND manager.is_active = true
            AND (
                manager.permissions->>'can_promote_demote' = 'true'
                OR manager.permissions->>'can_manage_permissions' = 'true'
                OR manager.family_rank IN ('boss', 'underboss')
            )
        )
    );

-- Delete policy for family_members (kicking members)
CREATE POLICY "Family leaders can remove members" ON family_members
    FOR DELETE
    USING (
        -- Can leave family themselves
        player_id = auth.uid()
        OR
        -- Leaders can kick others
        EXISTS (
            SELECT 1
            FROM family_members manager
            WHERE manager.family_id = family_members.family_id
            AND manager.player_id = auth.uid()
            AND manager.is_active = true
            AND (
                manager.permissions->>'can_kick_members' = 'true'
                OR manager.family_rank IN ('boss', 'underboss', 'caporegime')
            )
        )
    );

-- RLS policies for family_economics table
CREATE POLICY "Family members can view family economics" ON family_economics
    FOR SELECT
    USING (
        family_id = get_player_family_id(auth.uid())
        AND
        EXISTS (
            SELECT 1
            FROM family_members fm
            WHERE fm.family_id = family_economics.family_id
            AND fm.player_id = auth.uid()
            AND fm.is_active = true
            AND (
                fm.permissions->>'can_view_treasury' = 'true'
                OR fm.family_rank IN ('boss', 'underboss', 'caporegime', 'soldier')
            )
        )
    );

CREATE POLICY "Family treasurers can update economics" ON family_economics
    FOR UPDATE
    USING (
        family_id = get_player_family_id(auth.uid())
        AND
        EXISTS (
            SELECT 1
            FROM family_members fm
            WHERE fm.family_id = family_economics.family_id
            AND fm.player_id = auth.uid()
            AND fm.is_active = true
            AND (
                fm.permissions->>'can_manage_treasury' = 'true'
                OR fm.family_rank IN ('boss', 'underboss')
            )
        )
    );

-- Allow public read access to basic family info for browsing
CREATE POLICY "Public can view active recruiting families" ON families
    FOR SELECT
    USING (is_active = true AND is_recruiting = true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON family_members TO authenticated;
GRANT SELECT, UPDATE ON family_economics TO authenticated;
GRANT SELECT ON territories TO authenticated;
GRANT SELECT, INSERT ON family_activities TO authenticated;