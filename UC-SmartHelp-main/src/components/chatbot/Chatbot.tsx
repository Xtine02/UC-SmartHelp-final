import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chatbot = () => {
  // Manual Auth
  let user = null;
  try {
    const userJson = localStorage.getItem("user");
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    console.error("Chatbot: Failed to parse user", e);
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load previous messages
  useEffect(() => {
    if (!user) return;
    const userId = user.userId || user.id;
    supabase
      .from("chatbot_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const userId = user.userId || user.id;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Save user message
    await supabase.from("chatbot_messages").insert({
      user_id: userId,
      role: "user",
      content: input,
    });

    // Call edge function for AI response
    try {
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) },
      });

      const assistantContent = data?.reply || "I'm sorry, I couldn't process that. Please try again.";
      const assistantMsg: Message = { role: "assistant", content: assistantContent };
      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from("chatbot_messages").insert({
        user_id: userId,
        role: "assistant",
        content: assistantContent,
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again later." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-6 py-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">What can I help you?</h3>
      </div>
      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">Ask me anything about UC services!</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="h-6 w-6 text-primary shrink-0 mt-1" />}
            <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
              {m.content}
            </div>
            {m.role === "user" && <User className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <Bot className="h-6 w-6 text-primary" />
            <div className="rounded-lg bg-secondary px-4 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder="Ask me..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="uc-gradient-btn text-primary-foreground">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;
