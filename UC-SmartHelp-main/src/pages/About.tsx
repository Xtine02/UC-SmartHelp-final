import Navbar from "@/components/Navbar";
import logo from "@/assets/uc-smarthelp-logo.jpg";
const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-3xl py-16 space-y-8">
      <div className="text-center">
        <img src={logo} alt="UC SmartHelp" className="mx-auto h-24 mb-6" />
        <h1 className="text-3xl font-bold text-foreground">About UC SmartHelp</h1>
      </div>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          UC SmartHelp is the University of Cebu's integrated helpdesk platform,
          designed to help students get quick answers and connect with the right campus services anytime.
        </p>
        <p>
          Our system allows students to
          submit helpdesk tickets to specific departments, and track their ticket status in real-time.
        </p>
        <p>
          Staff members can manage and respond to tickets through their dashboard, while administrators
          have access to analytics, account management, and review insights across all departments.
        </p>
      </div>
      </div>
    </div>
  );
};

export default About;
