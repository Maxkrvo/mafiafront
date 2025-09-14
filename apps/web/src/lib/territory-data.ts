// Territory Data Access Layer - Family System Integration
// Integrates with existing family system instead of bypassing it

import { supabase } from "./supabase/client";
import {
  getFamilyById,
  checkFamilyPermission,
  logFamilyActivity,
} from "./family-data";
import type {
  Territory,
  TerritoryControl,
  TerritoryWar,
  BattleParticipant,
  SabotageMission,
  MissionExecution,
  TerritoryIncomeCalculation,
  TerritoryIncomeHistory,
  DeclareWarRequest,
  DeclareWarResponse,
  ParticipateinWarRequest,
  WarParticipationResponse,
  TerritoryIncomeReport,
  FamilyTerritoryReport,
  ContestPhase,
  PressureEvent,
} from "./supabase/territory-types";

// ================================
// Territory Management Functions
// ================================

export async function getAllTerritories(): Promise<Territory[]> {
  const { data, error } = await supabase
    .from("territories")
    .select("*")
    .order("map_y", { ascending: true })
    .order("map_x", { ascending: true });

  if (error) {
    console.error("Error fetching territories:", error);
    throw error;
  }

  return data || [];
}

export async function getTerritory(
  territoryId: string
): Promise<Territory | null> {
  const { data, error } = await supabase
    .from("territories")
    .select("*")
    .eq("id", territoryId)
    .single();

  if (error) {
    console.error("Error fetching territory:", error);
    return null;
  }

  return data;
}

export async function getTerritoriesByType(
  territoryType: string
): Promise<Territory[]> {
  const { data, error } = await supabase
    .from("territories")
    .select("*")
    .eq("territory_type", territoryType)
    .order("map_y", { ascending: true })
    .order("map_x", { ascending: true });

  if (error) {
    console.error("Error fetching territories by type:", error);
    throw error;
  }

  return data || [];
}

export async function getAdjacentTerritories(
  territoryId: string
): Promise<Territory[]> {
  const territory = await getTerritory(territoryId);
  if (!territory || !territory.adjacent_territories.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("territories")
    .select("*")
    .in("id", territory.adjacent_territories);

  if (error) {
    console.error("Error fetching adjacent territories:", error);
    throw error;
  }

  return data || [];
}

// ================================
// Territory Control Functions
// ================================

export async function getTerritoryControl(
  territoryId: string
): Promise<TerritoryControl | null> {
  try {
    // Get raw territory control data (without family join)
    const { data: controlData, error } = await supabase
      .from("territory_control")
      .select(
        `
        *,
        territory:territories(*)
      `
      )
      .eq("territory_id", territoryId)
      .single();

    if (error) {
      console.error("Error fetching territory control:", error);
      return null;
    }

    if (!controlData) return null;

    // Get family data using existing family system
    let controllingFamily = undefined;
    if (controlData.controlling_family_id) {
      const familyData = await getFamilyById(controlData.controlling_family_id);
      if (familyData) {
        controllingFamily = {
          id: familyData.id,
          name: familyData.name,
          display_name: familyData.display_name,
          color_hex: familyData.color_hex,
        };
      }
    }

    return {
      ...controlData,
      controlling_family: controllingFamily,
    };
  } catch (error) {
    console.error("Error in getTerritoryControl:", error);
    return null;
  }
}

export async function getFamilyTerritories(
  familyId: string
): Promise<TerritoryControl[]> {
  try {
    // Get raw territory control data
    const { data, error } = await supabase
      .from("territory_control")
      .select(
        `
        *,
        territory:territories(*)
      `
      )
      .eq("controlling_family_id", familyId)
      .order("controlled_since", { ascending: false });

    if (error) {
      console.error("Error fetching family territories:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // Get family data using existing family system
    const familyData = await getFamilyById(familyId);
    const familyInfo = familyData ? {
      id: familyData.id,
      name: familyData.name,
      display_name: familyData.display_name,
      color_hex: familyData.color_hex,
    } : undefined;

    // Add family data to each territory control
    return data.map(control => ({
      ...control,
      controlling_family: familyInfo,
    }));
  } catch (error) {
    console.error("Error in getFamilyTerritories:", error);
    return [];
  }
}

export async function getAllTerritoryControls(): Promise<TerritoryControl[]> {
  try {
    const { data, error } = await supabase
      .from("territory_control")
      .select(
        `
        *,
        territory:territories(*)
      `
      )
      .order("controlled_since", { ascending: false });

    if (error) {
      console.error("Error fetching territory controls:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // Get unique family IDs
    const familyIds = [...new Set(data.map(control => control.controlling_family_id))];

    // Batch get family data
    const familyDataMap = new Map();
    await Promise.all(
      familyIds.map(async (familyId) => {
        const familyData = await getFamilyById(familyId);
        if (familyData) {
          familyDataMap.set(familyId, {
            id: familyData.id,
            name: familyData.name,
            display_name: familyData.display_name,
            color_hex: familyData.color_hex,
          });
        }
      })
    );

    // Add family data to each territory control
    return data.map(control => ({
      ...control,
      controlling_family: familyDataMap.get(control.controlling_family_id),
    }));
  } catch (error) {
    console.error("Error in getAllTerritoryControls:", error);
    return [];
  }
}

export async function updateTerritoryControl(
  territoryId: string,
  updates: Partial<TerritoryControl>
): Promise<TerritoryControl | null> {
  const { data, error } = await supabase
    .from("territory_control")
    .update(updates)
    .eq("territory_id", territoryId)
    .select(
      `
      *,
      territory:territories(*),
      controlling_family:families(id, name, display_name, color_hex)
    `
    )
    .single();

  if (error) {
    console.error("Error updating territory control:", error);
    return null;
  }

  return data;
}

// ================================
// War Management Functions
// ================================

export async function declareWar(
  playerId: string,
  request: DeclareWarRequest
): Promise<DeclareWarResponse> {
  try {
    // Check family permissions first using existing family system
    const canDeclareWars = await checkFamilyPermission(playerId, 'can_declare_wars');
    if (!canDeclareWars.has_permission) {
      return {
        success: false,
        error: canDeclareWars.error_message || "Insufficient permissions to declare war",
      };
    }

    // Get current territory control to determine defending family
    const territoryControl = await getTerritoryControl(request.territory_id);
    if (!territoryControl) {
      return {
        success: false,
        error: "Territory not found or not controlled by any family",
      };
    }

    // Prevent self-declaration
    if (
      territoryControl.controlling_family_id === request.attacking_family_id
    ) {
      return {
        success: false,
        error: "Cannot declare war on your own territory",
      };
    }

    // Check if war already exists for this territory
    const existingWar = await getActiveWarForTerritory(request.territory_id);
    if (existingWar) {
      return {
        success: false,
        error: "Territory is already under attack",
      };
    }

    // Create new war
    const { data, error } = await supabase
      .from("territory_wars")
      .insert({
        territory_id: request.territory_id,
        attacking_family_id: request.attacking_family_id,
        defending_family_id: territoryControl.controlling_family_id,
        current_phase: "scouting" as ContestPhase,
        phase_started_at: new Date().toISOString(),
        phase_duration_hours: 6, // Default scouting duration
        attacking_pressure: 0,
        defending_pressure: 0,
        control_bar_position: 0,
        victory_threshold: 50,
        stalemate_timer: 48,
        metadata: {},
      })
      .select('*')
      .single();

    if (error) {
      console.error("Error creating war:", error);
      return {
        success: false,
        error: "Failed to declare war",
      };
    }

    // Update territory control to mark as under attack
    await updateTerritoryControl(request.territory_id, {
      under_attack: true,
      contest_phase: "scouting",
      contest_expires_at: new Date(
        Date.now() + 6 * 60 * 60 * 1000
      ).toISOString(), // 6 hours from now
    });

    // Log family activity using existing family system
    await logFamilyActivity({
      family_id: request.attacking_family_id,
      player_id: playerId,
      activity_type: 'war_declared',
      activity_title: 'War Declared',
      activity_description: `War declared on territory: ${territoryControl.territory?.display_name}`,
      territory_id: request.territory_id,
      target_family_id: territoryControl.controlling_family_id,
      reputation_impact: 0,
      treasury_impact: 0,
      respect_impact: 5,
      metadata: { war_id: data.id },
      is_public: true,
    });

    // Get family data for response
    const [attackingFamily, defendingFamily, territory] = await Promise.all([
      getFamilyById(request.attacking_family_id),
      getFamilyById(territoryControl.controlling_family_id),
      getTerritory(request.territory_id),
    ]);

    const enrichedWarData: TerritoryWar = {
      ...data,
      territory,
      attacking_family: attackingFamily ? {
        id: attackingFamily.id,
        name: attackingFamily.name,
        display_name: attackingFamily.display_name,
        color_hex: attackingFamily.color_hex,
      } : undefined,
      defending_family: defendingFamily ? {
        id: defendingFamily.id,
        name: defendingFamily.name,
        display_name: defendingFamily.display_name,
        color_hex: defendingFamily.color_hex,
      } : undefined,
    };

    return {
      success: true,
      war: enrichedWarData,
    };
  } catch (error) {
    console.error("Error in declareWar:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function getActiveWars(): Promise<TerritoryWar[]> {
  const { data, error } = await supabase
    .from("territory_wars_full")
    .select("*")
    .is("winner_family_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active wars:", error);
    throw error;
  }

  // Map the view data to match TerritoryWar interface
  return (data || []).map(war => ({
    ...war,
    attacking_family: {
      id: war.attacking_family_id,
      name: war.attacking_family_name,
      display_name: war.attacking_family_display_name,
      color_hex: war.attacking_family_color,
    },
    defending_family: {
      id: war.defending_family_id,
      name: war.defending_family_name,
      display_name: war.defending_family_display_name,
      color_hex: war.defending_family_color,
    },
    territory: {
      id: war.territory_id,
      name: war.territory_name,
      display_name: war.territory_display_name,
      territory_type: war.territory_type,
    }
  }));
}

export async function getWarsByFamily(
  familyId: string
): Promise<TerritoryWar[]> {
  const { data, error } = await supabase
    .from("territory_wars_full")
    .select("*")
    .or(`attacking_family_id.eq.${familyId},defending_family_id.eq.${familyId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wars by family:", error);
    throw error;
  }

  // Map the view data to match TerritoryWar interface
  return (data || []).map(war => ({
    ...war,
    attacking_family: {
      id: war.attacking_family_id,
      name: war.attacking_family_name,
      display_name: war.attacking_family_display_name,
      color_hex: war.attacking_family_color,
    },
    defending_family: {
      id: war.defending_family_id,
      name: war.defending_family_name,
      display_name: war.defending_family_display_name,
      color_hex: war.defending_family_color,
    },
    territory: {
      id: war.territory_id,
      name: war.territory_name,
      display_name: war.territory_display_name,
      territory_type: war.territory_type,
    }
  }));
}

export async function getWar(warId: string): Promise<TerritoryWar | null> {
  const { data, error } = await supabase
    .from("territory_wars_full")
    .select("*")
    .eq("id", warId)
    .single();

  if (error) {
    console.error("Error fetching war:", error);
    return null;
  }

  if (!data) return null;

  // Map the view data to match TerritoryWar interface
  return {
    ...data,
    attacking_family: {
      id: data.attacking_family_id,
      name: data.attacking_family_name,
      display_name: data.attacking_family_display_name,
      color_hex: data.attacking_family_color,
    },
    defending_family: {
      id: data.defending_family_id,
      name: data.defending_family_name,
      display_name: data.defending_family_display_name,
      color_hex: data.defending_family_color,
    },
    territory: {
      id: data.territory_id,
      name: data.territory_name,
      display_name: data.territory_display_name,
      territory_type: data.territory_type,
    }
  };
}

export async function getActiveWarForTerritory(
  territoryId: string
): Promise<TerritoryWar | null> {
  const { data, error } = await supabase
    .from("territory_wars")
    .select(
      `
      *,
      territory:territories(*),
      attacking_family:families(id, name, display_name, color_hex),
      defending_family:families(id, name, display_name, color_hex)
    `
    )
    .eq("territory_id", territoryId)
    .is("winner_family_id", null)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching active war for territory:", error);
    return null;
  }

  return data || null;
}

export async function advanceWarPhase(warId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("advance_war_phase", {
    war_uuid: warId,
  });

  if (error) {
    console.error("Error advancing war phase:", error);
    return false;
  }

  return data as boolean;
}

// ================================
// War Participation Functions
// ================================

export async function participateInWar(
  request: ParticipateinWarRequest & { player_id: string; family_id: string }
): Promise<WarParticipationResponse> {
  try {
    // Get or create participation record
    let participation = await getWarParticipation(
      request.war_id,
      request.player_id
    );

    if (!participation) {
      const { data, error } = await supabase
        .from("war_participation")
        .insert({
          war_id: request.war_id,
          player_id: request.player_id,
          family_id: request.family_id,
          contribution_score: 0,
          missions_completed: 0,
          supplies_provided: 0,
          guard_duty_hours: 0,
          last_action_at: new Date().toISOString(),
          total_actions: 0,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error creating war participation:", error);
        return { success: false, error: "Failed to join war" };
      }

      participation = data;
    }

    // Update participation based on action type
    let pressureChange = 0;
    let contributionPoints = 0;

    switch (request.action_type) {
      case "scout":
        pressureChange = 2;
        contributionPoints = 5;
        break;
      case "sabotage":
        pressureChange = 5;
        contributionPoints = 10;
        break;
      case "attack":
        pressureChange = 10;
        contributionPoints = 15;
        break;
      case "defend":
        pressureChange = -5; // Defensive pressure
        contributionPoints = 8;
        break;
      case "supply":
        pressureChange = 3;
        contributionPoints = 6;
        break;
    }

    // Update participation record
    const { error: updateError } = await supabase
      .from("war_participation")
      .update({
        contribution_score:
          participation.contribution_score + contributionPoints,
        total_actions: participation.total_actions + 1,
        last_action_at: new Date().toISOString(),
        missions_completed:
          request.action_type === "sabotage" || request.action_type === "scout"
            ? participation.missions_completed + 1
            : participation.missions_completed,
        supplies_provided:
          request.action_type === "supply"
            ? participation.supplies_provided + 1
            : participation.supplies_provided,
      })
      .eq("id", participation.id);

    if (updateError) {
      console.error("Error updating war participation:", updateError);
      return { success: false, error: "Failed to update participation" };
    }

    // Create war event
    await createWarEvent(
      request.war_id,
      request.player_id,
      request.action_type,
      pressureChange
    );

    // Update war pressure
    await updateWarPressure(request.war_id, request.family_id, pressureChange);

    return {
      success: true,
      pressure_change: pressureChange,
      contribution_points: contributionPoints,
      phase_advanced: false, // This would be determined by checking phase conditions
    };
  } catch (error) {
    console.error("Error in participateInWar:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function getWarParticipation(
  warId: string,
  playerId: string
): Promise<BattleParticipant | null> {
  const { data, error } = await supabase
    .from("war_participation")
    .select(
      `
      *,
      player:players(id, nickname, username, avatar_url)
    `
    )
    .eq("war_id", warId)
    .eq("player_id", playerId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching war participation:", error);
    return null;
  }

  return data;
}

export async function getWarParticipants(
  warId: string
): Promise<BattleParticipant[]> {
  const { data, error } = await supabase
    .from("war_participation")
    .select(
      `
      *,
      player:players(id, nickname, username, avatar_url)
    `
    )
    .eq("war_id", warId)
    .order("contribution_score", { ascending: false });

  if (error) {
    console.error("Error fetching war participants:", error);
    throw error;
  }

  return data || [];
}

// ================================
// War Events Functions
// ================================

async function createWarEvent(
  warId: string,
  playerId: string,
  eventType: string,
  pressureChange: number
): Promise<PressureEvent | null> {
  const war = await getWar(warId);
  if (!war) return null;

  const { data, error } = await supabase
    .from("war_events")
    .insert({
      war_id: warId,
      player_id: playerId,
      event_type: eventType,
      event_phase: war.current_phase,
      pressure_change: pressureChange,
      description: `Player performed ${eventType} action`,
      metadata: {},
    })
    .select(
      `
      *,
      player:players(id, nickname, avatar_url)
    `
    )
    .single();

  if (error) {
    console.error("Error creating war event:", error);
    return null;
  }

  return data;
}

export async function getWarEvents(
  warId: string,
  phase?: ContestPhase
): Promise<PressureEvent[]> {
  let query = supabase
    .from("war_events")
    .select(
      `
      *,
      player:players(id, nickname, avatar_url)
    `
    )
    .eq("war_id", warId)
    .order("created_at", { ascending: false });

  if (phase) {
    query = query.eq("event_phase", phase);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching war events:", error);
    throw error;
  }

  return data || [];
}

// ================================
// War Pressure Management
// ================================

async function updateWarPressure(
  warId: string,
  familyId: string,
  pressureChange: number
): Promise<void> {
  const war = await getWar(warId);
  if (!war) return;

  const isAttacking = war.attacking_family_id === familyId;

  const updates: Partial<TerritoryWar> = {};

  if (isAttacking) {
    updates.attacking_pressure = Math.max(
      0,
      war.attacking_pressure + Math.max(0, pressureChange)
    );
  } else {
    updates.defending_pressure = Math.max(
      0,
      war.defending_pressure + Math.max(0, Math.abs(pressureChange))
    );
  }

  // Update control bar position (-100 to +100)
  const netPressure =
    (updates.attacking_pressure || war.attacking_pressure) -
    (updates.defending_pressure || war.defending_pressure);
  updates.control_bar_position = Math.max(-100, Math.min(100, netPressure));

  const { error } = await supabase
    .from("territory_wars")
    .update(updates)
    .eq("id", warId);

  if (error) {
    console.error("Error updating war pressure:", error);
  }
}

// ================================
// Sabotage Mission Functions
// ================================

export async function getSabotageMissions(
  warId: string
): Promise<SabotageMission[]> {
  const { data, error } = await supabase
    .from("sabotage_missions")
    .select("*")
    .eq("war_id", warId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching sabotage missions:", error);
    throw error;
  }

  return data || [];
}

export async function executeSabotageMission(
  missionId: string,
  playerId: string,
  warId: string
): Promise<MissionExecution | null> {
  const mission = await supabase
    .from("sabotage_missions")
    .select("*")
    .eq("id", missionId)
    .single();

  if (mission.error) {
    console.error("Error fetching mission:", mission.error);
    return null;
  }

  // Calculate success based on mission success rate
  const success = Math.random() < mission.data.success_rate / 100;
  const energySpent = mission.data.energy_cost;
  const pressureGenerated = success ? mission.data.pressure_impact : 0;
  const sabotagePointsEarned = success ? mission.data.sabotage_points : 0;

  const { data, error } = await supabase
    .from("mission_executions")
    .insert({
      mission_id: missionId,
      player_id: playerId,
      war_id: warId,
      success,
      energy_spent: energySpent,
      pressure_generated: pressureGenerated,
      sabotage_points_earned: sabotagePointsEarned,
      execution_details: {
        mission_name: mission.data.name,
        risk_level: mission.data.risk_level,
      },
      consequences: success ? {} : { heat_gained: mission.data.risk_level * 2 },
    })
    .select(
      `
      *,
      mission:sabotage_missions(*),
      player:players(id, nickname, avatar_url)
    `
    )
    .single();

  if (error) {
    console.error("Error executing mission:", error);
    return null;
  }

  // Update mission completion count
  await supabase
    .from("sabotage_missions")
    .update({
      current_completions: mission.data.current_completions + 1,
    })
    .eq("id", missionId);

  return data;
}

// ================================
// Territory Income Functions
// ================================

export async function calculateTerritoryIncome(
  territoryId: string,
  hours: number = 1.0
): Promise<TerritoryIncomeCalculation | null> {
  const { data, error } = await supabase.rpc("calculate_territory_income", {
    territory_uuid: territoryId,
    hours_elapsed: hours,
  });

  if (error) {
    console.error("Error calculating territory income:", error);
    return null;
  }

  return data[0] as TerritoryIncomeCalculation;
}

export async function processTerritoryPayouts(): Promise<boolean> {
  const { error } = await supabase.rpc("process_territory_income");

  if (error) {
    console.error("Error processing territory payouts:", error);
    return false;
  }

  return true;
}

// Re-export family territory income functions
export { processFamilyTerritoryIncome, calculateFamilyTerritoryIncome } from './family-data';

export async function getTerritoryIncomeHistory(
  territoryId: string,
  days: number = 7
): Promise<TerritoryIncomeHistory[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("territory_income_history")
    .select("*")
    .eq("territory_id", territoryId)
    .gte("income_period_start", cutoffDate.toISOString())
    .order("income_period_start", { ascending: false });

  if (error) {
    console.error("Error fetching territory income history:", error);
    throw error;
  }

  return data || [];
}

export async function getFamilyTerritoryReport(
  familyId: string
): Promise<FamilyTerritoryReport | null> {
  try {
    const territories = await getFamilyTerritories(familyId);

    const territoryDetails: TerritoryIncomeReport[] = await Promise.all(
      territories.map(async (control) => {
        const income = await calculateTerritoryIncome(control.territory_id, 24); // 24 hours

        return {
          territory_id: control.territory_id,
          territory_name: control.territory?.name || "Unknown",
          gross_income: income?.gross_income || 0,
          maintenance_costs: income?.maintenance_cost || 0,
          net_income: income?.net_income || 0,
          control_percentage: control.control_percentage,
          bonuses_applied: control.territory?.special_bonuses || [],
        };
      })
    );

    const totalGrossIncome = territoryDetails.reduce(
      (sum, t) => sum + t.gross_income,
      0
    );
    const totalMaintenance = territoryDetails.reduce(
      (sum, t) => sum + t.maintenance_costs,
      0
    );
    const totalNetIncome = territoryDetails.reduce(
      (sum, t) => sum + t.net_income,
      0
    );

    return {
      total_territories: territories.length,
      total_gross_income: totalGrossIncome,
      total_maintenance: totalMaintenance,
      total_net_income: totalNetIncome,
      territory_details: territoryDetails,
      last_calculated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating family territory report:", error);
    return null;
  }
}
