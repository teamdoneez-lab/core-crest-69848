import { PublicNavigation } from '@/components/PublicNavigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      <div className="mx-auto max-w-4xl p-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about DoneEZ
          </p>
        </div>

        {/* For Customers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-primary">For Customers</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="customer-1">
              <AccordionTrigger className="text-lg font-semibold">
                How does the platform work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Submit a service request for free and receive quotes from trusted local professionals. You can 
                compare prices, availability, and reviews to choose the right pro for your needs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-2">
              <AccordionTrigger className="text-lg font-semibold">
                How do I book a service?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                After reviewing quotes, simply select the professional you'd like to work with and confirm your 
                preferred appointment time. No deposit is required to book.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-3">
              <AccordionTrigger className="text-lg font-semibold">
                Are professionals vetted?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">Yes. Every professional in the DoneEZ network is carefully screened to ensure reliability and quality. All must meet these minimum requirements:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Minimum 4-star rating on Yelp, Google, or similar platforms</li>
                  <li>Valid licenses and certifications (if applicable)</li>
                  <li>Active insurance coverage</li>
                  <li>Verified track record of professionalism and service excellence</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-4">
              <AccordionTrigger className="text-lg font-semibold">
                Do I need to pay a deposit?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No. You only pay the provider directly after the service is completed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-5">
              <AccordionTrigger className="text-lg font-semibold">
                What is your cancellation policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">Plans change — we get it. While there's no deposit to lose, we ask that you respect the mechanic's time.</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Cancel at least 24 hours in advance whenever possible</li>
                  <li>Frequent last-minute cancellations or no-shows may result in limited booking access</li>
                  <li>To cancel, use the platform's cancellation tool or email us at support@doneez.com</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-6">
              <AccordionTrigger className="text-lg font-semibold">
                What if I decline the service after the mechanic arrives?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If the mechanic arrives and the final cost is higher than expected, you're under no obligation to 
                proceed. You will not be charged, and the appointment can be cancelled without penalty.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-7">
              <AccordionTrigger className="text-lg font-semibold">
                Are there any platform fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No. DoneEZ does not charge you any service or booking fees. You only pay the professional 
                based on the quote you accepted — no hidden costs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-8">
              <AccordionTrigger className="text-lg font-semibold">
                What if there's a problem with the service?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Contact us at support@doneez.com and we'll work with both parties to quickly and fairly 
                resolve any issues.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* For Professionals */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-primary">For Professionals</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="pro-1">
              <AccordionTrigger className="text-lg font-semibold">
                How do I join the platform?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Click "Join Our Network" on our homepage, complete the application, and accept our Terms of 
                Service. Once approved, you'll begin receiving job opportunities in your area.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-2">
              <AccordionTrigger className="text-lg font-semibold">
                Is there a cost to join?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">No. Signing up and quoting is completely free.</p>
                <p>You only pay a referral fee when a customer selects your quote and the job is completed.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-3">
              <AccordionTrigger className="text-lg font-semibold">
                How do I get jobs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You'll receive alerts when customers request services in your area. Submit a quote with your 
                price and availability. Customers choose based on your quote, reviews, and experience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-4">
              <AccordionTrigger className="text-lg font-semibold">
                How do I get paid?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Customers pay you directly once the service is completed. DoneEZ does not process payments 
                — we just connect you with jobs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-5">
              <AccordionTrigger className="text-lg font-semibold">
                Can I set my own rates?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. You control your pricing, availability, and service scope.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-6">
              <AccordionTrigger className="text-lg font-semibold">
                How are referral fees calculated?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">When a customer selects your quote and the job is completed, you'll pay a one-time referral fee based on the total value of the job:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Jobs under $1,000 → 5%</li>
                  <li>$1,000 – $4,999 → 3%</li>
                  <li>$5,000 – $9,999 → 2%</li>
                  <li>$10,000 and above → 1%</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-7">
              <AccordionTrigger className="text-lg font-semibold">
                When and how do I pay the referral fee?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">After your quote is accepted, you'll receive a secure payment link. To confirm the booking, you must pay the referral fee upfront.</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>No credit card required on file</li>
                  <li>You're only ever charged when you win work</li>
                </ul>
                <p>Later, we'll offer auto-pay options for faster booking once trust is established.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-8">
              <AccordionTrigger className="text-lg font-semibold">
                What if the customer cancels or no-shows?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">You won't be charged the referral fee unless the job is completed. You're protected from:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Customer cancellations</li>
                  <li>No-shows</li>
                  <li>On-site refusals</li>
                </ul>
                <p>We monitor customer behavior to reduce abuse and protect your time.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-9">
              <AccordionTrigger className="text-lg font-semibold">
                What if I need to cancel?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Let the customer know through the platform as soon as possible. Repeated cancellations may 
                impact your standing and visibility on the platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-10">
              <AccordionTrigger className="text-lg font-semibold">
                Is my membership permanent?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">No. Membership is performance-based. To remain active, you must maintain strong ratings and deliver reliable service.</p>
                <p className="font-semibold mb-2">DoneEZ Rating Standards:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>4.5★ – 5.0★ → Top Rated: Priority access to jobs</li>
                  <li>4.0★ – 4.49★ → Good Standing: Fully active</li>
                  <li>3.5★ – 3.99★ → Probation Zone: Limited job access</li>
                  <li>Below 3.5★ (with 10+ DoneEZ reviews) → Account Paused: You'll enter our Controlled Jobs Recovery Program (only small jobs offered)</li>
                </ul>
                <p className="font-semibold mb-2">Failure Case:</p>
                <p className="mb-3">If your probation rating stays below 3.0★, your account will be permanently deactivated.</p>
                <p className="italic">Note: Your DoneEZ rating takes precedence over Yelp or Google once you're active on the platform. This ensures only shops delivering great customer experiences remain active.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* General */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-primary">General</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="general-1">
              <AccordionTrigger className="text-lg font-semibold">
                Is my information secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. We use encryption and strict data protection protocols. Your personal information is never 
                shared without your consent.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="general-2">
              <AccordionTrigger className="text-lg font-semibold">
                What types of services are available?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-3">Right now, we focus on connecting customers with top-rated auto service professionals.</p>
                <p className="mb-2">Soon, we'll be expanding into home services like:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Plumbing</li>
                  <li>Electrical</li>
                  <li>HVAC</li>
                  <li>Remodeling and more</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="general-3">
              <AccordionTrigger className="text-lg font-semibold">
                How do I contact support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Email us at support@doneez.com or use the live chat on our website.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}
