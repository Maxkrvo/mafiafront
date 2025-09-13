"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

const Container = styled.div<{ $hasHeader?: boolean }>`
  min-height: ${({ $hasHeader }) =>
    $hasHeader ? "calc(100vh - 147px)" : "100vh"};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};

  background-image: url("/mainbackground2.png"),
    linear-gradient(
      to right,
      rgba(0, 0, 0, 0.6) 0%,
      /* Replace with your theme colors */ rgba(0, 0, 0, 0) 20%,
      rgba(0, 0, 0, 0) 80%,
      rgba(0, 0, 0, 0.6) 100%
    );
  background-position: center;
  background-size: contain, cover; /* First layer: image, second layer: gradient */
  background-repeat: no-repeat;
`;

const MainContent = styled.main`
  text-align: center;
  max-width: ${({ theme }) => theme.layout.maxWidth.lg};
  margin: 0 auto;
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize["5xl"]};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-shadow: ${({ theme }) => theme.shadows.glow};
  letter-spacing: 0.02em;
`;

const Subtitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize["2xl"]};
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
  font-style: italic;
`;

const QuoteSection = styled.section`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border-left: 4px solid ${({ theme }) => theme.colors.primary.gold};
  padding: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing["2xl"]} 0;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  opacity: 0.8;
`;

const Quote = styled.blockquote`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-style: italic;
  color: ${({ theme }) => theme.colors.neutral.cream};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const QuoteAuthor = styled.cite`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.primary.gold};
  font-style: normal;
  text-align: right;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing["2xl"]};
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: all ${({ theme }) => theme.transitions.normal};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${({ $variant, theme }) =>
    $variant === "primary"
      ? `
    background: linear-gradient(45deg, ${theme.colors.primary.gold}, #f4d03f);
    color: ${theme.colors.primary.dark};
    border: 2px solid transparent;
    
    &:hover {
      background: ${theme.colors.neutral.cream};
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.lg};
    }
  `
      : `
  background: ${theme.colors.primary.charcoal};
    color: ${theme.colors.primary.gold};
    border: 2px solid ${theme.colors.primary.gold};
    
    &:hover {
      background: ${theme.colors.primary.gold};
      color: ${theme.colors.primary.dark};
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.glow};
    }
  `}
`;

const Footer = styled.footer`
  margin-top: ${({ theme }) => theme.spacing["4xl"]};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.smoke};
  color: ${({ theme }) => theme.colors.neutral.silver};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const WelcomeMessage = styled.div`
  background: ${({ theme }) => theme.colors.primary.charcoal};
  border: 1px solid ${({ theme }) => theme.colors.primary.gold};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing["2xl"]} 0;
  text-align: center;
  opacity: 0.8;
`;

const PlayerName = styled.span`
  color: ${({ theme }) => theme.colors.primary.gold};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: ${({ theme }) => theme.typography.fontFamily.accent};
`;

const PlayerRank = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.silver};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export default function Home() {
  const { user, player, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  if (user && player) {
    return (
      <Container $hasHeader={true}>
        <MainContent>
          <Title>MafiaFront</Title>

          <WelcomeMessage>
            <Subtitle>
              Welcome back, <PlayerName>{player.nickname}</PlayerName>
            </Subtitle>
            <PlayerRank>
              Rank: {player.rank} | Reputation: {player.reputation_score}
            </PlayerRank>
          </WelcomeMessage>

          <QuoteSection>
            <Quote>
              &quot;The strength of a family, like the strength of an army, lies
              in its loyalty to each other.&quot;
            </Quote>
            <QuoteAuthor>— Mario Puzo</QuoteAuthor>
          </QuoteSection>

          <ButtonContainer>
            <Button $variant="secondary" onClick={handleSignOut}>
              Sign Out
            </Button>
          </ButtonContainer>
        </MainContent>

        <Footer>
          <p>Respect. Honor. Family.</p>
        </Footer>
      </Container>
    );
  }

  return (
    <Container $hasHeader={false}>
      <MainContent>
        <Title>MafiaFront</Title>
        <Subtitle>Welcome to the Family</Subtitle>

        <QuoteSection>
          <Quote>
            &quot;A man who doesn&apos;t spend time with his family can never be
            a real man.&quot;
          </Quote>
          <QuoteAuthor>— Don Vito Corleone</QuoteAuthor>
        </QuoteSection>

        <ButtonContainer>
          <Button $variant="primary" onClick={() => setIsAuthModalOpen(true)}>
            Enter the Family
          </Button>
          <Button $variant="secondary" onClick={() => setIsAuthModalOpen(true)}>
            Learn Our Ways
          </Button>
        </ButtonContainer>
      </MainContent>

      <Footer>
        <p>Respect. Honor. Family.</p>
      </Footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </Container>
  );
}
