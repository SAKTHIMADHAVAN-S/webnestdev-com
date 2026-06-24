import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Users, MessageSquare, Code, Settings, Plus, Trash2, Edit2, Check, X, 
  Sparkles, ShieldCheck, Mail, Bell, Globe, ArrowRight, Save, Layout, CreditCard, Play,
  Share2, Smartphone, RefreshCw, Clock, Zap, Sliders, ToggleLeft, HelpCircle, Layers, ShieldAlert
} from "lucide-react";
import Logo from "./Logo";
import { ChatbotSettings, KnowledgeItem, ConversationLog, UserProfile, NotificationLog, Message, QuickReply, ResponseTemplate, FeatureToggles } from "../types";

interface AdminPanelProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onUpgradeProfile: (tier: "monthly" | "annual" | "none") => Promise<void>;
  onSwitchView?: () => void;
}

export default function AdminPanel({ userProfile, onLogout, onUpgradeProfile, onSwitchView }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"conversations" | "knowledge" | "widget-config" | "crm-integrations" | "code-snippet" | "system-logs" | "chatbot-settings" | "purchases" | "admin-workspace">("conversations");
  
  // 1. Widget Settings State
  const [widgetSettings, setWidgetSettings] = useState<ChatbotSettings>({
    id: userProfile.uid,
    botName: "NestBot",
    greetingText: "Hello there! I am WebNest's AI Support. How can my facts assist you today?",
    escalationMessage: "I apologize, but I could not find a clear answer to your question within our knowledge documents. Let me connect you directly to a human live agent.",
    systemPrompt: "You are a professional corporate support representative. Answer queries concisely using the knowledge base. Respond with [ESCALATE_TO_HUMAN] if the query is not resolved.",
    bubbleColor: "#0D9488", // Teal instead of orange
    accentColor: "#F0FDFA", // Teal light instead of orange light
    widgetIcon: "bot",
    widgetPosition: "bottom-right",
    emailNotification: userProfile.email
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 2. Knowledge Base CRUD state
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbAnswer, setKbAnswer] = useState("");
  const [kbCategory, setKbCategory] = useState("General FAQs");
  const [isEditingKbId, setIsEditingKbId] = useState<string | null>(null);
  const [isSavingKb, setIsSavingKb] = useState(false);

  // 3. Live Conversations & Humans takeover state
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatReply, setChatReply] = useState("");
  
  // 4. CRM & Automatic Handover Queue configurations state
  const [crmPipelines, setCrmPipelines] = useState<any>({
    userId: userProfile.uid,
    hubspotConnected: true,
    zohoConnected: false,
    salesforceConnected: false,
    lastSyncTimestamp: Date.now() - 3600000,
    syncedLeadsCount: 14,
    whatsappConnected: true,
    whatsappNumber: "+1 (555) 902-1400",
    whatsappToken: "wh_live_83ba928aee",
    mobileConnected: true,
    mobileAppId: "com.webnest.security",
    mobileToken: "sdk_token_71bfa982",
    telegramConnected: false,
    telegramBotToken: ""
  });
  const [isSyncingCrm, setIsSyncingCrm] = useState(false);
  const [supportHours, setSupportHours] = useState({
    supportStartHour: "09:00",
    supportEndHour: "17:00",
    timeZone: "EST",
    offHoursAutoQueue: true
  });

  // 5. System Notifications list
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // 6. SaaS Advanced Chatbot Settings states
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([]);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({
    userId: userProfile.uid,
    fileUploadEnabled: true,
    liveHandoffEnabled: true,
    speechToTextEnabled: false,
    proactiveGreetingEnabled: true,
    customVibeThemeEnabled: false
  });
  const [settingsSubTab, setSettingsSubTab] = useState<"quick-replies" | "templates" | "features">("quick-replies");

  // Tab A parameters
  const [qrText, setQrText] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [qrOrder, setQrOrder] = useState(1);
  const [editingQrId, setEditingQrId] = useState<string | null>(null);

  // Tab B parameters
  const [rtTrigger, setRtTrigger] = useState("");
  const [rtResponse, setRtResponse] = useState("");
  const [editingRtId, setEditingRtId] = useState<string | null>(null);

  const [isSavingAdvancedSetting, setIsSavingAdvancedSetting] = useState(false);

  // Dynamic customizable SaaS states for Admin Workspace
  const [packages, setPackages] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [footerSettings, setFooterSettings] = useState<any>({
    id: "default_footer",
    termsAndConditions: "",
    refundPolicies: "",
    contactEmail: "care.webnest@gmail.com",
    contactWhatsapp: ""
  });

  const [homepageSettings, setHomepageSettings] = useState<any>({
    heroBadge: "",
    heroHeading1: "",
    heroHeading2: "",
    heroDescription: "",
    featuresTitle: "",
    featuresDesc: "",
    chatTitle: "",
    chatDesc: "",
    activeOfferText: "",
    activeOfferButtonLabel: "",
    activeOfferButtonUrl: "",
    activeOfferActive: true
  });
  const [isSavingHomepage, setIsSavingHomepage] = useState(false);

  // Active Admin workspace sub-tabs
  const [adminSubTab, setAdminSubTab] = useState<"packages" | "feedbacks" | "invoices" | "footer" | "homepage" | "logins">("packages");
  const [logins, setLogins] = useState<any[]>([]);

  // State forms for Package CRUD
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState(0);
  const [packagePeriod, setPackagePeriod] = useState("per month");
  const [packageFeatures, setPackageFeatures] = useState(""); 
  const [packageDays, setPackageDays] = useState<number>(30);

  // State forms for Feedback CRUD
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackClientName, setFeedbackClientName] = useState("");
  const [feedbackClientEmail, setFeedbackClientEmail] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  // State forms for Invoices CRUD
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceClientName, setInvoiceClientName] = useState("");
  const [invoiceClientEmail, setInvoiceClientEmail] = useState("");
  const [invoicePackageName, setInvoicePackageName] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState(99);
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState("Credit Card (Simulated)");
  const [invoiceStatus, setInvoiceStatus] = useState<"paid" | "pending" | "failed">("paid");
  
  // Invoice live-preview selection
  const [previewingInvoice, setPreviewingInvoice] = useState<any | null>(null);

  // Manual Customer Purchase states
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [purchClientName, setPurchClientName] = useState("");
  const [purchClientEmail, setPurchClientEmail] = useState("");
  const [purchPackageName, setPurchPackageName] = useState("Pro Live Bot Plan");
  const [purchAmount, setPurchAmount] = useState<number>(149);
  const [purchPaymentMethod, setPurchPaymentMethod] = useState("Paytm Payment Gateway");
  const [purchDate, setPurchDate] = useState(new Date().toISOString().substring(0, 10));
  const [purchTime, setPurchTime] = useState(new Date().toTimeString().substring(0, 5));
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");

  // 1-second website connector simulation states
  const [inputWebsiteToConnect, setInputWebsiteToConnect] = useState("");
  const [isConnectingWebsite, setIsConnectingWebsite] = useState(false);
  const [connectedWebsitesList, setConnectedWebsitesList] = useState<string[]>(["demo-webnest.vercel.app"]);
  const [connectedSuccessMessage, setConnectedSuccessMessage] = useState("");


  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Clear reply text box when selected chat changes
  useEffect(() => {
    setChatReply("");
  }, [selectedConvId]);

  // Send typing events to the server as the representative types
  useEffect(() => {
    if (!selectedConvId) return;

    const convId = selectedConvId;

    if (!chatReply.trim()) {
      fetch(`/api/conversations/${convId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing: false })
      }).catch(() => {});
      lastTypingSentRef.current = 0;
      return;
    }

    const now = Date.now();
    // Only send the typing heartbeat every 2 seconds
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      fetch(`/api/conversations/${convId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing: true })
      }).catch(() => {});
    }

    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/conversations/${convId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing: false })
      }).catch(() => {});
      lastTypingSentRef.current = 0;
    }, 3000);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [chatReply, selectedConvId]);

  // Load calculations
  const escalatedCount = conversations.filter(c => c.status === "escalated").length;
  const activeChat = conversations.find(c => c.id === selectedConvId);

  // A. Fetch All Data Periodically (Removing Firestore listeners)
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        // Widget config
        const widgetConfigRes = await fetch(`/api/chatbots/settings?userId=${userProfile.uid}`);
        if (widgetConfigRes.ok) {
          const cfg = await widgetConfigRes.json();
          setWidgetSettings(cfg);
        }

        // Knowledge Base FAQs
        const kbRes = await fetch(`/api/chatbots/knowledge?userId=${userProfile.uid}`);
        if (kbRes.ok) {
          const kbItems = await kbRes.json();
          setKnowledgeItems(kbItems);
        }

        // Active conversation tickets
        const convRes = await fetch(`/api/conversations?userId=${userProfile.uid}`);
        if (convRes.ok) {
          const list = await convRes.json();
          setConversations(list);
        }

        // Active alerts & notifications
        const notificationRes = await fetch(`/api/chat_notifications?userId=${userProfile.uid}`);
        if (notificationRes.ok) {
          const alerts = await notificationRes.json();
          setNotifications(alerts);
        }

        // Fetch CRM status real-time
        const crmRes = await fetch(`/api/crm/settings?userId=${userProfile.uid}`);
        if (crmRes.ok) {
          const crmData = await crmRes.json();
          setCrmPipelines(crmData);
        }

        // Fetch Quick Replies
        const qrRes = await fetch(`/api/chatbots/quick-replies?userId=${userProfile.uid}`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQuickReplies(qrData);
        }

        // Fetch Response Templates
        const rtRes = await fetch(`/api/chatbots/response-templates?userId=${userProfile.uid}`);
        if (rtRes.ok) {
          const rtData = await rtRes.json();
          setResponseTemplates(rtData);
        }

        // Fetch Feature Toggles
        const ftRes = await fetch(`/api/chatbots/feature-toggles?userId=${userProfile.uid}`);
        if (ftRes.ok) {
          const ftData = await ftRes.json();
          setFeatureToggles(ftData);
        }

        // Fetch customizable packages
        const packagesRes = await fetch("/api/packages");
        if (packagesRes.ok) {
          const pkData = await packagesRes.json();
          setPackages(pkData);
        }

        // Fetch feedbacks
        const feedbacksRes = await fetch("/api/feedbacks");
        if (feedbacksRes.ok) {
          const fbData = await feedbacksRes.json();
          setFeedbacks(fbData);
        }

        // Fetch invoices
        const invoicesRes = await fetch("/api/invoices");
        if (invoicesRes.ok) {
          const invData = await invoicesRes.json();
          setInvoices(invData);
        }

        // Fetch general footer settings
        const footerRes = await fetch("/api/footer-settings");
        if (footerRes.ok) {
          const fsData = await footerRes.json();
          setFooterSettings(fsData);
        }

        // Fetch homepage settings
        const homepageRes = await fetch("/api/homepage-settings");
        if (homepageRes.ok) {
          const hpData = await homepageRes.json();
          setHomepageSettings(hpData);
        }

        // Fetch logins tracker data
        const loginsRes = await fetch("/api/logins");
        if (loginsRes.ok) {
          const lData = await loginsRes.json();
          setLogins(lData);
        }

      } catch (err) {
        console.warn("Error polling admin dataset:", err);
      }
    };

    fetchFreshData();
    const updater = setInterval(fetchFreshData, 4000);
    return () => clearInterval(updater);
  }, [userProfile.uid]);

  // Scroll to bottom of chat transcripts
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?.messages]);


  // --- ADMIN WORKSPACE CRUD HANDLERS ---
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;

    const payload = {
      id: editingPackageId || undefined,
      name: packageName,
      price: Number(packagePrice),
      periodText: packagePeriod,
      features: packageFeatures.split("\n").map(f => f.trim()).filter(Boolean),
      isPopular: false,
      days: Number(packageDays || 30)
    };

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setPackageName("");
        setPackagePrice(0);
        setPackagePeriod("per month");
        setPackageFeatures("");
        setPackageDays(30);
        setEditingPackageId(null);
        const pkgs = await (await fetch("/api/packages")).json();
        setPackages(pkgs);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name);
    setPackagePrice(pkg.price);
    setPackagePeriod(pkg.periodText);
    setPackageFeatures(pkg.features.join("\n"));
    setPackageDays(pkg.days ?? 30);
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package pricing?")) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (res.ok) {
        const pkgs = await (await fetch("/api/packages")).json();
        setPackages(pkgs);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackClientName.trim()) return;

    const payload = {
      id: editingFeedbackId || undefined,
      clientName: feedbackClientName,
      clientEmail: feedbackClientEmail,
      rating: Number(feedbackRating),
      comment: feedbackComment,
      timestamp: Date.now()
    };

    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFeedbackClientName("");
        setFeedbackClientEmail("");
        setFeedbackRating(5);
        setFeedbackComment("");
        setEditingFeedbackId(null);
        const fbs = await (await fetch("/api/feedbacks")).json();
        setFeedbacks(fbs);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditFeedback = (fb: any) => {
    setEditingFeedbackId(fb.id);
    setFeedbackClientName(fb.clientName);
    setFeedbackClientEmail(fb.clientEmail || "");
    setFeedbackRating(fb.rating);
    setFeedbackComment(fb.comment);
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom feedback?")) return;
    try {
      const res = await fetch(`/api/feedbacks/${id}`, { method: "DELETE" });
      if (res.ok) {
        const fbs = await (await fetch("/api/feedbacks")).json();
        setFeedbacks(fbs);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceClientName.trim()) return;

    const payload = {
      id: editingInvoiceId || undefined,
      clientName: invoiceClientName,
      clientEmail: invoiceClientEmail,
      packageName: invoicePackageName || "Silver Package",
      amount: Number(invoiceAmount),
      paymentMethod: invoicePaymentMethod,
      status: invoiceStatus,
      timestamp: Date.now()
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setInvoiceClientName("");
        setInvoiceClientEmail("");
        setInvoicePackageName("");
        setInvoiceAmount(99);
        setInvoicePaymentMethod("Credit Card (Simulated)");
        setInvoiceStatus("paid");
        setEditingInvoiceId(null);
        const invs = await (await fetch("/api/invoices")).json();
        setInvoices(invs);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditInvoice = (inv: any) => {
    setEditingInvoiceId(inv.id);
    setInvoiceClientName(inv.clientName);
    setInvoiceClientEmail(inv.clientEmail || "");
    setInvoicePackageName(inv.packageName);
    setInvoiceAmount(inv.amount);
    setInvoicePaymentMethod(inv.paymentMethod);
    setInvoiceStatus(inv.status);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        const invs = await (await fetch("/api/invoices")).json();
        setInvoices(invs);
        if (previewingInvoice?.id === id) {
          setPreviewingInvoice(null);
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const handleSaveFooterSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFooter(true);
    try {
      const res = await fetch("/api/footer-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(footerSettings)
      });
      if (res.ok) {
        const result = await res.json();
        setFooterSettings(result.footerSettings);
        alert("Footer customization settings updated successfully!");
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSavingFooter(false);
    }
  };


  // 1b. CRUD HANDLERS FOR SAAS ADVANCED SETTINGS
  // --- Tab A: Quick Replies ---
  const handleSaveQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrText.trim() || !qrValue.trim()) return;
    setIsSavingAdvancedSetting(true);
    const idStr = editingQrId || `qr_${userProfile.uid}_${Date.now()}`;
    const payload: QuickReply = {
      id: idStr,
      userId: userProfile.uid,
      text: qrText.trim(),
      value: qrValue.trim(),
      order: Number(qrOrder || 0)
    };
    try {
      const res = await fetch("/api/chatbots/quick-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setQrText("");
        setQrValue("");
        setQrOrder(1);
        setEditingQrId(null);
        // Refresh local cache
        const updatedRes = await fetch(`/api/chatbots/quick-replies?userId=${userProfile.uid}`);
        if (updatedRes.ok) setQuickReplies(await updatedRes.json());
      }
    } catch (err) {
      console.warn("Failed saving quick reply:", err);
    } finally {
      setIsSavingAdvancedSetting(false);
    }
  };

  const handleEditQuickReply = (qr: QuickReply) => {
    setEditingQrId(qr.id);
    setQrText(qr.text);
    setQrValue(qr.value);
    setQrOrder(qr.order);
  };

  const handleDeleteQuickReply = async (id: string) => {
    try {
      const res = await fetch(`/api/chatbots/quick-replies/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuickReplies(prev => prev.filter(q => q.id !== id));
        if (editingQrId === id) {
          setEditingQrId(null);
          setQrText("");
          setQrValue("");
          setQrOrder(1);
        }
      }
    } catch (err) {
      console.warn("Failed deleting quick reply:", err);
    }
  };

  // --- Tab B: Response Templates ---
  const handleSaveResponseTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtTrigger.trim() || !rtResponse.trim()) return;
    setIsSavingAdvancedSetting(true);
    const idStr = editingRtId || `rt_${userProfile.uid}_${Date.now()}`;
    const payload: ResponseTemplate = {
      id: idStr,
      userId: userProfile.uid,
      trigger: rtTrigger.toLowerCase().trim(),
      responseText: rtResponse.trim()
    };
    try {
      const res = await fetch("/api/chatbots/response-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setRtTrigger("");
        setRtResponse("");
        setEditingRtId(null);
        const updatedRes = await fetch(`/api/chatbots/response-templates?userId=${userProfile.uid}`);
        if (updatedRes.ok) setResponseTemplates(await updatedRes.json());
      }
    } catch (err) {
      console.warn("Failed saving response template:", err);
    } finally {
      setIsSavingAdvancedSetting(false);
    }
  };

  const handleEditResponseTemplate = (temp: ResponseTemplate) => {
    setEditingRtId(temp.id);
    setRtTrigger(temp.trigger);
    setRtResponse(temp.responseText);
  };

  const handleDeleteResponseTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/chatbots/response-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setResponseTemplates(prev => prev.filter(temp => temp.id !== id));
        if (editingRtId === id) {
          setEditingRtId(null);
          setRtTrigger("");
          setRtResponse("");
        }
      }
    } catch (err) {
      console.warn("Failed deleting response template:", err);
    }
  };

  // --- Tab C: Feature Toggles ---
  const handleToggleFeature = async (field: keyof FeatureToggles) => {
    if (field === "userId") return;
    const togglesCopy = { ...featureToggles };
    togglesCopy[field] = !togglesCopy[field] as any;
    
    // Check pricing tier limit bounds as requested!
    const isProTier = userProfile.billingStatus === "Active";
    
    // File upload and Custom Theme and Speech-to-text require sub active tiers pricing!
    if ((field === "fileUploadEnabled" || field === "customVibeThemeEnabled" || field === "speechToTextEnabled") && !isProTier && togglesCopy[field]) {
      alert(`⚠️ FEATURE GATE CONTROL LIMIT: "${field == "fileUploadEnabled" ? "File Upload Option" : field == "customVibeThemeEnabled" ? "Corporate Branding Themes" : "Speech Multi-Modal input"}" is reserved for premium accounts only. Please upgrade from Free Trial to Active tier!`);
      return;
    }

    setFeatureToggles(togglesCopy);
    try {
      await fetch("/api/chatbots/feature-toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(togglesCopy)
      });
    } catch (err) {
      console.warn("Failed mutating feature toggles:", err);
    }
  };

  // 1. SAVE WIDGET STYLE CONFIGS
  const handleSaveWidgetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/chatbots/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(widgetSettings)
      });
      if (!response.ok) {
        throw new Error("API responded with an error");
      }
      setIsSavingSettings(false);
      alert("Chatbot interface style and backend instructions saved successfully!");
    } catch (err) {
      alert("Failed to update widget settings configuration: " + err);
      setIsSavingSettings(false);
    }
  };

  // 2. KNOWLEDGE BASE CRUD SUBMISSIONS
  const handleSaveKnowledgeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbQuestion.trim() || !kbAnswer.trim()) {
      alert("Topic Question and Fact Answer content cannot be blank.");
      return;
    }

    setIsSavingKb(true);
    try {
      const id = isEditingKbId || "fact_" + Math.random().toString(36).substring(2, 11);
      const payload = {
        id,
        userId: userProfile.uid,
        question: kbQuestion,
        answer: kbAnswer,
        category: kbCategory,
        isCustom: true
      };

      const response = await fetch("/api/chatbots/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("API responded with an error");
      }

      setIsSavingKb(false);
      setKbQuestion("");
      setKbAnswer("");
      setIsEditingKbId(null);
    } catch (err) {
      alert("Error writing training data document: " + err);
      setIsSavingKb(false);
    }
  };

  const handleEditKb = (item: KnowledgeItem) => {
    setIsEditingKbId(item.id);
    setKbQuestion(item.question);
    setKbAnswer(item.answer);
    setKbCategory(item.category);
  };

  const handleDeleteKb = async (id: string) => {
    if (confirm("Are you sure you want to delete this training knowledge item?")) {
      try {
        const response = await fetch(`/api/chatbots/knowledge/${id}`, {
          method: "DELETE"
        });
        if (!response.ok) {
          throw new Error("Failed deleting the knowledge base faq element");
        }
      } catch (err) {
        alert("Failed to delete fact: " + err);
      }
    }
  };

  // 3. HUMAN LIVE OVERRIDE / TAKEOVER SEND REPLY
  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !selectedConvId || !activeChat) return;

    const textMsg = chatReply;
    setChatReply("");

    const humanMsg: Message = {
      sender: "human",
      text: textMsg,
      timestamp: Date.now()
    };

    const updatedMsgs = [...(activeChat.messages || []), humanMsg];
    const updatedChat = {
      ...activeChat,
      messages: updatedMsgs,
      lastActive: Date.now(),
      lastMessageText: `Representative: "${textMsg}"`
    };

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedChat)
      });
      if (!response.ok) {
        throw new Error("Network error transmitting human override reply");
      }
    } catch (err) {
      alert("Failed to transmit manual reply: " + err);
    }
  };

  // Claim active ticket for Agent Takeover
  const handleClaimTicket = async (convId: string) => {
    try {
      const response = await fetch("/api/conversations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: convId, assignedTo: "Liam Gardner" })
      });
      if (response.ok) {
        // Optimistically update conversations
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, assignedTo: "Liam Gardner" } : c));
      } else {
        alert("Could not claim this segment. Check server status.");
      }
    } catch (err) {
      console.warn("Error claiming conversation ticket:", err);
    }
  };

  // Mark ticket as resolved
  const handleResolveConversation = async (convId: string) => {
    try {
      const target = conversations.find(c => c.id === convId);
      if (target) {
        const revised = {
          ...target,
          status: "resolved"
        };
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(revised)
        });
        if (!response.ok) {
          throw new Error("Error posting resolved status update");
        }
        alert("Live conversation marked resolved! Returned chatbot control.");
      }
    } catch (err) {
      alert("Failed to update ticket: " + err);
    }
  };

  // 4. CRM SYNC & HYBRID AVAILABILITY SCHEDULERS
  const handleSyncCrmNow = async () => {
    setIsSyncingCrm(true);
    try {
      const response = await fetch("/api/crm/sync-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile.uid })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Synchronize endpoint failed");
      }
      setCrmPipelines(data.crm);
      alert(`CRM Synchronization active: ${data.message}`);
    } catch (err: any) {
      alert("Failed integrating CRM pipeline: " + err.message);
    } finally {
      setIsSyncingCrm(false);
    }
  };

  const handleToggleCrmIntegration = async (platform: string) => {
    try {
      const updated = {
        ...crmPipelines,
        [`${platform}Connected`]: !crmPipelines[`${platform}Connected`]
      };
      
      const response = await fetch("/api/crm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setCrmPipelines(updated);
      }
    } catch (err) {
      console.error("Failed toggling CRM state:", err);
    }
  };

  const handleSaveCrmPipelines = async (updatedObj = crmPipelines) => {
    try {
      const response = await fetch("/api/crm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedObj)
      });
      if (response.ok) {
        const data = await response.json();
        setCrmPipelines(data.crm);
      }
    } catch (err) {
      console.error("Failed saving CRM omnichannel settings:", err);
    }
  };

  const handleSaveHomepageSettings = async (updatedSettingsObj: any) => {
    setIsSavingHomepage(true);
    try {
      const response = await fetch("/api/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettingsObj)
      });
      if (response.ok) {
        const data = await response.json();
        setHomepageSettings(data.homepageSettings);
        alert("WebNest Homepage Customized Settings & Active Offers updated successfully across live databases!");
      } else {
        alert("Failed to save homepage settings.");
      }
    } catch (err) {
      console.error("Failed saving custom homepage options:", err);
      alert("Network exception saving homepage parameters.");
    } finally {
      setIsSavingHomepage(false);
    }
  };

  const handleSaveSupportHours = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save directly to backend chatbot configs
      const updatedSettings = {
        ...widgetSettings,
        systemPrompt: `${widgetSettings.systemPrompt}. Target support hours: ${supportHours.supportStartHour} to ${supportHours.supportEndHour} ${supportHours.timeZone}.`
      };
      
      const response = await fetch("/api/chatbots/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (response.ok) {
        setWidgetSettings(updatedSettings);
        alert("SLA Support Hours configuration saved successfully!");
      }
    } catch (err) {
      alert("Failed storing business support window metadata.");
    }
  };

  // Upgrading own billing tier directly within dev console!
  const handleOwnTierUpgrade = async (tier: "monthly" | "annual" | "none") => {
    try {
      await onUpgradeProfile(tier);
      alert(`Upgraded subscription successfully to ${tier === "none" ? "Free" : tier}!`);
    } catch (err) {
      alert("Billing activation failed.");
    }
  };

  return (
    <div id="webnest-admin" className="min-h-screen bg-gray-50 flex flex-col font-sans select-none">
      
      {/* Platform Dashboard Top Info bar */}
      <div className="bg-gray-900 border-b border-teal-950/20 text-teal-400 text-[10px] px-6 py-2 flex items-center justify-between font-mono font-medium tracking-wider">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block" />
          <span><b>Trust | Safe | Growth</b></span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span>100% SAFE AND SECURE</span>
        </div>
      </div>

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-8">
          <Logo size={42} showText={true} lightMode={true} />
          
          {/* Prominent High-Visibility Home Dashboard Button */}
          <button 
            onClick={() => { setActiveTab("conversations"); setSelectedConvId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === "conversations" ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm" : "bg-white border-gray-250 text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
            title="Return to primary inbox workspace"
          >
            <Layout size={15} className={activeTab === "conversations" ? "text-teal-600" : "text-gray-400"} />
            <span>Home Dashboard</span>
          </button>
        </div>

        {/* Current Hosting Plan indicator card & login identity & logout */}
        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-between md:justify-end">
          
          {/* Client Developer Login Identity Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-xl bg-gray-50/70">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
              {userProfile.displayName ? userProfile.displayName.charAt(0) : "U"}
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-xs font-bold text-gray-800 leading-none flex items-center gap-1.5">
                <span>{userProfile.displayName || "Admin Account"}</span>
                {userProfile.email === "care.webnest@gmail.com" && (
                  <span className="bg-orange-650 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs" style={{ backgroundColor: "#FF6321" }}>FOUNDER & CEO</span>
                )}
              </p>
              <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-tight">
                {userProfile.email === "care.webnest@gmail.com" ? "Founder And Ceo of WebNest" : userProfile.email}
              </p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-150 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
            <CreditCard size={15} className="text-teal-600" />
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase">HOSTING PLAN</p>
              <p className="text-xs font-bold text-teal-850 uppercase font-mono leading-none">
                {userProfile.billingStatus === "Active" ? `${userProfile.billingTier} Tier` : "Enterprise Trial Account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchView && userProfile.email === "care.webnest@gmail.com" && (
              <button 
                onClick={onSwitchView}
                className="text-xs bg-orange-50 hover:bg-orange-100 text-[#FF6321] py-2.5 px-4 rounded-xl font-black transition-all border border-orange-200 flex items-center gap-1.5 cursor-pointer"
                title="Edit packages, feedbacks, footer policies directly on live homepage"
              >
                🛠️ Homepage CRUD View
              </button>
            )}
            <button 
              onClick={onLogout}
              className="text-xs bg-gray-100 hover:bg-gray-250 text-gray-700 py-2.5 px-4 rounded-xl font-bold transition-all border border-gray-200 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 24/7 Smart Live Chat Real-Time Active Offer Banner */}
      {homepageSettings && homepageSettings.activeOfferActive && homepageSettings.activeOfferText && (
        <div className="mx-4 lg:mx-6 mt-4 p-4.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-white text-orange-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider animate-pulse shrink-0">
              ⚡ Exclusive WebNest Offer
            </span>
            <p className="text-xs sm:text-sm font-extrabold tracking-tight">
              {homepageSettings.activeOfferText}
            </p>
          </div>
          {homepageSettings.activeOfferButtonLabel && (
            <a 
              href={homepageSettings.activeOfferButtonUrl || "#pricing"}
              className="bg-white hover:bg-orange-50 text-[#FF6321] font-black text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-sm tracking-tight shrink-0 text-center"
            >
              {homepageSettings.activeOfferButtonLabel}
            </a>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6 overflow-hidden">
        
        {/* Left Sidebar navigation tab rail */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2">Primary Controls</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab("conversations")}
                className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "conversations" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare size={16} /> Live Escalated Inbox
                </span>
                {escalatedCount > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${activeTab === "conversations" ? "bg-white text-teal-600" : "bg-red-500 text-white"}`}>
                    {escalatedCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab("knowledge")}
                className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "knowledge" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Bot size={16} /> Bot Training FAQs
              </button>

              <button 
                onClick={() => setActiveTab("widget-config")}
                className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "widget-config" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Settings size={16} /> Widget Interface Theme
              </button>

              <button 
                onClick={() => setActiveTab("chatbot-settings")}
                className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "chatbot-settings" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Sliders size={16} /> SaaS Bot Advanced Settings
              </button>

              <button 
                onClick={() => setActiveTab("code-snippet")}
                className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "code-snippet" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Code size={16} /> Script Snip Embed
              </button>
            </nav>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2">Enterprise Sync & Queues</p>
            <nav className="space-y-1">
              <button 
                onClick={() => { setActiveTab("crm-integrations"); setSelectedConvId(null); }}
                className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "crm-integrations" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Share2 size={16} /> CRM Hub & Routing
              </button>

              <button 
                onClick={() => setActiveTab("system-logs")}
                className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "system-logs" ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="flex items-center gap-2.5">
                  <Mail size={16} /> Live Delivery Logs
                </span>
                {notifications.length > 0 && (
                  <span className="text-[9px] bg-teal-50 text-teal-600 font-semibold px-2 py-0.5 rounded-md">
                    {notifications.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {userProfile.email === "care.webnest@gmail.com" && (
            <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-200 shadow-xs space-y-4">
              <p className="text-[10px] font-bold text-orange-700 tracking-wider uppercase px-2">Admin Authority Controls</p>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab("admin-workspace")}
                  className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === "admin-workspace" ? "bg-orange-600 text-white shadow-md shadow-orange-600/10" : "text-orange-900 hover:bg-orange-100/30"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-orange-500 group-hover:text-amber-600" /> WebNest Admin Workspace
                  </span>
                  <span className="bg-orange-150 text-orange-850 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-tighter">
                    Active
                  </span>
                </button>

                <button 
                  onClick={() => setActiveTab("purchases")}
                  className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "purchases" ? "bg-orange-600 text-white shadow-md shadow-orange-600/10" : "text-orange-900 hover:bg-orange-100/30"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard size={16} /> Customers Purchase History
                  </span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${activeTab === "purchases" ? "bg-white text-orange-600" : "bg-orange-100 text-orange-800"}`}>
                    {invoices.length}
                  </span>
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Right Content Panels */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          
          {/* TAB 1: COVERSATION LOGS & HUMAN MANUAL TAKEOVER INTERFACE */}
          {activeTab === "conversations" && (
            <div id="m-inbox-panel" className="flex-1 flex flex-col md:grid md:grid-cols-5 min-h-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Inbox lists left */}
              <div className="md:col-span-2 flex flex-col min-h-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-850 flex items-center gap-1.5">
                      Conversations Inbox
                    </h3>
                    <p className="text-[9px] text-gray-400">Total logs: {conversations.length}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-600 text-[9px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse" />
                    Live Sync active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {conversations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 space-y-2">
                      <MessageSquare size={32} className="mx-auto stroke-[1.5]" />
                      <p className="text-xs font-medium">No live active conversation tickets cataloged yet.</p>
                      <p className="text-[10px]">Your embedded widget will register tickets automatically on load.</p>
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isEscalatedStatus = c.status === "escalated";
                      const isSelected = c.id === selectedConvId;
                      
                      return (
                        <div 
                          key={c.id}
                          onClick={() => setSelectedConvId(c.id)}
                          className={`p-4 cursor-pointer hover:bg-gray-50/50 transition-colors text-left space-y-2.5 ${isSelected ? "bg-teal-50/70 border-l-4 border-teal-500" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-850 flex items-center gap-1.5">
                              {c.visitorName || "Anonymous Visitor"}
                              {isEscalatedStatus && (
                                <span className="bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  Escalated
                                </span>
                              )}
                            </span>
                            <span className="text-[8px] font-mono text-gray-400">
                              {new Date(c.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-gray-500 truncate font-light leading-normal">
                            {c.lastMessageText || "No active transmission history."}
                          </p>

                          {/* NLP Tags and department routing row */}
                          {((c.tags && c.tags.length > 0) || c.department) && (
                            <div className="flex flex-wrap gap-1 items-center">
                              {c.department && (
                                <span className="text-[8px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                  {c.department}
                                </span>
                              )}
                              {c.tags && c.tags.map((t) => (
                                <span key={t} className="text-[8px] bg-gray-50 text-gray-500 border border-gray-150 font-bold px-1 py-0.2 rounded uppercase">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100/60 text-[9px]">
                            {/* Omnichannel identity */}
                            <span className="flex items-center gap-1 text-gray-400">
                              {c.channel === "whatsapp" ? (
                                <span className="flex items-center gap-0.5 text-emerald-600 font-semibold text-[8px]">
                                  <Smartphone size={10} /> WhatsApp
                                </span>
                              ) : c.channel === "ios" || c.channel === "android" || c.channel === "mobile_sdk" ? (
                                <span className="flex items-center gap-0.5 text-blue-600 font-semibold text-[8px]">
                                  <Smartphone size={10} /> Mobile SDK
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-teal-600 font-semibold text-[8px]">
                                  <Globe size={10} /> Web Widget
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Claim validation */}
                              <span className="text-[8px] font-bold text-gray-400">
                                {c.assignedTo ? `Claimed: ${c.assignedTo}` : "Unclaimed"}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${c.status === "resolved" ? "bg-green-100 text-green-700" : (c.status === "escalated" ? "bg-red-105 text-red-700" : "bg-orange-100 text-orange-700")}`}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat override screen right */}
              <div className="md:col-span-3 flex flex-col min-h-0 bg-gray-50/20">
                {activeChat ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <header className="px-4 py-3.5 border-b border-gray-150 bg-white flex items-center justify-between shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-gray-850">
                          Active Override Session: {activeChat.visitorName || "Guest User"}
                        </h4>
                        <p className="text-[9px] text-gray-400">Continuous Sync State: <span className="text-teal-600 font-bold font-mono">ONLINE</span></p>
                      </div>

                      <div className="flex gap-2">
                        {!activeChat.assignedTo ? (
                          <button 
                            onClick={() => handleClaimTicket(activeChat.id)}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-teal-600/15 cursor-pointer font-sans"
                          >
                            <Zap size={12} /> Claim Ticket
                          </button>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <Check size={11} className="stroke-[2.5]" /> Claimed as Liam Gardner
                          </span>
                        )}

                        {activeChat.status !== "resolved" && (
                          <button 
                            onClick={() => handleResolveConversation(activeChat.id)}
                            className="bg-green-600 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-sans cursor-pointer"
                          >
                            <Check size={12} /> Mark Resolved
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedConvId(null)}
                          className="text-gray-400 hover:text-gray-600 ml-1 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </header>

                    {/* Split View Container for chat and telemetry */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 min-h-0 bg-gray-50/20">
                      
                      {/* Left Column: Chat Area */}
                      <div className="lg:col-span-3 flex flex-col min-h-0 border-r border-gray-200">
                        {/* Messages transcripts board */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                          {activeChat.status === "escalated" && (
                            <div className="bg-teal-50 border border-teal-100 text-teal-900 rounded-xl p-3 text-[10px] font-sans flex items-start gap-2 max-w-lg mb-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 block mt-1.5 shrink-0" />
                              <p>
                                <b>HUMAN OVERRIDE ENGAGED:</b> Complete conversational transcript synced dynamically. Automatic bot controls have been bypassed.
                              </p>
                            </div>
                          )}

                          {activeChat.messages?.map((m: Message, idx: number) => {
                            const isSelf = m.sender === "human" || m.sender === "system";
                            const isBot = m.sender === "bot";
                            
                            return (
                              <div 
                                key={idx}
                                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                              >
                                <span className="text-[8px] text-gray-400 px-1 font-mono uppercase">
                                  {m.sender}
                                </span>
                                <div 
                                  className={`text-xs px-3.5 py-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                                    m.sender === "human" 
                                      ? "bg-teal-600 text-white" 
                                      : (m.sender === "system" ? "bg-teal-50 text-teal-950 font-semibold" : "bg-gray-100 border border-gray-150 text-gray-800")
                                  }`}
                                >
                                  {m.text}
                                </div>
                                <span className="text-[8px] text-gray-400 mt-0.5 px-1 font-mono">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input Reply block */}
                        <footer className="p-3.5 border-t border-gray-200 bg-gray-50/50 shrink-0 space-y-3">
                          
                          {/* Canned replies templates shortcuts row */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Canned Reply Templates Quick Shortcuts:</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button 
                                type="button"
                                onClick={() => setChatReply("Pricing tiers reside at $49/month for Pro and $299/month for enterprise teams. Omnichannel continuity is active.")}
                                className="text-[9px] bg-white hover:bg-teal-50 border border-gray-200 text-gray-600 font-bold px-2 py-1 rounded-md transition-colors cursor-pointer select-none"
                              >
                                🏷️ /pricing
                              </button>
                              <button 
                                type="button"
                                onClick={() => setChatReply("To synchronize our web widget, copy and insert the custom dynamic JavaScript snippet exactly before your </body> tag.")}
                                className="text-[9px] bg-white hover:bg-teal-50 border border-gray-200 text-gray-600 font-bold px-2 py-1 rounded-md transition-colors cursor-pointer select-none"
                              >
                                🛠️ /setup
                              </button>
                              <button 
                                type="button"
                                onClick={() => setChatReply("Full refund is executed immediately back to your transaction account if requested within our standard 14-day SLA.")}
                                className="text-[9px] bg-white hover:bg-teal-50 border border-gray-200 text-gray-600 font-bold px-2 py-1 rounded-md transition-colors cursor-pointer select-none"
                              >
                                🔄 /refund
                              </button>
                            </div>
                          </div>

                          <form onSubmit={handleSendManualReply} className="flex gap-2">
                            <input 
                              type="text"
                              required
                              value={chatReply}
                              onChange={(e) => setChatReply(e.target.value)}
                              placeholder="Type customer reply here (automatically pre-fills from shortcuts)..."
                              className="flex-1 bg-white border border-gray-200 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-teal-500 font-medium text-gray-700 shadow-xxs"
                            />
                            <button 
                              type="submit"
                              className="bg-teal-600 hover:bg-teal-700 font-bold text-xs text-white px-5 rounded-xl shadow-md shadow-teal-600/10 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              Send Reply
                            </button>
                          </form>
                        </footer>
                      </div>

                      {/* Right Column: Pre-Qualification Lead Details */}
                      <div className="lg:col-span-1 p-4 space-y-4 overflow-y-auto text-left flex flex-col justify-between h-full bg-slate-50 border-l border-gray-150">
                        <div className="space-y-4">
                          <header className="pb-2 border-b border-gray-200">
                            <span className="text-[8px] bg-teal-50 text-teal-700 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              NLP Handover Intent
                            </span>
                            <h5 className="text-[11px] font-bold text-gray-800 mt-1.5 uppercase tracking-wide">
                              Customer Contact Profile
                            </h5>
                          </header>

                          {/* Pre-Qual Details card */}
                          <div className="space-y-3 font-sans text-xs">
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Lead Name</span>
                              <p className="font-extrabold text-gray-850">{activeChat.visitorName || "Guest (Anonymous)"}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Verified Email Address</span>
                              <p className="font-semibold text-gray-700 underline break-all">{activeChat.visitorEmail || "Not shared"}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Order ID Reference</span>
                              <p className="font-mono bg-white border border-gray-150 font-bold text-[10px] text-teal-800 px-2 py-1 rounded select-all break-all">
                                {activeChat.orderId || "Not Registered"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">AI Handover Confidence</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                  (activeChat.confidenceScore || 0) < 40 ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                  {activeChat.confidenceScore || 35}% confidence
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">System Handover Logic</span>
                              <p className="text-[10px] text-gray-500 leading-normal font-light italic">
                                {activeChat.escalationReason || "Exceeded chatbot fallback sequence. Multi-agent claim trigger dispatched."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Integration footer pipeline */}
                        <div className="p-3 border border-gray-150 rounded-2xl bg-white space-y-1.5 text-[9px] font-sans text-gray-400 leading-normal">
                          <p className="font-bold text-gray-700 uppercase tracking-widest text-[8px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 block animate-ping" />
                            Omnichannel Continuity
                          </p>
                          <p className="font-light">
                            User session mapped under {activeChat.channel || "Web Widget"}. Transcripts will automatically write to HubSpot.
                          </p>
                        </div>

                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-gray-400 space-y-3">
                    <div className="bg-teal-50 p-4 rounded-full">
                      <MessageSquare size={34} className="stroke-[1.5] text-teal-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">No Session Selected</h4>
                      <p className="text-[10px] text-gray-505 mt-1 max-w-sm font-light leading-relaxed">
                        Select an active live chat from the left column inbox rail to claim the takeover, access pre-qualification forms, or dispatch canned reply snippets.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOT TRAINING DATA (CRUD) */}
          {activeTab === "knowledge" && (
            <div id="m-knowledge-panel" className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850">Knowledge Base Training Documents (CRUD)</h3>
                  <p className="text-[10px] text-gray-400">Add custom business facts, refunds criteria, and general FAQs to teach your chatbot how to reply.</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 text-[#FF6321] text-[10px] font-bold px-3 py-1 rounded-xl">
                  {knowledgeItems.length} Training Facts Loaded
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form left */}
                <form onSubmit={handleSaveKnowledgeItem} className="lg:col-span-2 bg-gray-50/50 p-4 rounded-3xl border border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold text-gray-850 flex items-center gap-1.5">
                    {isEditingKbId ? "Edit Fact Document" : "Onboard New training Fact"}
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Fact Topic / Question</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Do you ship to Australia?"
                        value={kbQuestion}
                        onChange={(e) => setKbQuestion(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Topic category</label>
                      <select 
                        value={kbCategory} 
                        onChange={(e) => setKbCategory(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-medium"
                      >
                        <option value="General FAQs">General FAQs</option>
                        <option value="Pricing & Billing">Pricing & Billing</option>
                        <option value="Refund Policies">Refund Policies</option>
                        <option value="Technical Setup">Technical Setup</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Fact Description / Truth Answer</label>
                      <textarea 
                        rows={4}
                        required
                        placeholder="Provide the exact truth text that the AI must refer to when answering queries..."
                        value={kbAnswer}
                        onChange={(e) => setKbAnswer(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      disabled={isSavingKb}
                      className="flex-1 bg-[#FF6321] hover:bg-[#E54F10] disabled:bg-[#FF6321]/50 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save size={13} />
                      {isSavingKb ? "Analyzing training vector..." : (isEditingKbId ? "Update Training Fact" : "Append Training Fact")}
                    </button>
                    {isEditingKbId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingKbId(null);
                          setKbQuestion("");
                          setKbAnswer("");
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-3.5 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Listing facts right */}
                <div className="lg:col-span-3 space-y-3">
                  {knowledgeItems.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 text-center text-gray-400 space-y-2">
                      <Bot size={28} className="mx-auto" />
                      <p className="text-xs font-semibold">No training documents in database.</p>
                      <p className="text-[10px]">Add company guidelines on the left to train your chatbot live!</p>
                    </div>
                  ) : (
                    knowledgeItems.map((k) => (
                      <div key={k.id} className="border border-gray-200 rounded-2xl p-4 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="bg-gray-150 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                            {k.category}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditKb(k)}
                              className="p-1.5 text-gray-400 hover:text-[#FF6321] rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteKb(k.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-gray-850">Q: {k.question}</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-light">
                          A: {k.answer}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WIDGET DESIGNER & THEMES */}
          {activeTab === "widget-config" && (
            <div id="m-config-panel" className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850">Widget Branding Designer & Prompts</h3>
                  <p className="text-[10px] text-gray-400">Configure custom widget colors, robot greeting texts and backend prompt rules.</p>
                </div>
              </div>

              <form onSubmit={handleSaveWidgetSettings} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-gray-50/50 p-4 border border-gray-200 rounded-3xl space-y-3 text-xs">
                    <h4 className="font-bold text-gray-850 text-xs pb-2 border-b border-gray-100">Core Configurations</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Chatbot Display Name</label>
                        <input 
                          type="text"
                          required
                          value={widgetSettings.botName}
                          onChange={(e) => setWidgetSettings({ ...widgetSettings, botName: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#FF6321] text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Accent Bubble Color</label>
                        <div className="flex gap-2">
                          <input 
                            type="color"
                            value={widgetSettings.bubbleColor}
                            onChange={(e) => setWidgetSettings({ ...widgetSettings, bubbleColor: e.target.value })}
                            className="w-10 h-8 border border-gray-200 rounded cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={widgetSettings.bubbleColor}
                            onChange={(e) => setWidgetSettings({ ...widgetSettings, bubbleColor: e.target.value })}
                            className="flex-1 bg-white border border-gray-200 px-2 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">First Bot Greeting text</label>
                      <input 
                        type="text"
                        required
                        value={widgetSettings.greetingText}
                        onChange={(e) => setWidgetSettings({ ...widgetSettings, greetingText: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#FF6321] text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Bot Escalation Request prompt</label>
                      <input 
                        type="text"
                        required
                        value={widgetSettings.escalationMessage}
                        onChange={(e) => setWidgetSettings({ ...widgetSettings, escalationMessage: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#FF6321] text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50/50 p-4 border border-gray-200 rounded-3xl space-y-3 text-xs">
                    <h4 className="font-bold text-gray-850 text-xs pb-2 border-b border-gray-100 uppercase text-[#FF6321]">
                      🔐 Advanced AI Prompts (SaaS Exclusive)
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Systemic AI Instructions</label>
                      <textarea 
                        rows={5}
                        required
                        value={widgetSettings.systemPrompt}
                        onChange={(e) => setWidgetSettings({ ...widgetSettings, systemPrompt: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-[#FF6321] text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full bg-[#FF6321] hover:bg-[#E54F10] disabled:bg-orange-300 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    {isSavingSettings ? "Saving rules as vectors..." : "Save widget Customizations"}
                  </button>
                </div>

                {/* Right Interactive live preview */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Live Dashboard Preview</span>
                  
                  {/* Simulate Widget Box directly in layout */}
                  <div className="border border-gray-250 rounded-3xl p-3 bg-gray-100 flex flex-col items-center justify-center h-[520px]">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-150 w-full h-[470px] overflow-hidden flex flex-col text-xs text-left">
                      
                      {/* Widget simulated head */}
                      <header 
                        className="px-4 py-3 flex items-center gap-2.5 text-white"
                        style={{ backgroundColor: widgetSettings.bubbleColor }}
                      >
                        <Bot size={16} />
                        <div>
                          <h4 className="font-semibold text-xs">{widgetSettings.botName}</h4>
                          <p className="text-[8px] opacity-80">24/7 AI Online Mode</p>
                        </div>
                      </header>

                      {/* Msg Area */}
                      <div className="flex-1 bg-gray-50/50 p-4 space-y-2.5 overflow-hidden">
                        <div className="bg-white border border-gray-150 text-gray-700 py-2 px-3 rounded-xl max-w-[85%] text-[11px]">
                          {widgetSettings.greetingText}
                        </div>
                        <div className="bg-orange-100 border border-orange-200 text-orange-900 py-2 px-3 rounded-xl max-w-[85%] text-[11px] self-end ml-auto">
                          Hi there, how can I configure custom shipping locations?
                        </div>
                        <div className="bg-white border border-gray-150 text-gray-700 py-2.5 px-3 rounded-xl max-w-[85%] text-[11px] flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                        </div>
                      </div>

                      {/* Footer area */}
                      <footer className="p-2 border-t border-gray-150 bg-white flex gap-1.5 items-center">
                        <input 
                          type="text" 
                          disabled
                          placeholder="Your reply..."
                          className="flex-1 bg-gray-100 py-2 px-3 rounded-lg text-[10px]"
                        />
                        <button 
                          className="p-2 rounded-lg text-white"
                          style={{ backgroundColor: widgetSettings.bubbleColor }}
                        >
                          <ArrowRight size={12} />
                        </button>
                      </footer>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CRM PIPELINES & BUSINESS SLA SCHEDULERS */}
          {activeTab === "crm-integrations" && (
            <div id="m-crm-panel" className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850">CRM Pipelines & SLA Routing Hub</h3>
                  <p className="text-[10px] text-gray-400">Synchronize client details and transfer active communication logs to customer platforms seamlessly.</p>
                </div>
                <Share2 className="text-teal-600" size={24} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* SLA Schedulers Left */}
                <form onSubmit={handleSaveSupportHours} className="lg:col-span-2 bg-gray-50/50 p-5 rounded-3xl border border-gray-200 space-y-4 text-xs font-sans">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-150">
                    <Clock className="text-teal-600" size={16} />
                    <h4 className="font-bold text-gray-850 text-xs">
                      24/7 Hybrid Availability Rules
                    </h4>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-normal font-light">
                    Assign standard off-hour brackets. Outside this window, complex queries will automatically queue for human live agents tomorrow morning.
                  </p>

                  <div className="space-y-3 font-medium text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Operational Timezone</label>
                      <select 
                        value={supportHours.timeZone}
                        onChange={(m) => setSupportHours({...supportHours, timeZone: m.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 focus:border-teal-500 font-semibold"
                      >
                        <option value="EST">Eastern Standard Time (EST)</option>
                        <option value="GMT">Greenwich Mean Time (GMT)</option>
                        <option value="CET">Central European Time (CET)</option>
                        <option value="PST">Pacific Standard Time (PST)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Start Hour</label>
                        <input 
                          type="time" 
                          required
                          value={supportHours.supportStartHour}
                          onChange={(e) => setSupportHours({...supportHours, supportStartHour: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">End Hour</label>
                        <input 
                          type="time" 
                          required
                          value={supportHours.supportEndHour}
                          onChange={(e) => setSupportHours({...supportHours, supportEndHour: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-start gap-2.5">
                      <input 
                        type="checkbox"
                        id="autoQueueBox"
                        checked={supportHours.offHoursAutoQueue}
                        onChange={(e) => setSupportHours({...supportHours, offHoursAutoQueue: e.target.checked})}
                        className="mt-0.5 rounded border-gray-200 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="autoQueueBox" className="text-[10px] text-gray-500 font-light leading-normal select-none cursor-pointer">
                        Queue off-hours escalations into team multi-agent inbox for next business morning
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/10"
                    >
                      <Save size={13} /> Save Availability SLA
                    </button>
                  </div>
                </form>

                {/* CRM pipelines integration board Right */}
                <div className="lg:col-span-3 space-y-4 font-sans text-xs">
                  <div className="bg-white border border-gray-250 rounded-3xl p-5 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-teal-600 animate-pulse" />
                        <h4 className="font-bold text-gray-800">Synchronized CRM Operations</h4>
                      </div>
                      <span className="text-[9px] font-mono bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
                        Connected State
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                      Automatic transcript synchronization transfers verified client profiles, order logs, intent categories, and conversational transcripts directly to third-party endpoints.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pb-2 text-[11px] font-medium text-gray-600 border-b border-gray-100">
                      <div>
                        <p className="text-gray-400 text-[9px] font-bold tracking-wider uppercase">Active Synced Leads</p>
                        <p className="text-lg font-bold text-gray-800 mt-0.5">{crmPipelines.syncedLeadsCount} clients</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[9px] font-bold tracking-wider uppercase">Last Operational Sync</p>
                        <p className="text-lg font-bold text-gray-800 mt-0.5">
                          {new Date(crmPipelines.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleSyncCrmNow}
                        disabled={isSyncingCrm}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <RefreshCw size={14} className={isSyncingCrm ? "animate-spin" : ""} />
                        {isSyncingCrm ? "Syncing Workspace Pipeline..." : "Manual Sync Queue Now"}
                      </button>
                    </div>
                  </div>

                  {/* CRM platform slots */}
                  <div className="space-y-3 font-medium text-xs">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Configure Enterprise Platforms</p>
                    
                    {/* HubSpot slot */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-600 font-extrabold text-[10px] w-9 h-9 flex items-center justify-center">
                          HS
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">HubSpot Connector Plugin</h5>
                          <p className="text-[9px] text-gray-400">Flow leads, pipeline tags & offline chat scripts.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleCrmIntegration("hubspot")}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all ${crmPipelines.hubspotConnected ? "bg-teal-50 text-teal-600 border border-teal-200" : "bg-gray-100 text-gray-500 hover:bg-gray-250 cursor-pointer"}`}
                      >
                        {crmPipelines.hubspotConnected ? "Connected" : "Inactive"}
                      </button>
                    </div>

                    {/* Zoho slot */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600 font-extrabold text-[10px] w-9 h-9 flex items-center justify-center">
                          ZH
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">Zoho CRM Sync</h5>
                          <p className="text-[9px] text-gray-400">Auto-inject lead pre-qualifications instantly.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleCrmIntegration("zoho")}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all ${crmPipelines.zohoConnected ? "bg-teal-50 text-teal-600 border border-teal-200" : "bg-gray-100 text-gray-500 hover:bg-gray-250 cursor-pointer"}`}
                      >
                        {crmPipelines.zohoConnected ? "Connected" : "Inactive"}
                      </button>
                    </div>

                    {/* Salesforce slot */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-50/50 p-2 rounded-xl text-sky-600 font-extrabold text-[10px] w-9 h-9 flex items-center justify-center">
                          SF
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">Salesforce Enterprise sync</h5>
                          <p className="text-[9px] text-gray-400">Map conversational intents directly to Salesforce cases.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleCrmIntegration("salesforce")}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all ${crmPipelines.salesforceConnected ? "bg-teal-50 text-teal-600 border border-teal-200" : "bg-gray-100 text-gray-500 hover:bg-gray-250 cursor-pointer"}`}
                      >
                        {crmPipelines.salesforceConnected ? "Connected" : "Inactive"}
                      </button>
                    </div>

                    {/* DIRECT OMNICHANNEL GATEWAY SYNC */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div>
                        <h4 className="font-bold text-teal-700 text-xs flex items-center gap-1.5">
                          <Smartphone size={15} /> Direct Omnichannel Routing Gateways
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5">Stream, route, and auto-classify client threads across secure messaging APIs.</p>
                      </div>

                      {/* WhatsApp Channel Card */}
                      <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                              WhatsApp Gateway
                            </span>
                            <span className={`w-2 h-2 rounded-full ${crmPipelines.whatsappConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-350"}`} />
                          </div>
                          <button 
                            type="button"
                            onClick={async () => {
                              const updated = { ...crmPipelines, whatsappConnected: !crmPipelines.whatsappConnected };
                              setCrmPipelines(updated);
                              await handleSaveCrmPipelines(updated);
                            }}
                            className={`text-[9px] font-bold px-3 py-1 rounded-lg transition-all ${crmPipelines.whatsappConnected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {crmPipelines.whatsappConnected ? "Online" : "Disconnected"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Support Phone Number</label>
                            <input 
                              type="text" 
                              value={crmPipelines.whatsappNumber || ""}
                              onChange={(e) => setCrmPipelines({ ...crmPipelines, whatsappNumber: e.target.value })}
                              onBlur={() => handleSaveCrmPipelines()}
                              placeholder="+1 (555) 000-0000"
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 text-[11px] font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Cloud API Token / Key</label>
                            <input 
                              type="password" 
                              value={crmPipelines.whatsappToken || ""}
                              onChange={(e) => setCrmPipelines({ ...crmPipelines, whatsappToken: e.target.value })}
                              onBlur={() => handleSaveCrmPipelines()}
                              placeholder="wh_live_..."
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 text-[11px] font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mobile App SDK Card */}
                      <div className="bg-blue-50/20 border border-blue-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                              Mobile Application SDK
                            </span>
                            <span className={`w-2 h-2 rounded-full ${crmPipelines.mobileConnected ? "bg-blue-500 animate-pulse" : "bg-gray-350"}`} />
                          </div>
                          <button 
                            type="button"
                            onClick={async () => {
                              const updated = { ...crmPipelines, mobileConnected: !crmPipelines.mobileConnected };
                              setCrmPipelines(updated);
                              await handleSaveCrmPipelines(updated);
                            }}
                            className={`text-[9px] font-bold px-3 py-1 rounded-lg transition-all ${crmPipelines.mobileConnected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {crmPipelines.mobileConnected ? "Online" : "Disconnected"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">iOS / Android App ID</label>
                            <input 
                              type="text" 
                              value={crmPipelines.mobileAppId || ""}
                              onChange={(e) => setCrmPipelines({ ...crmPipelines, mobileAppId: e.target.value })}
                              onBlur={() => handleSaveCrmPipelines()}
                              placeholder="com.yourcompany.app"
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 text-[11px] font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Application Secret Token</label>
                            <input 
                              type="password" 
                              value={crmPipelines.mobileToken || ""}
                              onChange={(e) => setCrmPipelines({ ...crmPipelines, mobileToken: e.target.value })}
                              onBlur={() => handleSaveCrmPipelines()}
                              placeholder="sdk_token_..."
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 text-[11px] font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Telegram Bot Sync Card */}
                      <div className="bg-sky-50/10 border border-sky-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-sky-50 text-sky-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                              Telegram Support Channel
                            </span>
                            <span className={`w-2 h-2 rounded-full ${crmPipelines.telegramConnected ? "bg-sky-500 animate-pulse" : "bg-gray-350"}`} />
                          </div>
                          <button 
                            type="button"
                            onClick={async () => {
                              const updated = { ...crmPipelines, telegramConnected: !crmPipelines.telegramConnected };
                              setCrmPipelines(updated);
                              await handleSaveCrmPipelines(updated);
                            }}
                            className={`text-[9px] font-bold px-3 py-1 rounded-lg transition-all ${crmPipelines.telegramConnected ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {crmPipelines.telegramConnected ? "Online" : "Disconnected"}
                          </button>
                        </div>
                        <div className="text-[11px] space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Telegram Bot API Token</label>
                          <input 
                            type="password" 
                            value={crmPipelines.telegramBotToken || ""}
                            onChange={(e) => setCrmPipelines({ ...crmPipelines, telegramBotToken: e.target.value })}
                            onBlur={() => handleSaveCrmPipelines()}
                            placeholder="0000000000:AA_TelegramBotTokenHere..."
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-sky-500 text-[11px] font-mono"
                          />
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4.5: SAAS ADVANCED CHATBOT SETTINGS (COMPLETE CRUD MANAGEMENT) */}
          {activeTab === "chatbot-settings" && (
            <div id="m-advanced-settings-panel" className="flex-1 p-6 overflow-y-auto space-y-6 text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-150 pb-4 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850 flex items-center gap-2">
                    <Sliders size={16} className="text-teal-600" />
                    Advanced Chatbot Rules & Feature Gates
                  </h3>
                  <p className="text-[10px] text-gray-400">Manage real-time FAQ chips, default response templates, and conditionally gate active options.</p>
                </div>

                {/* Sub-tab Navigation controls */}
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button 
                    onClick={() => setSettingsSubTab("quick-replies")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${settingsSubTab === "quick-replies" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    FAQ Chips
                  </button>
                  <button 
                    onClick={() => setSettingsSubTab("templates")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${settingsSubTab === "templates" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    Custom Triggers
                  </button>
                  <button 
                    onClick={() => setSettingsSubTab("features")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${settingsSubTab === "features" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    Premium Gates
                  </button>
                </div>
              </div>

              {/* Sub-Tab 1: Quick Reply Chips CRUD */}
              {settingsSubTab === "quick-replies" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* form block */}
                    <div className="md:col-span-2 bg-gray-50/50 p-5 border border-gray-200 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-850 uppercase tracking-wide">
                          {editingQrId ? "Modify FAQ Quick Reply" : "Create New FAQ Chip"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-1">FAQ chips act as fast-clickable suggestion buttons in the floating chat window.</p>
                      </div>

                      <form onSubmit={handleSaveQuickReply} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Button Display Label</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Custom Pricing 💳"
                            value={qrText}
                            onChange={(e) => setQrText(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-teal-500 focus:outline-none text-xs font-semibold leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Action Value on click</label>
                          <textarea 
                            rows={3}
                            required
                            placeholder="Query simulated text sent to AI, e.g. What are your premium plan pricing tiers?"
                            value={qrValue}
                            onChange={(e) => setQrValue(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-teal-500 focus:outline-none text-xs font-medium leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Priority Sort Order Map</label>
                          <input 
                            type="number"
                            required
                            min={1}
                            max={100}
                            value={qrOrder}
                            onChange={(e) => setQrOrder(parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-teal-500 focus:outline-none text-xs font-semibold"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            type="submit"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Save size={13} />
                            {editingQrId ? "Update Chip" : "Save FAQ Chip"}
                          </button>
                          
                          {editingQrId && (
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingQrId(null);
                                setQrText("");
                                setQrValue("");
                                setQrOrder(1);
                              }}
                              className="bg-gray-200 hover:bg-gray-250 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* records table */}
                    <div className="md:col-span-3 space-y-3">
                      <h4 className="text-xs font-bold text-gray-850 px-1">Active Suggestion List ({quickReplies.length})</h4>
                      
                      {quickReplies.length === 0 ? (
                        <div className="border border-dashed border-gray-200 p-8 rounded-2xl text-center text-gray-400 space-y-1.5 text-xs">
                          <HelpCircle className="mx-auto text-gray-300" size={32} />
                          <p>No active suggestion chips formulated.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-150 grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            <div className="col-span-1">Seq</div>
                            <div className="col-span-4">Text Chip Label</div>
                            <div className="col-span-5">Client Query Simulated</div>
                            <div className="col-span-2 text-right">Actions</div>
                          </div>

                          <div className="divide-y divide-gray-150">
                            {quickReplies.map((qr) => (
                              <div key={qr.id} className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-gray-50/70 transition-all">
                                <div className="col-span-1 font-mono font-bold text-gray-400">{qr.order}</div>
                                <div className="col-span-4 font-bold text-teal-700">{qr.text}</div>
                                <div className="col-span-5 text-gray-500 font-medium truncate pr-4" title={qr.value}>{qr.value}</div>
                                <div className="col-span-2 flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => handleEditQuickReply(qr)}
                                    className="p-1 px-1.5 hover:bg-teal-50 text-teal-600 rounded-md cursor-pointer"
                                    title="Edit chip parameters"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteQuickReply(qr.id)}
                                    className="p-1 px-1.5 hover:bg-red-50 text-red-500 rounded-md cursor-pointer"
                                    title="Delete chip"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Custom Response Templates CRUD */}
              {settingsSubTab === "templates" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Form Section */}
                    <div className="md:col-span-2 bg-gray-50/50 p-5 border border-gray-200 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-850 uppercase tracking-wide">
                          {editingRtId ? "Modify Response Rule" : "Create Response Trigger"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-1">If the user's message contains the specified trigger keyword, the bot immediately responds with the template text.</p>
                      </div>

                      <form onSubmit={handleSaveResponseTemplate} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Trigger Word Or Phrase</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. pricing"
                            value={rtTrigger}
                            onChange={(e) => setRtTrigger(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-teal-500 focus:outline-none text-xs font-mono font-bold leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Direct System Response Text</label>
                          <textarea 
                            rows={4}
                            required
                            placeholder="The precise template message returned to bypassing AI generators."
                            value={rtResponse}
                            onChange={(e) => setRtResponse(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-teal-500 focus:outline-none text-xs font-medium leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            type="submit"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Save size={13} />
                            {editingRtId ? "Update Template" : "Save Prompt Trigger"}
                          </button>
                          
                          {editingRtId && (
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingRtId(null);
                                setRtTrigger("");
                                setRtResponse("");
                              }}
                              className="bg-gray-200 hover:bg-gray-250 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Table section */}
                    <div className="md:col-span-3 space-y-3">
                      <h4 className="text-xs font-bold text-gray-850 px-1 font-sans">Configured Trigger Prompts ({responseTemplates.length})</h4>
                      
                      {responseTemplates.length === 0 ? (
                        <div className="border border-dashed border-gray-200 p-8 rounded-2xl text-center text-gray-400 space-y-1.5 text-xs">
                          <Layers className="mx-auto text-gray-300" size={32} />
                          <p>No prompt trigger intercepts configured.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-150 grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            <div className="col-span-3">Trigger Word</div>
                            <div className="col-span-7">Bypass Override Text Response</div>
                            <div className="col-span-2 text-right">Actions</div>
                          </div>

                          <div className="divide-y divide-gray-150">
                            {responseTemplates.map((rt) => (
                              <div key={rt.id} className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-gray-50/70 transition-all">
                                <div className="col-span-3 font-mono font-bold text-teal-850 bg-teal-55/40 px-2 py-0.5 rounded-md inline-block w-fit text-[11px] border border-teal-100">
                                  {rt.trigger}
                                </div>
                                <div className="col-span-7 text-gray-500 font-medium truncate pr-4" title={rt.responseText}>{rt.responseText}</div>
                                <div className="col-span-2 flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => handleEditResponseTemplate(rt)}
                                    className="p-1 px-1.5 hover:bg-teal-50 text-teal-600 rounded-md cursor-pointer"
                                    title="Edit template settings"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteResponseTemplate(rt.id)}
                                    className="p-1 px-1.5 hover:bg-red-50 text-red-500 rounded-md cursor-pointer"
                                    title="Delete template rule"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Premium Feature Toggles Matrix */}
              {settingsSubTab === "features" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-teal-900 to-teal-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-teal-800 opacity-20 pointer-events-none">
                      <ShieldCheck size={180} />
                    </div>
                    <div className="relative z-10 space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 text-xs bg-teal-600/30 text-teal-300 font-bold px-3 py-1 rounded-full border border-teal-500/30">
                        <Zap size={12} />
                        Subscription Plan Gates
                      </div>
                      <h4 className="text-base font-bold font-sans">Active Enterprise Feature Switches</h4>
                      <p className="text-xs text-teal-200">
                        Map and toggle premium features such as custom file attachment streams, automated support queue takeovers, or voice speech transcription based on active account tiers.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Live Handoff switch */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="space-y-1 pr-4">
                        <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                          Live Human Representative Escalation
                        </h5>
                        <p className="text-[10px] text-gray-400">If toggled off, automatic routing prompts will warn clients the queue is currently offline.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleFeature("liveHandoffEnabled")}
                        className={`w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${featureToggles.liveHandoffEnabled ? "bg-teal-600 justify-end" : "bg-gray-200 justify-start"}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {/* Proactive Greeting switch */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="space-y-1 pr-4">
                        <h5 className="font-bold text-gray-800 text-xs">
                          Proactive Greeting Welcome Popup
                        </h5>
                        <p className="text-[10px] text-gray-400">Triggers an elegant micro-greeting card above the host script window on launch.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleFeature("proactiveGreetingEnabled")}
                        className={`w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${featureToggles.proactiveGreetingEnabled ? "bg-teal-600 justify-end" : "bg-gray-200 justify-start"}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {/* File Upload options (Premium Gate) */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs relative">
                      <div className="space-y-1 pr-4">
                        <h5 className="font-bold text-gray-850 text-xs flex items-center gap-1.5">
                          Document File Attachment & Upload State
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 uppercase border border-teal-150">Pro</span>
                        </h5>
                        <p className="text-[10px] text-gray-400">Enables secure drag-drop visual attachment sharing inside the chatbot dialogue stream.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleFeature("fileUploadEnabled")}
                        className={`w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${featureToggles.fileUploadEnabled ? "bg-teal-600 justify-end" : "bg-gray-200 justify-start"}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {/* Speech to text input (Premium Gate) */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="space-y-1 pr-4">
                        <h5 className="font-bold text-gray-850 text-xs flex items-center gap-1.5">
                          Voice Speech-Into-Text Transcription
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 uppercase border border-teal-150">Pro</span>
                        </h5>
                        <p className="text-[10px] text-gray-400">Allows customer voice commands matching automated Web Speech recognition engines.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleFeature("speechToTextEnabled")}
                        className={`w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${featureToggles.speechToTextEnabled ? "bg-teal-600 justify-end" : "bg-gray-200 justify-start"}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {/* Branding Theme (Premium Gate) */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xxs">
                      <div className="space-y-1 pr-4">
                        <h5 className="font-bold text-gray-850 text-xs flex items-center gap-1.5">
                          Advanced Cosmic Slates Theme presets
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 uppercase border border-teal-150">Pro</span>
                        </h5>
                        <p className="text-[10px] text-gray-400">Apply deep dark space brand stylings, or premium gradient canvas options to the iframe design.</p>
                      </div>
                      <button 
                        onClick={() => handleToggleFeature("customVibeThemeEnabled")}
                        className={`w-14 h-7 rounded-full transition-all flex items-center p-1 cursor-pointer ${featureToggles.customVibeThemeEnabled ? "bg-teal-600 justify-end" : "bg-gray-200 justify-start"}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EMBED CODE SNIPPET SCRIPT GENERATION */}
          {activeTab === "code-snippet" && (
            <div id="m-snippet-panel" className="flex-1 p-6 overflow-y-auto space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850">Script Tag Onboarding & Embed Code</h3>
                  <p className="text-[10px] text-gray-400">Generate a lightweight snippet containing JavaScript code. Paste this code inside any external HTML body.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-teal-100 bg-teal-50/40 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-bold text-teal-800 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Lightweight Integration Snip
                  </h4>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Insert the following tag to load WebNest's floating launcher balloon. Since loading is processed inside an isolated runtime iframe, your parent site styles and corporate assets are completely protected.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <span className="font-bold text-gray-800">Copy the HTML snippet:</span>
                  <div className="bg-gray-900 text-orange-400 p-4 rounded-xl font-mono relative group text-[10px] sm:text-xs">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js?id=${userProfile.uid}"></script>`);
                        alert("Snippet copied to Clipboard!");
                      }}
                      className="absolute right-3 top-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-[10px] border border-gray-700"
                    >
                      Copy Script
                    </button>
                    <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed py-1">
{`<!-- WebNest.dev Live Chat Widget embed snippet -->
<script 
  src="${window.location.origin}/widget.js?id=${userProfile.uid}" 
  async>
</script>`}
                    </pre>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4 text-xs font-light leading-relaxed">
                  <h4 className="font-bold text-gray-850">Embed Instructions step-by-step:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-500">
                    <li>Open your destination customer website codebase directory (e.g. index.html).</li>
                    <li>Move down to the bottom where the ending body code tag resides: <span className="font-mono bg-gray-150 px-1 py-0.5 rounded text-gray-800">&lt;/body&gt;</span></li>
                    <li>Insert the customized script tag copied from above exactly before the body close.</li>
                    <li>Save, upload changes to your hosting server, and clear your browser memory. The chatbot bubble loads immediately!</li>
                  </ol>
                </div>

                {/* 1-Second Connection Simulator & Client Takeover Info */}
                <div className="border border-orange-200 rounded-2xl p-5 bg-orange-50/30 space-y-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-[#FF6321] flex items-center gap-1.5 text-sm uppercase tracking-wide">
                      ⚡ 1-Second Instant Website Connector & Live Takeover
                    </h4>
                    <p className="text-gray-500 font-light mt-1">
                      WebNest uses lightning-fast shadow-routing. Paste any active domain URL to connect chatbot nodes instantly (within exactly 1 second) and authorize active takeover alerts.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-[10px]">https://</span>
                      <input 
                        type="text" 
                        placeholder="your-company-website.com" 
                        className="bg-white border text-xs pl-14 pr-3 py-2 rounded-xl w-full font-mono outline-none focus:border-[#FF6321] border-gray-200 text-gray-700"
                        value={inputWebsiteToConnect}
                        onChange={(e) => setInputWebsiteToConnect(e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!inputWebsiteToConnect.trim()) {
                          alert("Please enter a valid website hostname address!");
                          return;
                        }
                        setIsConnectingWebsite(true);
                        setConnectedSuccessMessage("");
                        setTimeout(() => {
                          const domain = inputWebsiteToConnect.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
                          setConnectedWebsitesList([domain, ...connectedWebsitesList]);
                          setIsConnectingWebsite(false);
                          setConnectedSuccessMessage(`🎉 Successfully connected to ${domain} within 1 second! The live chatbot script is fully linked. Real-time active takeover is live.`);
                          setInputWebsiteToConnect("");
                        }, 1000);
                      }}
                      disabled={isConnectingWebsite}
                      className="bg-[#FF6321] hover:bg-[#E54F10] text-white font-bold px-5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      {isConnectingWebsite ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Handshaking...
                        </>
                      ) : (
                        "Connect Site"
                      )}
                    </button>
                  </div>

                  {connectedSuccessMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-800 text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
                      <span className="text-md">⚡</span>
                      <div>
                        <p className="font-bold">Real-Time Routing Online</p>
                        <p className="font-light mt-0.5">{connectedSuccessMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Connected list */}
                  <div className="space-y-2 pt-2 border-t border-orange-100/40">
                    <span className="font-bold text-gray-500 text-[10px] uppercase block tracking-wider">Connected Active Domains ({connectedWebsitesList.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {connectedWebsitesList.map((web, idx) => (
                        <div key={idx} className="bg-white border border-gray-150 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-[10px] text-gray-700 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                          <span>{web}</span>
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1 py-0.5 rounded leading-none">CONNECTED &lt;1S</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#002f6c]/5 border border-[#00baf2]/10 rounded-xl space-y-1.5 text-[11px] leading-relaxed text-gray-700">
                    <p className="font-bold text-[#002f6c] flex items-center gap-1">🎤 Human Takeover Client Communication:</p>
                    <p className="text-gray-500 font-light">
                      Whenever a visitor asks a complex question, the chatbot automatically offers a <b>"Connect Human Takeover"</b> callback. Live notification sound alerts compile inside your <b>Home Dashboard</b> where administrators can claim the active ticket and take over client discussions with a single click in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM ALERTS, PUSH TRANSCRIPT LOGS LOGS */}
          {activeTab === "system-logs" && (
            <div id="m-logs-panel" className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-850">Simulated Email and Push notification alerts</h3>
                  <p className="text-[10px] text-gray-400">View live notifications generated for agents during visitor takeover triggers.</p>
                </div>
                <Bell className="text-orange-600 animate-bounce" size={20} />
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 space-y-2 border border-dashed border-gray-250 rounded-2xl">
                    <Mail size={32} className="mx-auto" />
                    <p className="text-xs font-semibold">No alerts logged in the pipeline.</p>
                    <p className="text-[10px]">When a visitor asks for human routing on your test widget, transcripts log here instantly.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`border p-4 rounded-xl space-y-3.5 bg-white text-left ${n.type === "email" ? "border-red-100 bg-red-50/10" : "border-blue-100 bg-blue-50/10"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${n.type === "email" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
                          {n.type === "email" ? "HTML Email transmittal" : "Desktop Push trigger"}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">
                          {new Date(n.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                      <p className="text-[11px] text-gray-600 leading-normal">{n.body}</p>

                      {/* Transcripts logs drop block */}
                      {n.transcript && n.transcript.length > 0 && (
                        <div className="bg-gray-900 text-gray-200 border border-gray-850 p-2.5 rounded-lg space-y-1 font-mono text-[9px] max-h-48 overflow-y-auto">
                          <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider pb-1.5 border-b border-gray-800">
                            Archived chat history:
                          </p>
                          {n.transcript.map((msg, mIdx) => (
                            <p key={mIdx}>
                              <b>[{msg.sender.toUpperCase()}]:</b> {msg.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS PURCHASE RECORDS WITH TIME AND DATE */}
          {activeTab === "purchases" && userProfile.email === "care.webnest@gmail.com" && (
            <div id="m-purchases-panel" className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-md font-bold text-gray-850 flex items-center gap-2">
                    <CreditCard className="text-teal-600" size={18} /> Customers Purchase History Ledger
                  </h3>
                  <p className="text-[11px] text-gray-400">Track and review real-time Paytm checkout triggers, billing dates, time, and purchase amounts.</p>
                </div>
                <button
                  onClick={() => {
                    setPurchClientName("");
                    setPurchClientEmail("");
                    setPurchPackageName("Pro Live Bot Plan");
                    setPurchAmount(149);
                    setPurchPaymentMethod("Paytm Payment Gateway");
                    setPurchDate(new Date().toISOString().substring(0, 10));
                    setPurchTime(new Date().toTimeString().substring(0, 5));
                    setShowAddPurchaseModal(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus size={14} /> Add Customer Record
                </button>
              </div>

              {/* Filtering input bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer name, email address, transaction ref or plan..."
                  className="w-full bg-gray-50 border border-gray-250 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-650 focus:bg-white"
                  value={purchaseSearchQuery}
                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                />
                {purchaseSearchQuery && (
                  <button 
                    onClick={() => setPurchaseSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Tabular List Section */}
              <div className="bg-white border border-gray-250 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left text-xs text-gray-500">
                    <thead className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 border-b border-gray-150">
                      <tr>
                        <th className="p-4">Billing ID / Date & Time</th>
                        <th className="p-4">Customer Info</th>
                        <th className="p-4">Purchased Product</th>
                        <th className="p-4">Gateway Check</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {invoices.filter((inv) => {
                        const query = purchaseSearchQuery.toLowerCase().trim();
                        if (!query) return true;
                        return (
                          (inv.invoiceNum || "").toLowerCase().includes(query) ||
                          (inv.id || "").toLowerCase().includes(query) ||
                          (inv.clientName || "").toLowerCase().includes(query) ||
                          (inv.clientEmail || "").toLowerCase().includes(query) ||
                          (inv.packageName || "").toLowerCase().includes(query) ||
                          (inv.paymentMethod || "").toLowerCase().includes(query)
                        );
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-gray-405 space-y-2">
                            <CreditCard className="mx-auto text-gray-300" size={36} />
                            <p className="text-xs font-semibold">No purchase records found matching query.</p>
                            <p className="text-[10px]">Generate Paytm checkout orders or register custom purchases manually.</p>
                          </td>
                        </tr>
                      ) : (
                        invoices.filter((inv) => {
                          const query = purchaseSearchQuery.toLowerCase().trim();
                          if (!query) return true;
                          return (
                            (inv.invoiceNum || "").toLowerCase().includes(query) ||
                            (inv.id || "").toLowerCase().includes(query) ||
                            (inv.clientName || "").toLowerCase().includes(query) ||
                            (inv.clientEmail || "").toLowerCase().includes(query) ||
                            (inv.packageName || "").toLowerCase().includes(query) ||
                            (inv.paymentMethod || "").toLowerCase().includes(query)
                          );
                        }).map((inv) => (
                          <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4">
                              <p className="font-mono font-bold text-gray-901 tracking-tight">{inv.invoiceNum || "INV-GEN"}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-sans font-medium">
                                📅 {new Date(inv.timestamp).toLocaleString()}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-gray-950">{inv.clientName}</p>
                              <p className="text-[10px] font-mono text-gray-400 select-all">{inv.clientEmail || "no-email@webnest.dev"}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-gray-800">{inv.packageName}</span>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-emerald-650 font-mono font-bold">Rs. {inv.amount}</span>
                                <span className="bg-emerald-50 text-[9px] text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Paid</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {(inv.paymentMethod || "").toLowerCase().includes("paytm") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-sky-50 text-[#00baf2] border border-sky-100 uppercase">
                                  <span className="w-1.5 h-1.5 bg-[#00baf2] rounded-full"></span>
                                  Paytm Secure Channel
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-150 uppercase">
                                  {inv.paymentMethod || "Global Card"}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete record for ${inv.clientName}?`)) return;
                                  try {
                                    const res = await fetch(`/api/invoices/${inv.id}`, { method: "DELETE" });
                                    if (res.ok) {
                                      const updatedList = await (await fetch("/api/invoices")).json();
                                      setInvoices(updatedList);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-800 p-2 rounded-lg cursor-pointer transition-all border border-red-150"
                                title="Delete entry logs"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Simulated Stats Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Total Recieved GMV</p>
                  <p className="text-lg font-mono font-black text-teal-700 mt-1">
                    Rs. {invoices.reduce((acc, current) => acc + (Number(current.amount) || 0), 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Aggregated in-memory transactions</p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Active Paytm Users</p>
                  <p className="text-lg font-mono font-black text-[#00baf2] mt-1">
                    {invoices.filter(inv => (inv.paymentMethod || "").toLowerCase().includes("paytm")).length} Accounts
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Redirect checkout triggers processed</p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Ledger Sync Status</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Fully Operational
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Connected to persistent database services</p>
                </div>
              </div>

              {/* Trigger manual purchase recording MODAL */}
              {showAddPurchaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl max-w-md w-full border border-gray-250 shadow-2xl overflow-hidden p-6 relative text-left">
                    <button
                      onClick={() => setShowAddPurchaseModal(false)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>

                    <div className="space-y-1 mb-5">
                      <h3 className="font-display font-bold text-[#002f6c] text-sm uppercase tracking-wide flex items-center gap-1.5">
                        <CreditCard size={18} /> Record New Customer Purchase
                      </h3>
                      <p className="text-xs text-[#9CA3AF]">
                        Store custom purchase receipts in client history with precise dates, times, and amounts.
                      </p>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!purchClientName.trim()) return;

                        const datetimeString = `${purchDate}T${purchTime}`;
                        const parsedTimestamp = isNaN(Date.parse(datetimeString)) ? Date.now() : Date.parse(datetimeString);

                        const payload = {
                          clientName: purchClientName,
                          clientEmail: purchClientEmail || "guest_direct@webnest.dev",
                          packageName: purchPackageName,
                          amount: Number(purchAmount),
                          paymentMethod: purchPaymentMethod,
                          status: "paid",
                          timestamp: parsedTimestamp
                        };

                        try {
                          const res = await fetch("/api/invoices", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                          });
                          if (res.ok) {
                            setShowAddPurchaseModal(false);
                            const updatedList = await (await fetch("/api/invoices")).json();
                            setInvoices(updatedList);
                          }
                        } catch(err) {
                          console.error(err);
                        }
                      }}
                      className="space-y-4 text-xs font-semibold text-gray-800"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Client Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white"
                            value={purchClientName}
                            onChange={(e) => setPurchClientName(e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Client Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. name@company.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white"
                            value={purchClientEmail}
                            onChange={(e) => setPurchClientEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Product Package / Plan</label>
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white animate-none"
                            value={purchPackageName}
                            onChange={(e) => setPurchPackageName(e.target.value)}
                          >
                            <option value="Pro Live Bot Plan">Pro Live Bot Plan (Rs. 149)</option>
                            <option value="Enterprise Authority Suite">Enterprise Authority Suite (Rs. 499)</option>
                            <option value="Custom API Sandbox Connector">Custom API Sandbox Connector (Rs. 99)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Paid Cost (INR)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white"
                            value={purchAmount}
                            onChange={(e) => setPurchAmount(Number(e.target.value))}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Payment Gateway</label>
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white animate-none animate-none animate-none"
                            value={purchPaymentMethod}
                            onChange={(e) => setPurchPaymentMethod(e.target.value)}
                          >
                            <option value="Paytm Payment Gateway">Paytm Payment Gateway</option>
                            <option value="Stripe checkout">Stripe Checkout</option>
                            <option value="UPI direct transfer">UPI Direct Transfer</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Purchase Date</label>
                          <input
                            type="date"
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white"
                            value={purchDate}
                            onChange={(e) => setPurchDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Purchase Time</label>
                          <input
                            type="time"
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-normal focus:outline-none focus:border-teal-650 focus:bg-white"
                            value={purchTime}
                            onChange={(e) => setPurchTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        ⚡ Synchronize & Save Record
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ADMIN AUTHORITY WORKSPACE - FULL CRUD OPERATION PANEL */}
          {activeTab === "admin-workspace" && (
            <div id="m-admin-workspace-panel" className="flex-1 flex flex-col min-h-0 bg-white">
              
              {/* Header Title */}
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
                <div>
                  <h3 className="text-md font-bold text-gray-901 flex items-center gap-2 text-left">
                    <ShieldCheck size={20} className="text-orange-600 shrink-0" />
                    WebNest Admin Authority Workspace
                  </h3>
                  <p className="text-xs text-gray-500 text-left">
                    Production privilege authorized for <span className="text-orange-700 font-mono font-bold">care.webnest@gmail.com</span>. Custom site elements propagate instant updates.
                  </p>
                </div>

                {/* Sub-menu controllers */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 self-start md:self-auto">
                  <button
                    onClick={() => setAdminSubTab("packages")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "packages" ? "bg-orange-605 bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    📦 Packages
                  </button>
                  <button
                    onClick={() => { setAdminSubTab("feedbacks"); setPreviewingInvoice(null); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "feedbacks" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    💬 Feedbacks
                  </button>
                  <button
                    onClick={() => setAdminSubTab("invoices")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "invoices" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    📄 Invoices
                  </button>
                  <button
                    onClick={() => { setAdminSubTab("footer"); setPreviewingInvoice(null); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "footer" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    ⚙️ Footer
                  </button>
                  <button
                    onClick={() => { setAdminSubTab("homepage"); setPreviewingInvoice(null); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "homepage" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    🏠 Homepage & Offers
                  </button>
                  <button
                    onClick={() => { setAdminSubTab("logins"); setPreviewingInvoice(null); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${adminSubTab === "logins" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    👤 User login Data
                  </button>
                </div>
              </div>

              {/* Sub-tab view area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">

                {/* SUB TAB 1: CUSTOM PACKAGES CRUD */}
                {adminSubTab === "packages" && (
                  <div className="space-y-6">
                    <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-extrabold text-orange-950 uppercase tracking-wide">📦 Active Subscription Pricing tiers</h4>
                        <p className="text-[11px] text-orange-900 font-light">Configure client trial, monthly, multi-month, or yearly package templates displayed on the website.</p>
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{packages.length} Packages Online</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                      {/* Package Form */}
                      <form onSubmit={handleSavePackage} className="xl:col-span-2 border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
                        <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center justify-between">
                          <span>{editingPackageId ? "✏️ Edit Package Tier" : "➕ Create Custom Package"}</span>
                          {editingPackageId && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingPackageId(null);
                                setPackageName("");
                                setPackagePrice(0);
                                setPackagePeriod("per month");
                                setPackageFeatures("");
                                setPackageDays(30);
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-850 cursor-pointer"
                            >
                              Discard edit
                            </button>
                          )}
                        </h4>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Package Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Silver Package, Gold Pro"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Price (Rs.)</label>
                            <input
                              type="number"
                              required
                              className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                              value={packagePrice}
                              onChange={(e) => setPackagePrice(Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Billing Period</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. per month"
                              className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                              value={packagePeriod}
                              onChange={(e) => setPackagePeriod(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block leading-none">Days suitable</label>
                            <input
                              type="number"
                              required
                              min={1}
                              placeholder="e.g. 30"
                              className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                              value={packageDays}
                              onChange={(e) => setPackageDays(Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase block">
                            Key Features (One feature per line)
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="e.g.&#10;Smart AI chat routing assistant&#10;Up to 500 conversation records&#10;Custom widget color schemes"
                            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-sans"
                            value={packageFeatures}
                            onChange={(e) => setPackageFeatures(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                        >
                          {editingPackageId ? "Update Subscription Tier" : "Save and Deploy Package"}
                        </button>
                      </form>

                      {/* Package Grid Container */}
                      <div className="xl:col-span-3 space-y-3">
                        {packages.length === 0 ? (
                          <div className="p-12 text-center text-gray-400 border border-dashed border-gray-250 rounded-2xl bg-gray-50/50">
                            <Plus size={32} className="mx-auto text-gray-300" />
                            <p className="text-xs font-medium">No custom pricing packages registered.</p>
                          </div>
                        ) : (
                          packages.map((pkg) => (
                            <div key={pkg.id} className="border border-gray-200 p-4 rounded-xl bg-white flex items-start justify-between gap-4 text-left shadow-xs">
                              <div className="space-y-1.5 flex-1">
                                <h5 className="font-bold text-gray-910 text-xs flex flex-wrap items-center gap-1.5">
                                  <span>{pkg.name}</span>
                                  {pkg.price === 0 && <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Trial</span>}
                                  {pkg.days && (
                                    <span className="bg-orange-100 text-orange-850 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      {pkg.days} Days
                                    </span>
                                  )}
                                </h5>
                                <p className="text-xs font-bold text-orange-650 font-mono">
                                  Rupees {pkg.price} <span className="text-[10px] text-gray-400 font-normal">/ {pkg.periodText}</span>
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-[10px] text-gray-500 pl-1">
                                  {pkg.features && pkg.features.map((f: string, i: number) => (
                                    <li key={i}>{f}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditPackage(pkg)}
                                  className="p-1.5 bg-gray-55 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
                                  title="Edit Package"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-750 rounded cursor-pointer"
                                  title="Delete Package"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 2: CLIENT FEEDBACK & REVIEWS CRUD */}
                {adminSubTab === "feedbacks" && (
                  <div className="space-y-6">
                    <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-extrabold text-orange-950 uppercase tracking-wide">💬 Client Testimony & Feedback review boards</h4>
                        <p className="text-[11px] text-orange-900 font-light">Manage, edit, or delete customer reviews displayed on our corporate feedback wall page.</p>
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{feedbacks.length} Testimonials List</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                      {/* Testimony Form */}
                      <form onSubmit={handleSaveFeedback} className="xl:col-span-2 border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
                        <h4 className="text-xs font-bold text-gray-901 border-b border-gray-100 pb-2.5 flex items-center justify-between">
                          <span>{editingFeedbackId ? "✏️ Edit Review" : "➕ Write Custom/Mock Review"}</span>
                          {editingFeedbackId && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingFeedbackId(null);
                                setFeedbackClientName("");
                                setFeedbackClientEmail("");
                                setFeedbackRating(5);
                                setFeedbackComment("");
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-800 cursor-pointer"
                            >
                              Discard edit
                            </button>
                          )}
                        </h4>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Client Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sakthi Madhavan"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
                            value={feedbackClientName}
                            onChange={(e) => setFeedbackClientName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Client Email</label>
                            <input
                              type="email"
                              placeholder="e.g. sakthi@webnest.dev"
                              className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                              value={feedbackClientEmail}
                              onChange={(e) => setFeedbackClientEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Rating Score (1-5)</label>
                            <select
                              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-bold bg-white"
                              value={feedbackRating}
                              onChange={(e) => setFeedbackRating(Number(e.target.value))}
                            >
                              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                              <option value="3">⭐⭐⭐ (3 Stars)</option>
                              <option value="2">⭐⭐ (2 Stars)</option>
                              <option value="1">⭐ (1 Star)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Commentary Testimony</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Type client feedback observations here..."
                            className="w-full text-xs p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                        >
                          {editingFeedbackId ? "Update Feedback Review" : "Publish Customer Testimony"}
                        </button>
                      </form>

                      {/* Testimony list */}
                      <div className="xl:col-span-3 space-y-3.5">
                        {feedbacks.length === 0 ? (
                          <div className="p-12 text-center text-gray-400 border border-dashed border-gray-250 rounded-2xl bg-gray-50/50">
                            <HelpCircle size={32} className="mx-auto text-gray-300" />
                            <p className="text-xs font-semibold">No feedback records indexed.</p>
                          </div>
                        ) : (
                          feedbacks.map((fb) => (
                            <div key={fb.id} className="border border-gray-250 p-4 rounded-xl bg-white flex items-start justify-between gap-4 text-left shadow-xs">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-901 text-xs">{fb.clientName}</span>
                                  {fb.clientEmail && (
                                    <span className="text-[9px] text-gray-400 uppercase font-mono tracking-tight">{fb.clientEmail}</span>
                                  )}
                                </div>
                                <div className="flex text-amber-500 text-[10px]">
                                  {Array.from({ length: Math.min(5, Math.max(1, fb.rating)) }).map((_, rIdx) => (
                                    <span key={rIdx}>★</span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 font-light leading-relaxed">
                                  "{fb.comment}"
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditFeedback(fb)}
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 cursor-pointer"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeedback(fb.id)}
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-650 rounded cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 3: INVOICES & BILLING LISTS WITH PREVIEW LETTERS */}
                {adminSubTab === "invoices" && (
                  <div className="space-y-6">
                    <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-extrabold text-orange-950 uppercase tracking-wide">📄 client invoice, billings & receipts records</h4>
                        <p className="text-[11px] text-orange-900 font-light">Manage transactions, register mock client orders, and launch instant letterhead layout invoices previews.</p>
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{invoices.length} Registered Invoices</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                      {/* Invoice Form */}
                      <form onSubmit={handleSaveInvoice} className="xl:col-span-2 border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
                        <h4 className="text-xs font-bold text-gray-901 border-b border-gray-100 pb-2.5 flex items-center justify-between">
                          <span>{editingInvoiceId ? "✏️ Edit Invoice Info" : "➕ Issue New Client Invoice"}</span>
                          {editingInvoiceId && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingInvoiceId(null);
                                setInvoiceClientName("");
                                setInvoiceClientEmail("");
                                setInvoicePackageName("");
                                setInvoiceAmount(99);
                                setInvoicePaymentMethod("Credit Card (Simulated)");
                                setInvoiceStatus("paid");
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-800 cursor-pointer"
                            >
                              Discard edit
                            </button>
                          )}
                        </h4>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Client Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Madhavan S."
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
                            value={invoiceClientName}
                            onChange={(e) => setInvoiceClientName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Client Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. madhavan2006sakthi@gmail.com"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={invoiceClientEmail}
                            onChange={(e) => setInvoiceClientEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Package Purchased</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Silver Package - Rs. 99"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={invoicePackageName}
                            onChange={(e) => setInvoicePackageName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Amount Paid (Rupees)</label>
                            <input
                              type="number"
                              required
                              className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                              value={invoiceAmount}
                              onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                            <select
                              className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white font-semibold"
                              value={invoiceStatus}
                              onChange={(e) => setInvoiceStatus(e.target.value as any)}
                            >
                              <option value="paid">✅ Paid & Clear</option>
                              <option value="pending">⏳ Pending Draft</option>
                              <option value="failed">❌ Failed / Terminated</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Payment Channel</label>
                          <input
                            type="text"
                            placeholder="e.g. UPI, credit Card, Stripe"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={invoicePaymentMethod}
                            onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                        >
                          {editingInvoiceId ? "Update Invoice Copy" : "Issue & Log Client Invoice"}
                        </button>
                      </form>

                      {/* Invoices List */}
                      <div className="xl:col-span-3 space-y-3">
                        {invoices.length === 0 ? (
                          <div className="p-12 text-center text-gray-400 border border-dashed border-gray-250 rounded-2xl bg-gray-50/50">
                            <CreditCard size={32} className="mx-auto text-gray-300" />
                            <p className="text-xs font-medium">No invoice receipts found on file.</p>
                          </div>
                        ) : (
                          invoices.map((inv) => (
                            <div 
                              key={inv.id} 
                              className={`border p-4 rounded-xl text-left bg-white transition-all space-y-3 shadow-xs ${previewingInvoice?.id === inv.id ? "border-orange-500 ring-2 ring-orange-100" : "border-gray-200"}`}
                            >
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">{inv.invoiceNum}</span>
                                  <h5 className="font-bold text-gray-901 text-xs">{inv.clientName}</h5>
                                  <p className="text-[10px] text-gray-400 font-mono tracking-tight">{inv.clientEmail}</p>
                                </div>

                                <div className="flex items-center gap-1 font-sans ml-auto">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewingInvoice(inv)}
                                    className="px-2 py-1 bg-orange-50 text-orange-700 text-[9px] font-bold border border-orange-100 rounded hover:bg-orange-100 transition-colors cursor-pointer"
                                  >
                                    🔍 Preview Bill
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditInvoice(inv)}
                                    className="p-1 bg-gray-100 hover:bg-gray-205 rounded text-gray-600 cursor-pointer"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInvoice(inv.id)}
                                    className="p-1 bg-red-100 hover:bg-red-200 text-red-650 rounded cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] font-mono">
                                <div>
                                  <span className="text-gray-400">Total:</span>{" "}
                                  <b className="text-gray-900 font-sans">Rupees {inv.amount}</b>
                                </div>
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${inv.status === "paid" ? "bg-green-150 text-green-800" : inv.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-800"}`}>
                                  {inv.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* LIVE BILLING LETTERHEAD PREVIEW PANEL MODULE */}
                    {previewingInvoice && (
                      <div className="border border-orange-200 bg-amber-50/10 p-6 rounded-3xl mt-6 relative shadow-sm max-w-2xl mx-auto space-y-6">
                        <button
                          type="button"
                          onClick={() => setPreviewingInvoice(null)}
                          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 font-mono text-xs cursor-pointer"
                        >
                          ✕ Close Preview
                        </button>

                        <div className="border border-gray-250 bg-white rounded-2xl p-6 shadow-md text-left space-y-6 select-none font-sans relative overflow-hidden">
                          {/* Corporate stamp label decoration */}
                          <div className="absolute right-4 top-16 border-4 border-dashed border-green-600/30 text-green-600/30 text-[10px] font-black uppercase tracking-widest p-1 px-3 rotate-12 rounded-lg pointer-events-none">
                            WebNest Verified<br />Paid & Settled
                          </div>

                          {/* Invoice Letterhead Header */}
                          <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <div className="bg-orange-600 text-white w-9 h-9 rounded-xl flex flex-col items-center justify-center font-black leading-none p-1 select-none shrink-0 shadow-sm border border-orange-500">
                                  <span className="text-[11px] tracking-wide">WN</span>
                                  <span className="text-[5.5px] font-bold uppercase tracking-widest text-orange-200 mt-0.5 whitespace-nowrap">WEB NEST</span>
                                </div>
                                <div className="text-left">
                                  <span className="font-extrabold text-sm text-gray-901 tracking-tight block leading-none">WEB NEST Systems</span>
                                  <span className="text-[8px] text-orange-600 font-bold uppercase font-mono tracking-widest block mt-1">⚡ Secure direct invoicing</span>
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-2.5 leading-normal font-light">
                                405 Cloud-Native Sandbox Lane,<br />Silicon Gateway Transit, TN, India
                              </p>
                            </div>
                            <div className="text-right">
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">TAX RECEIPT</h4>
                              <p className="text-[10px] font-mono text-orange-600 font-bold">{previewingInvoice.invoiceNum}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{new Date(previewingInvoice.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Client bill-to metadata */}
                          <div className="grid grid-cols-2 gap-4 text-xs font-light">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wide">Customer details</span>
                              <b className="text-gray-901 font-semibold">{previewingInvoice.clientName}</b>
                              <p className="text-gray-400 text-[10px] font-mono leading-tight">{previewingInvoice.clientEmail}</p>
                            </div>
                            <div className="space-y-1 border-l border-gray-100 pl-4">
                              <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wide">Settlement status</span>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="capitalize font-mono font-bold text-green-700">{previewingInvoice.status}</span>
                              </div>
                              <p className="text-gray-400 text-[10px]">Via: {previewingInvoice.paymentMethod}</p>
                            </div>
                          </div>

                          {/* Billing Table */}
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[9px] uppercase font-bold">
                                <th className="p-2">Subscription Tier Descriptor</th>
                                <th className="p-2 text-right">Units</th>
                                <th className="p-2 text-right">Unit Rate</th>
                                <th className="p-2 text-right">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-100 text-gray-700">
                                <td className="p-2 font-medium">{previewingInvoice.packageName || "Silver Month Tier"}</td>
                                <td className="p-2 text-right font-mono">1</td>
                                <td className="p-2 text-right font-mono">Rs. {previewingInvoice.amount}</td>
                                <td className="p-2 text-right font-mono font-bold text-gray-900">Rs. {previewingInvoice.amount}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Math aggregations */}
                          <div className="flex justify-end pt-2 text-xs">
                            <div className="w-64 space-y-1.5 border-t border-gray-100 pt-3">
                              <div className="flex justify-between text-gray-400">
                                <span>Sub-Total:</span>
                                <span className="font-mono text-gray-900">Rs. {previewingInvoice.amount}</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>CGST @ 9.0%:</span>
                                <span className="font-mono text-gray-500">Included</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>SGST @ 9.0%:</span>
                                <span className="font-mono text-gray-500">Included</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-951 font-bold">
                                <span className="uppercase text-[9px] tracking-wide">Grand total:</span>
                                <span className="font-mono text-orange-600 text-xs">Rupees {previewingInvoice.amount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Signature or disclaimer */}
                          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                            <div className="space-y-0.5 text-[9px] text-gray-400 font-light leading-normal">
                              <span>For customer queries regarding refunds or UPI failures, email {footerSettings.contactEmail}</span>
                              <p>© 2026 WebNest.dev Inc. Thank you for your support!</p>
                            </div>
                            <div className="text-right">
                              <span className="font-serif italic text-xs text-gray-400 block pb-1">Admin Representative</span>
                              <span className="text-[10px] font-mono uppercase font-bold text-gray-700">WebNest Care</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive billing console */}
                        <div className="flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors shadow cursor-pointer"
                          >
                            🖨️ Print Receipt Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUB TAB 4: GENERAL FOOTER CUSTOMIZER */}
                {adminSubTab === "footer" && (
                  <form onSubmit={handleSaveFooterSettings} className="border border-gray-200 rounded-3xl p-6 bg-white space-y-6 text-left max-w-2xl mx-auto shadow-xs">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">⚙️ Corporate Footer Customization Config</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Edit refund rules, support triggers, and policy items reflected on layout headers and footer rails.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Terms & Conditions text</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full text-xs p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-sans"
                        value={footerSettings.termsAndConditions}
                        onChange={(e) => setFooterSettings({ ...footerSettings, termsAndConditions: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Refund policies guideline</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full text-xs p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-sans"
                        value={footerSettings.refundPolicies}
                        onChange={(e) => setFooterSettings({ ...footerSettings, refundPolicies: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Support Email Identifier</label>
                        <input
                          type="email"
                          required
                          className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          value={footerSettings.contactEmail}
                          onChange={(e) => setFooterSettings({ ...footerSettings, contactEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">WhatsApp Help Channel Number</label>
                        <input
                          type="text"
                          required
                          className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          value={footerSettings.contactWhatsapp}
                          onChange={(e) => setFooterSettings({ ...footerSettings, contactWhatsapp: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingFooter}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-650 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-600/15 cursor-pointer text-xs"
                    >
                      {isSavingFooter ? "Applying custom rules to global database..." : "🔒 Save and Propagate Footer Customization"}
                    </button>
                  </form>
                )}

                {/* SUB TAB 5: HOMEPAGE CONTENT & ACTIVE OFFERS CRUD */}
                {adminSubTab === "homepage" && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveHomepageSettings(homepageSettings);
                    }} 
                    className="border border-gray-200 rounded-3xl p-6 bg-white space-y-6 text-left max-w-2xl mx-auto shadow-xs"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-901">🏠 Live Homepage Layout Customizer</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Customize elements of your homepage instantly. Changes propagate immediately onto public visitors' views.</p>
                    </div>

                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block animate-pulse" />
                        <h5 className="text-xs font-bold text-orange-950 uppercase">Immediate Offer Announcement Broadcaster</h5>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Live Announcement Message</label>
                        <textarea
                          rows={2}
                          className="w-full text-xs p-3.5 border border-gray-250 rounded-lg focus:outline-none focus:border-orange-500"
                          placeholder="e.g. 🎉 Special Launch Offer: Upgrade to Silver today and get 30% off!"
                          value={homepageSettings.activeOfferText || ""}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, activeOfferText: e.target.value })}
                        />
                        <p className="text-[9px] text-gray-400">Announcing this immediately creates an alert notification banner visible in real-time inside ALL active client dashboards and on the homepage.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Offer Button CTA Label</label>
                          <input
                            type="text"
                            className="w-full text-xs px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none"
                            placeholder="e.g. Claim Discount Now"
                            value={homepageSettings.activeOfferButtonLabel || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, activeOfferButtonLabel: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Offer Button URL Destination</label>
                          <input
                            type="text"
                            className="w-full text-xs px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none"
                            placeholder="e.g. #pricing"
                            value={homepageSettings.activeOfferButtonUrl || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, activeOfferButtonUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5">
                        <input
                          type="checkbox"
                          id="active-offer-toggle"
                          className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                          checked={homepageSettings.activeOfferActive !== false}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, activeOfferActive: e.target.checked })}
                        />
                        <label htmlFor="active-offer-toggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                          Activate and broadcast this announcement immediately
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">1. Hero Section Layout Options</h5>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Hero Floating Sparkle Badge</label>
                        <input
                          type="text"
                          required
                          className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          value={homepageSettings.heroBadge || ""}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, heroBadge: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Hero Title Line 1</label>
                          <input
                            type="text"
                            required
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={homepageSettings.heroHeading1 || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, heroHeading1: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Hero Highlight Title Line 2</label>
                          <input
                            type="text"
                            required
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={homepageSettings.heroHeading2 || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, heroHeading2: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Hero Descriptive Subtext</label>
                        <textarea
                          rows={3}
                          required
                          className="w-full text-xs p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-sans"
                          value={homepageSettings.heroDescription || ""}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, heroDescription: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">2. Product Features & Chat Preview</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Features Section Title</label>
                          <input
                            type="text"
                            required
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={homepageSettings.featuresTitle || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, featuresTitle: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Chatbot Widget Bot Display Title</label>
                          <input
                            type="text"
                            required
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                            value={homepageSettings.chatTitle || ""}
                            onChange={(e) => setHomepageSettings({ ...homepageSettings, chatTitle: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Features Section Paragraph Description</label>
                        <textarea
                          rows={3}
                          required
                          className="w-full text-xs p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-sans"
                          value={homepageSettings.featuresDesc || ""}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, featuresDesc: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Chatbot Widget Subtitle Status Text</label>
                        <input
                          type="text"
                          required
                          className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          value={homepageSettings.chatDesc || ""}
                          onChange={(e) => setHomepageSettings({ ...homepageSettings, chatDesc: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingHomepage}
                      className="w-full bg-[#FF6321] hover:bg-orange-700 disabled:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-600/15 cursor-pointer text-xs uppercase tracking-wide"
                    >
                      {isSavingHomepage ? "Applying custom fields & publishing..." : "🔒 Save and Propagate Entire Homepage Content"}
                    </button>
                  </form>
                )}

                {/* SUB TAB 6: USER LOGIN DATA MONITOR */}
                {adminSubTab === "logins" && (
                  <div className="space-y-6">
                    <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-bold text-gray-901">👤 Secure Real-Time User Login Reports</h4>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                          Monitor active authentication handshakes, Google Sign-Ins, and registration sessions. All records are logged securely and synchronized instantly across your server logs.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-orange-100 text-[#FF6321] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono whitespace-nowrap">
                          {logins.length} TOTAL LOGINS
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                              <th className="p-4">User Details / Email</th>
                              <th className="p-4">Security User ID (UID)</th>
                              <th className="p-4">Login Channel Method</th>
                              <th className="p-4">Assigned IP Address</th>
                              <th className="p-4 text-right">Authentication Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {logins.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 font-light">
                                  No real-time user authentication sessions recorded yet today.
                                </td>
                              </tr>
                            ) : (
                              logins.map((login) => (
                                <tr key={login.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 text-left">
                                    <div className="font-semibold text-gray-900">{login.displayName || "WebNest Guest"}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{login.email}</div>
                                  </td>
                                  <td className="p-4 text-left font-mono text-[10px] text-gray-500 max-w-[140px] truncate" title={login.uid}>
                                    {login.uid}
                                  </td>
                                  <td className="p-4 text-left">
                                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                      🛡️ {login.method || "Google Sign-In"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-left font-mono text-[11px] text-gray-500">
                                    {login.ipAddress || "127.0.0.1"}
                                  </td>
                                  <td className="p-4 text-right font-mono text-[10px] text-gray-400">
                                    {new Date(login.timestamp).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
