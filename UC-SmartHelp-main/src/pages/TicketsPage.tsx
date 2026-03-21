import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TicketList from "@/components/tickets/TicketList";
const TicketsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Safe localStorage access and auth check
  let parsedUser: User | null = null;
  try {
    const savedUser = localStorage.getItem("user");
    parsedUser = savedUser ? (JSON.parse(savedUser) as User) : null;
  } catch (e) {
    console.error("TicketsPage: Failed to parse user", e);
  }

  const isGuest = localStorage.getItem("uc_guest") === "1";

  // Auth Check
  useEffect(() => {
    if (!parsedUser && !isGuest) {
      console.log("No user found, redirecting to login");
      navigate("/login");
      return;
    }
    setLoading(false);
  }, [navigate, parsedUser, isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        <div className="rounded-2xl border bg-card shadow-xl overflow-hidden p-4 min-h-[720px]">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Your Tickets</h1>
            <p className="text-muted-foreground">View and manage your support tickets</p>
          </div>
          <TicketList />
        </div>
      </main>
    </div>
  );
};

export default TicketsPage;
