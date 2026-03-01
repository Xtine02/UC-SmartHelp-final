import { Ticket, ClipboardList } from "lucide-react";
import Chatbot from "@/components/chatbot/Chatbot";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GuestDashboard = () => {
  return (
    <div className="space-y-8 p-4">
      {/* Welcome banner - Simplified for the inner view */}
      <div className="rounded-xl uc-gradient px-8 py-10 bg-primary text-white text-center shadow-md">
        <h1 className="text-3xl font-bold italic md:text-4xl">Welcome, Guest!</h1>
        <p className="mt-2 text-primary-foreground/90">Explore our campus assistant below.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Locked Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-muted/30 p-8 transition-all">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
              Locked
            </div>
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center shadow-inner">
              <Ticket className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <span className="text-xl font-bold text-muted-foreground">New Ticket</span>
            <p className="text-sm text-muted-foreground text-center">
              Please <Link to="/register" className="text-primary underline font-medium">Register</Link> to submit formal support requests.
            </p>
          </div>

          <div className="relative group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-muted/30 p-8 transition-all">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
              Locked
            </div>
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center shadow-inner">
              <ClipboardList className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <span className="text-xl font-bold text-muted-foreground">Track Tickets</span>
            <p className="text-sm text-muted-foreground text-center">
              Sign in to view the history and status of your tickets.
            </p>
          </div>
        </div>

        {/* Call to Action for Guests */}
        <div className="bg-card border rounded-2xl p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Want the full experience?</h3>
          <p className="text-muted-foreground mb-4 text-sm">Create an account to track tickets and get personalized updates.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="default" className="uc-gradient-btn">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Chatbot - The main guest feature */}
        <div className="mt-12 bg-background rounded-2xl border-2 border-primary/20 p-1 shadow-xl">
          <div className="bg-primary/5 p-4 rounded-t-xl border-b flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Assistant Available</span>
          </div>
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
