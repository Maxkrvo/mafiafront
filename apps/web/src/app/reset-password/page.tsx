"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase/client";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary.dark} 0%,
    ${({ theme }) => theme.colors.primary.charcoal} 100%
  );
`;

const FormContainer = styled.div`
  max-width: 400px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing["2xl"]};
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.primary.gold};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
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

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
  background: linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.primary.gold},
    #f4d03f
  );
  color: ${({ theme }) => theme.colors.primary.dark};
  border: none;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.neutral.cream};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

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

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Handle the auth callback and check for password reset session
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash which contains the auth tokens
        console.log("Full URL:", window.location.href);
        console.log("Hash:", window.location.hash);

        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        console.log(
          "All hash params:",
          Object.fromEntries(hashParams.entries())
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // If we have tokens and it's a recovery type, validate them directly
        if (accessToken && refreshToken && type === "recovery") {
          console.log("Found recovery tokens, validating...");
          console.log("Token lengths:", {
            accessToken: accessToken?.length,
            refreshToken: refreshToken?.length,
            type,
          });

          // For password reset, we can validate the tokens are present and properly formatted
          // The actual session validation will happen when updateUser is called
          if (
            accessToken &&
            refreshToken &&
            accessToken.length > 5 &&
            refreshToken.length > 5
          ) {
            console.log("Tokens appear valid, setting validSession to true");
            setValidSession(true);

            // Tokens validated - ready for password reset
            console.log("Tokens validated successfully for password reset");
          } else {
            console.log("Invalid token format:", { accessToken, refreshToken });
            setValidSession(false);
          }
        } else {
          // Check if we already have a valid session (user navigated back)
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setValidSession(!!session);
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        setValidSession(false);
      }
    };

    handleAuthCallback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    console.log("9");
    try {
      console.log("Starting password update...");

      // Get tokens from URL hash for direct API call
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      
      if (!accessToken) {
        setError("Session expired. Please request a new password reset link.");
        return;
      }

      console.log("Making direct API call to update password...");
      
      // Use fetch directly to call Supabase REST API
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          password: password
        })
      });

      console.log("API Response status:", response.status);
      
      const result = await response.json();
      console.log("Password update result:", result);

      if (!response.ok) {
        const errorMessage = result?.error?.message || result?.msg || 'Password update failed';
        setError(errorMessage);
      } else {
        console.log("Password updated successfully");
        setSuccess(true);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      console.error("Exception during password update:", err);
      setError(
        `Update failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    router.push("/");
  };

  console.log("Current validSession state:", validSession);

  if (validSession === null) {
    return (
      <Container>
        <FormContainer>
          <Title>Loading...</Title>
        </FormContainer>
      </Container>
    );
  }

  if (validSession === false) {
    return (
      <Container>
        <FormContainer>
          <Title>Invalid Reset Link</Title>
          <ErrorMessage>
            This password reset link is invalid or has expired. Please request a
            new one.
          </ErrorMessage>
          <LinkButton onClick={handleReturnToLogin}>
            Return to Sign In
          </LinkButton>
        </FormContainer>
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <FormContainer>
          <Title>Password Updated</Title>
          <SuccessMessage>
            Your password has been successfully updated! You will be redirected
            to the home page shortly.
          </SuccessMessage>
          <LinkButton onClick={handleReturnToLogin}>
            Continue to Home
          </LinkButton>
        </FormContainer>
      </Container>
    );
  }

  return (
    <Container>
      <FormContainer>
        <Title>Reset Your Password</Title>
        <Description>
          Enter your new password below. Make sure it&apos;s at least 6
          characters long.
        </Description>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
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
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>

          <LinkButton type="button" onClick={handleReturnToLogin}>
            Cancel and Return to Sign In
          </LinkButton>
        </Form>
      </FormContainer>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <FormContainer>
            <Title>Loading...</Title>
          </FormContainer>
        </Container>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
