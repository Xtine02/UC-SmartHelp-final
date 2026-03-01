import { useState, useEffect } from "react";
import { Ticket as TicketIcon, ClipboardList } from "lucide-react";
import NewTicketDialog from "@/components/tickets/NewTicketDialog";
import TicketDetailModal from "@/components/tickets/TicketDetailModal";
import Chatbot from "@/components/chatbot/Chatbot";
import FeedbackDialog from "@/components/tickets/FeedbackDialog";
import { Button } from "@/components/ui/button";

interface User {
  userId: number;
  id?: number;
  role: string;
  firstName: string;
  fullName: string;
  email?: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  department_id: string;
  description?: string;
  departments?: { name: string } | null;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

const StudentDashboard = () => {
  // Safe localStorage access
  let parsedUser: User | null = null;
  try {
    const savedUser = localStorage.getItem("user");
    parsedUser = savedUser ? (JSON.parse(savedUser) as User) : null;
  } catch (e) {
    console.error("StudentDashboard: Failed to parse user", e);
  }
  
  const isGuest = localStorage.getItem("uc_guest") === "1";

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [view, setView] = useState<"home" | "tickets">("home");
  const [showFeedback, setShowFeedback] = useState(false);

  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        if (isGuest || !parsedUser) {
          setRecentTickets([]);
          return;
        }
        // Placeholder for MySQL fetch
        setRecentTickets([]);
      } catch (error) {
        console.error("StudentDashboard: Error loading tickets", error);
      }
    };
    loadRecent();
  }, [parsedUser, isGuest]);

  return (
    <div className="space-y-8 p-4">
      {/* Welcome banner */}
      <div className="rounded-xl uc-gradient px-8 py-6 bg-primary text-white text-center shadow-md">
        <h1 className="text-2xl font-bold italic md:text-3xl">
          Welcome {parsedUser?.firstName || (isGuest ? "Guest" : "Student")}!
        </h1>
      </div>

      {view === "home" ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              onClick={() => { if (!isGuest) setShowNewTicket(true); }}
              className={
                "flex flex-col items-center gap-3 rounded-xl border bg-card p-8 shadow-sm transition-all " +
                (isGuest ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-1")
              }
              disabled={isGuest}
            >
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <TicketIcon className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">New Ticket</span>
              <p className="text-sm text-muted-foreground text-center">
                {isGuest ? "Available after registering" : "Create a new support ticket"}
              </p>
            </button>

            <button
              onClick={() => { if (!isGuest) setView("tickets"); }}
              className={
                "flex flex-col items-center gap-3 rounded-xl border bg-card p-8 shadow-sm transition-all " +
                (isGuest ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-1")
              }
              disabled={isGuest}
            >
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Check Ticket Status</span>
              <p className="text-sm text-muted-foreground text-center">
                {isGuest ? "Available after registering" : "View and manage your tickets"}
              </p>
            </button>
          </div>

          {/* Recent tickets preview */}
          {recentTickets.length > 0 && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Recent Tickets</h3>
              <ul className="space-y-3">
                {recentTickets.map((t) => (
                  <li 
                    key={t.id} 
                    className="p-3 rounded-lg bg-muted/30 hover:bg-secondary/20 cursor-pointer transition-colors" 
                    onClick={() => { setSelectedTicket(t); setView('tickets'); }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-foreground">{t.ticket_number} — {t.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 capitalize">
                      {t.status?.replace('_', ' ') || 'Pending'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chatbot */}
          <div className="mt-8">
            <Chatbot />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setView("home")} className="hover:bg-primary/5">
            ← Back to Dashboard
          </Button>
          <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
             <div className="flex flex-col items-center gap-2">
                <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-2" />
                <h3 className="text-lg font-semibold text-foreground">Your Tickets</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                   MySQL Database connection is pending. Your tickets will appear here soon.
                </p>
             </div>
          </div>
        </div>
      )}

      <NewTicketDialog open={showNewTicket} onOpenChange={setShowNewTicket} />
      <FeedbackDialog open={showFeedback} onClose={() => setShowFeedback(false)} />
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => { setSelectedTicket(null); setView('home'); }}
          isStaff={false}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
