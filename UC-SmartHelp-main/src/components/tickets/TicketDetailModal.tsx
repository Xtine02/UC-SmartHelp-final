import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

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

interface Props {
  ticket: Ticket;
  onClose: () => void;
  isStaff?: boolean;
}

const TicketDetailModal = ({ ticket, onClose, isStaff = false }: Props) => {
  // Manual Auth
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [forwardDept, setForwardDept] = useState("");
  const [showForward, setShowForward] = useState(false);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);

  const fetchMessages = async () => {
    // MySQL Integration Pending
    setMessages([]); 
  };

  const fetchDepartments = async () => {
    setDepartments([
      { id: "1", name: "Registrar's Office" },
      { id: "2", name: "Accounting Office" },
      { id: "3", name: "Clinic" },
      { id: "4", name: "CCS Office" },
      { id: "5", name: "Cashier's Office" },
      { id: "6", name: "SAO" },
      { id: "7", name: "Scholarship" }
    ]);
  };

  useEffect(() => {
    if (ticket?.id) {
      fetchMessages();
      fetchDepartments();
    }
  }, [ticket?.id]);

  const handleSendReply = async () => {
    if (!reply.trim() || !user) return;
    setLoading(true);
    console.log("Reply submitted:", reply);
    
    setTimeout(() => {
      setReply("");
      setShowReplyBox(false);
      setLoading(false);
      toast({ title: "Reply sent (Database Pending)" });
    }, 500);
  };

  const handleForward = async () => {
    if (!forwardDept) return;
    const dept = departments.find((d) => d.id === forwardDept);
    toast({ title: `Ticket forwarded to ${dept?.name || "department"}` });
    setShowForward(false);
    onClose();
  };

  const senderName = ticket.profiles 
    ? `${ticket.profiles.first_name || ""} ${ticket.profiles.last_name || ""}`.trim() 
    : "Student";
    
  const deptName = ticket.departments?.name || "Department";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-full overflow-y-auto rounded-3xl bg-background border shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/90 backdrop-blur-md z-10 flex justify-between items-center px-8 py-6 border-b">
          <div>
            <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tight">Ticket Details</h2>
            <p className="text-xs font-bold text-primary tracking-widest uppercase">#{ticket.ticket_number || "Draft"}</p>
          </div>
          <Button variant="secondary" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:rotate-90 transition-all duration-300">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">From Student</span>
              <span className="text-lg font-bold text-foreground">{isStaff ? senderName : "You"}</span>
            </div>
            <div className="p-4 bg-secondary/50 rounded-2xl border">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Assigned Department</span>
              <span className="text-lg font-bold text-foreground">{deptName}</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Concern Topic</span>
              <div className="text-xl font-extrabold text-foreground bg-secondary/20 p-4 rounded-2xl border-l-4 border-primary">
                {ticket.subject}
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Message Description</span>
              <div className="bg-muted/10 p-6 rounded-2xl border border-dashed text-foreground leading-relaxed">
                 <p className="whitespace-pre-wrap">{ticket.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          {/* Thread History */}
          {messages.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Conversation</h4>
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-primary">
                        {m.profiles?.first_name} {m.profiles?.last_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">RECENT</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Forms */}
          {showReplyBox && (
            <div className="p-6 border-2 border-primary/20 rounded-3xl bg-primary/5 space-y-4 animate-in slide-in-from-top-4">
              <h4 className="text-sm font-black uppercase text-primary ml-1">Write Response</h4>
              <Textarea
                placeholder="Type your message here..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[150px] bg-background rounded-xl border-none shadow-inner text-base"
              />
              <div className="flex gap-3">
                <Button onClick={handleSendReply} disabled={loading || !reply.trim()} className="flex-1 py-6 rounded-xl font-bold">
                  {loading ? "SENDING..." : "SEND REPLY"}
                </Button>
                <Button variant="outline" onClick={() => setShowReplyBox(false)} className="rounded-xl px-8">Cancel</Button>
              </div>
            </div>
          )}

          {showForward && (
            <div className="p-6 border-2 border-amber-500/20 rounded-3xl bg-amber-500/5 space-y-4 animate-in slide-in-from-top-4">
              <h4 className="text-sm font-black uppercase text-amber-600 ml-1">Forward Ticket</h4>
              <Select value={forwardDept} onValueChange={setForwardDept}>
                <SelectTrigger className="bg-background rounded-xl h-12">
                  <SelectValue placeholder="Select target department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-3">
                <Button onClick={handleForward} disabled={!forwardDept} className="flex-1 py-6 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold">
                  CONFIRM FORWARD
                </Button>
                <Button variant="outline" onClick={() => setShowForward(false)} className="rounded-xl px-8">Cancel</Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showReplyBox && !showForward && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button onClick={() => setShowReplyBox(true)} className="flex-1 py-8 text-xl font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                REPLY
              </Button>
              <Button variant="outline" onClick={() => setShowForward(true)} className="flex-1 py-8 text-xl font-black rounded-2xl border-2 hover:bg-secondary/50 transition-all">
                FORWARD
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
