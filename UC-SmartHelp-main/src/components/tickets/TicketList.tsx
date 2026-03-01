import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import TicketDetailModal from "./TicketDetailModal";
import FeedbackDialog from "./FeedbackDialog";

interface Department {
  id: string;
  name: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
  department_id: string;
  departments?: Department | null;
  description?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-green-400 text-foreground hover:bg-green-500",
  in_progress: "bg-pink-400 text-foreground hover:bg-pink-500",
  resolved: "bg-blue-400 text-foreground hover:bg-blue-500",
};

const TicketList = () => {
  // 1. Manual Auth Logic
  let user = null;
  try {
    const savedUser = localStorage.getItem("user");
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error("TicketList: Failed to parse user", e);
  }
  
  const isGuest = localStorage.getItem("uc_guest") === "1";
  
  // Role check logic
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTicket, setFeedbackTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    try {
      // TODO: Replace with fetch('/api/get_tickets.php') for your MySQL backend
      // Using an empty array to prevent rendering crashes while database is pending
      setTickets([]);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    if (user || isGuest) {
      fetchTickets();
    }
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const handleTicketClick = (t: Ticket) => {
    setSelectedTicket(t);
  };

  const handleCloseModal = () => {
    const closedTicket = selectedTicket;
    setSelectedTicket(null);
    fetchTickets();

    // Show feedback dialog for resolved tickets (student only, not guest)
    if (!isStaffOrAdmin && closedTicket?.status === "resolved" && !isGuest) {
      setFeedbackTicket(closedTicket);
      setShowFeedback(true);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar */}
        <div className="space-y-4 min-w-[200px]">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Filters</span>
            <span className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showFilters && (
            <div className="space-y-1 p-1 bg-secondary/20 rounded-xl border border-dashed animate-in slide-in-from-top-2">            
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-3 py-2 tracking-widest">By Status</p>
              {[
                { id: "all", label: "All Tickets" },
                { id: "pending", label: "Pending" },
                { id: "in_progress", label: "In-Progress" },
                { id: "resolved", label: "Resolved" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    filter === btn.id 
                      ? "bg-background text-primary shadow-sm" 
                      : "hover:bg-background/50 text-muted-foreground"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tickets Table */}
        <div className="flex-1 rounded-2xl border bg-card shadow-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">TICKET ID</TableHead>
                <TableHead className="font-bold py-4">SUBJECT</TableHead>
                <TableHead className="font-bold py-4">DEPARTMENT</TableHead>
                <TableHead className="font-bold py-4">STATUS</TableHead>
                <TableHead className="font-bold py-4 text-right">DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-20 bg-muted/5">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                         <span className="text-2xl font-bold">!</span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">No tickets found</p>
                        <p className="text-sm">The list is currently empty.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="cursor-pointer hover:bg-secondary/20 transition-colors" 
                    onClick={() => handleTicketClick(t)}
                  >
                    <TableCell className="font-mono font-bold text-primary">{t.ticket_number}</TableCell>
                    <TableCell className="font-bold text-foreground">{t.subject}</TableCell>
                    <TableCell className="text-sm">{t.departments?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[t.status] || "bg-gray-400"} border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5`}>
                        {t.status === "in_progress" ? "In-Progress" : t.status === "resolved" ? "Resolved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs font-medium">
                      {t.created_at ? format(new Date(t.created_at), "MMM d, yyyy") : "---"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          isStaff={isStaffOrAdmin}
        />
      )}

      {feedbackTicket && (
        <FeedbackDialog
          open={showFeedback}
          onClose={() => { setShowFeedback(false); setFeedbackTicket(null); }}
          departmentName={feedbackTicket.departments?.name}
          departmentId={feedbackTicket.department_id}
          ticketId={feedbackTicket.id}
        />
      )}
    </div>
  );
};

export default TicketList;
