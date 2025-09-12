'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
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
  transform: ${({ $isOpen }) => ($isOpen ? 'scale(1)' : 'scale(0.9)')};
  transition: transform ${({ theme }) => theme.transitions.normal};
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

const FormWrapper = styled.div`
  position: relative;
`;

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signup':
        return (
          <SignUpForm
            onSwitchToLogin={() => setMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSwitchToLogin={() => setMode('login')}
          />
        );
      default:
        return (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent $isOpen={isOpen}>
        <FormWrapper>
          <CloseButton onClick={onClose}>×</CloseButton>
          {renderForm()}
        </FormWrapper>
      </ModalContent>
    </ModalOverlay>
  );
}