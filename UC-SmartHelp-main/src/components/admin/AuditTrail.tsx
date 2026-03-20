import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Activity, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AuditEntry {
  id: string;
  user_id?: string | number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  created_at: string;
}

interface AuditTrailProps {
  userId?: string;
  all?: boolean;
}

const AuditTrail = ({ userId, all = false }: AuditTrailProps) => {
  const { toast } = useToast();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const endpoint = all ? `${API_URL}/api/audit-trail` : `${API_URL}/api/audit-trail/${userId}`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setAuditEntries(data);
        }
      } catch (error) {
        console.error("Error fetching audit trail:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch audit trail" });
      } finally {
        setLoading(false);
      }
    };

    if (all || userId) {
      fetchAuditTrail();
    }
  }, [userId, all, toast]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === auditEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(auditEntries.map((e) => e.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      for (const id of Array.from(selectedIds)) {
        const response = await fetch(`${API_URL}/api/audit-trail/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || 'Failed to delete audit entry');
        }
      }
      
      // Optimistic UI update
      setAuditEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      toast({ title: "Audit entries deleted successfully" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ variant: "destructive", title: "Delete Failed", description: errorMessage });
    }
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('login')) return 'bg-green-100 text-green-800';
    if (action.toLowerCase().includes('logout')) return 'bg-red-100 text-red-800';
    if (action.toLowerCase().includes('forward')) return 'bg-blue-100 text-blue-800';
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEntityTypeColor = (entityType?: string) => {
    if (!entityType) return 'bg-gray-100 text-gray-600';
    if (entityType === 'user') return 'bg-purple-100 text-purple-800';
    if (entityType === 'ticket') return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Activity History</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading activity...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Activity History</h3>
        <Badge variant="secondary" className="text-xs">
          {auditEntries.length} entries
        </Badge>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-destructive/10 p-4 rounded-xl border border-destructive/20 animate-in slide-in-from-top-4">
          <span className="text-sm font-bold text-destructive">
            {selectedIds.size} entry{selectedIds.size === 1 ? "" : "es"} selected
          </span>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-destructive text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-destructive/90 transition-all shadow-lg active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            DELETE SELECTED
          </button>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit Entries?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedIds.size} selected audit entry{selectedIds.size === 1 ? "" : "es"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={selectedIds.size === auditEntries.length && auditEntries.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {all && <TableHead className="font-bold">User ID</TableHead>}
              <TableHead className="font-bold">Action</TableHead>
              <TableHead className="font-bold">Entity</TableHead>
              <TableHead className="font-bold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={all ? 5 : 4} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                    <span>No activity recorded yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              auditEntries.map((entry) => (
                <TableRow key={entry.id} className={`hover:bg-muted/20 cursor-pointer transition-all ${selectedIds.has(entry.id) ? 'bg-destructive/5 border-l-4 border-destructive' : 'border-l-4 border-transparent'}`}>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={() => toggleSelect(entry.id)}
                    />
                  </TableCell>
                  {all && (
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {entry.user_id}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={`${getActionColor(entry.action)} border-0 font-medium`}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.entity_type && entry.entity_id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getEntityTypeColor(entry.entity_type)} text-xs`}>
                          {entry.entity_type}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          #{entry.entity_id}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditTrail;