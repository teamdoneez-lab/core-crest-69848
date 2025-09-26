import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RequestService from "./pages/RequestService";
import ServiceRequestFlow from "./pages/ServiceRequestFlow";
import RequestConfirmation from "./pages/RequestConfirmation";
import ProProfile from "./pages/ProProfile";
import ProOnboarding from "./pages/ProOnboarding";
import ProDashboard from "./pages/ProDashboard";
import ProInbox from "./pages/ProInbox";
import ServiceRequests from "./pages/ServiceRequests";
import Appointments from "./pages/Appointments";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/request-service" element={<RequestService />} />
            <Route path="/request-service-flow" element={<ServiceRequestFlow />} />
            <Route path="/request-confirmation" element={<RequestConfirmation />} />
            <Route path="/pro-profile" element={<ProProfile />} />
            <Route path="/pro-onboarding" element={<ProOnboarding />} />
            <Route path="/pro-dashboard" element={<ProDashboard />} />
            <Route path="/pro-inbox" element={<ProInbox />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
