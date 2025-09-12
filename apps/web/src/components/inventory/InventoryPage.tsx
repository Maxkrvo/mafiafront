'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlayerInventoryItem,
  ITEM_RARITIES
} from '@/lib/supabase/jobs-types';

const InventoryContainer = styled.div`
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

const TabsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  justify-content: center;
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
      $active ? theme.colors.primary.gold : theme.colors.primary.gold + '20'
    };
    color: ${({ $active, theme }) => 
      $active ? theme.colors.primary.dark : theme.colors.neutral.cream
    };
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const ItemCard = styled.div<{ $rarity: string; $equipped: boolean }>`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 2px solid ${({ $rarity }) => ITEM_RARITIES[$rarity as keyof typeof ITEM_RARITIES]?.borderColor || '#666666'};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $equipped }) => $equipped ? 1 : 0.8};
  box-shadow: ${({ $equipped, theme }) => 
    $equipped ? `0 0 20px ${theme.colors.primary.gold}40` : 'none'
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const ItemIcon = styled.div`
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const ItemName = styled.h3<{ $rarity: string }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ $rarity }) => ITEM_RARITIES[$rarity as keyof typeof ITEM_RARITIES]?.color || '#ffffff'};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const ItemDescription = styled.p`
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const ItemStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatBadge = styled.div<{ $type: 'attack' | 'defense' | 'value' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'attack': return theme.colors.semantic.error + '20';
      case 'defense': return theme.colors.semantic.info + '20';
      case 'value': return theme.colors.primary.gold + '20';
    }
  }};
  color: ${({ $type, theme }) => {
    switch ($type) {
      case 'attack': return theme.colors.semantic.error;
      case 'defense': return theme.colors.semantic.info;
      case 'value': return theme.colors.primary.gold;
    }
  }};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ItemFlavorText = styled.p`
  color: ${({ theme }) => theme.colors.neutral.ash};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-style: italic;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  padding-top: ${({ theme }) => theme.spacing.md};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ $variant, theme }) => 
    $variant === 'primary' 
      ? `linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f)`
      : 'transparent'
  };
  color: ${({ $variant, theme }) => 
    $variant === 'primary' 
      ? theme.colors.primary.dark 
      : theme.colors.neutral.silver
  };
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $variant, theme }) => 
      $variant === 'primary' 
        ? theme.colors.neutral.cream 
        : theme.colors.primary.gold + '20'
    };
    color: ${({ $variant, theme }) => 
      $variant === 'primary' 
        ? theme.colors.primary.dark 
        : theme.colors.neutral.cream
    };
  }
`;

const EquippedBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary.gold};
  color: ${({ theme }) => theme.colors.primary.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['4xl']};
  color: ${({ theme }) => theme.colors.neutral.silver};
  
  h3 {
    font-family: ${({ theme }) => theme.typography.fontFamily.accent};
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    color: ${({ theme }) => theme.colors.primary.gold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

export function InventoryPage() {
  const { player } = useAuth();
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('player_inventory')
        .select(`
          *,
          item_template:item_templates(*)
        `)
        .eq('player_id', player!.id)
        .order('acquired_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [player]);

  useEffect(() => {
    if (player) {
      fetchInventory();
    }
  }, [player, fetchInventory]);

  const toggleEquipped = async (inventoryId: string, currentEquipped: boolean) => {
    try {
      const { error } = await supabase
        .from('player_inventory')
        .update({ is_equipped: !currentEquipped })
        .eq('id', inventoryId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh inventory
      fetchInventory();
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  };

  const sellItem = async (inventoryId: string, value: number) => {
    try {
      // Add money to player economics
      const { error: economicsError } = await supabase
        .from('player_economics')
        .update({ 
          cash_on_hand: supabase.raw(`cash_on_hand + ${value}`),
          total_earned: supabase.raw(`total_earned + ${value}`)
        })
        .eq('player_id', player!.id);

      if (economicsError) throw economicsError;

      // Remove item from inventory
      const { error: inventoryError } = await supabase
        .from('player_inventory')
        .delete()
        .eq('id', inventoryId);

      if (inventoryError) throw inventoryError;
      
      // Refresh inventory
      fetchInventory();
    } catch (error) {
      console.error('Error selling item:', error);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'equipped') return item.is_equipped;
    return item.item_template?.item_type === activeTab;
  });

  const tabs = [
    { key: 'all', label: 'All Items' },
    { key: 'equipped', label: 'Equipped' },
    { key: 'weapon', label: 'Weapons' },
    { key: 'protection', label: 'Protection' },
    { key: 'tool', label: 'Tools' },
    { key: 'consumable', label: 'Consumables' }
  ];

  if (loading) {
    return (
      <InventoryContainer>
        <Header>
          <Title>Loading inventory...</Title>
        </Header>
      </InventoryContainer>
    );
  }

  return (
    <InventoryContainer>
      <Header>
        <Title>Your Arsenal</Title>
        <Subtitle>Manage your equipment and valuables</Subtitle>
      </Header>

      <TabsContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabsContainer>

      {filteredInventory.length === 0 ? (
        <EmptyState>
          <h3>No Items Found</h3>
          <p>
            {activeTab === 'all' 
              ? 'Your inventory is empty. Complete jobs to earn loot and build your arsenal.'
              : `No ${activeTab} items in your inventory.`
            }
          </p>
        </EmptyState>
      ) : (
        <InventoryGrid>
          {filteredInventory.map((item) => {
            const template = item.item_template!;
            return (
              <ItemCard 
                key={item.id} 
                $rarity={template.rarity}
                $equipped={item.is_equipped}
              >
                {item.is_equipped && <EquippedBadge>Equipped</EquippedBadge>}
                
                <ItemIcon>{template.icon_name}</ItemIcon>
                <ItemName $rarity={template.rarity}>{template.name}</ItemName>
                <ItemDescription>{template.description}</ItemDescription>
                
                <ItemStats>
                  {template.attack_power > 0 && (
                    <StatBadge $type="attack">
                      ⚔️ {template.attack_power}
                    </StatBadge>
                  )}
                  {template.defense_power > 0 && (
                    <StatBadge $type="defense">
                      🛡️ {template.defense_power}
                    </StatBadge>
                  )}
                  {template.base_value > 0 && (
                    <StatBadge $type="value">
                      💰 ${template.base_value}
                    </StatBadge>
                  )}
                </ItemStats>

                {item.quantity > 1 && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <strong>Quantity: {item.quantity}</strong>
                  </div>
                )}

                {template.flavor_text && (
                  <ItemFlavorText>&quot;{template.flavor_text}&quot;</ItemFlavorText>
                )}

                <ActionButtons>
                  <ActionButton
                    $variant="primary"
                    onClick={() => toggleEquipped(item.id, item.is_equipped)}
                  >
                    {item.is_equipped ? 'Unequip' : 'Equip'}
                  </ActionButton>
                  <ActionButton
                    $variant="secondary"
                    onClick={() => sellItem(item.id, template.base_value)}
                  >
                    Sell
                  </ActionButton>
                </ActionButtons>
              </ItemCard>
            );
          })}
        </InventoryGrid>
      )}
    </InventoryContainer>
  );
}