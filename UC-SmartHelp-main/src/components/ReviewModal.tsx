import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReviewModal = () => {
  const [open, setOpen] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasReviewed = localStorage.getItem("uc_page_reviewed");
      const dismissedThisSession = sessionStorage.getItem("uc_review_dismissed");
      
      if (!hasReviewed && !dismissedThisSession) {
        e.preventDefault();
        setOpen(true);
        return false;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("uc_review_dismissed", "true");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (helpful === null) return;
    setSubmitting(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.userId || user?.id || user?.user_id || null,
          is_helpful: helpful,
          comment: feedback.trim()
        })
      });

      if (response.ok) {
        localStorage.setItem("uc_page_reviewed", "true");
        toast({ title: "Thank you for your feedback!" });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl bg-background relative flex items-center justify-center">
        <button 
          onClick={handleDismiss}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-secondary/50 transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <DialogHeader className="space-y-4 text-center">
          <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-primary">
            Was this page helpful?
          </DialogTitle>
          <p className="text-muted-foreground font-medium italic">
            Your feedback helps us improve the University of Cebu SmartHelp experience.
          </p>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setHelpful(true)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                helpful === true
                  ? "bg-green-50 border-green-500 text-green-600 scale-105" 
                  : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <ThumbsUp className={`h-10 w-10 ${helpful === true ? "fill-green-500" : ""}`} />
              <span className="font-black uppercase tracking-widest text-xs">Yes</span>
            </button>

            <button
              onClick={() => setHelpful(false)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                helpful === false 
                  ? "bg-red-50 border-red-500 text-red-600 scale-105" 
                  : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <ThumbsDown className={`h-10 w-10 ${helpful === false ? "fill-red-500" : ""}`} />
              <span className="font-black uppercase tracking-widest text-xs">No</span>
            </button>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Comments & Suggestions</Label>
            <Textarea
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] rounded-2xl border-2 resize-none shadow-sm focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={helpful === null || submitting}
            className="w-full py-8 text-xl font-black rounded-2xl shadow-xl uc-gradient-btn text-white disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
          </Button>
          
          <button 
            onClick={handleDismiss}
            className="w-full text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
