'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import {
  createFamily,
  getFamilyCreationFee,
  validateFamilyName,
  type CreateFamilyRequest,
  type FamilyCreationFee
} from '@/lib/family-data';

const FormContainer = styled.div`
  max-width: 500px;
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
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary.gold};
`;

const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.neutral.silver};
  line-height: 1.5;
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

const Input = styled.input<{ $hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme, $hasError }) =>
    $hasError ? theme.colors.semantic.error : theme.colors.neutral.smoke
  };
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.semantic.error : theme.colors.primary.gold
    };
    box-shadow: 0 0 0 2px ${({ theme, $hasError }) =>
      $hasError ? theme.colors.semantic.error : theme.colors.primary.gold
    }20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.ash};
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme, $hasError }) =>
    $hasError ? theme.colors.semantic.error : theme.colors.neutral.smoke
  };
  border-radius: ${({ theme }) => theme.borders.radius.md};
  color: ${({ theme }) => theme.colors.neutral.cream};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  min-height: 100px;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.semantic.error : theme.colors.primary.gold
    };
    box-shadow: 0 0 0 2px ${({ theme, $hasError }) =>
      $hasError ? theme.colors.semantic.error : theme.colors.primary.gold
    }20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.ash};
  }
`;

const ColorPicker = styled.input`
  width: 60px;
  height: 40px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  background: transparent;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: ${({ theme }) => theme.borders.radius.sm};
  }
`;

const FeeDisplay = styled.div`
  background: ${({ theme }) => theme.colors.primary.dark};
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const FeeAmount = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FeeDetails = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  line-height: 1.4;
`;

const ValidationMessage = styled.div<{ $type: 'error' | 'success' | 'info' }>`
  color: ${({ theme, $type }) =>
    $type === 'error' ? theme.colors.semantic.error :
    $type === 'success' ? theme.colors.semantic.success :
    theme.colors.neutral.silver
  };
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme, $type }) =>
    $type === 'error' ? theme.colors.semantic.error :
    $type === 'success' ? theme.colors.semantic.success :
    theme.colors.neutral.silver
  }20;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  border: 1px solid ${({ theme, $type }) =>
    $type === 'error' ? theme.colors.semantic.error :
    $type === 'success' ? theme.colors.semantic.success :
    theme.colors.neutral.silver
  };
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

const CharacterCount = styled.div<{ $over?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme, $over }) =>
    $over ? theme.colors.semantic.error : theme.colors.neutral.ash
  };
  text-align: right;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

interface FamilyCreationFormProps {
  onSuccess?: (familyId: string) => void;
  onCancel?: () => void;
}

export function FamilyCreationForm({ onSuccess, onCancel }: FamilyCreationFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateFamilyRequest>({
    name: '',
    display_name: '',
    description: '',
    motto: '',
    color_hex: '#D4AF37'
  });
  const [nameValidation, setNameValidation] = useState<{ valid: boolean; message?: string }>({ valid: false });
  const [creationFee, setCreationFee] = useState<FamilyCreationFee | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  // Load creation fee on component mount
  useEffect(() => {
    loadCreationFee();
  }, []);

  // Validate family name on change with debounce
  useEffect(() => {
    if (!formData.name || formData.name.length < 3) {
      setNameValidation({ valid: false, message: 'Name must be at least 3 characters' });
      return;
    }

    const timeout = setTimeout(async () => {
      setCheckingName(true);
      try {
        const result = await validateFamilyName(formData.name);
        setNameValidation({
          valid: result.valid,
          message: result.error || (result.valid ? 'Name is available!' : undefined)
        });
      } catch (error) {
        setNameValidation({ valid: false, message: 'Error checking name availability' });
      } finally {
        setCheckingName(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.name]);

  const loadCreationFee = async () => {
    try {
      const fee = await getFamilyCreationFee();
      setCreationFee(fee);
    } catch (error) {
      console.error('Error loading creation fee:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Family name is required';
    if (!formData.display_name) newErrors.display_name = 'Display name is required';
    if (!nameValidation.valid) newErrors.name = nameValidation.message || 'Invalid family name';

    if (formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be 100 characters or less';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (formData.motto && formData.motto.length > 200) {
      newErrors.motto = 'Motto must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);
    try {
      const result = await createFamily(user.id, formData);

      if (result.success && result.family) {
        onSuccess?.(result.family.id);
      } else {
        setErrors({ submit: result.error || 'Failed to create family' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateFamilyRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <FormContainer>
      <Title>Establish Your Family</Title>
      <Subtitle>
        Create a powerful crime family and build your empire through territory control and strategic alliances.
      </Subtitle>

      {creationFee && (
        <FeeDisplay>
          <FeeAmount>${creationFee.final_fee.toLocaleString()}</FeeAmount>
          <FeeDetails>
            Creation Fee • {creationFee.existing_families_count} existing families
            <br />
            Base: ${creationFee.base_fee.toLocaleString()} × {creationFee.demand_multiplier.toFixed(2)} demand
          </FeeDetails>
        </FeeDisplay>
      )}

      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="name">Family Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="corleone_family"
            required
            disabled={loading}
            $hasError={!!errors.name}
            minLength={3}
            maxLength={50}
          />
          {checkingName && (
            <ValidationMessage $type="info">Checking availability...</ValidationMessage>
          )}
          {!checkingName && nameValidation.message && (
            <ValidationMessage $type={nameValidation.valid ? 'success' : 'error'}>
              {nameValidation.message}
            </ValidationMessage>
          )}
          {errors.name && <ValidationMessage $type="error">{errors.name}</ValidationMessage>}
        </InputGroup>

        <InputGroup>
          <Label htmlFor="display_name">Display Name *</Label>
          <Input
            id="display_name"
            type="text"
            value={formData.display_name}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            placeholder="The Corleone Family"
            required
            disabled={loading}
            $hasError={!!errors.display_name}
            maxLength={100}
          />
          <CharacterCount $over={formData.display_name.length > 100}>
            {formData.display_name.length}/100
          </CharacterCount>
          {errors.display_name && <ValidationMessage $type="error">{errors.display_name}</ValidationMessage>}
        </InputGroup>

        <InputGroup>
          <Label htmlFor="description">Family Description</Label>
          <TextArea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="A brief description of your family's background, values, and goals..."
            disabled={loading}
            $hasError={!!errors.description}
            maxLength={500}
          />
          <CharacterCount $over={(formData.description?.length || 0) > 500}>
            {formData.description?.length || 0}/500
          </CharacterCount>
          {errors.description && <ValidationMessage $type="error">{errors.description}</ValidationMessage>}
        </InputGroup>

        <InputGroup>
          <Label htmlFor="motto">Family Motto</Label>
          <Input
            id="motto"
            type="text"
            value={formData.motto || ''}
            onChange={(e) => handleInputChange('motto', e.target.value)}
            placeholder="Family first, always."
            disabled={loading}
            $hasError={!!errors.motto}
            maxLength={200}
          />
          <CharacterCount $over={(formData.motto?.length || 0) > 200}>
            {formData.motto?.length || 0}/200
          </CharacterCount>
          {errors.motto && <ValidationMessage $type="error">{errors.motto}</ValidationMessage>}
        </InputGroup>

        <InputGroup>
          <Label htmlFor="color">Family Colors</Label>
          <ColorPicker
            id="color"
            type="color"
            value={formData.color_hex || '#D4AF37'}
            onChange={(e) => handleInputChange('color_hex', e.target.value)}
            disabled={loading}
          />
          <ValidationMessage $type="info">
            Choose colors that will represent your family on the territory map
          </ValidationMessage>
        </InputGroup>

        {errors.submit && <ValidationMessage $type="error">{errors.submit}</ValidationMessage>}

        <Button type="submit" disabled={loading || !nameValidation.valid}>
          {loading ? 'Establishing Family...' : 'Establish Family'}
        </Button>

        {onCancel && (
          <Button type="button" $variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </Form>
    </FormContainer>
  );
}