import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface User {
  id?: number;
  user_id?: number;
  userId?: number;
  role?: string;
  department?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
}

interface Announcement {
  id: number;
  user_id: number;
  role: string;
  department?: string;
  message: string;
  posted_at: string;
  first_name?: string;
  last_name?: string;
}

const Announcements = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get user from localStorage
  useEffect(() => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setRefreshing(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/announcements`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({ title: "Error", description: "Failed to fetch announcements", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchAnnouncements, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    if (!newMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    if (!user?.role || !["admin", "staff"].includes(user.role.toLowerCase())) {
      toast({ title: "Error", description: "Only admin and staff can create announcements", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id || user.userId || user.user_id,
          role: user.role,
          department: user.department || null,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Announcement created successfully" });
        setNewMessage("");
        await fetchAnnouncements();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create announcement");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to create announcement";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isStaffOrAdmin = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "staff";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-12 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Announcements</h1>
            <p className="text-muted-foreground">Stay updated with latest news from University of Cebu</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Create Announcement Form - Only for Staff/Admin */}
        {isStaffOrAdmin && (
          <Card className="bg-card border-2">
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Message
                </label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your announcement message..."
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={loading || !newMessage.trim()}
                className="w-full"
              >
                {loading ? "Creating..." : "Post Announcement"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            All Announcements
            {refreshing && <span className="text-xs text-muted-foreground">Updating...</span>}
          </h2>

          {announcements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No announcements yet.</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={announcement.role === "admin" ? "default" : "secondary"}>
                          {announcement.role === "admin" ? "Admin" : "Staff"}
                        </Badge>
                        {announcement.role === "staff" && announcement.department && (
                          <Badge variant="outline">{announcement.department}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{announcement.first_name} {announcement.last_name}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {announcement.posted_at
                        ? format(new Date(announcement.posted_at), "MMM d, yyyy HH:mm")
                        : "No date"
                      }
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
