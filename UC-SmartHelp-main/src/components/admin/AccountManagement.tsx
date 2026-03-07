import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const AccountManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const departments = [
    "Registrar's Office",
    "Accounting Office",
    "Clinic",
    "CCS Office",
    "Cashier's Office",
    "SAO",
    "Scholarship"
  ];

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (userId: number, role: string, department: string | null) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, department }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      toast({ title: "User updated successfully" });
      fetchUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <h2 className="text-xl font-bold text-foreground">Account Management</h2>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead>Last Name</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.last_name}</TableCell>
                <TableCell>{u.first_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => handleUpdate(u.id, v, u.department)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.role === "staff" ? (
                    <Select value={u.department || ""} onValueChange={(v) => handleUpdate(u.id, u.role, v)}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Dept" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccountManagement;
