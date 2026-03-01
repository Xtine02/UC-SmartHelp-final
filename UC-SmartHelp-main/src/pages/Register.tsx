import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, X } from "lucide-react";
import Navbar from "@/components/Navbar";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password,
    };

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid server response (Check Backend)");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      toast({ 
        title: "Success!", 
        description: "Account created successfully. You can now login." 
      });
      navigate("/login");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration Error", 
        description: error.message === "Failed to fetch" ? "Backend server is offline (Port 3000)." : error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    const isGuest = localStorage.getItem("uc_guest") === "1";
    if (isGuest) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="relative w-full max-w-md space-y-5 rounded-2xl uc-gradient p-8 shadow-xl animate-in fade-in zoom-in duration-300">
          <button 
            onClick={handleClose} 
            className="absolute right-4 top-4 text-white hover:scale-110 transition-transform"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-center text-3xl font-bold italic text-white tracking-widest uppercase">Register</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-white text-sm ml-1">First Name:</Label>
                <Input placeholder="Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-white/95 border-0 h-11" />
              </div>
              <div className="space-y-1">
                <Label className="text-white text-sm ml-1">Last Name:</Label>
                <Input placeholder="Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-white/95 border-0 h-11" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white text-sm ml-1">Email:</Label>
              <Input type="email" placeholder="example@uc.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/95 border-0 h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-white text-sm ml-1">Password:</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/95 border-0 pr-10 h-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl py-7 mt-2 rounded-xl shadow-lg transition-all active:scale-95">
              {loading ? "SYNCING..." : "SIGN UP"}
            </Button>
          </form>

          <p className="text-center text-sm text-white/90">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-white hover:underline underline-offset-4">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;