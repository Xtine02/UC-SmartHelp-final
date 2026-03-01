import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Sub-dashboards
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import GuestDashboard from "@/components/dashboard/GuestDashboard";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Read from localStorage once with safety
    let savedUser = null;
    try {
      const userJson = localStorage.getItem("user");
      savedUser = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error("Dashboard: Failed to parse user session", e);
      localStorage.removeItem("user");
    }

    const guestFlag = localStorage.getItem("uc_guest") === "1";

    // 2. Auth Check
    if (!savedUser && !guestFlag) {
      console.log("No user found, redirecting to login");
      navigate("/login");
      return;
    }

    // 3. Set State
    if (savedUser) {
      setUser(savedUser);
    }

    setIsGuest(guestFlag);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />  
          <p className="text-muted-foreground font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine which view to render
  const renderView = () => {
    if (isGuest) return <GuestDashboard />;

    const role = (user?.role || "student").toLowerCase();
    
    if (role === "admin") return <AdminDashboard />;
    if (role === "staff") return <StaffDashboard />;
    return <StudentDashboard />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto p-4 md:p-8 animate-in fade-in duration-500">    
        {/* Dynamic Dashboard Content */}
        <div className="rounded-2xl border bg-card shadow-xl overflow-hidden min-h-[500px]">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
