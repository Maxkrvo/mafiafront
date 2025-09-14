'use client';

import React from 'react';
import styled from 'styled-components';
import { FamilyCreationForm } from './FamilyCreationForm';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalContent = styled.div`
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeInScale 0.3s ease-out;

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.primary.dark};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.neutral.smoke};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.colors.neutral.silver};
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -50px;
  right: 0;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-size: 24px;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral.cream}20;
    color: ${({ theme }) => theme.colors.primary.gold};
  }

  @media (max-width: 768px) {
    top: -10px;
    right: -10px;
    background: ${({ theme }) => theme.colors.primary.charcoal};
    border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  }
`;

interface FamilyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (familyId: string) => void;
}

export function FamilyCreationModal({ isOpen, onClose, onSuccess }: FamilyCreationModalProps) {
  if (!isOpen) return null;

  const handleSuccess = (familyId: string) => {
    onSuccess?.(familyId);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose} aria-label="Close modal">
          ×
        </CloseButton>
        <FamilyCreationForm
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </ModalContent>
    </ModalOverlay>
  );
}