import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail = ({
  userName,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to DoneEZ - You're all set!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hi {userName},</Heading>
        <Text style={highlight}>
          You're all set. High five! 🎉
        </Text>
        <Text style={text}>
          Thanks for joining DoneEZ! Managing your bookings and quotes has never been easier, all from one convenient place.
        </Text>
        <Text style={text}>
          If you experience any issues with your account or didn't sign up for DoneEZ, just reply to this email. We're here to help!
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Cheers,<br />
          The DoneEZ Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 48px',
};

const highlight = {
  color: '#7c3aed',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 20px',
  padding: '0 48px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 48px',
};
