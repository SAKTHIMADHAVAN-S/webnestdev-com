export interface Message {
  sender: "user" | "bot" | "human" | "system";
  text: string;
  timestamp: number;
}

export interface ChatbotSettings {
  id: string; // matches client's user UID or 'default'
  botName: string;
  greetingText: string;
  escalationMessage: string;
  systemPrompt: string;
  bubbleColor: string;
  accentColor: string;
  widgetIcon: string;
  widgetPosition: "bottom-right" | "bottom-left";
  emailNotification: string;
}

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isCustom?: boolean;
}

export interface ConversationLog {
  id: string;
  userId: string; // client developer's UID
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  status: "bot" | "escalated" | "resolved";
  messages: Message[];
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  billingStatus: "Free" | "Active";
  billingTier: "monthly" | "annual" | "none";
  registeredAt: number;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: "email" | "push";
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  transcript?: Message[];
}

export interface QuickReply {
  id: string;
  userId: string;
  text: string;
  value: string;
  order: number;
}

export interface ResponseTemplate {
  id: string;
  userId: string;
  trigger: string;
  responseText: string;
}

export interface FeatureToggles {
  userId: string;
  fileUploadEnabled: boolean;
  liveHandoffEnabled: boolean;
  speechToTextEnabled: boolean;
  proactiveGreetingEnabled: boolean;
  customVibeThemeEnabled: boolean;
}

export interface CustomPackage {
  id: string;
  name: string;
  price: number;
  periodText: string;
  features: string[];
  isPopular?: boolean;
  days?: number;
}

export interface FeedbackReview {
  id: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface InvoiceReceipt {
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

export interface FooterSettings {
  id: string;
  termsAndConditions: string;
  refundPolicies: string;
  contactEmail: string;
  contactWhatsapp: string;
}

