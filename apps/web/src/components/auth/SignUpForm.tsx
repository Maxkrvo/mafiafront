'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';

const FormContainer = styled.div`
  max-width: 400px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
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
    color: ${theme.colors.primary.gold};
    border: 1px solid ${theme.colors.primary.gold};
    
    &:hover:not(:disabled) {
      background: ${theme.colors.primary.gold}20;
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

const LinkButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.gold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-decoration: underline;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.md};
  align-self: center;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral.cream};
  }
`;

const PasswordStrength = styled.div<{ $strength: number }>`
  height: 4px;
  background: ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.xs};
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $strength }) => $strength}%;
    background: ${({ $strength, theme }) => 
      $strength < 30 ? theme.colors.semantic.error :
      $strength < 70 ? theme.colors.semantic.warning :
      theme.colors.semantic.success
    };
    transition: width ${({ theme }) => theme.transitions.fast};
  }
`;

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const { signUp } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const validateForm = () => {
    if (!nickname || !email || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }

    if (nickname.length < 3) {
      return 'Nickname must be at least 3 characters long';
    }

    if (nickname.length > 20) {
      return 'Nickname must be less than 20 characters';
    }

    if (!/^[a-zA-Z0-9_-\s]+$/.test(nickname)) {
      return 'Nickname can only contain letters, numbers, spaces, underscores, and hyphens';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (calculatePasswordStrength(password) < 50) {
      return 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, nickname);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormContainer>
        <Title>Welcome to the Family</Title>
        <SuccessMessage>
          Please check your email to verify your account before signing in.
        </SuccessMessage>
        <LinkButton onClick={onSwitchToLogin}>
          Return to Sign In
        </LinkButton>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <Title>Join the Family</Title>
      
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tony Soprano"
            required
            disabled={loading}
            minLength={3}
            maxLength={20}
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@famiglia.com"
            required
            disabled={loading}
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
          />
          <PasswordStrength $strength={calculatePasswordStrength(password)} />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
          />
        </InputGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Join the Family'}
        </Button>

        <LinkButton type="button" onClick={onSwitchToLogin}>
          Already a member? Sign In
        </LinkButton>
      </Form>
    </FormContainer>
  );
}