import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("*, profiles:author_id(first_name, last_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setAnnouncements(data); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : "No date"}
                </p>
              </CardHeader>
              <CardContent><p className="text-foreground">{a.content}</p></CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
