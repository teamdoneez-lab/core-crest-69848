import { Navigation } from '@/components/Navigation';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-4xl p-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using DoneEZ, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use of Service</h2>
            <p className="text-muted-foreground mb-4">
              DoneEZ provides a platform connecting customers with automotive service professionals. You agree to use the 
              service only for lawful purposes and in accordance with these Terms.
            </p>
            <p className="text-muted-foreground">
              You are responsible for:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground">
              When you create an account with us, you must provide accurate, complete, and current information. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of 
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Service Providers</h2>
            <p className="text-muted-foreground mb-4">
              Professionals using DoneEZ agree to:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>Maintain all necessary licenses, insurance, and certifications</li>
              <li>Provide accurate information about services offered</li>
              <li>Honor quotes and commitments made through the platform</li>
              <li>Deliver quality service in a professional manner</li>
              <li>Pay applicable referral fees for jobs booked through the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Payments and Fees</h2>
            <p className="text-muted-foreground">
              Customers pay service providers directly for services rendered. DoneEZ may charge professionals a 
              referral fee for successful bookings. All fees are non-refundable except as required by law or as 
              explicitly stated in these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Disputes</h2>
            <p className="text-muted-foreground">
              DoneEZ is not responsible for disputes between customers and service providers. However, we encourage 
              users to report any issues through our platform, and we will make reasonable efforts to facilitate 
              resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              DoneEZ acts as a marketplace platform. We do not perform automotive services and are not responsible 
              for the quality, safety, or legality of services provided by professionals on our platform. Our liability 
              is limited to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The service and its original content, features, and functionality are owned by DoneEZ and are protected 
              by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, 
              including breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. We will provide notice of any 
              material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us through our support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
