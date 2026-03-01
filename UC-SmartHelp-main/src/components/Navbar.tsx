import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/uc-smarthelp-logo.jpg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson && userJson !== "null") {
        setUser(JSON.parse(userJson));
      } else {
        setUser(null);
      }
      setIsGuest(localStorage.getItem("uc_guest") === "1");
    } catch (e) {
      console.error("Navbar: Failed to parse user from localStorage", e);
      setUser(null);
    }
  }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem("uc_guest");
    localStorage.removeItem("user");
    setUser(null);
    setIsGuest(false);
    navigate("/");
  };

  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  
  // High-precision login check
  const isLoggedIn = (user && (user.userId || user.id || user.user_id)) || isGuest;

  const handleDashboardClick = () => {
    if (location.pathname === "/dashboard") {
      // If already on dashboard, force a reload or re-navigate to reset inner state
      navigate("/dashboard", { replace: true });
      window.location.href = "/dashboard"; 
    } else {
      navigate("/dashboard");
    }
  };

  // Format full name: Use server provided fullName
  const fullName = user?.fullName || "User";
  const initial = (user?.firstName?.[0] || user?.fullName?.[0] || "U").toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {location.pathname !== "/" ? (
          <Link to="/" className="flex items-center gap-2 animate-in fade-in duration-300">
            <img src={logo} alt="UC SmartHelp" className="h-10 w-auto" />
          </Link>
        ) : (
          <div className="w-10" /> /* Spacer to maintain layout alignment */
        )}

        {/* Navigation Links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/announcements" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Announcements
          </Link>
          <Link to="/uc-map" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            UC map
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </Link>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all">
                  {isGuest ? (
                    <UserIcon className="h-5 w-5" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                {/* Profile Header */}
                <div className="flex flex-col px-2 py-3 border-b mb-2">
                  <span className="text-sm font-black text-foreground uppercase tracking-tight">
                    {isGuest ? "Guest User" : fullName}
                  </span>
                  {!isGuest && (
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase mt-0.5">
                      {user?.role}
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <DropdownMenuItem onClick={handleDashboardClick} className="rounded-lg font-medium cursor-pointer">
                  Dashboard
                </DropdownMenuItem>
                
                {!isGuest && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-lg font-medium cursor-pointer">
                      Account Settings
                    </DropdownMenuItem>
                    {(isAdmin || isStaff) && (
                      <DropdownMenuItem onClick={handleDashboardClick} className="rounded-lg font-medium cursor-pointer">
                        View Reports
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                <div className="my-1 border-t border-muted" />
                
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg font-bold text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
