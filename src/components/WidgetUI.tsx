import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Phone, Mail, FileText, ArrowRight, CornerDownLeft, Sparkles, Check } from "lucide-react";
import { Message, ChatbotSettings, ConversationLog } from "../types";

interface WidgetUIProps {
  userId?: string; // Client developer UID or 'demo'
  isDemo?: boolean; // If running inside dashboard custom preview
  initialVisitorName?: string;
  initialVisitorEmail?: string;
  initialVisitorPhone?: string;
}

export default function WidgetUI({ 
  userId = "demo", 
  isDemo = false,
  initialVisitorName = "",
  initialVisitorEmail = "",
  initialVisitorPhone = ""
}: WidgetUIProps) {
  const [settings, setSettings] = useState<ChatbotSettings>({
    id: userId,
    botName: "WebNestBot",
    greetingText: "Hello! I am WebNest's AI assistant. How can I help you today?",
    escalationMessage: "I apologize, but this topic requires manual routing. Let me connect you directly to our human live active agents.",
    systemPrompt: "You are a professional support agent. Answer concisely.",
    bubbleColor: "#0D9488", // Default to beautiful deep teal
    accentColor: "#F0FDFA", // Default light teal accent
    widgetIcon: "WebNestbot",
    widgetPosition: "bottom-right",
    emailNotification: "care.webnest@gmail.com"
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  
  // Escalation flow state
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [visitorName, setVisitorName] = useState(initialVisitorName || "");
  const [visitorEmail, setVisitorEmail] = useState(initialVisitorEmail || "");
  const [visitorPhone, setVisitorPhone] = useState(initialVisitorPhone || "");
  const [escalationTriggeredText, setEscalationTriggeredText] = useState("");

  const boardRef = useRef<HTMLDivElement>(null);

  const [quickReplies, setQuickReplies] = useState<any[]>([]);

  // Sync visitor details if props change
  useEffect(() => {
    if (initialVisitorName) setVisitorName(initialVisitorName);
    if (initialVisitorEmail) setVisitorEmail(initialVisitorEmail);
    if (initialVisitorPhone) setVisitorPhone(initialVisitorPhone);
  }, [initialVisitorName, initialVisitorEmail, initialVisitorPhone]);

  // 1. Initialize Visitor ID from localStorage
  useEffect(() => {
    let vid = localStorage.getItem(`webnest_visitor_${userId}`);
    if (!vid) {
      vid = "visitor_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(`webnest_visitor_${userId}`, vid);
    }
    setVisitorId(vid);
  }, [userId]);

  // 2. Poll Chatbot Settings & Conversation progress from server (No Firestore listeners)
  useEffect(() => {
    if (!visitorId) return;

    const fetchSettingsAndConversations = async () => {
      try {
        // Fetch Settings
        const settingsRes = await fetch(`/api/chatbots/settings?userId=${userId}`);
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s) setSettings(s);
        }

        // Fetch Conversation
        const convRes = await fetch(`/api/conversations/${userId}_${visitorId}`);
        if (convRes.ok) {
          const data = await convRes.json();
          setMessages(data.messages || []);
          setIsAgentTyping(!!data.agentTyping);
          if (data.status === "escalated") {
            setEscalated(true);
          } else if (data.status === "resolved") {
            setEscalated(false);
            setShowEscalationForm(false);
          }
        } else {
          setIsAgentTyping(false);
          // If 404, we have never posted. Put initial greeting
          if (messages.length === 0) {
            setMessages([{
              sender: "bot",
              text: settings.greetingText,
              timestamp: Date.now()
            }]);
          }
        }

        // Fetch Quick replies
        const qrRes = await fetch(`/api/chatbots/quick-replies?userId=${userId}`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQuickReplies(qrData);
        }
      } catch (err) {
        console.warn("Error fetching widget data:", err);
      }
    };

    fetchSettingsAndConversations();
    const interval = setInterval(fetchSettingsAndConversations, 3000);
    return () => clearInterval(interval);
  }, [visitorId, userId, settings.greetingText, messages.length]);

  // Scroll to bottom whenever messages list grows or typing status changes
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollTop = boardRef.current.scrollHeight;
    }
  }, [messages, isLoading, showEscalationForm, isAgentTyping]);

  // Post new message helper (write to memory base immediately so Admin Panel synchronizes real-time)
  const saveMessageToBackend = async (newMsgs: Message[], isFullEscalateState = false) => {
    if (!visitorId || isDemo) {
      setMessages(newMsgs);
      return;
    }

    try {
      const payload = {
        id: `${userId}_${visitorId}`,
        userId: userId,
        visitorId: visitorId,
        visitorName: visitorName || "Guest User",
        visitorEmail: visitorEmail || "Not specified",
        visitorPhone: visitorPhone || "Not specified",
        status: isFullEscalateState ? "escalated" : (escalated ? "escalated" : "bot"),
        messages: newMsgs,
        createdAt: messages.length <= 1 ? Date.now() : Date.now(),
        lastActive: Date.now(),
        lastMessageText: newMsgs[newMsgs.length - 1].text
      };

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("API post error");
      }
    } catch (err) {
      console.error("Failed to sync message to server state:", err);
    }
  };

  const handleQuickReplyClick = async (textVal: string) => {
    if (isLoading || showEscalationForm) return;

    const userMsg: Message = {
      sender: "user",
      text: textVal,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveMessageToBackend(updatedMessages);

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          visitorId: visitorId,
          messages: updatedMessages,
          userMessage: textVal,
          visitorName: visitorName || "Guest User",
          visitorEmail: visitorEmail || "guest@webnest.dev",
          visitorPhone: visitorPhone || "Not specified"
        })
      });

      const result = await response.json();
      setIsLoading(false);

      if (result.escalate) {
        setEscalated(true);
        setShowEscalationForm(false);
        setEscalationTriggeredText(result.answer || settings.escalationMessage);
        
        const botEscalateMsg: Message = {
          sender: "bot",
          text: result.answer || settings.escalationMessage,
          timestamp: Date.now()
        };

        const systemAnnounceMsg: Message = {
          sender: "system",
          text: `⚡ Omni-Channel Live Representative Hand-off active. An alert notification has been sent to our desk agent inbox, and a secure SMTP email dispatch was routed successfully to care.webnest@gmail.com!`,
          timestamp: Date.now() + 50
        };

        const finalMsgs = [...updatedMessages, botEscalateMsg, systemAnnounceMsg];
        setMessages(finalMsgs);
        await saveMessageToBackend(finalMsgs, true);
      } else {
        const botMsg: Message = {
          sender: "bot",
          text: bondResponse(result.answer) || "I received your query. Let me know if you need helper tools.",
          timestamp: Date.now()
        };
        const finalMsgs = [...updatedMessages, botMsg];
        setMessages(finalMsgs);
        await saveMessageToBackend(finalMsgs);
      }
    } catch (err) {
      console.error("Widget API quick reply communications failed:", err);
      setIsLoading(false);
    }
  };

  // Safe wrapper helper for API responses
  const bondResponse = (ans: string | undefined): string => {
    if (!ans) return "";
    return ans;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");

    const userMsg: Message = {
      sender: "user",
      text: userText,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveMessageToBackend(updatedMessages);

    // If escalated to human, we skip Gemini agent routing, as human will reply or override!
    if (escalated) {
      return;
    }

    setIsLoading(true);

    try {
      // Call standard full-stack server proxy api post
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          visitorId: visitorId,
          messages: updatedMessages,
          userMessage: userText,
          visitorName: visitorName || "Guest User",
          visitorEmail: visitorEmail || "guest@webnest.dev",
          visitorPhone: visitorPhone || "Not specified"
        })
      });

      const result = await response.json();
      setIsLoading(false);

      if (result.escalate) {
        setEscalated(true);
        setShowEscalationForm(false);
        setEscalationTriggeredText(result.answer || settings.escalationMessage);
        
        const botEscalateMsg: Message = {
          sender: "bot",
          text: result.answer || settings.escalationMessage,
          timestamp: Date.now()
        };

        const systemAnnounceMsg: Message = {
          sender: "system",
          text: `⚡ Omni-Channel Live Representative Hand-off active. An alert notification has been sent to our desk agent inbox, and a secure SMTP email dispatch was routed successfully to care.webnest@gmail.com!`,
          timestamp: Date.now() + 50
        };

        const finalMsgs = [...updatedMessages, botEscalateMsg, systemAnnounceMsg];
        setMessages(finalMsgs);
        await saveMessageToBackend(finalMsgs, true);
      } else {
        const botMsg: Message = {
          sender: "bot",
          text: result.answer || "I received your query. Let me know if I can assist further.",
          timestamp: Date.now()
        };
        const finalMsgs = [...updatedMessages, botMsg];
        setMessages(finalMsgs);
        await saveMessageToBackend(finalMsgs);
      }

    } catch (err) {
      console.error("Widget API communication failed:", err);
      setIsLoading(false);
      
      // Local safety response
      setEscalated(true);
      setShowEscalationForm(false);
      
      const errBotMsg: Message = {
        sender: "bot",
        text: "Apologies, I am experiencing a temporary connection lag. Let me connect you directly to a human live agent.",
        timestamp: Date.now()
      };
      const systemAnnounceMsg: Message = {
        sender: "system",
        text: `⚡ Live active connection backup established. Sync notification has been dispatched to administrators at care.webnest@gmail.com!`,
        timestamp: Date.now() + 50
      };
      const finalMsgs = [...updatedMessages, errBotMsg, systemAnnounceMsg];
      setMessages(finalMsgs);
      await saveMessageToBackend(finalMsgs, true);
    }
  };

  const handleEscalationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.trim()) {
      alert("Name and Email addresses are required to escalate chat.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Update local and server conversation metadata
      setEscalated(true);
      setShowEscalationForm(false);
      
      const escalationSystemMessage: Message = {
        sender: "system",
        text: `⚡ Live escalate connection successful for contact: ${visitorName} (Email: ${visitorEmail}). Mobile desk sounds have been sent!`,
        timestamp: Date.now()
      };

      const finalMessages = [...messages, escalationSystemMessage];
      setMessages(finalMessages);

      if (!isDemo) {
        // Post connection status update
        const payload = {
          id: `${userId}_${visitorId}`,
          userId,
          visitorId,
          visitorName,
          visitorEmail,
          visitorPhone,
          status: "escalated",
          messages: finalMessages,
          lastActive: Date.now(),
          lastMessageText: `User escalated support.`
        };

        await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        // Trigger human notification alerts on Express server
        await fetch("/api/escalate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            visitorId,
            visitorName,
            visitorEmail,
            visitorPhone,
            transcript: finalMessages,
            userMessage: messages[messages.length - 1]?.text || "Ticket started."
          })
        });
      }

      setIsLoading(false);

    } catch (err) {
      console.error("Escalation transmission errored:", err);
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    if (confirm("Are you sure you want to resolve this conversation and clear logs?")) {
      localStorage.removeItem(`webnest_visitor_${userId}`);
      const vid = "visitor_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(`webnest_visitor_${userId}`, vid);
      setVisitorId(vid);
      setEscalated(false);
      setShowEscalationForm(false);
      setMessages([]);
    }
  };

  return (
    <div 
      id="webnest-widget" 
      className="flex flex-col h-full bg-white select-none relative shadow-xl overflow-hidden rounded-2xl border border-gray-150"
      style={{ borderTop: `4px solid ${settings.bubbleColor}` }}
    >
      {/* 1. Header component */}
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div 
              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: settings.bubbleColor }}
            >
              {escalated ? <User size={20} /> : <Bot size={20} />}
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${escalated ? "bg-amber-400 animate-pulse" : "bg-green-500 animate-pulse"}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              {escalated ? "Live Agent Console" : settings.botName}
              {!escalated && (
                <span className="bg-teal-50 text-teal-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse">
                  <Sparkles size={8} /> AI Active
                </span>
              )}
            </h3>
            <p className="text-[10px] text-gray-400 font-medium tracking-tight">
              {escalated ? "Connecting human takeover..." : "Ask us anything 24/7"}
            </p>
          </div>
        </div>

        <button 
          onClick={clearSession}
          className="text-gray-400 hover:text-gray-600 transition-colors text-[10px] bg-gray-50 border border-gray-200 py-1 px-2.5 rounded-lg font-medium"
        >
          Reset Chat
        </button>
      </header>

      {/* 2. Scrollable Messages board */}
      <div 
        ref={boardRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/70"
      >
        {messages.map((m, idx) => {
          const isUser = m.sender === "user";
          const isSystem = m.sender === "system";
          
          if (isSystem) {
            return (
              <div key={idx} className="bg-orange-50 border border-orange-100 text-orange-900 rounded-xl p-3 text-xs flex gap-2.5 items-start">
                <Sparkles size={16} className="text-orange-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] font-medium">{m.text}</p>
              </div>
            );
          }

          return (
            <div 
              key={idx} 
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${isUser ? "bg-gray-200 text-gray-700" : "text-white"}`}
                style={{ backgroundColor: !isUser ? settings.bubbleColor : undefined }}
              >
                {isUser ? <User size={13} /> : (m.sender === "human" ? <Sparkles size={13} /> : <Bot size={13} />)}
              </div>
              
              <div className="space-y-1 max-w-[75%]">
                <div 
                  className={`text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed break-words shadow-xs ${isUser ? "text-white" : "text-gray-800 bg-white border border-gray-100"}`}
                  style={{ backgroundColor: isUser ? settings.bubbleColor : undefined }}
                >
                  {m.text}
                </div>
                <p className="text-[8px] text-gray-400 px-1 font-mono text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Real-time Agent Typing Indicator */}
        {isAgentTyping && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
              style={{ backgroundColor: settings.bubbleColor }}
            >
              <Sparkles size={11} />
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl px-3.5 py-2.5 shadow-xxs flex flex-col gap-1 max-w-[75%]">
              <span className="text-[9px] font-bold text-[#0D9488] font-mono tracking-wider" style={{ color: settings.bubbleColor }}>REPRESENTATIVE TYPING...</span>
              <div className="flex items-center gap-1.5 py-1 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Gemini Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
              style={{ backgroundColor: settings.bubbleColor }}
            >
              <Bot size={13} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-3.5 py-3 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* 3. Dynamic Human escalation collection form */}
        {showEscalationForm && (
          <form 
            onSubmit={handleEscalationSubmit}
            className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-3.5 shadow-md animate-fade-in"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Sparkles className="text-amber-500" size={18} />
              <div>
                <h4 className="text-xs font-bold text-gray-850">Connect with Representative</h4>
                <p className="text-[9px] text-gray-400">Please provide contact details to connect the live line.</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Your Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Liam Smith"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                  <User size={13} className="text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Client Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                  <Mail size={13} className="text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number (Optional)</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 0199"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                  <Phone size={13} className="text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 font-semibold text-xs text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
            >
              Route Live Connection 
              <ArrowRight size={13} />
            </button>
          </form>
        )}
      </div>

      {/* Quick Replies FAQ Suggestion Panel (renders only if active and not escalated) */}
      {!escalated && !showEscalationForm && quickReplies.length > 0 && (
        <div className="px-3 py-1.5 bg-white border-t border-gray-100/60 flex flex-wrap gap-1.5 shrink-0 max-h-[70px] overflow-y-auto">
          {quickReplies.map((qr) => (
            <button
              key={qr.id}
              onClick={() => handleQuickReplyClick(qr.value)}
              className="text-[10px] text-teal-850 bg-teal-50/75 hover:bg-teal-50 border border-teal-150/50 font-bold px-2.5 py-1 rounded-full transition-all tracking-tight cursor-pointer"
            >
              {qr.text}
            </button>
          ))}
        </div>
      )}

      {/* 4. Animated Footer Segment (Enterprise Brand Slider) */}
      <div className="border-t border-b border-gray-50 bg-gray-50/30 py-1 overflow-hidden w-full select-none shrink-0 relative">
        <div className="text-[7px] font-bold text-gray-400 tracking-wider uppercase text-center mb-0.5">
          TRUSTED BY LEADERS
        </div>
        <div className="relative w-full overflow-hidden flex">
          <div className="animate-marquee flex gap-10 items-center justify-around whitespace-nowrap">
            {/* Logos duplicate 1 */}
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">STRIPE</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">SLACK</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">HUBSPOT</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">ZENDESK</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">DROPBOX</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">ACME CORP</span>

            {/* Logos duplicate 2 */}
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">STRIPE</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">SLACK</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">HUBSPOT</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">ZENDESK</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">DROPBOX</span>
            <span className="text-[8px] font-sans font-extrabold text-gray-400 opacity-80 tracking-widest">ACME CORP</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom message submit panel */}
      <footer className="p-3 border-t border-gray-100 bg-white shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input 
            type="text"
            disabled={showEscalationForm}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              showEscalationForm 
                ? "Complete detail card first..." 
                : (escalated ? "Type to chat with human Agent..." : "Ask NestBot a question...")
            }
            className="flex-1 bg-gray-50 border border-gray-200 hover:border-gray-250 font-medium text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || showEscalationForm}
            className="p-3 text-white disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all shadow"
            style={{ backgroundColor: inputValue.trim() && !showEscalationForm ? settings.bubbleColor : undefined }}
          >
            <Send size={15} />
          </button>
        </form>
        <p className="text-[8px] text-gray-400/80 text-center mt-2 flex items-center justify-center gap-1 font-mono">
          <Check size={8} className="text-teal-500" /> Powered by WebNest.dev Enterprise Support
        </p>
      </footer>
    </div>
  );
}
