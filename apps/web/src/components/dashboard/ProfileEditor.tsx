'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/lib/supabase/types';

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all ${({ theme }) => theme.transitions.normal};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalContent = styled.div<{ $isOpen: boolean }>`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  max-width: 500px;
  width: 100%;
  transform: ${({ $isOpen }) => ($isOpen ? 'scale(1)' : 'scale(0.9)')};
  transition: transform ${({ theme }) => theme.transitions.normal};
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.smoke};
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.primary.gold};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.gold}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.ash};
  }
`;

const TextArea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.gold};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.gold}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.ash};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
  
  ${({ $variant, theme }) => $variant === 'secondary' ? `
    background: transparent;
    color: ${theme.colors.neutral.silver};
    border: 1px solid ${theme.colors.neutral.smoke};
    
    &:hover:not(:disabled) {
      background: ${theme.colors.neutral.smoke}20;
      border-color: ${theme.colors.neutral.silver};
    }
  ` : `
    background: linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f);
    color: ${theme.colors.primary.dark};
    border: none;
    
    &:hover:not(:disabled) {
      background: ${theme.colors.neutral.cream};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.lg};
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.error}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.success};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.semantic.success}20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.semantic.success};
`;

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditor({ isOpen, onClose }: ProfileEditorProps) {
  const { player, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    nickname: player?.nickname || '',
    famiglia_name: player?.famiglia_name || '',
    bio: player?.bio || '',
    avatar_url: player?.avatar_url || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (player) {
      setFormData({
        nickname: player.nickname,
        famiglia_name: player.famiglia_name || '',
        bio: player.bio || '',
        avatar_url: player.avatar_url || '',
      });
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!formData.nickname.trim()) {
      setError('Nickname is required');
      setLoading(false);
      return;
    }

    if (formData.nickname.length < 3 || formData.nickname.length > 20) {
      setError('Nickname must be between 3 and 20 characters');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-\s]+$/.test(formData.nickname)) {
      setError('Nickname can only contain letters, numbers, spaces, underscores, and hyphens');
      setLoading(false);
      return;
    }

    try {
      const updates: Partial<Player> = {
        nickname: formData.nickname,
        famiglia_name: formData.famiglia_name || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
      };

      const { error } = await updateProfile(updates);
      
      if (error) {
        if ((error as { code?: string }).code === '23505') {
          setError('Username is already taken');
        } else {
          setError(error.message || 'Failed to update profile');
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent $isOpen={isOpen}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <Title>Edit Profile</Title>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Tony Soprano"
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="famiglia_name">Famiglia Name</Label>
            <Input
              id="famiglia_name"
              type="text"
              value={formData.famiglia_name}
              onChange={(e) => setFormData(prev => ({ ...prev, famiglia_name: e.target.value }))}
              placeholder="MafiaFront Soprano"
              disabled={loading}
              maxLength={100}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="bio">Bio</Label>
            <TextArea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about your famiglia..."
              disabled={loading}
              maxLength={500}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
              disabled={loading}
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>Profile updated successfully!</SuccessMessage>}

          <ButtonContainer>
            <Button type="button" $variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </Modal>
  );
}