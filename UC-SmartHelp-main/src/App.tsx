import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page Imports
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Component Imports
import Navbar from "@/components/Navbar";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import GuestDashboard from "@/components/dashboard/GuestDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Centralized Dashboard Route (Handles Role-based Redirection and Layout) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Individual Dashboard Routes (Optional, can be used for direct linking) */}
          {/* Note: These individual routes now rely on the sub-components which don't have Navbars internally, 
              so we add one here for these specific routes. */}
          <Route path="/StudentDashboard" element={<><Navbar /><div className="container mx-auto p-4 md:p-8"><StudentDashboard /></div></>} />
          <Route path="/StaffDashboard" element={<><Navbar /><div className="container mx-auto p-4 md:p-8"><StaffDashboard /></div></>} />
          <Route path="/AdminDashboard" element={<><Navbar /><div className="container mx-auto p-4 md:p-8"><AdminDashboard /></div></>} />
          <Route path="/GuestDashboard" element={<><Navbar /><div className="container mx-auto p-4 md:p-8"><GuestDashboard /></div></>} />
          
          {/* Support Pages (These pages HAVE Navbar inside them already) */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
