'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type {
  TerritoryWar,
  BattleParticipant,
  PressureEvent,
} from '../../lib/supabase/territory-types';
import { getWarParticipants, getWarEvents } from '../../lib/territory-data';

interface WarStatusProps {
  war: TerritoryWar;
  playerFamilyId?: string;
}

const WarContainer = styled.div`
  background: linear-gradient(135deg, #2c1810 0%, #3d2317 100%);
  border-radius: 12px;
  border: 2px solid #8b0000;
  padding: 20px;
  margin-bottom: 20px;
`;

const WarHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #8b0000;
`;

const WarTitle = styled.h3`
  color: #ff6666;
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const PhaseIndicator = styled.div<{ phase: string }>`
  background: ${props => {
    switch (props.phase) {
      case 'scouting': return 'linear-gradient(135deg, #4682b4, #5f9ea0)';
      case 'sabotage': return 'linear-gradient(135deg, #ffa500, #ff8c00)';
      case 'showdown': return 'linear-gradient(135deg, #ff0000, #dc143c)';
      case 'consolidation': return 'linear-gradient(135deg, #32cd32, #228b22)';
      default: return 'linear-gradient(135deg, #666, #888)';
    }
  }};
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BattleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const FamilyTag = styled.div<{ color: string; isPlayer: boolean }>`
  background: ${props => props.color}22;
  border: 2px solid ${props => props.isPlayer ? props.color : `${props.color}66`};
  color: ${props => props.color};
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  flex: 1;
  ${props => props.isPlayer && `
    box-shadow: 0 0 10px ${props.color}44;
  `}
`;

const VersusIndicator = styled.div`
  color: #ff6666;
  font-size: 1.2rem;
  font-weight: 700;
`;

const ControlBarContainer = styled.div`
  margin: 20px 0;
`;

const ControlBarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #e0e0e0;
`;

const ControlBar = styled.div`
  height: 20px;
  background: linear-gradient(to right, #ff0000, #ffff00, #00ff00);
  border-radius: 10px;
  border: 2px solid #333;
  position: relative;
  overflow: hidden;
`;

const ControlIndicator = styled.div<{ position: number }>`
  position: absolute;
  top: -2px;
  left: calc(${props => ((props.position + 100) / 200) * 100}% - 2px);
  width: 4px;
  height: 24px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
`;

const ControlPosition = styled.div<{ position: number }>`
  text-align: center;
  margin-top: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => {
    if (props.position > 20) return '#00ff00';
    if (props.position < -20) return '#ff0000';
    return '#ffff00';
  }};
`;

const PressureStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 20px 0;
`;

const PressureStat = styled.div<{ isAttacking: boolean }>`
  background: ${props => props.isAttacking ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 128, 0, 0.1)'};
  border: 2px solid ${props => props.isAttacking ? '#ff000066' : '#00800066'};
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const PressureLabel = styled.div`
  color: #b8941f;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 5px;
`;

const PressureValue = styled.div`
  color: #e0e0e0;
  font-size: 1.2rem;
  font-weight: 700;
`;

const ParticipantsSection = styled.div`
  margin: 20px 0;
`;

const SectionTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const ParticipantItem = styled.div<{ isPlayerFamily: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.isPlayerFamily ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)'};
  border: 1px solid ${props => props.isPlayerFamily ? '#d4af37' : '#555'};
  border-radius: 6px;
  padding: 8px 12px;
`;

const ParticipantName = styled.div`
  color: #e0e0e0;
  font-weight: 500;
`;

const ParticipantScore = styled.div`
  color: #d4af37;
  font-weight: 600;
`;

const RecentEvents = styled.div`
  margin-top: 20px;
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #d4af37;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
`;

const EventTime = styled.span`
  color: #888;
  font-size: 0.75rem;
`;

const EventDescription = styled.div`
  color: #e0e0e0;
  margin-top: 3px;
`;

const LoadingText = styled.div`
  color: #d4af37;
  text-align: center;
  padding: 20px;
  font-style: italic;
`;

const WarStatus: React.FC<WarStatusProps> = ({
  war,
  playerFamilyId,
}) => {
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [recentEvents, setRecentEvents] = useState<PressureEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWarData = async () => {
    try {
      setLoading(true);
      const [participantsData, eventsData] = await Promise.all([
        getWarParticipants(war.id),
        getWarEvents(war.id),
      ]);

      setParticipants(participantsData);
      setRecentEvents(eventsData.slice(0, 10)); // Show last 10 events
    } catch (error) {
      console.error('Error loading war data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarData();
  }, [war.id]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventTime = new Date(dateString);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'scouting':
        return 'Intelligence gathering phase - scouts are assessing enemy defenses';
      case 'sabotage':
        return 'Sabotage phase - weakening enemy infrastructure and morale';
      case 'showdown':
        return 'Active combat phase - the decisive battle is underway';
      case 'consolidation':
        return 'Securing control - establishing new territorial authority';
      default:
        return 'War phase unknown';
    }
  };

  const isPlayerAttacking = playerFamilyId === war.attacking_family_id;
  const isPlayerDefending = playerFamilyId === war.defending_family_id;

  if (loading) {
    return (
      <WarContainer>
        <LoadingText>Loading war status...</LoadingText>
      </WarContainer>
    );
  }

  return (
    <WarContainer>
      <WarHeader>
        <WarTitle>
          ⚔️ Territory War
          <PhaseIndicator phase={war.current_phase}>
            {war.current_phase}
          </PhaseIndicator>
        </WarTitle>
        <div style={{ color: '#ccc', fontSize: '0.9rem', fontStyle: 'italic' }}>
          {getPhaseDescription(war.current_phase)}
        </div>
      </WarHeader>

      <BattleInfo>
        <FamilyTag
          color={war.attacking_family?.color_hex || '#ff0000'}
          isPlayer={isPlayerAttacking}
        >
          {war.attacking_family?.display_name || 'Unknown'}
          {isPlayerAttacking && ' (You)'}
        </FamilyTag>
        <VersusIndicator>VS</VersusIndicator>
        <FamilyTag
          color={war.defending_family?.color_hex || '#0000ff'}
          isPlayer={isPlayerDefending}
        >
          {war.defending_family?.display_name || 'Unknown'}
          {isPlayerDefending && ' (You)'}
        </FamilyTag>
      </BattleInfo>

      <PressureStats>
        <PressureStat isAttacking={true}>
          <PressureLabel>Attacking Pressure</PressureLabel>
          <PressureValue>{war.attacking_pressure}</PressureValue>
        </PressureStat>
        <PressureStat isAttacking={false}>
          <PressureLabel>Defending Pressure</PressureLabel>
          <PressureValue>{war.defending_pressure}</PressureValue>
        </PressureStat>
      </PressureStats>

      <ControlBarContainer>
        <ControlBarLabel>
          <span>Defender Advantage</span>
          <span>Attacker Advantage</span>
        </ControlBarLabel>
        <ControlBar>
          <ControlIndicator position={war.control_bar_position} />
        </ControlBar>
        <ControlPosition position={war.control_bar_position}>
          {war.control_bar_position > 0 ? '+' : ''}{war.control_bar_position}
        </ControlPosition>
      </ControlBarContainer>

      <ParticipantsSection>
        <SectionTitle>Top Contributors</SectionTitle>
        <ParticipantsList>
          {participants.slice(0, 8).map((participant) => (
            <ParticipantItem
              key={participant.id}
              isPlayerFamily={participant.family_id === playerFamilyId}
            >
              <ParticipantName>
                {participant.player?.nickname || 'Unknown Player'}
              </ParticipantName>
              <ParticipantScore>
                {participant.contribution_score} pts
              </ParticipantScore>
            </ParticipantItem>
          ))}
          {participants.length === 0 && (
            <ParticipantItem isPlayerFamily={false}>
              <ParticipantName style={{ color: '#888', fontStyle: 'italic' }}>
                No participants yet
              </ParticipantName>
            </ParticipantItem>
          )}
        </ParticipantsList>
      </ParticipantsSection>

      <RecentEvents>
        <SectionTitle>Recent Activity</SectionTitle>
        <EventsList>
          {recentEvents.map((event) => (
            <EventItem key={event.id}>
              <EventTime>{formatTimeAgo(event.created_at)}</EventTime>
              <EventDescription>
                {event.player?.nickname || 'A player'} performed {event.event_type}
                {event.pressure_change !== 0 && (
                  <span style={{
                    color: event.pressure_change > 0 ? '#00ff00' : '#ff0000',
                    fontWeight: 600,
                    marginLeft: '5px'
                  }}>
                    ({event.pressure_change > 0 ? '+' : ''}{event.pressure_change})
                  </span>
                )}
              </EventDescription>
            </EventItem>
          ))}
          {recentEvents.length === 0 && (
            <EventItem>
              <EventDescription style={{ color: '#888', fontStyle: 'italic' }}>
                No recent activity
              </EventDescription>
            </EventItem>
          )}
        </EventsList>
      </RecentEvents>
    </WarContainer>
  );
};

export default WarStatus;