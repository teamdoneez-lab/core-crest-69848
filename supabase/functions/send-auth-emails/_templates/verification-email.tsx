import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface VerificationEmailProps {
  confirmationUrl: string;
}

export const VerificationEmail = ({
  confirmationUrl,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Please verify your DoneEZ email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hi there,</Heading>
        <Text style={text}>
          To protect your account and complete your DoneEZ registration, please verify your email address by clicking below:
        </Text>
        <Section style={buttonContainer}>
          <Link
            href={confirmationUrl}
            target="_blank"
            style={button}
          >
            Verify My Email
          </Link>
        </Section>
        <Text style={text}>
          If you didn't request this, you can safely ignore this message.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Thanks,<br />
          The DoneEZ Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

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

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
  padding: '0 48px',
};

const buttonContainer = {
  padding: '0 48px',
  margin: '20px 0',
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
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
