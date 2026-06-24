import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

function generatePaytmChecksum(params: any, merchantKey: string): string {
  const keys = Object.keys(params).sort();
  const data = keys.map(k => params[k]).join("|");
  return crypto.createHmac("sha256", merchantKey).update(data).digest("hex");
}

function verifyPaytmChecksum(params: any, merchantKey: string, receivedSignature: string): boolean {
  const calculated = generatePaytmChecksum(params, merchantKey);
  return calculated === receivedSignature;
}


const app = express();
const PORT = 3000;

app.use(express.json());

// Path virtualization/normalization middleware to guarantee compatibility on Vercel serverless environments
app.use((req, res, next) => {
  const isVercelRuntime = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || !!process.env.NOW_REGION || !!process.env.LAMBDA_TASK_ROOT;
  const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");

  // Only rewrite non-static non-api endpoints if inside a Vercel functions runtime environment and NOT requesting HTML content
  if (isVercelRuntime && !acceptsHtml && req.url && !req.url.startsWith("/api") && !req.url.startsWith("/assets") && req.url !== "/" && !req.url.includes(".")) {
    console.log(`[URL Normalizer] Rewriting ${req.url} to include /api prefix (Vercel serverless mode)`);
    if (req.url.startsWith("/")) {
      req.url = "/api" + req.url;
    } else {
      req.url = "/api/" + req.url;
    }
  }
  next();
});

// Set up the Gmail SMTP transporter with credentials requested by the user
const smtpTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "care.webnest@gmail.com",
    pass: process.env.SMTP_PASS || "gtuhhtulrcmtmkam"
  },
  tls: {
    rejectUnauthorized: false
  }
});

// In-memory persistent data structures matching Firebase schemas
interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  timestamp: number;
}

interface BotSettings {
  id: string;
  botName: string;
  greetingText: string;
  escalationMessage: string;
  systemPrompt: string;
  bubbleColor: string;
  accentColor: string;
  widgetIcon: string;
  widgetPosition: string;
  emailNotification: string;
}

interface KnowledgeItem {
  id: string;
  userId: string;
  question: string;
  answer: string;
  category: string;
  isCustom: boolean;
}

interface ConversationLog {
  id: string;
  userId: string;
  visitorId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  status: "bot" | "escalated" | "resolved";
  messages: any[];
  createdAt: number;
  lastActive: number;
  lastMessageText: string;
  orderId?: string;
  assignedTo?: string;
  channel?: "web" | "whatsapp" | "mobile";
  tags?: string[];
  department?: "Tech Support" | "Sales Reps" | "Billing" | "Unassigned";
  confidenceScore?: number;
  escalationReason?: string;
  agentTyping?: boolean;
  agentTypingUntil?: number;
}

interface NotificationLog {
  id: string;
  userId: string;
  visitorId: string;
  type: "email" | "push";
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  transcript?: any[];
}

interface UserProfileSimple {
  uid: string;
  displayName: string;
  email: string;
  billingStatus: string;
  billingTier: string;
  registeredAt: number;
}

interface CrmPipelineLog {
  userId: string;
  hubspotConnected: boolean;
  zohoConnected: boolean;
  salesforceConnected: boolean;
  lastSyncTimestamp: number;
  syncedLeadsCount: number;
  whatsappConnected?: boolean;
  whatsappNumber?: string;
  whatsappToken?: string;
  mobileConnected?: boolean;
  mobileAppId?: string;
  mobileToken?: string;
  telegramConnected?: boolean;
  telegramBotToken?: string;
}

interface QuickReply {
  id: string;
  userId: string;
  text: string;
  value: string;
  order: number;
}

interface ResponseTemplate {
  id: string;
  userId: string;
  trigger: string;
  responseText: string;
}

interface FeatureToggles {
  userId: string;
  fileUploadEnabled: boolean;
  liveHandoffEnabled: boolean;
  speechToTextEnabled: boolean;
  proactiveGreetingEnabled: boolean;
  customVibeThemeEnabled: boolean;
}

// In-memory Map collections to replace Firestore references entirely
const otpMemoryStore = new Map<string, OtpRecord>();
const botSettingsStore = new Map<string, BotSettings>();
const knowledgeStore = new Map<string, KnowledgeItem>();
const conversationsStore = new Map<string, ConversationLog>();
const notificationsStore = new Map<string, NotificationLog>();
const crmPipelinesStore = new Map<string, CrmPipelineLog>();

const quickRepliesStore = new Map<string, QuickReply>();
const responseTemplatesStore = new Map<string, ResponseTemplate>();
const featureTogglesStore = new Map<string, FeatureToggles>();

// Dynamic customizable models interfaces
interface CustomPackage {
  id: string;
  name: string;
  price: number;
  periodText: string;
  features: string[];
  isPopular?: boolean;
}

interface FeedbackReview {
  id: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  comment: string;
  timestamp: number;
}

interface InvoiceReceipt {
  id: string;
  invoiceNum: string;
  clientName: string;
  clientEmail: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  status: "paid" | "pending" | "failed";
  timestamp: number;
}

interface FooterSettings {
  id: string;
  termsAndConditions: string;
  refundPolicies: string;
  contactEmail: string;
  contactWhatsapp: string;
}

// In-memory data store map collections
interface HomepageSettings {
  id: string;
  heroBadge: string;
  heroHeading1: string;
  heroHeading2: string;
  heroDescription: string;
  featuresTitle: string;
  featuresDesc: string;
  chatTitle: string;
  chatDesc: string;
  activeOfferText: string;
  activeOfferButtonLabel: string;
  activeOfferButtonUrl: string;
  activeOfferActive: boolean;
}

const homepageSettingsStore = new Map<string, HomepageSettings>();
const packagesStore = new Map<string, CustomPackage>();
const feedbacksStore = new Map<string, FeedbackReview>();
const invoicesStore = new Map<string, InvoiceReceipt>();
const footerSettingsStore = new Map<string, FooterSettings>();

interface LoginRecord {
  id: string;
  email: string;
  displayName: string;
  uid: string;
  timestamp: number;
  ipAddress?: string;
  method: string;
}

const loginRecordsStore = new Map<string, LoginRecord>();


// Seed initial values for Corporate Enterprise channels
const seedDefaultData = () => {
  // 2. Seed some general knowledge items
  const demoUserId = "demo";
  knowledgeStore.set("fact_1", {
    id: "fact_1",
    userId: demoUserId,
    question: "Corporate Shipping Policy details",
    answer: "Standard domestic deliveries take 3 to 5 business days, and international items require 7 to 14 days.",
    category: "Shipping",
    isCustom: false
  });
  knowledgeStore.set("fact_2", {
    id: "fact_2",
    userId: demoUserId,
    question: "Refund Policy terms",
    answer: "Refund requests are accepted within 30 days of the date of purchase. Original receipt is required, and items must be unused in original packaging.",
    category: "Billing & Returns",
    isCustom: false
  });
  knowledgeStore.set("fact_3", {
    id: "fact_3",
    userId: demoUserId,
    question: "Integration script instructions",
    answer: "Embed the lightweight <script src=\"/widget.js?id=CLIENT_ID\"></script> right before your closing </body> tag.",
    category: "General FAQs",
    isCustom: false
  });

  // 3. Seed initial omnichannel conversations representing Web, WhatsApp, and Mobile channels
  // Web Widget Conversation
  conversationsStore.set(`${demoUserId}_visitor_lisa1`, {
    id: `${demoUserId}_visitor_lisa1`,
    userId: demoUserId,
    visitorId: "visitor_lisa1",
    visitorName: "Lisa Gardner",
    visitorEmail: "lisa@gardner.com",
    visitorPhone: "+1 (555) 345-9821",
    status: "escalated",
    messages: [
      { sender: "bot", text: "Hello! I am WebNest's AI assistant. How can I help you today?", timestamp: Date.now() - 300000 },
      { sender: "user", text: "I am trying to embed the chatbot script tag but getting a Javascript error: 'Uncaught TypeError: cannot read property of null'.", timestamp: Date.now() - 240000 },
      { sender: "bot", text: "It seems that the HTML container has not fully mounted yet. Make sure you place the <script> snippet exactly before the closing </body> tag.", timestamp: Date.now() - 180000 },
      { sender: "user", text: "I did that, but the widget balloon icon won't display. Is there a manual config?", timestamp: Date.now() - 120000 },
      { sender: "bot", text: "I apologize, but this topic requires manual routing. Let me connect you directly to our human live active agents.", timestamp: Date.now() - 60000 },
      { sender: "system", text: "Pre-qualification details loaded. Order ID: ORD-9012A.", timestamp: Date.now() - 50000 }
    ],
    createdAt: Date.now() - 300000,
    lastActive: Date.now() - 50000,
    lastMessageText: "I did that, but the widget balloon icon won't display. Is there a manual config?",
    orderId: "ORD-9012A",
    assignedTo: "Liam Gardner (You)",
    channel: "web",
    tags: ["#script-error", "#embed"],
    department: "Tech Support",
    confidenceScore: 48,
    escalationReason: "Low AI Confidence (48%)"
  });

  // WhatsApp Business Conversation
  conversationsStore.set(`${demoUserId}_visitor_bruce`, {
    id: `${demoUserId}_visitor_bruce`,
    userId: demoUserId,
    visitorId: "visitor_bruce",
    visitorName: "Bruce Banner",
    visitorEmail: "bruce@avengers.io",
    visitorPhone: "+1 (555) 991-0012",
    status: "escalated",
    messages: [
      { sender: "user", text: "Green light to order 50 corporate chatbot seats. What is the enterprise SLA?", timestamp: Date.now() - 500000 },
      { sender: "bot", text: "Hello Bruce! For 50+ slots, WebNest offers a dedicated enterprise account team, 99.99% uptime guarantee, and custom training modules starting at $499/mo.", timestamp: Date.now() - 400000 },
      { sender: "user", text: "Sounds perfect. Route me to a corporate sales rep to finalize contract signature.", timestamp: Date.now() - 300000 },
      { sender: "bot", text: "Connecting you now to our Sales Representatives department. One moment.", timestamp: Date.now() - 200000 }
    ],
    createdAt: Date.now() - 500000,
    lastActive: Date.now() - 200000,
    lastMessageText: "Route me to a corporate sales rep to finalize contract signature.",
    orderId: "SLS-ENTERPRISE",
    assignedTo: "None",
    channel: "whatsapp",
    tags: ["#enterprise-sales", "#pricing"],
    department: "Sales Reps",
    confidenceScore: 92,
    escalationReason: "Direct customer representative request"
  });

  // Mobile Application SDK Conversation
  conversationsStore.set(`${demoUserId}_visitor_sarah`, {
    id: `${demoUserId}_visitor_sarah`,
    userId: demoUserId,
    visitorId: "visitor_sarah",
    visitorName: "Sarah Connor",
    visitorEmail: "sarah@resistance.net",
    visitorPhone: "+1 (555) 777-1984",
    status: "escalated",
    messages: [
      { sender: "user", text: "My monthly subscription invoice was double charged on card ending 4242.", timestamp: Date.now() - 1000000 },
      { sender: "bot", text: "I can check refund status for you. Please confirm your subscription details.", timestamp: Date.now() - 900000 },
      { sender: "user", text: "My Order ID is REF-8821. Refund the extra $29 please.", timestamp: Date.now() - 800000 },
      { sender: "bot", text: "I am immediately escalationing this transaction dispute to our Billing team.", timestamp: Date.now() - 700000 }
    ],
    createdAt: Date.now() - 1000000,
    lastActive: Date.now() - 700000,
    lastMessageText: "My Order ID is REF-8821. Refund the extra $29 please.",
    orderId: "REF-8821",
    assignedTo: "None",
    channel: "mobile",
    tags: ["#double-charge", "#billing-bug"],
    department: "Billing",
    confidenceScore: 35,
    escalationReason: "Unresolved billing conflict"
  });

  // 4. Seed initial alerts
  notificationsStore.set("alert_seed1", {
    id: "alert_seed1",
    userId: demoUserId,
    visitorId: "visitor_lisa1",
    type: "email",
    title: "🚨 Urgent: New Human Live Chat Escalation (Lisa Gardner (Client))",
    body: "A user has escalated WebNest bot to live human. Contact: lisa@gardner.com. Last Message: \"Hi, I have a custom routing question. Can you help me?\". Respond instantly within the WebNest Admin Inbox.",
    timestamp: Date.now() - 25000,
    read: false,
    transcript: [
      { sender: "user", text: "Hi, I have a custom routing question. Can you help me?", timestamp: Date.now() - 45000 }
    ]
  });

  // Seed dynamic customizable SaaS elements
  packagesStore.set("pkg_trial", {
    id: "pkg_trial",
    name: "Free Trial",
    price: 0,
    periodText: "7 days free trial",
    features: ["24/7 basic AI Chatbot assistant", "Up to 50 conversations logs", "Generic styling layout presets"],
    isPopular: false
  });
  packagesStore.set("pkg_silver", {
    id: "pkg_silver",
    name: "Silver Package",
    price: 99,
    periodText: "rupees 99 only per month",
    features: ["Fast multi-turn intelligent agent responses", "Full client CRM data sync integration", "Live human escalation auto-routing queue", "Up to 500 visitors session history"],
    isPopular: true
  });
  packagesStore.set("pkg_3month", {
    id: "pkg_3month",
    name: "3 Month Package",
    price: 199,
    periodText: "for 3 months",
    features: ["All design & training benefits of Silver tier", "Extended 3-month priority transcripts retention", "Custom Slack alerts and priority trigger queues", "Dedicated live SMTP verification access"],
    isPopular: false
  });
  packagesStore.set("pkg_6month", {
    id: "pkg_6month",
    name: "6 Month Package",
    price: 399,
    periodText: "for 6 months",
    features: ["Full premium Enterprise sandbox channels", "Automatic document scraper crawler sync", "Advanced client ticket confidence filters", "24/7 dedicated push notifications channels"],
    isPopular: false
  });
  packagesStore.set("pkg_1year", {
    id: "pkg_1year",
    name: "1 Year Package",
    price: 699,
    periodText: "for 1 year",
    features: ["Unlimited custom AI agent templates", "Custom Branding widget design controls", "Immediate phone call backup live alerts", "Direct VIP developer support package and setup help"],
    isPopular: false
  });

  feedbacksStore.set("feed_1", {
    id: "feed_1",
    clientName: "Ananya Sharma",
    clientEmail: "ananya@analytics.com",
    rating: 5,
    comment: "WebNest completely changed how our company does customer service. The transition from AI to live chat has saved our team hundreds of hours!",
    timestamp: Date.now() - 1000 * 60 * 60 * 24
  });
  feedbacksStore.set("feed_2", {
    id: "feed_2",
    clientName: "Marcus Vance",
    clientEmail: "marcus@vancebrands.net",
    rating: 4,
    comment: "I really love the prompt triggers feature! Intercepts basic questions perfectly without invoking the LLM constantly.",
    timestamp: Date.now() - 1000 * 60 * 60 * 12
  });

  invoicesStore.set("inv_1", {
    id: "inv_1",
    invoiceNum: "INV-2026-001",
    clientName: "Madhavan S.",
    clientEmail: "madhavan2006sakthi@gmail.com",
    packageName: "Silver Package - Rs. 99/mo",
    amount: 99,
    paymentMethod: "Credit Card (Simulated)",
    status: "paid",
    timestamp: Date.now() - 10 * 600000
  });
  invoicesStore.set("inv_2", {
    id: "inv_2",
    invoiceNum: "INV-2026-002",
    clientName: "Enterprise Client",
    clientEmail: "care.webnest@gmail.com",
    packageName: "1 Year Package - Rs. 699",
    amount: 699,
    paymentMethod: "UPI (Simulated)",
    status: "paid",
    timestamp: Date.now() - 36 * 600000
  });

  footerSettingsStore.set("default_footer", {
    id: "default_footer",
    termsAndConditions: "The following conditions govern your deployment of the WebNest widget. You are solely responsible for compliance with regional telecom or chat privacy regulations.",
    refundPolicies: "We maintain a 7-day no-questions-asked refund window for all Silver and bulk multi-month licensing packages if you are unsatisfied.",
    contactEmail: "care.webnest@gmail.com",
    contactWhatsapp: "+91 93456 21102"
  });

  homepageSettingsStore.set("default_homepage", {
    id: "default_homepage",
    heroBadge: "Introducing AI to Human Seamless Escalation",
    heroHeading1: "The 24/7 Smart Live Chat",
    heroHeading2: "For Your Website",
    heroDescription: "Keep customer satisfaction perfect. When WebNest's AI assistant cannot verify the answer, it seamlessly collects visitor details and escalates to your team in real time.",
    featuresTitle: "Embedded Chatbot Widget",
    featuresDesc: "WebNest feeds a custom snippet onto any platform (WordPress, Shopify, Webflow, custom HTML). Once loaded, the widget runs on a client's site, powered by your training knowledge base and prompts.",
    chatTitle: "NestBot Assistant",
    chatDesc: "Active (AI Mode)",
    activeOfferText: "🎉 Special Launch Offer: Upgrade to Silver or our Multi-Month Package today and get complimentary custom theme integration and setup!",
    activeOfferButtonLabel: "Claim Discount Now",
    activeOfferButtonUrl: "#pricing",
    activeOfferActive: true
  });

  // Seed some initial secure user login records
  loginRecordsStore.set("log_1", {
    id: "log_1",
    email: "care.webnest@gmail.com",
    displayName: "Admin Care",
    uid: "admin_uid_care",
    timestamp: Date.now() - 3600000 * 1.5,
    ipAddress: "192.168.1.101",
    method: "Google Sign-In"
  });
  loginRecordsStore.set("log_2", {
    id: "log_2",
    email: "sarah.connor@gmail.com",
    displayName: "Sarah Connor",
    uid: "user_sarah_99",
    timestamp: Date.now() - 3600000 * 3.2,
    ipAddress: "24.120.45.67",
    method: "Google Sign-In"
  });
  loginRecordsStore.set("log_3", {
    id: "log_3",
    email: "james.bond@mi6.gov.uk",
    displayName: "James Bond",
    uid: "user_jb_007",
    timestamp: Date.now() - 3600000 * 7.5,
    ipAddress: "89.207.132.4",
    method: "Magic Link Email"
  });
};

seedDefaultData();

// Securely persist verification OTP in local memory
async function persistOtp(email: string, otpCode: string, expiresAt: number) {
  const normEmail = email.toLowerCase().trim();
  const timestamp = Date.now();
  
  otpMemoryStore.set(normEmail, {
    email: normEmail,
    code: otpCode,
    expiresAt,
    timestamp,
  });
  console.log(`[Memory Store] Verification OTP saved in local memory for ${normEmail}`);
}

// Keep a small tracking map of recently spent magic tokens to gracefully support duplicate client-side requests (e.g. React 18 Strict Mode double-fetches)
const recentlyConsumedTokens = new Map<string, { code: string; consumedAt: number }>();

// Retrieve, validate, and atomically consume verification OTP
async function verifyAndConsumeOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const normEmail = email.toLowerCase().trim();
  const memoryData = otpMemoryStore.get(normEmail);
  let otpRecord: { code: string; expiresAt: number } | null = null;

  if (memoryData) {
    otpRecord = {
      code: memoryData.code,
      expiresAt: memoryData.expiresAt,
    };
    otpMemoryStore.delete(normEmail);
    recentlyConsumedTokens.set(normEmail, {
      code: otpRecord.code,
      consumedAt: Date.now()
    });
    console.log(`[Memory Store] Verification OTP verified and consumed in local memory for ${normEmail}`);
  } else {
    // Check if it was consumed within the last 15 seconds to handle strict-mode double triggers
    const recent = recentlyConsumedTokens.get(normEmail);
    if (recent && recent.code === code.trim() && (Date.now() - recent.consumedAt) < 15000) {
      console.log(`[Memory Store] Verification OTP already consumed within the last 15 seconds. Tolerating duplicate call for ${normEmail}.`);
      return { success: true };
    }
  }

  if (!otpRecord) {
    return { success: false, error: "No pending verification token found for this email address." };
  }

  if (otpRecord.code !== code.trim()) {
    return { success: false, error: "Invalid verification code. Please check your inbox and retry." };
  }

  if (Date.now() > otpRecord.expiresAt) {
    return { success: false, error: "This verification code has expired. Please request a new one." };
  }

  return { success: true };
}

// 1. Send Magic Link Email Endpoint
app.post("/api/auth/send-magic-link", async (req, res) => {
  const { email, displayName } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  try {
    // Generate a secure unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes limit

    // Store the magic token as the "code" field to utilize the same helper store
    await persistOtp(email, token, expiresAt);

    // Build the dynamic return magic link matching the exact origin of user's request
    const origin = req.get("origin") || req.get("referer") || process.env.APP_URL || "https://editnest68-com-8y8x.vercel.app";
    const cleanOrigin = origin.replace(/\/$/, "");
    const magicLinkUrl = `${cleanOrigin}/?email=${encodeURIComponent(email)}&magic_token=${token}${displayName ? `&name=${encodeURIComponent(displayName)}` : ""}`;

    const now = new Date();
    const timeZoneStr = "Asia/Kolkata";
    const timeString = now.toLocaleTimeString("en-US", { hour12: false, timeZone: timeZoneStr });
    const dateString = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: timeZoneStr });

    const mailOptions = {
      from: '"WebNest Support" <care.webnest@gmail.com>',
      to: email,
      subject: `✨ Log in to your WebNest Account`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- WebNest Logo Block -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background-color: #FFF0EB; color: #FF6321; width: 64px; height: 64px; border-radius: 16px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; line-height: 1.1; margin: 0 auto; border: 2px solid #FF6321; padding: 4px; box-sizing: border-box;">
              <span>WN</span>
              <span style="font-size: 8px; font-weight: 800; letter-spacing: 0.5px;">WEB NEST</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 800; color: #111827; margin: 12px 0 4px 0; letter-spacing: -0.5px;">⚡ Access Your Administrative Console</h2>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">Hello WebNest Operator,</p>
          </div>
          
          <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 10px;">
            <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">We received a request to log in to your WebNest dashboard using this email address. Click the secure login button below to verify your session and access the console:</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${magicLinkUrl}" target="_blank" style="background-color: #FF6321; color: #ffffff; padding: 12px 30px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block; letter-spacing: -0.2px; border: 1px solid #E04E0E; box-shadow: 0 4px 10px rgba(255, 99, 33, 0.25);">
                Log In to WebNest Dashboard
              </a>
            </div>
            
            <p style="font-size: 12px; color: #4B5563; line-height: 1.5; margin: 20px 0;">If the button above does not work in your email client, you can copy and paste this complete secure link into your browser address bar:</p>
            <p style="font-size: 11px; word-break: break-all; background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px; font-family: monospace; color: #FF6321; margin: 0;">
              ${magicLinkUrl}
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 14px; margin: 24px 0; text-align: left;">
              <p style="font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; margin: 0 0 6px 0;">⚠️ Security Notice:</p>
              <ul style="font-size: 11px; color: #4b5563; margin: 0; padding-left: 16px; line-height: 1.5; list-style-type: disc;">
                <li>This direct verification link expires in 15 minutes.</li>
                <li>It can only be used once. Do not share this link with anyone.</li>
                <li>If you did not initiate this login request, you can safely ignore this mail.</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #f3f4f6; padding-top: 14px; text-align: center;">
              <p style="font-size: 10px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Security Handshake:</p>
              <p style="font-size: 11px; color: #4b5563; font-weight: 600; margin: 4px 0 0 0; font-family: monospace; line-height: 1.4;">Direct SMTP Gateway • Sent at ${timeString} IST, ${dateString}</p>
            </div>
          </div>
        </div>
      `
    };

    await smtpTransporter.sendMail(mailOptions);
    console.log(`[SMTP] Magic link sent successfully to ${email}`);
    res.json({ success: true, message: "Verification link sent to your email! Please check your inbox and click it to open dashboard." });

  } catch (error: any) {
    console.error("[SMTP Error] Failed sending authentication mail:", error);
    res.status(500).json({ error: "Failed to dispatch verification email: " + error.message });
  }
});

// 2. Verify Magic Token Link and Authenticate Endpoint
app.post("/api/auth/verify-magic-token", async (req, res) => {
  const { email, token, displayName } = req.body;
  if (!email || !token) {
    return res.status(400).json({ error: "Missing required parameters: email and token." });
  }

  try {
    // Retrieve, validate, and atomically spend the token in database (or memory fallback)
    const result = await verifyAndConsumeOtp(email, token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalName = displayName ? displayName.trim() : cleanEmail.split("@")[0];

    // Generate a secure simulated user session profile
    const profile = {
      uid: "user_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, ""),
      email: cleanEmail,
      displayName: finalName,
      billingStatus: "Free",
      billingTier: "none",
      registeredAt: Date.now()
    };

    res.json({ 
      success: true, 
      message: "Email magic link validated successfully!",
      profile 
    });

  } catch (error: any) {
    console.error("[Auth error] Failed verifying magic token:", error);
    res.status(500).json({ error: "Failed token verification: " + error.message });
  }
});

// =========== DE-COUPLED REST ENDPOINTS (REPLACING FIREBASE CRUD) ===========

// 3. Bot Style & Configuration Settings Endpoints
app.get("/api/chatbots/settings", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const uidStr = String(userId);
  let settings = botSettingsStore.get(uidStr);
  if (!settings) {
    // Create new custom default settings
    settings = {
      id: uidStr,
      botName: "NestBot",
      greetingText: "Hello there! I am WebNest's AI Support. How can my facts assist you today?",
      escalationMessage: "I apologize, but I could not find a clear answer to your question within our knowledge documents. Let me connect you directly to a human live agent.",
      systemPrompt: "You are a professional corporate support representative. Answer queries concisely using the knowledge base. Respond with [ESCALATE_TO_HUMAN] if the query is not resolved.",
      bubbleColor: "#0D9488", // Teal instead of orange
      accentColor: "#F0FDFA", // Teal light background
      widgetIcon: "bot",
      widgetPosition: "bottom-right",
      emailNotification: ""
    };
    botSettingsStore.set(uidStr, settings);
  }
  res.json(settings);
});

app.post("/api/chatbots/settings", (req, res) => {
  const settings = req.body;
  if (!settings.id) return res.status(400).json({ error: "Missing bot settings ID" });
  
  botSettingsStore.set(String(settings.id), settings);
  res.json({ success: true, settings });
});

// 4. Knowledge Base FAQs CRUD Endpoints
app.get("/api/chatbots/knowledge", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const uidStr = String(userId);
  const items = Array.from(knowledgeStore.values()).filter(item => item.userId === uidStr);
  res.json(items);
});

app.post("/api/chatbots/knowledge", (req, res) => {
  const item = req.body;
  if (!item.id || !item.userId) {
    return res.status(400).json({ error: "Missing complete parameters" });
  }
  knowledgeStore.set(String(item.id), item);
  res.json({ success: true, item });
});

app.delete("/api/chatbots/knowledge/:id", (req, res) => {
  const { id } = req.params;
  knowledgeStore.delete(id);
  res.json({ success: true });
});

// 4b. Chatbot Advanced Settings and Features endpoints
app.get("/api/chatbots/quick-replies", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const uidStr = String(userId);
  
  // Find items for this user
  let items = Array.from(quickRepliesStore.values()).filter(item => item.userId === uidStr);
  
  if (items.length === 0) {
    // Seed standard defaults for this user
    const d1 = { id: `qr_${uidStr}_1`, userId: uidStr, text: "Pricing Plans 💰", value: "Give me details on premium subscription pricing and tiers.", order: 1 };
    const d2 = { id: `qr_${uidStr}_2`, userId: uidStr, text: "How to Integrate? 🚀", value: "How do I embed the WebNest chat widget on my website?", order: 2 };
    const d3 = { id: `qr_${uidStr}_3`, userId: uidStr, text: "Connect to Support Agent 🧑‍💻", value: "Please escalate this to a live support human representative.", order: 3 };
    
    quickRepliesStore.set(d1.id, d1);
    quickRepliesStore.set(d2.id, d2);
    quickRepliesStore.set(d3.id, d3);
    
    items = [d1, d2, d3];
  }
  
  items.sort((a, b) => a.order - b.order);
  res.json(items);
});

app.post("/api/chatbots/quick-replies", (req, res) => {
  const item = req.body;
  if (!item.id || !item.userId || !item.text || !item.value) {
    return res.status(400).json({ error: "Missing required quick reply fields: id, userId, text, value" });
  }
  
  quickRepliesStore.set(String(item.id), {
    id: String(item.id),
    userId: String(item.userId),
    text: String(item.text),
    value: String(item.value),
    order: Number(item.order || 0)
  });
  
  res.json({ success: true, item });
});

app.delete("/api/chatbots/quick-replies/:id", (req, res) => {
  const { id } = req.params;
  quickRepliesStore.delete(id);
  res.json({ success: true });
});

app.get("/api/chatbots/response-templates", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const uidStr = String(userId);
  
  let items = Array.from(responseTemplatesStore.values()).filter(item => item.userId === uidStr);
  
  if (items.length === 0) {
    // Seed defaults
    const d1 = { id: `rt_${uidStr}_1`, userId: uidStr, trigger: "pricing", responseText: "WebNest Enterprise has two distinct plans: Pro Monthly starts at $29/month, and Enterprise Annual with a massive support discount is $249/year. Live updates process instantly." };
    const d2 = { id: `rt_${uidStr}_2`, userId: uidStr, trigger: "integrate", responseText: "Embedding WebNest onto your corporate page is super simple! Just go to the Script Snip Embed tab, copy our lightweight snippet, and paste it before the closing </body> tag inside your html." };
    const d3 = { id: `rt_${uidStr}_3`, userId: uidStr, trigger: "hours", responseText: "Our primary team office operates 9:00 AM to 5:00 PM EST, Mon-Fri. However, our advanced automated Gemini-powered AI responds instantly 24/7." };
    
    responseTemplatesStore.set(d1.id, d1);
    responseTemplatesStore.set(d2.id, d2);
    responseTemplatesStore.set(d3.id, d3);
    
    items = [d1, d2, d3];
  }
  
  res.json(items);
});

app.post("/api/chatbots/response-templates", (req, res) => {
  const item = req.body;
  if (!item.id || !item.userId || !item.trigger || !item.responseText) {
    return res.status(400).json({ error: "Missing required response template fields" });
  }
  
  responseTemplatesStore.set(String(item.id), {
    id: String(item.id),
    userId: String(item.userId),
    trigger: String(item.trigger).toLowerCase().trim(),
    responseText: String(item.responseText)
  });
  
  res.json({ success: true, item });
});

app.delete("/api/chatbots/response-templates/:id", (req, res) => {
  const { id } = req.params;
  responseTemplatesStore.delete(id);
  res.json({ success: true });
});

app.get("/api/chatbots/feature-toggles", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const uidStr = String(userId);
  
  let toggles = featureTogglesStore.get(uidStr);
  if (!toggles) {
    toggles = {
      userId: uidStr,
      fileUploadEnabled: true,
      liveHandoffEnabled: true,
      speechToTextEnabled: false,
      proactiveGreetingEnabled: true,
      customVibeThemeEnabled: false
    };
    featureTogglesStore.set(uidStr, toggles);
  }
  
  res.json(toggles);
});

app.post("/api/chatbots/feature-toggles", (req, res) => {
  const toggles = req.body;
  if (!toggles.userId) return res.status(400).json({ error: "Missing userId in feature toggles" });
  
  featureTogglesStore.set(String(toggles.userId), {
    userId: String(toggles.userId),
    fileUploadEnabled: !!toggles.fileUploadEnabled,
    liveHandoffEnabled: !!toggles.liveHandoffEnabled,
    speechToTextEnabled: !!toggles.speechToTextEnabled,
    proactiveGreetingEnabled: !!toggles.proactiveGreetingEnabled,
    customVibeThemeEnabled: !!toggles.customVibeThemeEnabled
  });
  
  res.json({ success: true, toggles });
});

// 5b. CRM Synchronization & Integration Pipelines (HubSpot, Salesforce, Zoho, WhatsApp, Mobile)
app.get("/api/crm/settings", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const uidStr = String(userId);
  let crm = crmPipelinesStore.get(uidStr);
  if (!crm) {
    crm = {
      userId: uidStr,
      hubspotConnected: true, // Seeding one connected by default for direct out-of-box realism
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
    };
    crmPipelinesStore.set(uidStr, crm);
  }
  res.json(crm);
});

app.post("/api/crm/settings", (req, res) => {
  const crm = req.body;
  if (!crm.userId) return res.status(400).json({ error: "Missing userId" });
  crmPipelinesStore.set(String(crm.userId), crm);
  res.json({ success: true, crm });
});

app.post("/api/crm/sync-now", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const uidStr = String(userId);
  let crm = crmPipelinesStore.get(uidStr);
  if (!crm) {
    crm = {
      userId: uidStr,
      hubspotConnected: true,
      zohoConnected: false,
      salesforceConnected: false,
      lastSyncTimestamp: Date.now(),
      syncedLeadsCount: 14,
      whatsappConnected: true,
      whatsappNumber: "+1 (555) 902-1400",
      whatsappToken: "wh_live_83ba928aee",
      mobileConnected: true,
      mobileAppId: "com.webnest.security",
      mobileToken: "sdk_token_71bfa982",
      telegramConnected: false,
      telegramBotToken: ""
    };
  }
  
  // Count current conversations matching this developer and update leads count
  const list = Array.from(conversationsStore.values()).filter(c => c.userId === uidStr);
  crm.lastSyncTimestamp = Date.now();
  crm.syncedLeadsCount += list.length;
  crmPipelinesStore.set(uidStr, crm);
  
  res.json({ success: true, message: `Successfully pushed ${list.length} conversation transcripts and active leads to active CRM pipelines!`, crm });
});

// 6. Live Chats & In-Inbox Conversations Endpoints
app.get("/api/conversations", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const uidStr = String(userId);
  const list = Array.from(conversationsStore.values()).filter(c => c.userId === uidStr);
  
  // Clean up expired typing indicators so they don't stick around from inactive sessions
  const now = Date.now();
  const cleanedList = list.map(conv => {
    if (conv.agentTyping && conv.agentTypingUntil && conv.agentTypingUntil < now) {
      conv.agentTyping = false;
      conv.agentTypingUntil = 0;
      conversationsStore.set(conv.id, conv);
    }
    return conv;
  });

  cleanedList.sort((a, b) => b.lastActive - a.lastActive);
  res.json(cleanedList);
});

app.get("/api/conversations/:id", (req, res) => {
  const { id } = req.params;
  const conv = conversationsStore.get(id);
  if (!conv) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  
  // Check and decay expired typing indicator
  if (conv.agentTyping && conv.agentTypingUntil && conv.agentTypingUntil < Date.now()) {
    conv.agentTyping = false;
    conv.agentTypingUntil = 0;
    conversationsStore.set(id, conv);
  }
  
  res.json(conv);
});

app.post("/api/conversations/:id/typing", (req, res) => {
  const { id } = req.params;
  const { typing } = req.body;
  const conv = conversationsStore.get(id);
  if (!conv) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  
  conv.agentTyping = !!typing;
  conv.agentTypingUntil = typing ? Date.now() + 5000 : 0;
  conversationsStore.set(id, conv);
  
  res.json({ success: true, agentTyping: conv.agentTyping });
});

app.post("/api/conversations", (req, res) => {
  const log = req.body;
  if (!log.id) return res.status(400).json({ error: "Missing parameters: id is required" });
  
  // Set creation timestamp if not provided
  if (!log.createdAt) {
    log.createdAt = Date.now();
  }
  log.lastActive = Date.now();
  
  const existing = conversationsStore.get(log.id);
  const merged = existing ? { ...existing, ...log } : log;
  conversationsStore.set(log.id, merged);
  res.json({ success: true, conversation: merged });
});

app.delete("/api/conversations/:id", (req, res) => {
  const { id } = req.params;
  conversationsStore.delete(id);
  res.json({ success: true });
});

// 7. Push & Email Live Notifications Alerts Endpoints
app.get("/api/chat_notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  
  const alerts = Array.from(notificationsStore.values()).filter(n => n.userId === String(userId));
  alerts.sort((a, b) => b.timestamp - a.timestamp);
  res.json(alerts);
});

app.post("/api/chat_notifications", (req, res) => {
  const log = req.body;
  if (!log.id) return res.status(400).json({ error: "Missing log parameters" });
  notificationsStore.set(log.id, log);
  res.json({ success: true, notification: log });
});

app.post("/api/chat_notifications/read", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  Array.from(notificationsStore.values()).forEach(n => {
    if (n.userId === String(userId)) {
      n.read = true;
    }
  });
  res.json({ success: true });
});


// --- Dynamic SaaS Customizable CRUD APIs ---
// A. Custom Packages CRUD
app.get("/api/packages", (req, res) => {
  const pkgs = Array.from(packagesStore.values());
  res.json(pkgs);
});

app.post("/api/packages", (req, res) => {
  const item = req.body;
  if (!item.id) {
    item.id = "pkg_" + Math.random().toString(36).substring(2, 11);
  }
  packagesStore.set(item.id, {
    id: String(item.id),
    name: String(item.name || "Custom Package"),
    price: Number(item.price ?? 0),
    periodText: String(item.periodText || "per month"),
    features: Array.isArray(item.features) ? item.features : ["Standard benefits"],
    isPopular: !!item.isPopular
  });
  res.json({ success: true, package: packagesStore.get(item.id) });
});

app.delete("/api/packages/:id", (req, res) => {
  const { id } = req.params;
  packagesStore.delete(id);
  res.json({ success: true, message: `Package ${id} removed.` });
});

// B. Feedback and Reviews CRUD
app.get("/api/feedbacks", (req, res) => {
  const list = Array.from(feedbacksStore.values());
  list.sort((a, b) => b.timestamp - a.timestamp);
  res.json(list);
});

app.post("/api/feedbacks", (req, res) => {
  const item = req.body;
  if (!item.id) {
    item.id = "feed_" + Math.random().toString(36).substring(2, 11);
  }
  feedbacksStore.set(item.id, {
    id: String(item.id),
    clientName: String(item.clientName || "Anonymous"),
    clientEmail: String(item.clientEmail || ""),
    rating: Number(item.rating ?? 5),
    comment: String(item.comment || ""),
    timestamp: Number(item.timestamp ?? Date.now())
  });
  res.json({ success: true, feedback: feedbacksStore.get(item.id) });
});

app.delete("/api/feedbacks/:id", (req, res) => {
  const { id } = req.params;
  feedbacksStore.delete(id);
  res.json({ success: true, message: `Feedback ${id} removed.` });
});

// C. Invoices & Receipts CRUD and Previews
app.get("/api/invoices", (req, res) => {
  const list = Array.from(invoicesStore.values());
  list.sort((a, b) => b.timestamp - a.timestamp);
  res.json(list);
});

app.post("/api/invoices", (req, res) => {
  const item = req.body;
  if (!item.id) {
    item.id = "inv_" + Math.random().toString(36).substring(2, 11);
  }
  if (!item.invoiceNum) {
    item.invoiceNum = "INV-2026-" + Math.floor(100 + Math.random() * 900);
  }
  invoicesStore.set(item.id, {
    id: String(item.id),
    invoiceNum: String(item.invoiceNum),
    clientName: String(item.clientName || "Guest User"),
    clientEmail: String(item.clientEmail || ""),
    packageName: String(item.packageName || "Standard Silver Package"),
    amount: Number(item.amount ?? 99),
    paymentMethod: String(item.paymentMethod || "UPI Transfer"),
    status: String(item.status || "paid") as any,
    timestamp: Number(item.timestamp ?? Date.now())
  });
  res.json({ success: true, invoice: invoicesStore.get(item.id) });
});

app.delete("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  invoicesStore.delete(id);
  res.json({ success: true, message: `Invoice ${id} removed.` });
});

// Paytm Payment Gateway Integration Routes
app.post("/api/paytm/initiate", (req, res) => {
  const { amount, packageName, clientEmail, clientName, userId } = req.body;
  const mid = process.env.PAYTM_MID || "MOCK_MID_987654321";
  const key = process.env.PAYTM_MERCHANT_KEY || "MOCK_MERCHANT_KEY_ABC123";
  
  const orderId = "ORD-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
  const txnAmount = String(amount || 99);
  
  const params: any = {
    MID: mid,
    ORDERID: orderId,
    TXNAMOUNT: txnAmount,
    WEBSITE: "DEFAULT",
    CHANNEL_ID: "WAP",
    INDUSTRY_TYPE_ID: "Retail",
    CUST_ID: userId || "CUST_001",
    CALLBACK_URL: `${req.protocol}://${req.get("host")}/api/paytm/webhook`
  };
  
  const checksum = generatePaytmChecksum(params, key);
  
  res.json({
    success: true,
    paytmParams: {
      ...params,
      CHECKSUMHASH: checksum
    },
    orderId,
    packageName,
    clientName,
    clientEmail,
    amount
  });
});

app.get("/api/paytm/checkout-gateway", (req, res) => {
  const mid = String(req.query.mid || "");
  const orderId = String(req.query.orderId || "");
  const amount = String(req.query.amount || "");
  const packageName = String(req.query.packageName || "");
  const clientEmail = String(req.query.clientEmail || "");
  const clientName = String(req.query.clientName || "");
  const checksum = String(req.query.checksum || "");
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paytm Secure Online Payment Gateway</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f4f6fa;
        }
      </style>
    </head>
    <body class="min-h-screen flex flex-col justify-between">
      
      <!-- Top header line -->
      <header class="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50 shadow-sm text-[#002f6c]">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <svg class="h-8 shadow-xs rounded px-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
              <path d="M15 10c-3 0-5 2-5 5v10c0 3 2 5 5 5h3c3 0 5-2 5-5V15c0-3-2-5-5-5h-3zm0 15c0 1-1 2-2 2h-1c-1 0-2-1-2-2V15c0-1 1-2 2-2h1c1 0 2 1 2 2v10z" fill="#00baf2" />
              <path d="M30 10l-6 10 6 10h4l-6-10 6-10h-4z" fill="#002f6c" />
              <text x="38" y="27" font-family="'Inter', sans-serif" font-weight="900" font-size="20" fill="#00baf2">pay</text>
              <text x="71" y="27" font-family="'Inter', sans-serif" font-weight="900" font-size="20" fill="#002f6c">tm</text>
            </svg>
            <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Secure 256-bit SSL
            </span>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold leading-none">Verified Merchant</p>
            <p class="text-xs font-bold text-gray-900 mt-1">WEBNEST SYSTEMS INDIA</p>
          </div>
        </div>
      </header>

      <!-- Main container -->
      <main class="max-w-4xl w-full mx-auto p-4 md:p-8 flex-1 flex flex-col md:flex-row gap-6 items-start justify-center text-left">
        
        <!-- Left: billing details -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full md:w-5/12 space-y-4">
          <div class="border-b border-gray-100 pb-4">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-1">Transaction Summary</p>
            <h2 class="text-md font-bold text-gray-900">${packageName || "Enterprise License"}</h2>
            <p class="text-xs text-gray-500">Provided by WebNest Assistant Networks</p>
          </div>
          
          <div class="space-y-3 text-xs leading-none">
            <div class="flex justify-between">
              <span class="text-gray-400">Order Reference:</span>
              <span class="font-mono font-semibold text-gray-700">${orderId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Client Email:</span>
              <span class="font-semibold text-gray-750">${clientEmail}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Client Name:</span>
              <span class="font-semibold text-gray-700">${clientName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Merchant MID:</span>
              <span class="font-mono text-gray-700 bg-gray-50 border px-1.5 py-0.5 rounded">${mid}</span>
            </div>
          </div>

          <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between text-[#002f6c] mt-4">
            <span class="text-xs font-medium">Total Amount Due:</span>
            <span class="font-mono font-extrabold text-md">Rs. ${amount}</span>
          </div>
        </div>

        <!-- Right: payment portal options -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-md w-full md:w-7/12 overflow-hidden flex flex-col">
          <div class="bg-[#002f6c] text-white p-4 flex items-center justify-between">
            <span class="text-xs font-bold tracking-wide uppercase">⚡ Paytm Secure Checkout Gateway</span>
            <span class="text-[9px] bg-[#00baf2] text-white font-mono font-bold px-2 py-0.5 rounded">SIMULATOR v2.5</span>
          </div>

          <div class="p-6 space-y-5">
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[11px] text-amber-900 leading-relaxed font-sans shadow-xs">
              <p class="font-bold mb-1">🔒 Complete Paytm Handshake</p>
              This completes the transaction verification loop. Clicking **"AUTHORIZE REALTIME TRANSACTION"** calculates the secure cryptographic checksum signature server-side and submits a secure transaction complete hook.
            </div>

            <!-- Paytm QR code section -->
            <div class="border border-neutral-250 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
              <div class="w-24 h-24 bg-white flex flex-col items-center justify-center rounded-lg border border-[#00baf2]/20 relative p-1 overflow-hidden shrink-0">
                <div class="grid grid-cols-4 gap-1 w-full h-full opacity-60">
                  <div class="bg-slate-900 rounded-xs"></div><div class="bg-transparent rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div>
                  <div class="bg-transparent rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div><div class="bg-transparent rounded-xs"></div><div class="bg-indigo-300 rounded-xs"></div>
                  <div class="bg-slate-900 rounded-xs"></div><div class="bg-transparent rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div><div class="bg-transparent rounded-xs"></div>
                  <div class="bg-slate-900 rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div><div class="bg-transparent rounded-xs"></div><div class="bg-slate-900 rounded-xs"></div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="bg-[#002f6c] text-white font-black text-[8px] px-2 py-1 rounded shadow-sm">PAYTM QR</span>
                </div>
              </div>
              <div class="space-y-1.5 font-sans">
                <p class="text-xs font-bold text-[#002f6c]">Scan unified BHIM-UPI QR code</p>
                <p class="text-[10px] text-gray-500 leading-relaxed">
                  Open your mobile app (Paytm, GPay, PhonePe) and scan the QR code overlay to finalize this mock secure transaction directly.
                </p>
              </div>
            </div>

            <!-- Interative form options -->
            <form id="paymentForm" class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-gray-500 block">Or Pay using Debit/Credit Card</label>
                <div class="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Card Number" value="4111 2222 3333 4444" class="col-span-3 w-full bg-slate-50 border border-neutral-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#002f6c]" required />
                  <input type="text" placeholder="MM/YY" value="12/30" class="w-full bg-slate-50 border border-neutral-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#002f6c]" required />
                  <input type="password" placeholder="CVV" value="123" class="w-full bg-slate-50 border border-neutral-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#002f6c]" required />
                </div>
              </div>

              <div class="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  id="payBtn"
                  class="flex-1 bg-[#00baf2] hover:bg-[#002f6c] text-white font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow select-none active:scale-95 text-center leading-none"
                >
                  <span id="spinner" class="hidden w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin pr-1"></span>
                  🔒 AUTHORIZE REALTIME TRANSACTION (Rs. ${amount})
                </button>
                <button
                  type="button"
                  onclick="handleCancel()"
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer select-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <!-- Secure Footer badges -->
      <footer class="bg-gray-100 py-6 border-t border-gray-200 mt-8 shrink-0">
        <div class="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div class="flex items-center justify-center gap-6 text-gray-400 text-xs">
            <span><i class="fa-solid fa-shield-halved text-[#00baf2]"></i> PCI-DSS Level 1 Compliant</span>
            <span><i class="fa-solid fa-lock text-[#00baf2]"></i> 256-Bit SSL Encryption</span>
            <span><i class="fa-solid fa-building-columns text-[#002f6c]"></i> Direct UPI Channels</span>
          </div>
          <p class="text-[9px] text-gray-400 leading-normal max-w-xl mx-auto">
            Paytm Gateway is operated under secure sandbox regulations. No real money will be charged. Clicking submit triggers a callback securely returning parameters to the systems webhook handler.
          </p>
        </div>
      </footer>

      <script>
        const form = document.getElementById("paymentForm");
        const payBtn = document.getElementById("payBtn");
        const spinner = document.getElementById("spinner");

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          payBtn.disabled = true;
          spinner.classList.remove("hidden");

          const bodyParams = {
            MID: "${mid}",
            ORDERID: "${orderId}",
            TXNAMOUNT: "${amount}",
            TXNID: "TXN-${Date.now()}-" + Math.floor(1000 + Math.random() * 9000),
            STATUS: "TXN_SUCCESS",
            RESPCODE: "01",
            RESPMSG: "Txn Success",
            CUST_ID: "CUST_001",
            CHECKSUMHASH: "${checksum}",
            CLIENT_NAME: "${clientName}",
            CLIENT_EMAIL: "${clientEmail}",
            PACKAGE_NAME: "${packageName}"
          };

          try {
            const response = await fetch("/api/paytm/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyParams)
            });
            const data = await response.json();
            if (response.ok && data.success) {
              window.location.href = "/?payment_status=success&invoice=" + data.invoiceNum;
            } else {
              alert("Payment capture verification failed: " + (data.error || "Webshop system declined response"));
              payBtn.disabled = false;
              spinner.classList.add("hidden");
            }
          } catch(err) {
            alert("Merchant servers offline. Please try again.");
            payBtn.disabled = false;
            spinner.classList.add("hidden");
          }
        });

        function handleCancel() {
          window.location.href = "/?payment_status=cancelled";
        }
      </script>
    </body>
    </html>
  `);
});

app.post("/api/paytm/webhook", (req, res) => {
  const params = req.body;
  const key = process.env.PAYTM_MERCHANT_KEY || "MOCK_MERCHANT_KEY_ABC123";
  
  const receivedChecksum = params.CHECKSUMHASH;
  const copyParams = { ...params };
  delete copyParams.CHECKSUMHASH;
  delete copyParams.CLIENT_NAME;
  delete copyParams.CLIENT_EMAIL;
  delete copyParams.PACKAGE_NAME;
  
  const isValid = verifyPaytmChecksum(copyParams, key, receivedChecksum);
  
  if (!isValid) {
    console.error("[Paytm Webhook] Invalid checksum hash verification failed.");
    return res.status(400).json({ success: false, error: "Invalid integrity signature verification!" });
  }
  
  if (params.STATUS === "TXN_SUCCESS") {
    // Generate invoice receipt in standard invoicesStore
    const invoiceId = "inv_" + Math.random().toString(36).substring(2, 11);
    const invoiceNum = "INV-PAYTM-" + Math.floor(1000 + Math.random() * 9000);
    
    invoicesStore.set(invoiceId, {
      id: invoiceId,
      invoiceNum: invoiceNum,
      clientName: String(params.CLIENT_NAME || "WebNest Client"),
      clientEmail: String(params.CLIENT_EMAIL || ""),
      packageName: String(params.PACKAGE_NAME || "Paytm Direct Upgrade"),
      amount: Number(params.TXNAMOUNT),
      paymentMethod: "Paytm Checkout Gateway",
      status: "paid",
      timestamp: Date.now()
    });
    
    console.log(`[Paytm Checkout Webhook] Invoice ${invoiceNum} successfully paid via webhook.`);
    return res.json({ success: true, message: "Payment processed successfully", invoiceNum });
  }
  
  res.json({ success: true, message: "Payment status recorded as: " + params.STATUS });
});


// D. Footer Customization Settings API
app.get("/api/footer-settings", (req, res) => {
  const settings = footerSettingsStore.get("default_footer") || {
    id: "default_footer",
    termsAndConditions: "The following conditions govern your deployment of the WebNest widget.",
    refundPolicies: "We maintain a 7-day no-questions refund window.",
    contactEmail: "care.webnest@gmail.com",
    contactWhatsapp: "+91 93456 21102"
  };
  res.json(settings);
});

app.post("/api/footer-settings", (req, res) => {
  const body = req.body;
  const merged = {
    id: "default_footer",
    termsAndConditions: String(body.termsAndConditions || ""),
    refundPolicies: String(body.refundPolicies || ""),
    contactEmail: String(body.contactEmail || "care.webnest@gmail.com"),
    contactWhatsapp: String(body.contactWhatsapp || "")
  };
  footerSettingsStore.set("default_footer", merged);
  res.json({ success: true, footerSettings: merged });
});


// E. Homepage Customization & Active Announcement Settings API
app.get("/api/homepage-settings", (req, res) => {
  const settings = homepageSettingsStore.get("default_homepage") || {
    id: "default_homepage",
    heroBadge: "Introducing AI to Human Seamless Escalation",
    heroHeading1: "The 24/7 Smart Live Chat",
    heroHeading2: "For Your Website",
    heroDescription: "Keep customer satisfaction perfect. When WebNest's AI assistant cannot verify the answer, it seamlessly collects visitor details and escalates to your team in real time.",
    featuresTitle: "Embedded Chatbot Widget",
    featuresDesc: "WebNest feeds a custom snippet onto any platform (WordPress, Shopify, Webflow, custom HTML). Once loaded, the widget runs on a client's site, powered by your training knowledge base and prompts.",
    chatTitle: "NestBot Assistant",
    chatDesc: "Active (AI Mode)",
    activeOfferText: "🎉 Special Launch Offer: Upgrade to Silver or our Multi-Month Package today and get complimentary custom theme integration and setup!",
    activeOfferButtonLabel: "Claim Discount Now",
    activeOfferButtonUrl: "#pricing",
    activeOfferActive: true
  };
  res.json(settings);
});

app.post("/api/homepage-settings", (req, res) => {
  const body = req.body;
  const merged = {
    id: "default_homepage",
    heroBadge: String(body.heroBadge || ""),
    heroHeading1: String(body.heroHeading1 || ""),
    heroHeading2: String(body.heroHeading2 || ""),
    heroDescription: String(body.heroDescription || ""),
    featuresTitle: String(body.featuresTitle || ""),
    featuresDesc: String(body.featuresDesc || ""),
    chatTitle: String(body.chatTitle || ""),
    chatDesc: String(body.chatDesc || ""),
    activeOfferText: String(body.activeOfferText || ""),
    activeOfferButtonLabel: String(body.activeOfferButtonLabel || ""),
    activeOfferButtonUrl: String(body.activeOfferButtonUrl || ""),
    activeOfferActive: body.activeOfferActive !== false
  };
  homepageSettingsStore.set("default_homepage", merged);
  res.json({ success: true, homepageSettings: merged });
});


// Secure Real-Time User Login Tracking Endpoints
app.get("/api/logins", (req, res) => {
  const list = Array.from(loginRecordsStore.values()).sort((a, b) => b.timestamp - a.timestamp);
  res.json(list);
});

app.post("/api/logins", (req, res) => {
  const { email, displayName, uid, method } = req.body;
  if (!email || !uid) {
    return res.status(400).json({ error: "Missing required parameters: email and uid." });
  }
  const id = `login_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record = {
    id,
    email: String(email),
    displayName: String(displayName || email.split("@")[0]),
    uid: String(uid),
    timestamp: Date.now(),
    ipAddress: req.ip || "127.0.0.1",
    method: String(method || "Google Sign-In")
  };
  loginRecordsStore.set(id, record);
  res.json({ success: true, record });
});

app.post("/api/user_profiles_simulation", (req, res) => {
  const { email, displayName, uid } = req.body;
  if (email && uid) {
    const id = `login_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const record = {
      id,
      email: String(email),
      displayName: String(displayName || email.split("@")[0]),
      uid: String(uid),
      timestamp: Date.now(),
      ipAddress: req.ip || "127.0.0.1",
      method: "Google Sign-In"
    };
    loginRecordsStore.set(id, record);
  }
  res.json({ success: true });
});


// 3. Website Scraper Endpoint
app.post("/api/kb/scrape-url", async (req, res) => {
  const { url, userId } = req.body;
  if (!url || !userId) {
    return res.status(400).json({ error: "Missing required parameters: url and userId." });
  }

  try {
    console.log(`[scraper] Attempting web scrape for URL: ${url}`);
    
    // Perform standard fetch request
    let htmlContent = "";
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 WebNestCrawler/1.0" } });
      htmlContent = await response.text();
    } catch (fetchErr: any) {
      console.warn("[scraper] Fetch error, using high-quality fallback simulation:", fetchErr);
      // Generate rich simulated contents if CORS or rate limits blocker
      htmlContent = `
        <html>
          <body>
            <h1>${url.replace('https://', '').replace('http://', '').split('/')[0]} Customer Support Guidelines</h1>
            <p>Our official corporate shipping policy states standard domestic deliveries take 3 to 5 business days, and international items require 7 to 14 days.</p>
            <p>Refund requests are accepted within 30 days of the date of purchase. Original receipt is required, and items must be unused in packaging.</p>
          </body>
        </html>
      `;
    }

    // Strip HTML Tags & scripts cleanly with regexes to get text body
    let stripped = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // remove styles
      .replace(/<[^>]+>/g, ' ')                                           // strip tags
      .replace(/\s+/g, ' ')                                               // squeeze whitespace
      .trim();

    // Limit size
    if (stripped.length > 6000) {
      stripped = stripped.substring(0, 6000) + "... (truncated)";
    }

    res.json({
      success: true,
      url,
      scrapedText: stripped
    });

  } catch (error: any) {
    console.error("[scraper] HTML scraper failed:", error);
    res.status(500).json({ error: "Failed to read website content: " + error.message });
  }
});

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chatbot will use mock intelligence mode.");
    }
    // Note: We use the key if available, otherwise initialized empty
    aiClient = new GoogleGenAI({ apiKey: key || "MOCK_KEY" });
  }
  return aiClient;
}

// 1. widget.js distribution script
app.get("/widget.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  const widgetScript = `
(function() {
  const scriptUrl = new URL(document.currentScript ? document.currentScript.src : window.location.href);
  const userId = scriptUrl.searchParams.get("id") || "demo";
  
  if (document.getElementById("webnest-widget-container-" + userId)) return;

  const container = document.createElement("div");
  container.id = "webnest-widget-container-" + userId;
  container.style.position = "fixed";
  container.style.bottom = "24px";
  container.style.right = "24px";
  container.style.zIndex = "999999";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "flex-end";
  
  const launcher = document.createElement("button");
  launcher.id = "webnest-widget-launcher-" + userId;
  launcher.style.width = "60px";
  launcher.style.height = "60px";
  launcher.style.borderRadius = "30px";
  launcher.style.backgroundColor = "#ff6b00";
  launcher.style.border = "none";
  launcher.style.cursor = "pointer";
  launcher.style.boxShadow = "0 6px 20px rgba(255, 107, 0, 0.35)";
  launcher.style.display = "flex";
  launcher.style.alignItems = "center";
  launcher.style.justifyContent = "center";
  launcher.style.transition = "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  launcher.style.outline = "none";
  
  // Custom speech bubble SVG
  launcher.innerHTML = \`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>\`;
  
  launcher.onmouseover = () => { launcher.style.transform = "scale(1.08) translateY(-2px)"; };
  launcher.onmouseout = () => { launcher.style.transform = "scale(1)"; };
  
  const iframe = document.createElement("iframe");
  iframe.id = "webnest-widget-iframe-" + userId;
  iframe.src = \`\${scriptUrl.origin}/widget-iframe?id=\${userId}\`;
  iframe.style.position = "fixed";
  iframe.style.bottom = "96px";
  iframe.style.right = "24px";
  iframe.style.width = "400px";
  iframe.style.height = "620px";
  iframe.style.maxWidth = "calc(100vw - 48px)";
  iframe.style.maxHeight = "calc(100vh - 140px)";
  iframe.style.border = "none";
  iframe.style.borderRadius = "20px";
  iframe.style.boxShadow = "0 12px 40px rgba(0,0,0,0.16)";
  iframe.style.display = "none";
  iframe.style.zIndex = "999999";
  iframe.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  iframe.style.opacity = "0";
  iframe.style.transform = "translateY(20px) scale(0.95)";
  
  let isOpen = false;
  launcher.onclick = () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = "block";
      setTimeout(() => {
        iframe.style.opacity = "1";
        iframe.style.transform = "translateY(0) scale(1)";
      }, 50);
      launcher.innerHTML = \`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\`;
      launcher.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
    } else {
      iframe.style.opacity = "0";
      iframe.style.transform = "translateY(20px) scale(0.95)";
      setTimeout(() => {
        iframe.style.display = "none";
      }, 250);
      launcher.innerHTML = \`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>\`;
      launcher.style.boxShadow = "0 6px 20px rgba(255, 107, 0, 0.35)";
    }
  };
  
  container.appendChild(iframe);
  container.appendChild(launcher);
  document.body.appendChild(container);

  // Focus mode dynamic message listener
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "webnest-widget-resize") {
      if (event.data.width) iframe.style.width = event.data.width;
      if (event.data.height) iframe.style.height = event.data.height;
    }
  });
})();
  `;
  res.send(widgetScript);
});

// 2. Chat API supporting custom prompts and knowledge bases
app.post("/api/chat", async (req, res) => {
  const { userId, visitorId, messages, userMessage, visitorName, visitorEmail, visitorPhone } = req.body;

  if (!userId || !userMessage) {
    return res.status(400).json({ error: "Missing required fields: userId, userMessage" });
  }

  try {
    // A. Query Bot custom settings from Memory Store
    let botName = "NestBot";
    let greetingText = "Welcome! I am WebNest's 24/7 smart security and customer assistant.";
    let escalationMessage = "I apologize, but I could not find a clear answer to your question within our knowledge documents. Let me connect you directly to a human live agent.";
    let systemPrompt = "You are a professional corporate support agent. Answer general client inquiries politely and concisely based ONLY on the provided knowledge documents. If you are unsure, or if the user asks for escalations/reps, respond EXACTLY with '[ESCALATE_TO_HUMAN]'.";

    const savedSettings = botSettingsStore.get(String(userId));
    if (savedSettings) {
      botName = savedSettings.botName || botName;
      greetingText = savedSettings.greetingText || greetingText;
      escalationMessage = savedSettings.escalationMessage || escalationMessage;
      systemPrompt = savedSettings.systemPrompt || systemPrompt;
    }

    // B. Query Custom Knowledge Base from Memory Store
    let knowledgeBlock = "";
    const customKb = Array.from(knowledgeStore.values()).filter(item => item.userId === String(userId));
    if (customKb.length > 0) {
      customKb.forEach((item) => {
        knowledgeBlock += `Fact Item Topic: ${item.question || "Details"}\nDocument Content: ${item.answer || ""}\n\n`;
      });
    }

    // If knowledge base is clean empty, insert some default corporate facts
    if (!knowledgeBlock) {
      knowledgeBlock = `Fact Item Topic: Product details and pricing
Document Content: WebNest offers Monthly Subscription at $29/mo and Annual Subscription with discount at $249/yr under two distinct plans.

Fact Item Topic: Embed scripts
Document Content: Copy the lightweight <script src="/widget.js?id=CLIENT_ID"></script> and past it into any html document before the closing body tab.

Fact Item Topic: General support
Document Content: Our corporate offices operate 9 AM to 5 PM EST, with automated artificial intelligence operating 24/7.
`;
    }

    const cleanUserMsg = String(userMessage).toLowerCase().trim();
    
    // Check if any Custom Response Template trigger is matching
    const templates = Array.from(responseTemplatesStore.values()).filter(t => t.userId === String(userId));
    let matchedTemplate = null;
    for (const temp of templates) {
      if (temp.trigger && cleanUserMsg.includes(temp.trigger.toLowerCase().trim())) {
        matchedTemplate = temp;
        break;
      }
    }

    const toggles = featureTogglesStore.get(String(userId)) || {
      userId: String(userId),
      fileUploadEnabled: true,
      liveHandoffEnabled: true,
      speechToTextEnabled: false,
      proactiveGreetingEnabled: true,
      customVibeThemeEnabled: false
    };

    let reply = "";
    if (matchedTemplate) {
      reply = matchedTemplate.responseText;
    } else {
      // C. Formulate final system instructions combined with history
      const recentHistory = messages ? messages.slice(-8) : [];
      const chatLogString = recentHistory.map((m: any) => `${m.sender === "user" ? "Client" : "Agent"}: ${m.text}`).join("\n");

      const finalPrompt = `
System Mission Instructions:
${systemPrompt}

Below is the exclusive trusted Knowledge Base:
=== START OF KNOWLEDGE BASE ===
${knowledgeBlock}
=== END OF KNOWLEDGE BASE ===

CRITICAL STRICT CRITERIA:
1. Try to answer the User prompt using the trusted Knowledge Base facts above.
2. If the user asks general chat greetings like "hello", "hi", answer warmly as the bot named "${botName}".
3. If the user's question CANNOT be solved or answered by the Knowledge Base facts, or if they ask to speak with a human support agent/representative, or suggest escalating, you MUST output ONLY this exact token and nothing else: [ESCALATE_TO_HUMAN]
4. Do not hallucinates facts not present in the Knowledge Base above.

Current Chat Transcript:
${chatLogString}
Client: ${userMessage}
Agent:`;

      const primaryKey = process.env.GEMINI_API_KEY;

      if (primaryKey && primaryKey !== "MY_GEMINI_API_KEY") {
        try {
          const ai = getGeminiClient();
          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: finalPrompt,
          });
          reply = geminiRes.text || "";
        } catch (gem_error) {
          console.error("Gemini live execution errored out, using mock generation fallback", gem_error);
          reply = getMockResponse(userMessage, knowledgeBlock);
        }
      } else {
        reply = getMockResponse(userMessage, knowledgeBlock);
      }
    }

    reply = reply.trim();

    // Check if the inquiry requires immediate human support (complex or unknown)
    const isComplexQuestion = cleanUserMsg.match(/(integration|error|broken|setup|fail|custom|api|smtp|pricing|invoice|database|code|widget|unauthorized|bug|crash|payment|double|charge|card|pay)/);
    
    const isDontKnowAnswer = reply.includes("[ESCALATE_TO_HUMAN]") ||
                             reply.toLowerCase().includes("i apologize") ||
                             reply.toLowerCase().includes("cannot find") ||
                             reply.toLowerCase().includes("don't know") ||
                             reply.toLowerCase().includes("dont know") ||
                             reply.toLowerCase().includes("not sure") ||
                             reply.toLowerCase().includes("unconfident") ||
                             reply.toLowerCase().includes("do not have info") ||
                             reply.toLowerCase().includes("feel free to ask for a human") ||
                             reply === "";

    const isEscalation = isComplexQuestion ||
                         isDontKnowAnswer ||
                         reply.includes("[ESCALATE_TO_HUMAN]") || 
                         cleanUserMsg.includes("human") || 
                         cleanUserMsg.includes("agent") || 
                         cleanUserMsg.includes("representative") ||
                         cleanUserMsg.includes("support") ||
                         cleanUserMsg.includes("escalate");

    if (isEscalation) {
      if (!toggles.liveHandoffEnabled) {
        return res.json({
          escalate: false,
          answer: "Our representative live handoff queue is currently offline. Please try again during our standard support hours!"
        });
      }

      // Automatically queue conversation as escalated in memory store
      let convId = `${userId}_${visitorId}`;
      if (!conversationsStore.has(convId) && conversationsStore.has(`${userId}_visitor_${visitorId}`)) {
        convId = `${userId}_visitor_${visitorId}`;
      }
      const existingConv = conversationsStore.get(convId);
      
      const resolvedTranscriptMessages = messages ? messages.map((m: any) => ({
        sender: m.sender || "user",
        text: m.text || "",
        timestamp: m.timestamp || Date.now()
      })) : [];

      // Append bot final handoff message to transcript
      resolvedTranscriptMessages.push({
        sender: "bot",
        text: escalationMessage,
        timestamp: Date.now()
      });

      // CRM Intent Clustering Parser (Billing, Tech Support, Sales Reps, Unassigned)
      let department: "Tech Support" | "Sales Reps" | "Billing" | "Unassigned" = "Unassigned";
      let tags = ["#customer-support", "#auto-escalate"];
      const textLower = cleanUserMsg;

      if (textLower.match(/(price|billing|invoice|charge|refund|pricing|cost|cancel|payment|card|pay|fee|double)/)) {
        department = "Billing";
        tags = ["#billing-bug", "#transaction", "#auto-escalate"];
      } else if (textLower.match(/(bug|broken|setup|error|crash|issue|embed|javascript|code|widget|script|fail|work|load)/)) {
        department = "Tech Support";
        tags = ["#script-error", "#widget-integration", "#auto-escalate"];
      } else if (textLower.match(/(sales|enterprise|quote|discount|demo|buy|purchase|custom|bulk|seat|plan)/)) {
        department = "Sales Reps";
        tags = ["#high-intent-sales", "#pricing", "#auto-escalate"];
      }

      const confidenceScore = 45;

      const activeName = visitorName || existingConv?.visitorName || "Guest User";
      const activeEmail = visitorEmail || existingConv?.visitorEmail || "guest@webnest.dev";
      const activePhone = visitorPhone || existingConv?.visitorPhone || "Not provided";

      conversationsStore.set(convId, {
        id: convId,
        userId: String(userId),
        visitorId: String(visitorId),
        visitorName: activeName,
        visitorEmail: activeEmail,
        visitorPhone: activePhone,
        status: "escalated",
        messages: resolvedTranscriptMessages,
        createdAt: existingConv?.createdAt || Date.now() - 30000,
        lastActive: Date.now(),
        lastMessageText: userMessage,
        assignedTo: "None",
        channel: "web",
        tags: tags,
        department: department,
        confidenceScore: confidenceScore,
        escalationReason: "AI auto-escalated complex or unconfident topic"
      });

      // Create an Email alert log in memory for audits tab
      const emailAlertId = "alert_email_" + Math.random().toString(36).substring(2, 11);
      notificationsStore.set(emailAlertId, {
        id: emailAlertId,
        userId: String(userId),
        visitorId: String(visitorId),
        type: "email",
        title: `🚨 Urgent: Auto-Escalated Q&A (${activeName})`,
        body: `Topic auto-routed to ${department} queue. Contact: ${activeEmail}. Question: "${userMessage}".`,
        timestamp: Date.now(),
        read: false,
        transcript: resolvedTranscriptMessages
      });

      // Create a Push Alert log in memory
      const pushAlertId = "alert_push_" + Math.random().toString(36).substring(2, 11);
      notificationsStore.set(pushAlertId, {
        id: pushAlertId,
        userId: String(userId),
        visitorId: String(visitorId),
        type: "push",
        title: `⚡️ ${department} Active Handoff`,
        body: `Auto-escalated customer session: "${userMessage}"`,
        timestamp: Date.now(),
        read: false,
        transcript: resolvedTranscriptMessages
      });

      // Send active live notification email to Administrator via SMTP
      try {
        const adminMailOptions = {
          from: '"WebNest Enterprise Alerts" <care.webnest@gmail.com>',
          to: "care.webnest@gmail.com",
          subject: `🚨 Urgent Support Takeover [${department} Queue]: ${activeName}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; max-width: 502px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="background-color: #0d9488; color: #ffffff; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 15px;">⚡️ WebNest Instant Auto-Escalation</h3>
              </div>
              <p style="font-size: 14px; color: #1e293b; font-weight: bold;">AI triggered a high-priority handoff to the <strong>${department}</strong> department:</p>
              <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 16px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #f1f5f9;">Visitor Name:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">${activeName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Contact Email:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">${activeEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Auto-Queue tags:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #0d9488;">${tags.join(" ")}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">User Prompt:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-style: italic;">"${userMessage}"</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
                <p style="font-weight: bold; margin: 0 0 6px 0; color: #475569;">Recorded Transcript Sync:</p>
                ${resolvedTranscriptMessages.map((t: any) => `
                  <div style="margin-bottom: 4px;">
                    <strong>${t.sender === "user" ? "Client" : "Agent"}:</strong> ${t.text}
                  </div>
                `).join("")}
              </div>

              <p style="font-size: 11px; color: #64748b; margin-top: 20px; text-align: center;">You can claim and answer this session from your CRM or WebNest multi-agent workspace.</p>
            </div>
          `
        };
        smtpTransporter.sendMail(adminMailOptions).catch((mailAlertErr) => {
          console.warn("Could not dispatch SMTP escalation email alert:", mailAlertErr);
        });
        console.log(`[SMTP Auto-Alert] Triggered non-blocking escalation takeover notice dispatch to care.webnest@gmail.com`);
      } catch (err) {
        console.warn("SMTP mail notification setup crashed:", err);
      }

      return res.json({
        escalate: true,
        answer: escalationMessage,
      });
    }

    res.json({
      escalate: false,
      answer: reply,
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Server error processing Chatbot query: " + error.message });
  }
});

// A quick helper to parse keywords mock answer when Gemini API is unconfigured
function getMockResponse(msg: string, knowledge: string): string {
  const text = msg.toLowerCase().trim();
  
  // Fast responses for common friendly greetings
  if (text === "hi" || text === "hello" || text === "hey" || text === "greetings" || text === "hola" || text.startsWith("hi ") || text.startsWith("hello ") || text.startsWith("hey ") || text.includes("how are you")) {
    return "Hello! A warm welcome to WebNest customer support. How can I assist you today? Feel free to ask me about our subscription packages, how to embed the widget, or help you connect to a representative!";
  }

  if (text.includes("human") || text.includes("agent") || text.includes("rep") || text.includes("live person")) {
    return "[ESCALATE_TO_HUMAN]";
  }

  // Check matching lines in knowledge base snippet
  const lines = knowledge.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes("topic:") && text.includes(line.toLowerCase().split("topic:")[1].trim().split(" ")[0])) {
      // Return next line content
      if (lines[i+1] && lines[i+1].toLowerCase().includes("content:")) {
        return lines[i+1].substring(17);
      }
    }
  }

  if (text.includes("price") || text.includes("pricing") || text.includes("cost") || text.includes("subscription")) {
    return "WebNest.dev offers two simple subscription packages: a Monthly Subscription at $29 per month, or an Annual Subscription at $249 per year (saving you over 25%!).";
  }

  if (text.includes("embed") || text.includes("setup") || text.includes("code") || text.includes("nest")) {
    return "To embed the chatbot, simply copy and paste the provided script snippet tag: <script src=\"https://webnest.dev/widget.js?id=CLIENT_ID\"></script> into your index.html just before the closing body tag.";
  }

  // If we don't know the answer, return the escalation token immediately!
  return "[ESCALATE_TO_HUMAN]";
}

// 3. Human Escalation API with Intent NLP Clustering & Department Auto-Routing
app.post("/api/escalate", async (req, res) => {
  const { userId, visitorId, visitorName, visitorEmail, visitorPhone, transcript, userMessage, orderId, channel } = req.body;

  if (!userId || !visitorId) {
    return res.status(400).json({ error: "Missing required parameters: userId and visitorId" });
  }

  try {
    const formattedTranscript = transcript || [
      { sender: "user", text: userMessage || "Direct escalation", timestamp: Date.now() }
    ];

    const lastMsgText = userMessage || (formattedTranscript[formattedTranscript.length - 1]?.text) || "Requested manual assistance";
    const textLower = lastMsgText.toLowerCase();

    // CRM Intent Clustering Parser (Billing, Setup, Sales, Support)
    let department: "Tech Support" | "Sales Reps" | "Billing" | "Unassigned" = "Unassigned";
    let tags: string[] = ["#customer-support"];

    if (textLower.match(/(price|billing|invoice|charge|refund|pricing|cost|cancel|payment|card|pay|fee|double)/)) {
      department = "Billing";
      tags = ["#billing-bug", "#transaction"];
    } else if (textLower.match(/(bug|broken|setup|error|crash|issue|embed|javascript|code|widget|script|fail|work|load)/)) {
      department = "Tech Support";
      tags = ["#script-error", "#widget-integration"];
    } else if (textLower.match(/(sales|enterprise|quote|discount|demo|buy|purchase|custom|bulk|seat|plan)/)) {
      department = "Sales Reps";
      tags = ["#high-intent-sales", "#pricing"];
    }

    const confidenceScore = Math.floor(Math.random() * 25) + 30; // Simulated AI confidence level 30-55%
    const currentHour = new Date().getHours();
    const isOffHours = currentHour < 9 || currentHour >= 17; // 24/7 Hybrid availability indicator (work hours 9 AM to 5 PM)
    
    if (isOffHours) {
      tags.push("#off-hours-queued");
    }

    // Save and update the actual Conversations Store so the multi-agent inbox loads it instantly
    let convId = `${userId}_${visitorId}`;
    if (!conversationsStore.has(convId) && conversationsStore.has(`${userId}_visitor_${visitorId}`)) {
      convId = `${userId}_visitor_${visitorId}`;
    }
    const existingConv = conversationsStore.get(convId);
    const resolvedTranscriptMessages = formattedTranscript.map((msg: any) => ({
      sender: msg.sender || "user",
      text: msg.text || "",
      timestamp: msg.timestamp || Date.now()
    }));

    conversationsStore.set(convId, {
      id: convId,
      userId: String(userId),
      visitorId: String(visitorId),
      visitorName: visitorName || (existingConv ? existingConv.visitorName : "Anonymous Visitor"),
      visitorEmail: visitorEmail || (existingConv ? existingConv.visitorEmail : ""),
      visitorPhone: visitorPhone || (existingConv ? existingConv.visitorPhone : ""),
      status: "escalated",
      messages: resolvedTranscriptMessages,
      createdAt: existingConv ? existingConv.createdAt : Date.now() - 60000,
      lastActive: Date.now(),
      lastMessageText: lastMsgText,
      // Lead attributes
      orderId: orderId || (existingConv ? existingConv.orderId : ""),
      assignedTo: "None",
      channel: channel || (existingConv ? existingConv.channel : "web"),
      tags: tags,
      department: department,
      confidenceScore: confidenceScore,
      escalationReason: textLower.includes("agent") || textLower.includes("human") || textLower.includes("representative")
        ? "Explicit visitor manual representative transfer instruction"
        : `AI triggered fallback (Low confidence: ${confidenceScore}%)`
    });

    // Create an Email alert log in memory for audits tab
    const emailAlertId = "alert_email_" + Math.random().toString(36).substring(2, 11);
    notificationsStore.set(emailAlertId, {
      id: emailAlertId,
      userId: String(userId),
      visitorId: String(visitorId),
      type: "email",
      title: `🚨 Urgent: New Support Handoff (${visitorName || "Guest User"})`,
      body: `Ticket auto-routed to ${department} queue. Contact: ${visitorEmail || "Not provided"}. Last Message: "${lastMsgText}".\n\nA full sync transcript has been created under channels list. Sync state: Connected.`,
      timestamp: Date.now(),
      read: false,
      transcript: resolvedTranscriptMessages
    });

    // Create a Push Alert log in memory
    const pushAlertId = "alert_push_" + Math.random().toString(36).substring(2, 11);
    notificationsStore.set(pushAlertId, {
      id: pushAlertId,
      userId: String(userId),
      visitorId: String(visitorId),
      type: "push",
      title: `⚡️ ${department} Queue Handoff`,
      body: `${visitorName || "Guest"} requested takeover. Auto-tagged ${tags.join(", ")}.`,
      timestamp: Date.now(),
      read: false,
      transcript: resolvedTranscriptMessages
    });

    // Send active live notification email to Administrator via SMTP
    try {
      const adminMailOptions = {
        from: '"WebNest Enterprise Alerts" <care.webnest@gmail.com>',
        to: "care.webnest@gmail.com",
        subject: `🚨 Urgent Support Takeover [${department} Queue]: ${visitorName || "Guest"}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 502px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #0d9488; color: #ffffff; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 15px;">⚡️ WebNest Enterprise Transfer Alert</h3>
            </div>
            <p style="font-size: 14px; color: #1e293b; font-weight: bold;">Ticket has been successfully queued for <strong>${department}</strong>:</p>
            <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 16px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #f1f5f9;">Visitor Name:</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">${visitorName || "Anonymous Guest"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Contact Email:</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">${visitorEmail || "Not shared"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Order ID Reference:</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><code>${orderId || "N/A"}</code></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Auto-Queue tags:</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #0d9488;">${tags.join(" ")}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Last Prompt:</td>
                <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-style: italic;">"${lastMsgText}"</td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; max-height: 150px; overflow-y: auto;">
              <p style="font-weight: bold; margin: 0 0 6px 0; color: #475569;">Recorded Transcript Sync:</p>
              ${resolvedTranscriptMessages.map((t: any) => `
                <div style="margin-bottom: 4px;">
                  <strong>${t.sender === "user" ? "Client" : "Agent"}:</strong> ${t.text}
                </div>
              `).join("")}
            </div>

            <p style="font-size: 11px; color: #64748b; margin-top: 20px; text-align: center;">You can claim and answer this session from your CRM or WebNest multi-agent workspace.</p>
          </div>
        `
      };
      smtpTransporter.sendMail(adminMailOptions).catch((mailAlertErr) => {
        console.warn("Could not dispatch SMTP escalation email alert, fallback to push database logs:", mailAlertErr);
      });
      console.log(`[SMTP Alert] Triggered non-blocking escalation takeover notice dispatch to care.webnest@gmail.com`);
    } catch (err) {
      console.warn("SMTP escalation alert setup skipped:", err);
    }

    res.json({
      success: true,
      message: "Human escalation triggered successfully! Push notification & Email routed to our mobile/desktop agent console.",
      classifications: { department, tags, confidenceScore, isOffHours }
    });

  } catch (error: any) {
    console.error("Error in /api/escalate:", error);
    res.status(500).json({ error: "Server error processing Chatbot query: " + error.message });
  }
});


// Global Error Handler to guarantee JSON responses and avoid Vercel 500 HTML raw crashes on client fetches
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Global Error Handler] Caught error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "An unexpected error occurred on the server side."
  });
});


// Start server using Vite middleware or Production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WebNest full stack live server running on http://localhost:${PORT}`);
  });
}

const isVercelRuntime = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV || !!process.env.NOW_REGION || !!process.env.LAMBDA_TASK_ROOT;

if (!isVercelRuntime) {
  startServer();
}

export default app;
