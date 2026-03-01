import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import TicketDetailModal from "@/components/tickets/TicketDetailModal";
import ReviewAnalytics from "@/components/analytics/ReviewAnalytics";

// Define a local type to replace Supabase generated types
type TicketStatus = "pending" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  sender_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  departments?: {
    name: string;
  };
}

const StaffDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0 });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [view, setView] = useState<"tickets" | "reviews">("tickets");

  const fetchData = async () => {
    // MySQL Integration Pending
    setTickets([]);
    setStats({ pending: 0, in_progress: 0, resolved: 0 });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    toast({ 
      title: "Status update requested", 
      description: `Target status: ${newStatus}. (Database connection pending)` 
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as TicketStatus } : t));
  };

  if (view === "reviews") {
    return (
      <div className="space-y-6 p-4">
        <button onClick={() => setView("tickets")} className="text-sm font-medium text-primary hover:underline transition-all">
          &larr; Back to Dashboard Overview
        </button>
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <ReviewAnalytics />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 animate-in fade-in duration-500">
      {/* Header with Switcher */}
      <div className="flex justify-between items-center bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Overview</h1>
          <p className="text-muted-foreground">Manage and respond to student inquiries.</p>
        </div>
        <button 
          onClick={() => setView("reviews")}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          View Analytics
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl p-8 text-center shadow-md border-b-4 border-amber-400 bg-amber-50">
          <p className="text-5xl font-extrabold text-amber-600 mb-2">{stats.pending}</p>
          <p className="text-sm font-bold text-amber-800 uppercase tracking-wider">Pending</p>
        </div>
        <div className="rounded-2xl p-8 text-center shadow-md border-b-4 border-blue-400 bg-blue-50">
          <p className="text-5xl font-extrabold text-blue-600 mb-2">{stats.in_progress}</p>
          <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">In-Progress</p>
        </div>
        <div className="rounded-2xl p-8 text-center shadow-md border-b-4 border-emerald-400 bg-emerald-50">
          <p className="text-5xl font-extrabold text-emerald-600 mb-2">{stats.resolved}</p>
          <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Resolved</p>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground px-1">All Tickets</h2>
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">TICKET ID</TableHead>
                <TableHead className="font-bold py-4">SUBJECT</TableHead>
                <TableHead className="font-bold py-4">SENDER</TableHead>
                <TableHead className="font-bold py-4">DATE SENT</TableHead>
                <TableHead className="font-bold py-4">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-20 bg-muted/5">
                    <div className="flex flex-col items-center gap-2 opacity-60">
                       <p className="text-lg font-medium">No tickets currently assigned.</p>
                       <p className="text-sm">When students submit tickets to your department, they will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelectedTicket(t)}>
                    <TableCell className="font-mono font-bold text-primary">{t.ticket_number}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>
                      {t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : "Unknown Student"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                        <SelectTrigger className="w-36 h-9 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In-Progress</SelectItem>
                          <SelectItem value="resolved">Resolved/Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => { setSelectedTicket(null); fetchData(); }}
          isStaff={true}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
