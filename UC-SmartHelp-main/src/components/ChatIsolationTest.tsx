import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatTestResult {
  userId: string | number | null;
  userRole: string;
  canAccessOwnChats: boolean;
  canAccessOtherChats: boolean;
  message: string;
}

const ChatIsolationTest = () => {
  const [testResult, setTestResult] = useState<ChatTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Get current user info
      const userRaw = localStorage.getItem("user");
      let user = null;
      try {
        user = userRaw ? JSON.parse(userRaw) : null;
      } catch {
        user = null;
      }

      const userId = user?.id || user?.userId || user?.user_id || null;
      const userRole = (user?.role || "").toString().toLowerCase();
      const isAdmin = userRole === "admin";

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Test 1: Can access own chats
      let canAccessOwnChats = false;
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/api/chat-history?user_id=${userId}&limit=1`);
          canAccessOwnChats = response.ok;
        } catch {
          canAccessOwnChats = false;
        }
      }

      // Test 2: Cannot access other user's chats (unless admin)
      let canAccessOtherChats = false;
      if (!isAdmin && userId) {
        try {
          // Try to access a different user ID
          const differentUserId = Number(userId) + 1;
          const response = await fetch(`${API_URL}/api/chat-history?user_id=${differentUserId}&limit=1`);
          canAccessOtherChats = response.ok;
        } catch {
          canAccessOtherChats = false;
        }
      } else if (isAdmin) {
        // Admins should be able to access all chats
        try {
          const response = await fetch(`${API_URL}/api/chat-history/all?limit=1`);
          canAccessOtherChats = response.ok;
        } catch {
          canAccessOtherChats = false;
        }
      }

      const message = isAdmin 
        ? "Admin can access all chat history"
        : canAccessOwnChats && !canAccessOtherChats
        ? "Chat isolation is working correctly"
        : canAccessOwnChats && canAccessOtherChats
        ? "WARNING: Can access other users' chats"
        : !canAccessOwnChats
        ? "Cannot access own chats"
        : "Unknown state";

      setTestResult({
        userId,
        userRole,
        canAccessOwnChats,
        canAccessOtherChats,
        message
      });

    } catch (error) {
      setTestResult({
        userId: null,
        userRole: "unknown",
        canAccessOwnChats: false,
        canAccessOtherChats: false,
        message: `Error during test: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run test on mount
    runTest();
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">Testing chat isolation...</p>
      </div>
    );
  }

  if (!testResult) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chat Isolation Test</h3>
        <Button onClick={runTest} variant="outline" size="sm">
          Re-run Test
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">User ID:</p>
          <p className="text-sm">{testResult.userId || 'Not logged in'}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Role:</p>
          <p className="text-sm">{testResult.userRole || 'Unknown'}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Can access own chats:</p>
          <p className={`text-sm ${testResult.canAccessOwnChats ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.canAccessOwnChats ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Can access other chats:</p>
          <p className={`text-sm ${testResult.canAccessOtherChats ? 'text-red-600' : 'text-green-600'}`}>
            {testResult.canAccessOtherChats ? 'Yes (POTENTIAL ISSUE)' : 'No (Good)'}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted">
        <p className="text-sm font-medium">Result: {testResult.message}</p>
      </div>
    </div>
  );
};

export default ChatIsolationTest;