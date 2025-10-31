import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import RequestService from "./pages/RequestService";
import ServiceRequestFlow from "./pages/ServiceRequestFlow";
import RequestConfirmation from "./pages/RequestConfirmation";
import ProProfile from "./pages/ProProfile";
import ProOnboarding from "./pages/ProOnboarding";
import ProDashboard from "./pages/ProDashboard";
import ProInbox from "./pages/ProInbox";
import ServiceRequests from "./pages/ServiceRequests";
import Appointments from "./pages/Appointments";
import MyRequests from "./pages/MyRequests";
import MyJobs from "./pages/MyJobs";
import Earnings from "./pages/Earnings";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import CustomerProfile from "./pages/CustomerProfile";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProMarketplace from "./pages/ProMarketplace";
import ProductDetailPage from "./pages/ProductDetailPage";
import PartnerOffers from "./pages/PartnerOffers";
import SupplierOnboarding from "./pages/SupplierOnboarding";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierProductUpload from "./pages/SupplierProductUpload";
import SupplierSignup from "./pages/SupplierSignup";
import SupplierLogin from "./pages/SupplierLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/request-service" element={<RequestService />} />
            <Route path="/request-service-flow" element={<ServiceRequestFlow />} />
            <Route path="/request-confirmation" element={<RequestConfirmation />} />
            <Route path="/pro-profile" element={<ProProfile />} />
            <Route path="/pro-onboarding" element={<ProOnboarding />} />
            <Route path="/pro-dashboard" element={<ProDashboard />} />
            <Route path="/pro-inbox" element={<ProInbox />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/pro-marketplace" element={<ProMarketplace />} />
            <Route path="/pro-marketplace/product/:productHandle" element={<ProductDetailPage />} />
            <Route path="/partner-offers" element={<PartnerOffers />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/customer-profile" element={<CustomerProfile />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/supplier-signup" element={<SupplierSignup />} />
            <Route path="/supplier-login" element={<SupplierLogin />} />
            <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />
            <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
            <Route path="/supplier/upload-products" element={<SupplierProductUpload />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
