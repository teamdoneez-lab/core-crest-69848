import { Navigation } from '@/components/Navigation';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-4xl p-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>Name, email address, phone number, and other contact information</li>
              <li>Vehicle information when requesting services</li>
              <li>Business information for service professionals</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Communications between users through our messaging system</li>
              <li>Location data when you use location-based features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Connect customers with service professionals</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Detect, prevent, and address fraud and security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>With service professionals when you request a service</li>
              <li>With customers when professionals respond to service requests</li>
              <li>With service providers who perform services on our behalf</li>
              <li>When required by law or to protect rights and safety</li>
              <li>With your consent or at your direction</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground">
              We take reasonable measures to protect your information from unauthorized access, use, or disclosure. 
              However, no internet or email transmission is ever fully secure or error-free. Please take special 
              care in deciding what information you send to us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground space-y-2">
              <li>Access and update your account information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Disable location services through your device settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to collect and track information about your use 
              of our service. You can instruct your browser to refuse all cookies or to indicate when a cookie 
              is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for children under 18 years of age. We do not knowingly collect 
              personal information from children under 18. If you become aware that a child has provided us 
              with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as necessary to provide our services and fulfill the 
              purposes outlined in this policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and maintained on servers located outside of your state, 
              province, country, or other governmental jurisdiction where data protection laws may differ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us through our support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
