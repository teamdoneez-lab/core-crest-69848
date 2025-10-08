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

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">
              How does DoneEZ work?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              DoneEZ connects customers who need auto services with verified professionals in their area. 
              Simply submit a service request, receive quotes from local pros, choose the one you like best, 
              and schedule your appointment. It's that easy!
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">
              Are the professionals verified?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes! All professionals on DoneEZ go through a verification process to ensure they are licensed, 
              insured, and qualified to perform the services they offer. We take the safety and quality of 
              service seriously.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">
              How much does it cost to use DoneEZ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              For customers, it's completely free to submit service requests and receive quotes. You only pay 
              the professional directly for the services rendered. Professionals pay a small referral fee when 
              they successfully book a job through the platform.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">
              What types of services are available?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              DoneEZ covers a wide range of auto services including repairs, maintenance, detailing, tire services, 
              bodywork, customization, and more. If it's related to your vehicle, we've got you covered!
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">
              How quickly can I get service?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Response times vary depending on the service and your location, but many customers receive quotes 
              within a few hours. You can also specify your preferred timeline when submitting a request.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">
              What if I'm not satisfied with the service?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Customer satisfaction is our top priority. If you experience any issues, please contact our support 
              team immediately. We work with both customers and professionals to resolve any concerns fairly.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-semibold">
              How do I become a professional on DoneEZ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Sign up for a professional account, complete your profile with your business information, service areas, 
              and the types of services you offer. After verification, you'll start receiving service requests from 
              customers in your area.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">
              Can I cancel or reschedule an appointment?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes, you can cancel or reschedule appointments through your dashboard. We recommend communicating 
              directly with the professional through our messaging system to coordinate any changes as early as possible.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
