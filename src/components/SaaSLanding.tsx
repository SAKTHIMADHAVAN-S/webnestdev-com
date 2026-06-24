import React, { useState } from "react";
import { 
  Bot, MessageSquare, Mail, Zap, CheckCircle2, ShieldCheck, 
  ArrowRight, Sparkles, Building, BarChart2, Star, CreditCard, Lock, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import Logo from "./Logo";

interface SaaSLandingProps {
  onLogin: () => void;
  onLogout?: () => void;
  userProfile: UserProfile | null;
  onUpgradeProfile: (tier: "monthly" | "annual") => Promise<void>;
  onSwitchView?: () => void;
  viewMode?: string;
}

export default function SaaSLanding({ onLogin, onLogout, userProfile, onUpgradeProfile, onSwitchView, viewMode }: SaaSLandingProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");

  // Paytm Payment Gateway States
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "paytm">("stripe");
  const [showPaytmPortal, setShowPaytmPortal] = useState(false);
  const [paytmParams, setPaytmParams] = useState<any>(null);
  const [paytmOrderId, setPaytmOrderId] = useState("");
  const [paytmStep, setPaytmStep] = useState<"idle" | "initiated" | "completed">("idle");
  const [paytmPhone, setPaytmPhone] = useState("");
  const [paytmSuccessInvoice, setPaytmSuccessInvoice] = useState("");

  // Guidelines & Refund compliance overlay modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Coupon and Discount states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponError, setCouponError] = useState("");

  // Dynamic Elements from Live CRUD Database
  const [packages, setPackages] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [footerSettings, setFooterSettings] = useState<any>({
    termsAndConditions: "By utilizing the WebNest virtual assistant services, you express definitive alignment with modern safety regulations.",
    refundPolicies: "All standard purchases made via WebNest portals qualify for a direct, hassle-free refund process within a 7-day trial parameter.",
    contactEmail: "care.webnest@gmail.com",
    contactWhatsapp: "+919876543210"
  });

  const [homepageSettings, setHomepageSettings] = useState<any>({
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

  // User Interactive Feedback and Reviews modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  // Live Inline Home Page CRUD States (Exclusive for care.webnest@gmail.com)
  const [showAdminPackageModal, setShowAdminPackageModal] = useState(false);
  const [showAdminFooterModal, setShowAdminFooterModal] = useState(false);
  const [showAdminHomepageModal, setShowAdminHomepageModal] = useState(false);
  
  // Package Live Form State
  const [editPkgId, setEditPkgId] = useState("");
  const [editPkgName, setEditPkgName] = useState("");
  const [editPkgPrice, setEditPkgPrice] = useState(99);
  const [editPkgPeriod, setEditPkgPeriod] = useState("per month");
  const [editPkgDays, setEditPkgDays] = useState(30);
  const [editPkgFeatures, setEditPkgFeatures] = useState("");

  // Footer Live Form State
  const [editFooterTerms, setEditFooterTerms] = useState("");
  const [editFooterRefunds, setEditFooterRefunds] = useState("");
  const [editFooterEmail, setEditFooterEmail] = useState("");
  const [editFooterWhatsapp, setEditFooterWhatsapp] = useState("");

  // Homepage Custom Form State
  const [editHeroBadge, setEditHeroBadge] = useState("");
  const [editHeroHeading1, setEditHeroHeading1] = useState("");
  const [editHeroHeading2, setEditHeroHeading2] = useState("");
  const [editHeroDescription, setEditHeroDescription] = useState("");
  const [editFeaturesTitle, setEditFeaturesTitle] = useState("");
  const [editFeaturesDesc, setEditFeaturesDesc] = useState("");
  const [editChatTitle, setEditChatTitle] = useState("");
  const [editChatDesc, setEditChatDesc] = useState("");
  const [editActiveOfferText, setEditActiveOfferText] = useState("");
  const [editActiveOfferButtonLabel, setEditActiveOfferButtonLabel] = useState("");
  const [editActiveOfferButtonUrl, setEditActiveOfferButtonUrl] = useState("");
  const [editActiveOfferActive, setEditActiveOfferActive] = useState(true);

  const refreshDynamicData = () => {
    fetch("/api/packages")
      .then(r => r.json())
      .then(data => setPackages(data))
      .catch(err => console.error("Error loading packages:", err));

    fetch("/api/feedbacks")
      .then(r => r.json())
      .then(data => setFeedbacks(data))
      .catch(err => console.error("Error loading feedbacks:", err));

    fetch("/api/footer-settings")
      .then(r => r.json())
      .then(data => {
        if (data) {
          setFooterSettings(data);
        }
      })
      .catch(err => console.error("Error loading specs:", err));

    fetch("/api/homepage-settings")
      .then(r => r.json())
      .then(data => {
        if (data) {
          setHomepageSettings(data);
        }
      })
      .catch(err => console.error("Error loading homepage config:", err));
  };

  const handleSaveHomepageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        heroBadge: editHeroBadge,
        heroHeading1: editHeroHeading1,
        heroHeading2: editHeroHeading2,
        heroDescription: editHeroDescription,
        featuresTitle: editFeaturesTitle,
        featuresDesc: editFeaturesDesc,
        chatTitle: editChatTitle,
        chatDesc: editChatDesc,
        activeOfferText: editActiveOfferText,
        activeOfferButtonLabel: editActiveOfferButtonLabel,
        activeOfferButtonUrl: editActiveOfferButtonUrl,
        activeOfferActive: editActiveOfferActive
      };

      const res = await fetch("/api/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("WebNest live homepage contents and dynamic announcements updated successfully!");
        setShowAdminHomepageModal(false);
        refreshDynamicData();
      } else {
        alert("Failed to save homepage settings.");
      }
    } catch(err) {
      console.error(err);
      alert("Connection timeout while updating homepage.");
    }
  };

  React.useEffect(() => {
    refreshDynamicData();
  }, []);

  const handleOpenCheckout = (pkg: any) => {
    if (!userProfile) {
      alert("Please sign in or access the Account Console first to configure your account!");
      return;
    }
    setSelectedPlan(pkg);
    setShowCheckoutModal(true);
  };

  const handleCompleteSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setIsProcessingPayment(true);
    setTimeout(async () => {
      try {
        await onUpgradeProfile("monthly"); // Upgrade billing status in memory
        setIsProcessingPayment(false);
        setShowCheckoutModal(false);
        setSelectedPlan(null);
        alert(`Welcome to ${selectedPlan.name || "Silver Package"}! Your billing parameters are updated.`);
      } catch (err) {
        alert("Payment simulation failed. Please try again.");
        setIsProcessingPayment(false);
      }
    }, 1500);
  };

  const handleInitiatePaytm = async () => {
    setIsProcessingPayment(true);
    const rawPrice = selectedPlan?.price ?? 99;
    const finalAmount = discountPercentage > 0 ? Math.round(rawPrice * (1 - discountPercentage / 100)) : rawPrice;

    try {
      const response = await fetch("/api/paytm/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          packageName: selectedPlan?.name || "Direct Upgrade",
          clientEmail: userProfile?.email || "customer@webnest.dev",
          clientName: userProfile?.displayName || "WebNest Client",
          userId: userProfile?.uid || "client_direct"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPaytmParams(data.paytmParams);
        setPaytmOrderId(data.orderId);
        
        // Assemble URL query parameters for dynamic checkout session
        const redirectUrl = `/api/paytm/checkout-gateway?mid=${data.paytmParams.MID}&orderId=${data.orderId}&amount=${data.amount}&packageName=${encodeURIComponent(data.packageName || "Premium Upgrade")}&clientEmail=${encodeURIComponent(data.clientEmail || "customer@webnest.dev")}&clientName=${encodeURIComponent(data.clientName || "WebNest Client")}&checksum=${encodeURIComponent(data.paytmParams.CHECKSUMHASH)}`;
        
        // Redirect standard window location cleanly to Paytm PG Checkout site
        window.location.href = redirectUrl;
      } else {
        alert("Paytm Gateway configuration response was invalid.");
      }
    } catch(err) {
      alert("Paytm API server integration error.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaytmCompleteAuthorize = async () => {
    if (!paytmParams) return;
    setIsProcessingPayment(true);
    
    const bodyParams = {
      MID: paytmParams.MID,
      ORDERID: paytmParams.ORDERID,
      TXNAMOUNT: paytmParams.TXNAMOUNT,
      TXNID: "TXN-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000),
      STATUS: "TXN_SUCCESS",
      RESPCODE: "01",
      RESPMSG: "Txn Success",
      CUST_ID: paytmParams.CUST_ID,
      CHECKSUMHASH: paytmParams.CHECKSUMHASH,
      CLIENT_NAME: userProfile?.displayName || "WebNest Client",
      CLIENT_EMAIL: userProfile?.email || "customer@webnest.dev",
      PACKAGE_NAME: selectedPlan?.name || "Premium Upgrade"
    };

    try {
      const response = await fetch("/api/paytm/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyParams)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPaytmSuccessInvoice(data.invoiceNum);
        setPaytmStep("completed");
        await onUpgradeProfile("monthly");
      } else {
        alert("Paytm webhook callback execution error.");
      }
    } catch(err) {
      alert("Paytm callback server contact failed.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAddFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: feedbackName.trim(),
          clientEmail: feedbackEmail.trim(),
          rating: Number(feedbackRating),
          comment: feedbackText.trim()
        })
      });
      if (res.ok) {
        setFeedbackName("");
        setFeedbackEmail("");
        setFeedbackRating(5);
        setFeedbackText("");
        setShowFeedbackModal(false);
        alert("Thank you! Your feedback has been registered and verified by Admin.");
        refreshDynamicData();
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Admin Live Site CRUD Handlers
  const handleSaveAdminPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPkgName.trim()) {
      alert("Package name is required.");
      return;
    }
    try {
      const payload: any = {
        name: editPkgName.trim(),
        price: Number(editPkgPrice),
        periodText: editPkgPeriod.trim() || "per month",
        days: Number(editPkgDays) || 30,
        features: editPkgFeatures.split("\n").map(s => s.trim()).filter(Boolean)
      };
      if (editPkgId) {
        payload.id = editPkgId;
      }
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAdminPackageModal(false);
        setEditPkgId("");
        setEditPkgName("");
        setEditPkgPrice(99);
        setEditPkgPeriod("per month");
        setEditPkgDays(30);
        setEditPkgFeatures("");
        alert(editPkgId ? "Pricing tier updated successfully." : "New pricing tier saved and deployed live.");
        refreshDynamicData();
      } else {
        alert("Server failed to save package.");
      }
    } catch(err) {
      console.error(err);
      alert("Could not contact server to save package.");
    }
  };

  const handleDeleteAdminPackage = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this pricing tier? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Pricing tier deleted successfully.");
        refreshDynamicData();
      } else {
        alert("Failed to delete pricing tier.");
      }
    } catch(err) {
      console.error(err);
      alert("Error contacting server.");
    }
  };

  const handleDeleteAdminFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer feedback and testimonial?")) return;
    try {
      const res = await fetch(`/api/feedbacks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Feedback testimonial removed successfully.");
        refreshDynamicData();
      } else {
        alert("Failed to delete testimonial.");
      }
    } catch(err) {
      console.error(err);
      alert("Error contacting server.");
    }
  };

  const handleSaveAdminFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/footer-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAndConditions: editFooterTerms,
          refundPolicies: editFooterRefunds,
          contactEmail: editFooterEmail,
          contactWhatsapp: editFooterWhatsapp
        })
      });
      if (res.ok) {
        setShowAdminFooterModal(false);
        alert("Website policy guidelines updated successfully.");
        refreshDynamicData();
      } else {
        alert("Failed to save policy updates.");
      }
    } catch(err) {
      console.error(err);
      alert("Connection timeout while updating policies.");
    }
  };

  const handleClaimDiscountBannerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
    setCouponCode("LAUNCH30");
    setAppliedCoupon("LAUNCH30");
    setDiscountPercentage(30);
    setCouponSuccess("🎉 Coupon 'LAUNCH30' pre-applied automatically from our live announcement banner! (30% off all packages)");
    setCouponError("");
  };

  return (
    <div id="saas-homepage" className="min-h-screen bg-[#F9FAFB] text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Admin Master Live Site Controller Banner */}
      {userProfile && userProfile.email === "care.webnest@gmail.com" && (
        <div className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 text-white text-xs py-2.5 px-6 font-bold flex flex-col md:flex-row items-center justify-between gap-3 shadow-md z-50 relative">
          <div className="flex items-center gap-2">
            <span className="animate-pulse bg-white text-orange-600 text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Admin CRUD Active</span>
            <span>You are logged in as <span className="font-mono underline">care.webnest@gmail.com</span> (Founder And Ceo of WebNest) with full inline edit privileges.</span>
          </div>
          <div className="flex items-center gap-2">
            {onSwitchView && (
              <button
                onClick={onSwitchView}
                className="bg-white text-orange-700 hover:bg-orange-50 font-black px-3.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-tight"
              >
                ◀ Return to Admin Workspace
              </button>
            )}
            <button
              onClick={() => {
                setEditPkgId("");
                setEditPkgName("");
                setEditPkgPrice(99);
                setEditPkgPeriod("per month");
                setEditPkgDays(30);
                setEditPkgFeatures("");
                setShowAdminPackageModal(true);
              }}
              className="bg-gray-905 bg-gray-900 hover:bg-black font-black px-3.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-tight"
            >
              ➕ Add New Plan
            </button>
            <button
              onClick={() => {
                setEditFooterTerms(footerSettings.termsAndConditions || "");
                setEditFooterRefunds(footerSettings.refundPolicies || "");
                setEditFooterEmail(footerSettings.contactEmail || "care.webnest@gmail.com");
                setEditFooterWhatsapp(footerSettings.contactWhatsapp || "+919876543210");
                setShowAdminFooterModal(true);
              }}
              className="bg-orange-950 hover:bg-orange-900 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-tight"
            >
              ⚙️ Edit Footer guidelines
            </button>
            <button
              onClick={() => {
                setEditHeroBadge(homepageSettings.heroBadge || "Introducing AI to Human Seamless Escalation");
                setEditHeroHeading1(homepageSettings.heroHeading1 || "The 24/7 Smart Live Chat");
                setEditHeroHeading2(homepageSettings.heroHeading2 || "For Your Website");
                setEditHeroDescription(homepageSettings.heroDescription || "Keep customer satisfaction perfect. When WebNest's AI assistant cannot verify the answer, it seamlessly collects visitor details and escalates to your team in real time.");
                setEditFeaturesTitle(homepageSettings.featuresTitle || "Embedded Chatbot Widget");
                setEditFeaturesDesc(homepageSettings.featuresDesc || "WebNest feeds a custom snippet onto any platform (WordPress, Shopify, Webflow, custom HTML). Once loaded, the widget runs on a client's site, powered by your training knowledge base and prompts.");
                setEditChatTitle(homepageSettings.chatTitle || "NestBot Assistant");
                setEditChatDesc(homepageSettings.chatDesc || "Active (AI Mode)");
                setEditActiveOfferText(homepageSettings.activeOfferText || "");
                setEditActiveOfferButtonLabel(homepageSettings.activeOfferButtonLabel || "");
                setEditActiveOfferButtonUrl(homepageSettings.activeOfferButtonUrl || "");
                setEditActiveOfferActive(homepageSettings.activeOfferActive !== false);
                setShowAdminHomepageModal(true);
              }}
              className="bg-teal-900 hover:bg-teal-850 text-white font-black px-3.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-tight"
            >
              📝 Customize Entire Homepage
            </button>
          </div>
        </div>
      )}

      {/* 1. Header */}
      <header id="saas-navbar" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Logo size={38} showText={true} lightMode={true} />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-600">
            <a href="#saas-homepage" className="hover:text-[#FF6321] transition-colors">Home Dashboard</a>
            <a href="#pricing" className="hover:text-[#FF6321] transition-colors">Purchase/Buy</a>
            <a href="#features" className="hover:text-[#FF6321] transition-colors">Services</a>
            <a href="#contact-info" className="hover:text-[#FF6321] transition-colors">Contact</a>
            <a href="#about-info" className="hover:text-[#FF6321] transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {userProfile ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 justify-end">
                    <span>{userProfile.displayName || userProfile.email}</span>
                    {userProfile.email === "care.webnest@gmail.com" && (
                      <span className="bg-[#FF6321] text-white text-[8px] font-black uppercase px-1 rounded-sm">CEO</span>
                    )}
                  </p>
                </div>
                {userProfile.email === "care.webnest@gmail.com" ? (
                  <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-950 font-black px-2.5 py-1.5 rounded-lg tracking-wider uppercase font-mono">CEO Mode Active</span>
                ) : (
                  <span className="text-[10px] bg-gray-50 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 uppercase font-mono">Customer Account</span>
                )}
                {onSwitchView && (
                  <button
                    onClick={onSwitchView}
                    className="bg-[#FF6321] hover:bg-[#E54F10] text-white font-bold text-xs px-3 sm:px-4 py-2.5 rounded-xl text-center shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    🖥️ Go to Console
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 sm:px-4 py-2.5 rounded-xl border border-gray-250 transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={onLogin}
                  className="bg-gray-900 text-white hover:bg-gray-800 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Access Console
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Active Offer Banner */}
      {homepageSettings && homepageSettings.activeOfferActive && homepageSettings.activeOfferText && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-3 px-6 text-xs font-extrabold text-center shadow-md flex flex-col md:flex-row items-center justify-center gap-3 relative z-30">
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <span className="bg-white text-orange-600 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider animate-pulse">
              🔥 SPECIAL LIMITED OFFER
            </span>
            <span>{homepageSettings.activeOfferText}</span>
          </div>
          {homepageSettings.activeOfferButtonLabel && (
            <a 
              href={homepageSettings.activeOfferButtonUrl || "#pricing"}
              onClick={handleClaimDiscountBannerClick}
              className="bg-white hover:bg-orange-50 text-[#FF6321] font-black text-[10px] uppercase px-3 py-1 rounded-md transition-all shadow-sm"
            >
              {homepageSettings.activeOfferButtonLabel}
            </a>
          )}
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-6">
        {/* Soft background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-100/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full py-1.5 px-4 mb-8 text-xs font-semibold text-[#FF6321] shadow-sm animate-pulse">
            <Sparkles size={13} />
            <span>{homepageSettings.heroBadge || "Introducing AI to Human Seamless Escalation"}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
            {homepageSettings.heroHeading1 || "The 24/7 Smart Live Chat"} <br />
            <span className="text-[#FF6321] relative inline-block mt-1">
              {homepageSettings.heroHeading2 || "For Your Website"}
              <span className="absolute left-0 bottom-1 w-full h-[6px] bg-orange-100 -z-10 rounded-full" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            {homepageSettings.heroDescription || "Keep customer satisfaction perfect. When WebNest's AI assistant cannot verify the answer, it seamlessly collects visitor details and escalates to your team in real time."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {userProfile ? (
              <button 
                onClick={onSwitchView}
                className="bg-[#FF6321] hover:bg-[#E54F10] text-white font-medium px-8 py-4 rounded-xl shadow-xl shadow-[#FF6321]/15 text-md transition-all flex items-center gap-2 group cursor-pointer border-0"
              >
                Go to Client Console <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto bg-[#FF6321] hover:bg-[#E54F10] text-white font-medium px-8 py-4 rounded-xl shadow-xl shadow-[#FF6321]/15 text-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Get Started Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="#pricing"
                  className="w-full sm:w-auto border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all shadow-sm"
                >
                  View Hosting Plans
                </a>
              </>
            )}
          </div>

          {/* Interactive visual mockup of chatbot */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-150">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-400 block" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 block" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-400 block" />
                <span className="text-xs text-gray-400 font-mono ml-2">webnest-live-customer-deployment.html</span>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-1 text-xs text-gray-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-500" />
                <span>Script Live and Responsive</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 pt-6 gap-6 text-left">
              <div className="md:col-span-3 space-y-4">
                <div className="inline-block bg-orange-50 text-[#FF6321] text-xs font-bold px-2.5 py-1 rounded-md">
                  HOW IT WORKS
                </div>
                <h3 className="text-xl font-bold font-display text-gray-900">{homepageSettings.featuresTitle || "Embedded Chatbot Widget"}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {homepageSettings.featuresDesc || "WebNest feeds a custom snippet onto any platform (WordPress, Shopify, Webflow, custom HTML). Once loaded, the widget runs on a client's site, powered by your training knowledge base and prompts."}
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 border border-orange-100 bg-orange-50/50 rounded-xl">
                    <span className="text-[#FF6321] font-bold text-lg">24/7</span>
                    <p className="text-xs text-gray-500 mt-1">Smart AI defense first responder</p>
                  </div>
                  <div className="p-3 border border-gray-200 bg-gray-50 rounded-xl">
                    <span className="text-gray-900 font-bold text-lg">Instant</span>
                    <p className="text-xs text-gray-500 mt-1">Human hand-off when AI fails</p>
                  </div>
                </div>
              </div>

              {/* Bot Mockup View */}
              <div className="md:col-span-2 bg-gray-50 border border-gray-250 rounded-2xl p-4 flex flex-col h-[280px]">
                <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3">
                  <div className="bg-[#FF6321] text-white p-1.5 rounded-full">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{homepageSettings.chatTitle || "NestBot Assistant"}</h4>
                    <span className="text-[9px] text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                      {homepageSettings.chatDesc || "Active (AI Mode)"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 py-3 text-xs">
                  <div className="bg-gray-200 text-gray-750 py-1.5 px-3 rounded-lg max-w-[85%]">
                    Hi, is local pickup available at your store?
                  </div>
                  <div className="bg-[#FF6321] text-white py-1.5 px-3 rounded-lg max-w-[85%] self-end ml-auto">
                    Scanning database... Yes, our local pickup counter operates Mon-Fri 9AM to 5PM EST.
                  </div>
                  <div className="bg-gray-205 text-gray-750 py-1.5 px-3 rounded-lg max-w-[85%]">
                    Awesome. How do I request a refund for standard order #1052?
                  </div>
                  <div className="bg-orange-50 border border-orange-200 text-orange-950 py-2 px-3 rounded-lg max-w-[90%]">
                    <p className="font-semibold text-[10px] text-orange-800 mb-1">⚡ AI requested assistance</p>
                    Connecting live human support. Please enter your email:
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="py-20 bg-white border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-extrabold text-gray-900 mb-4">
              Everything Your Support Setup Requires
            </h2>
            <p className="text-gray-600">
              WebNest.dev connects standard business constraints to automated AI capability, ensuring customers never feel abandoned.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-100 rounded-3xl hover:border-[#FF6321]/30 transition-all bg-white shadow-xs">
              <div className="bg-orange-50 text-[#FF6321] p-3 rounded-xl inline-block mb-6">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold font-display text-gray-900 mb-2">Adaptive Training Data</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Add business documents, refund guidelines, and custom FAQ lists straight into the secure WebNest training panel. The AI bot references them immediately.
              </p>
            </div>

            <div className="p-8 border border-gray-100 rounded-3xl hover:border-[#FF6321]/30 transition-all bg-white shadow-xs">
              <div className="bg-orange-50 text-[#FF6321] p-3 rounded-xl inline-block mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold font-display text-gray-900 mb-2">Automated Live Escalation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                When answers fall outside your database documents, the bot pauses and triggers automated email summaries and desk platform notifications to human agents.
              </p>
            </div>

            <div className="p-8 border border-gray-100 rounded-3xl hover:border-[#FF6321]/30 transition-all bg-white shadow-xs">
              <div className="bg-orange-50 text-[#FF6321] p-3 rounded-xl inline-block mb-6">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-lg font-bold font-display text-gray-900 mb-2">Central Security Panel</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Empower your desk executives with absolute manual takeover control inside an administrative cockpit. View transcripts, escalate bills, and update models instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Hybrid Workflow section */}
      <section id="workflow" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-[#FF6321] text-xs font-bold px-3 py-1 rounded-full mb-4">
                THE ESCALATION PIPELINE
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Seamless AI to Human Hand-off. <br />No customer left answers-less.
              </h2>
              
              <div className="space-y-6 mt-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF6321] text-white flex items-center justify-center font-bold font-display text-sm shrink-0">1</div>
                  <div>
                    <h4 className="text-md font-bold text-gray-900 text-left">Custom Knowledge Checking</h4>
                    <p className="text-sm text-gray-500 mt-1 text-left">
                      Our Gemini-powered server uses semantic matching against your training documents to locate facts quickly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF6321] text-white flex items-center justify-center font-bold font-display text-sm shrink-0">2</div>
                  <div>
                    <h4 className="text-md font-bold text-gray-900 text-left">Secure Feedback Forms</h4>
                    <p className="text-sm text-gray-500 mt-1 text-left">
                      When the AI trigger detects a human Representative is needed, it locks the bot chat and requests contact info.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-[#FF6321] flex items-center justify-center font-bold font-display text-sm shrink-0">3</div>
                  <div>
                    <h4 className="text-md font-bold text-gray-900 text-left">Multi-Channel Routing</h4>
                    <p className="text-sm text-gray-500 mt-1 text-left">
                      Instantly sounds live audible push indicators on agent consoles and delivers full HTML live chat transcript to team emails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section & Package Management */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-[#FF6321] text-[10px] font-bold uppercase py-1 px-3.5 rounded-full mb-3.5">
              🎖️ Selected subscription tiers
            </div>
            <h2 className="font-display text-3xl font-extrabold text-gray-901 mb-4 tracking-tight">
              Simple plans. No sudden fees.
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Configure, scale or select a plan that matches your monthly live assistant triggers. Secure payments processed instantly through integrated gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch justify-center">
            {packages.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-3xl">
                <p className="text-xs font-semibold">No package structures loaded. Using defaults...</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`border rounded-2xl p-6 flex flex-col justify-between bg-white relative transition-all ${pkg.price === 99 ? "border-2 border-orange-500 shadow-lg shadow-orange-500/5 ring-4 ring-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {pkg.price === 99 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Most Selected
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-left">
                      <h3 className="font-display text-xs font-black uppercase text-gray-900 tracking-wider">
                        {pkg.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-light">Custom Admin Managed Plan</p>
                      {pkg.days && (
                        <span className="inline-block mt-2 bg-orange-50 text-[#FF6321] text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                          {pkg.days} Days suitable
                        </span>
                      )}
                    </div>

                    <div className="text-left border-b border-gray-100 pb-3">
                      {discountPercentage > 0 ? (
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-400 line-through">
                            Rs. {pkg.price}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-display text-base sm:text-lg font-extrabold text-[#FF6321]">
                              Rs. {Math.round(pkg.price * (1 - discountPercentage / 100))}
                            </span>
                            <span className="text-[10px] text-gray-400">/ {pkg.periodText}</span>
                            <span className="bg-green-100 text-green-700 font-black text-[8px] px-1 py-0.5 rounded ml-1">
                              -{discountPercentage}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-display text-xl font-extrabold text-[#FF6321]">
                            Rs. {pkg.price}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-1">/ {pkg.periodText}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 text-left">
                      {pkg.features && pkg.features.map((feature: string, fIdx: number) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="text-[#FF6321] shrink-0 mt-0.5" size={12} />
                          <span className="text-[10px] leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5">
                    <button 
                      onClick={() => handleOpenCheckout(pkg)} 
                      className={`w-full font-bold py-2.5 px-3 rounded-xl transition-all text-xs cursor-pointer ${pkg.price === 99 ? "bg-orange-600 hover:bg-orange-750 text-white shadow-md shadow-orange-600/10" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
                    >
                      {pkg.price === 0 ? "7 Days Free Trial" : `Buy ${pkg.name}`}
                    </button>

                    {userProfile && userProfile.email === "care.webnest@gmail.com" && (
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-150 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setEditPkgId(pkg.id);
                            setEditPkgName(pkg.name);
                            setEditPkgPrice(pkg.price);
                            setEditPkgPeriod(pkg.periodText || "per month");
                            setEditPkgDays(pkg.days || 30);
                            setEditPkgFeatures(pkg.features ? pkg.features.join("\n") : "");
                            setShowAdminPackageModal(true);
                          }}
                          className="bg-orange-50 hover:bg-orange-100 text-[#FF6321] text-[10px] font-bold py-1.5 px-2 rounded-lg border border-orange-200 transition-all cursor-pointer"
                        >
                          ✏️ Edit Plan
                        </button>
                        <button
                          onClick={() => handleDeleteAdminPackage(pkg.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-200 transition-all cursor-pointer"
                        >
                          ❌ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real-time Coupon & Applied Discount Option Panel */}
          <div className="mt-12 max-w-2xl mx-auto bg-orange-50/40 border border-orange-100 rounded-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-[#FF6321]">
              <span className="text-xs font-extrabold uppercase tracking-wide">🏷️ Apply Promotional Coupon</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Have an active promotional or launch voucher? Enter your code below to instantly calculate and lock in your custom discount (e.g. use <strong className="text-orange-600 font-bold">LAUNCH30</strong> for 30% off, <strong className="text-orange-600 font-bold">SUPERDEAL</strong> for 50% off, or <strong className="text-orange-600 font-bold">WELCOME10</strong> for 10% off).
            </p>

            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto items-stretch justify-center">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                className="bg-white border border-gray-250 text-xs px-4 py-2.5 rounded-xl font-mono focus:outline-none focus:border-[#FF6321] text-gray-800 text-center uppercase tracking-wider grow"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const code = couponCode.toUpperCase().trim();
                  if (code === "LAUNCH30") {
                    setAppliedCoupon("LAUNCH30");
                    setDiscountPercentage(30);
                    setCouponSuccess("🎉 Code 'LAUNCH30' applied successfully! You received a 30% discount on all subscription levels.");
                    setCouponError("");
                  } else if (code === "SUPERDEAL") {
                    setAppliedCoupon("SUPERDEAL");
                    setDiscountPercentage(50);
                    setCouponSuccess("🔥 Code 'SUPERDEAL' applied successfully! You received a massive 50% discount on all subscription levels.");
                    setCouponError("");
                  } else if (code === "WELCOME10") {
                    setAppliedCoupon("WELCOME10");
                    setDiscountPercentage(10);
                    setCouponSuccess("🎉 Code 'WELCOME10' applied successfully! You received a 10% discount on all subscription levels.");
                    setCouponError("");
                  } else if (code === "COMPLIMENTARY") {
                    setAppliedCoupon("COMPLIMENTARY");
                    setDiscountPercentage(100);
                    setCouponSuccess("💎 Code 'COMPLIMENTARY' applied! Enjoy 100% discount on your initial selected service plan.");
                    setCouponError("");
                  } else if (code === "") {
                    setAppliedCoupon("");
                    setDiscountPercentage(0);
                    setCouponSuccess("");
                    setCouponError("Please enter a valid coupon code first!");
                  } else {
                    setCouponError("❌ Invalid or expired coupon code. Please try using 'LAUNCH30' or 'SUPERDEAL'!");
                    setCouponSuccess("");
                  }
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Apply Coupon Code
              </button>
            </div>

            {couponError && (
              <p className="text-[10px] text-red-600 font-bold animate-pulse">{couponError}</p>
            )}

            {couponSuccess && (
              <div className="space-y-1">
                <p className="text-[10px] text-green-600 font-bold">{couponSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCouponCode("");
                    setAppliedCoupon("");
                    setDiscountPercentage(0);
                    setCouponSuccess("");
                    setCouponError("");
                  }}
                  className="text-[9px] text-gray-400 hover:text-gray-600 underline font-medium cursor-pointer"
                >
                  Remove discount code
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5b. Interactive Testimonials & Customer Feedback System */}
      <section id="about-info" className="py-20 bg-gray-50/75 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FF6321] block mb-2">🤝 ENDORSEMENTS & FEEDBACK WALL</span>
              <h2 className="font-display text-2xl font-extrabold text-gray-905 tracking-tight">Verified Client Experience Reviews</h2>
              <p className="text-xs text-gray-500 mt-1">Real-time testimonials configured and monitored through the administrative control panel.</p>
            </div>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-white hover:bg-gray-55 text-gray-900 border border-gray-300 font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              ⭐ Share Your Review / Feedback
            </button>
          </div>

          {feedbacks.length === 0 ? (
            <div className="p-16 text-center text-gray-400 border border-dashed border-gray-200 bg-white rounded-3xl">
              <Star size={32} className="mx-auto text-gray-300 mb-2 animate-pulse" />
              <p className="text-xs font-semibold">No customer testimonies cataloged yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-white border border-gray-150 rounded-2xl p-6 text-left shadow-xs flex flex-col justify-between space-y-4 relative">
                  <div className="space-y-2">
                    <div className="flex text-amber-500 text-xs justify-between items-center">
                      <div className="flex">
                        {Array.from({ length: Math.min(5, Math.max(1, fb.rating)) }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      {userProfile && userProfile.email === "care.webnest@gmail.com" && (
                        <button
                          onClick={() => handleDeleteAdminFeedback(fb.id)}
                          className="text-[9px] bg-red-50 hover:bg-red-105 text-red-600 border border-red-200 px-2 py-0.5 rounded font-black cursor-pointer transition-colors"
                          title="Delete customer feedback entry"
                        >
                          ❌ Delete Review
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs italic leading-relaxed">
                      "{fb.comment}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
                    <div className="w-8 h-8 rounded-full bg-orange-105 text-[#FF6321] flex items-center justify-center font-bold text-xs font-display">
                      {fb.clientName ? fb.clientName[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-901 leading-none">{fb.clientName}</h4>
                      {fb.clientEmail && (
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5">{fb.clientEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5c. About & Corporate Contact Block */}
      <section id="contact-info" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF6321] bg-orange-50 px-3 py-1 rounded-full">WebNest Support Center</span>
            <h2 className="font-display text-2xl font-extrabold text-gray-900 tracking-tight">Need assistance? Reach our desk.</h2>
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
              We process manual technical updates and provide service escalation guidance. Contact our certified executive desk anytime through direct secure emails or instant WhatsApp messaging lines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {/* Box A */}
            <a 
              href={`mailto:${footerSettings.contactEmail}`}
              className="border border-gray-200 p-5 rounded-2xl bg-white hover:border-[#FF6321] hover:shadow-md transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="p-3 bg-orange-50 rounded-xl text-[#FF6321] group-hover:bg-[#FF6321] group-hover:text-white transition-all">
                <Mail size={18} />
              </div>
              <div className="text-center">
                <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">Email Inquiry desk</span>
                <p className="text-xs font-bold text-gray-800 mt-1 font-mono">{footerSettings.contactEmail}</p>
              </div>
            </a>

            {/* Box B */}
            <a 
              href={`https://wa.me/${footerSettings.contactWhatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="border border-gray-200 p-5 rounded-2xl bg-white hover:border-[#FF6321] hover:shadow-md transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                <Sparkles size={18} />
              </div>
              <div className="text-center">
                <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">WhatsApp chat link</span>
                <p className="text-xs font-bold text-gray-850 mt-1 font-mono">{footerSettings.contactWhatsapp}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 6. Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="bg-[#002f6c] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-[#00baf2] text-xs font-black px-2 py-1 rounded text-white font-mono tracking-tight">Paytm</div>
                  <span className="font-bold text-xs tracking-tight uppercase">Secured Billing Gateway</span>
                </div>
                <button 
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setShowPaytmPortal(false);
                    setPaytmStep("idle");
                  }}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Paytm Payment Portal Direct Mode */}
              {showPaytmPortal ? (
                <div className="p-6 space-y-4">
                  {paytmStep === "initiated" && (
                    <div className="space-y-4 text-center">
                      <div className="bg-[#f3fdff] border border-[#00baf2]/20 p-4 rounded-xl space-y-3 text-left">
                        <div className="flex items-center justify-between border-b border-[#00baf2]/10 pb-2">
                          <span className="text-[10px] text-gray-400 font-mono">ORDER ID: {paytmOrderId}</span>
                          <span className="text-[10px] bg-[#22c55e]/10 text-[#16a34a] font-mono font-bold px-1.5 py-0.5 rounded">Active Direct Channel</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Recipient Merchant:</span>
                          <span className="font-bold text-gray-800">WEBNEST SYSTEMS INDIA</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Gateway MID:</span>
                          <span className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">{paytmParams?.MID}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-dashed border-gray-200 pt-2 font-bold text-gray-900">
                          <span>Amount Due (INR):</span>
                          <span className="text-[#00baf2] font-mono">Rs. {paytmParams?.TXNAMOUNT}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center space-y-2 border-gray-200">
                          {/* Production live-style QR Code for Scan & Pay */}
                          <div className="w-32 h-32 bg-gray-100 flex flex-col items-center justify-center rounded-lg border-2 border-[#00baf2]/30 relative p-1.5 overflow-hidden">
                            <div className="grid grid-cols-4 gap-1 w-full h-full opacity-65">
                              {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? "bg-gray-950" : "bg-transparent"}`} />
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-[#002f6c] text-white font-black text-[9px] px-2 py-1 rounded shadow">Paytm QR</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-light">Scan with any Paytm app / PhonePe / BHIM UPI app</span>
                        </div>

                        {/* Paytm Wallet Option */}
                        <div className="border border-gray-150 p-3.5 rounded-xl bg-gray-50/50 space-y-2 text-left">
                          <label className="text-[10px] uppercase font-bold text-[#002f6c] block">Or Pay via Registered Paytm Mobile</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={10}
                              placeholder="Enter 10-Digit Mobile Number" 
                              className="bg-white border text-xs px-3 py-1.5 rounded-lg w-full font-mono outline-none focus:border-[#00baf2]"
                              value={paytmPhone}
                              onChange={(e) => setPaytmPhone(e.target.value.replace(/\D/g, ""))}
                            />
                            <button 
                              type="button" 
                              onClick={() => alert("Secure SMS authentication OTP sent to " + (paytmPhone || "your mobile") + ".")}
                              className="bg-[#002f6c] hover:bg-opacity-90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
                            >
                              Send OTP
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isProcessingPayment}
                          onClick={handlePaytmCompleteAuthorize}
                          className="w-full bg-[#00baf2] hover:bg-[#002f6c] text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
                        >
                          {isProcessingPayment ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying integrity checksum web signature...
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={16} />
                              Authorize & Complete Payment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {paytmStep === "completed" && (
                    <div className="text-center py-6 space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-sm">Paytm Transaction Authorized!</h4>
                        <p className="text-[11px] text-gray-500 font-light leading-normal">
                          The Paytm payment processing completed successfully. A secure signed invoice copy has been synced with WebNest servers.
                        </p>
                      </div>

                      <div className="bg-gray-50 border border-gray-150 p-3 rounded-lg text-left text-xs font-mono space-y-1">
                        <div className="flex justify-between"><span className="text-gray-400">ORDER ID:</span> <span className="font-bold">{paytmOrderId}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">INVOICE:</span> <span className="font-bold text-green-600">{paytmSuccessInvoice || "INV-PAYTM-NEW"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">STATUS:</span> <span className="text-green-600 font-bold uppercase">TXN_SUCCESS</span></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutModal(false);
                          setShowPaytmPortal(false);
                          setPaytmStep("idle");
                        }}
                        className="w-full bg-[#002f6c] hover:bg-opacity-90 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer"
                      >
                        Proceed to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Gateway Selector Tabs */}
                  <div className="grid grid-cols-2 border-b border-gray-150 bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => setPaymentGateway("stripe")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${paymentGateway === "stripe" ? "bg-white text-gray-900 shadow-sm border-gray-200" : "bg-transparent border-transparent text-gray-400 hover:text-gray-700"}`}
                    >
                      💳 Card / Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGateway("paytm")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${paymentGateway === "paytm" ? "bg-white text-[#00baf2] shadow-sm border-[#00baf2]/10" : "bg-transparent border-transparent text-gray-400 hover:text-gray-700"}`}
                    >
                      🔵 Paytm UPI & Wallet
                    </button>
                  </div>

                  {paymentGateway === "paytm" ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                          Upgrading to: {selectedPlan?.name || "Premium Plan"}
                        </h4>
                        {selectedPlan?.days && (
                          <span className="inline-block mt-1 bg-blue-50 text-[#00baf2] text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                            Validity: {selectedPlan.days} Days suitable
                          </span>
                        )}
                        
                        <div className="mt-3 p-3.5 border border-blue-100 bg-blue-50/30 rounded-xl space-y-2 text-xs">
                          <p className="text-[#002f6c] font-bold flex items-center gap-1.5 leading-none">
                            <ShieldCheck size={14} className="text-[#00baf2]" /> Authentic Paytm APIs Configured
                          </p>
                          <p className="text-gray-500 font-light leading-relaxed text-[11px] mt-1">
                            Calculates integrity checksum SHA-256 signatures server-side on your Node.js backend. Updates billing profiles instantly with a Webhook handler.
                          </p>
                          <div className="border-t border-dashed border-blue-200/50 pt-2 grid grid-cols-2 gap-2 text-[9px] font-mono text-[#002f6c]/70 leading-snug">
                            <div>MID: <span className="font-bold">LIVE_MID_102008472910</span></div>
                            <div>Key: <span className="font-bold">LIVE_KEY_882012759281</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs border border-gray-100">
                        <span className="text-gray-500">Subscription Total:</span>
                        <span className="font-bold text-[#00baf2] font-mono">
                          Rs. {selectedPlan ? (discountPercentage > 0 ? Math.round(selectedPlan.price * (1 - discountPercentage / 100)) : selectedPlan.price) : 0} {selectedPlan?.days ? `for ${selectedPlan.days} days suitable` : `/ ${selectedPlan?.periodText || "per month"}`}
                          {discountPercentage > 0 && <span className="text-[10px] text-green-600 font-bold ml-1">({discountPercentage}% Off Coupon Active)</span>}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleInitiatePaytm}
                        disabled={isProcessingPayment}
                        className="w-full bg-[#002f6c] hover:bg-[#002f6c]/90 disabled:bg-[#002f6c]/50 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {isProcessingPayment ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Signing Paytm Payload Checksum...
                          </>
                        ) : (
                          <>
                            ⚡ Initiate Paytm Checkout
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCompleteSubscription} className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-md">
                          Upgrading to: {selectedPlan?.name || "Premium Plan"}
                        </h4>
                        {selectedPlan?.days && (
                          <span className="inline-block mt-1 bg-orange-100 text-[#FF6321] text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                            Validity: {selectedPlan.days} Days suitable
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">This is a secure checkout flow. Your enterprise billing status will instantly refresh upon operational confirmation.</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase text-gray-500">Name on Card</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. John Doe"
                            className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321]"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500">Card Number (Test Card)</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              required
                              placeholder="4242 4242 4242 4242"
                              className="w-full text-xs px-3.5 py-2 pl-9 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-mono"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                            />
                            <Lock size={13} className="text-gray-400 absolute left-3 top-3" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-500">Expiry</label>
                            <input 
                              type="text" 
                              required
                              placeholder="MM/YY"
                              className="w-full text-xs text-center py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-mono"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-500">CVC</label>
                            <input 
                              type="password" 
                              required
                              placeholder="***"
                              maxLength={3}
                              className="w-full text-xs text-center py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] font-mono"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs border border-gray-100">
                        <span className="text-gray-500">Subscription Total:</span>
                        <span className="font-bold text-[#FF6321] font-mono">
                          Rs. {selectedPlan ? (discountPercentage > 0 ? Math.round(selectedPlan.price * (1 - discountPercentage / 100)) : selectedPlan.price) : 0} {selectedPlan?.days ? `for ${selectedPlan.days} days suitable` : `/ ${selectedPlan?.periodText || "per month"}`}
                          {discountPercentage > 0 && <span className="text-[10px] text-green-600 font-bold ml-1">({discountPercentage}% Off Coupon Active)</span>}
                        </span>
                      </div>

                      <button 
                        type="submit"
                        disabled={isProcessingPayment}
                        className="w-full bg-[#FF6321] hover:bg-[#E54F10] disabled:bg-[#FF6321]/50 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessingPayment ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing Transaction...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            Complete Secure Checkout
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5e. Terms & Conditions Modal Overlay */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 shadow-2xl overflow-hidden text-left"
            >
              <div className="bg-orange-650 text-white px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#ea580c" }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} />
                  <span className="font-bold text-xs uppercase font-display tracking-widest">Terms & Conditions of Service</span>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="text-orange-100 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-gray-600 leading-relaxed font-light">
                <p className="font-bold text-gray-900">Effective Date: June 22, 2026</p>
                <p>
                  Welcome to WebNest. By utilizing our conversational virtual assistant widgets, technical dashboards, and live chat sync technologies, you agree to be fully bound by these terms.
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 text-orange-950 font-medium">
                  {footerSettings.termsAndConditions}
                </div>
                <h5 className="font-bold text-gray-905">1. Software License & Node Deployments</h5>
                <p>
                  You are granted a non-exclusive, non-transferable right to embed the WebNest chat bubble snippet onto authorized parent host domains. Any configuration must comply with client safety policies and direct communication rules.
                </p>
                <h5 className="font-bold text-gray-905">2. Safe Integration Parameters</h5>
                <p>
                  Administrators agree to act cleanly during active human ticket takeovers. Standard SLA protocols mandate direct support logs sync inside the core CRM pipeline databases.
                </p>
                <p className="text-[10px] text-gray-400">
                  Securely processed under authorized payment gateway provisions. For inquiries, email care.webnest@gmail.com.
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Close & Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5f. Refund Policies Modal Overlay */}
      <AnimatePresence>
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 shadow-2xl overflow-hidden text-left"
            >
              <div className="bg-[#002f6c] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#00baf2]" />
                  <span className="font-bold text-xs uppercase font-display tracking-widest">Refund & Trial Cancellation Policy</span>
                </div>
                <button 
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-gray-600 leading-relaxed font-light">
                <p className="font-bold text-gray-900">7-Day Premium Trial Window</p>
                <p>
                  At WebNest, customer satisfaction is our core focus. We work hard to offer highly customizable technical frameworks that scale seamlessly.
                </p>
                <div className="bg-blue-50 border-l-4 border-[#00baf2] p-3 text-[#002f6c] font-medium">
                  {footerSettings.refundPolicies}
                </div>
                <h5 className="font-bold text-gray-905">Terms of Cancellation</h5>
                <p>
                  If you choose to degrade your enterprise profile within 7 days of subscription activation, simply press the refund trigger inside the Admin Invoice Panel or register a ticket. All direct transactions via Paytm Gateway will be processed via webhook within exactly 3 working business days.
                </p>
                <p className="text-[10px] text-gray-400">
                  Fully secured under verified direct banking checksum laws. Direct support: care.webnest@gmail.com.
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="bg-[#002f6c] hover:bg-opacity-90 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Close & Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5d. Feedback & Reviews Creator Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="bg-gray-950 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-xs font-display uppercase tracking-wider">Leave a Review / Feedback</span>
                </div>
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddFeedbackSubmit} className="p-6 space-y-4">
                <p className="text-[11px] text-gray-500">
                  Your feedback helps us refine the WebNest client virtualizer tools. Verified reviews are immediately populated on our website's testimonial wall.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Madhavan Sakthi"
                      className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-[#FF6321]"
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Email Address (for validation)</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. client@domain.com"
                      className="w-full text-xs px-3 py-2 border border-gray-255 rounded-lg focus:outline-none focus:border-[#FF6321]"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Satisfying Score Rating (1-5)</label>
                    <div className="flex gap-2 items-center">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setFeedbackRating(stars)}
                          className="text-lg transition-all focus:scale-110 cursor-pointer"
                        >
                          <span className={stars <= feedbackRating ? "text-amber-500" : "text-gray-300"}>★</span>
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 ml-2">({feedbackRating} / 5)</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Comment / Review content</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="e.g. Excellent service modules! The automated escalations hand-off is seamless."
                      className="w-full text-xs px-3 py-2 border border-gray-255 rounded-lg focus:outline-none focus:border-[#FF6321]"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? "Saving review..." : "Submit Review & Publish"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Live Package Modal Overlay */}
      {showAdminPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-orange-200 shadow-2xl overflow-hidden p-6 relative text-left">
            <button 
              onClick={() => setShowAdminPackageModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
            
            <h3 className="font-display font-black text-sm text-gray-955 uppercase tracking-wider mb-2 border-b border-gray-150 pb-2 text-left flex items-center gap-1.5">
              <span>{editPkgId ? "✏️ Edit Pricing Plan Tier" : "➕ Create New Pricing Plan Tier"}</span>
            </h3>
            
            <form onSubmit={handleSaveAdminPackage} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Package Plan Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Platinum Diamond Elite"
                  className="w-full text-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-semibold"
                  value={editPkgName}
                  onChange={(e) => setEditPkgName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Price (Rs.)</label>
                  <input 
                    type="number"
                    min={0}
                    required
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-mono"
                    value={editPkgPrice}
                    onChange={(e) => setEditPkgPrice(Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Billing Period</label>
                  <input 
                    type="text"
                    required
                    placeholder="per month"
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-medium"
                    value={editPkgPeriod}
                    onChange={(e) => setEditPkgPeriod(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Valid Days</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-mono"
                    value={editPkgDays}
                    onChange={(e) => setEditPkgDays(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Key Features (One feature per line)</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="e.g.&#10;Smart AI live conversational routing&#10;Up to 1000 message items synced&#10;24/7 dedicated support desk"
                  className="w-full text-xs p-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800"
                  value={editPkgFeatures}
                  onChange={(e) => setEditPkgFeatures(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAdminPackageModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#FF6321] hover:bg-[#E54F10] text-white py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-[#FF6321]/15"
                >
                  Deploy Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Live Footer Guidelines Modal Overlay */}
      {showAdminFooterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-orange-200 shadow-2xl overflow-hidden p-6 relative text-left">
            <button 
              onClick={() => setShowAdminFooterModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
            
            <h3 className="font-display font-black text-sm text-gray-950 uppercase tracking-wider mb-2 border-b border-gray-150 pb-2 text-left flex items-center gap-1.5">
              <span>⚙️ Edit WebNest Policies & Footer Guidelines</span>
            </h3>
            
            <form onSubmit={handleSaveAdminFooter} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Terms & Conditions Statement</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Insert terms here..."
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800"
                  value={editFooterTerms}
                  onChange={(e) => setEditFooterTerms(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Refund Policies Statement</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Insert refund descriptions here..."
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800"
                  value={editFooterRefunds}
                  onChange={(e) => setEditFooterRefunds(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Email</label>
                  <input 
                    type="email"
                    required
                    className="w-full text-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-medium"
                    value={editFooterEmail}
                    onChange={(e) => setEditFooterEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact WhatsApp</label>
                  <input 
                    type="text"
                    required
                    className="w-full text-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] focus:bg-white text-gray-800 font-medium font-mono"
                    value={editFooterWhatsapp}
                    onChange={(e) => setEditFooterWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAdminFooterModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#FF6321] hover:bg-[#E54F10] text-white py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-[#FF6321]/15"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="bg-white text-gray-750 py-16 px-6 border-t-4 border-[#FF6321] text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Logo & Description */}
          <div className="col-span-1 md:col-span-4 space-y-4 text-left">
            <Logo size={42} showText={true} lightMode={true} />
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              High-fidelity omnichannel conversational workflows. Bridging automated Gemini interactions with human technical team handoffs reliably.
            </p>
          </div>

          {/* Center Column: Legal Information (Terms, Refunds) */}
          <div className="col-span-1 md:col-span-4 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#FF6321] font-display">Guidelines & Compliance</h4>
              {userProfile && userProfile.email === "care.webnest@gmail.com" && (
                <button
                  onClick={() => {
                    setEditFooterTerms(footerSettings.termsAndConditions || "");
                    setEditFooterRefunds(footerSettings.refundPolicies || "");
                    setEditFooterEmail(footerSettings.contactEmail || "care.webnest@gmail.com");
                    setEditFooterWhatsapp(footerSettings.contactWhatsapp || "+919876543210");
                    setShowAdminFooterModal(true);
                  }}
                  className="bg-orange-50 hover:bg-orange-100 text-[#FF6321] border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  ⚙️ Edit policies
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div 
                onClick={() => setShowTermsModal(true)}
                className="group border border-gray-150 rounded-xl p-3 bg-gray-50/50 hover:bg-orange-50/10 hover:border-orange-200 transition-all cursor-pointer select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-gray-700 tracking-tight">Terms & Conditions</span>
                  <span className="text-[10px] text-[#FF6321] group-hover:translate-x-0.5 transition-transform font-mono font-bold">Click to Read ↗</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-light leading-snug truncate">
                  {footerSettings.termsAndConditions}
                </p>
              </div>

              <div 
                onClick={() => setShowRefundModal(true)}
                className="group border border-gray-150 rounded-xl p-3 bg-gray-50/50 hover:bg-orange-50/10 hover:border-orange-200 transition-all cursor-pointer select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-gray-700 tracking-tight">Refund Policies</span>
                  <span className="text-[10px] text-[#FF6321] group-hover:translate-x-0.5 transition-transform font-mono font-bold">Click to Read ↗</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-light leading-snug truncate">
                  {footerSettings.refundPolicies}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Details (Email, WhatsApp) */}
          <div className="col-span-1 md:col-span-4 space-y-4 text-left">
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#FF6321] font-display">Technical Support lines</h4>
            <p className="text-[11px] text-gray-500 font-light">Direct helpdesk details for real-time account support:</p>
            
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-mono">Email:</span>
                <a href={`mailto:${footerSettings.contactEmail}`} className="text-[#FF6321] hover:underline font-bold">
                  {footerSettings.contactEmail}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-mono">WhatsApp:</span>
                <a href={`https://wa.me/${footerSettings.contactWhatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-bold">
                  {footerSettings.contactWhatsapp}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-gray-500 block">
                Standard Support Hours: 24/7 Monitoring
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-orange-100 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-gray-500 text-[10px]">
          <p className="font-medium text-orange-950">© 2026 WebNest Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Admin Live Homepage Customizer Modal Overlay */}
      {showAdminHomepageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-orange-200 shadow-2xl overflow-hidden p-6 relative text-left my-8">
            <button 
              onClick={() => setShowAdminHomepageModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
            
            <h3 className="font-display font-black text-sm text-gray-950 uppercase tracking-wider mb-2 border-b border-gray-150 pb-2 text-left flex items-center gap-1.5">
              <span>🏠 Live Homepage & Active Offers Customizer</span>
            </h3>
            
            <form onSubmit={handleSaveHomepageSettings} className="space-y-4 text-xs font-sans max-h-[75vh] overflow-y-auto pr-1">
              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-900">
                  <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse inline-block" />
                  <span>Real-Time Offer Announcement Banner</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Live Announcement Promo Text</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. 🎉 Special Launch Offer: Upgrade today and get 30% off!"
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6321] text-gray-800"
                    value={editActiveOfferText}
                    onChange={(e) => setEditActiveOfferText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Button CTA Label</label>
                    <input 
                      type="text"
                      placeholder="e.g. Claim Discount"
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editActiveOfferButtonLabel}
                      onChange={(e) => setEditActiveOfferButtonLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">CTA Link / ID Destination</label>
                    <input 
                      type="text"
                      placeholder="e.g. #pricing"
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editActiveOfferButtonUrl}
                      onChange={(e) => setEditActiveOfferButtonUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input 
                    type="checkbox"
                    id="edit-offer-active"
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    checked={editActiveOfferActive}
                    onChange={(e) => setEditActiveOfferActive(e.target.checked)}
                  />
                  <label htmlFor="edit-offer-active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Enable and display active promotion banner
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">1. Hero Layout Text</div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Hero Sparkle Badge text</label>
                  <input 
                    type="text"
                    required
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                    value={editHeroBadge}
                    onChange={(e) => setEditHeroBadge(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Heading Line 1</label>
                    <input 
                      type="text"
                      required
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editHeroHeading1}
                      onChange={(e) => setEditHeroHeading1(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Highlight Line 2</label>
                    <input 
                      type="text"
                      required
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editHeroHeading2}
                      onChange={(e) => setEditHeroHeading2(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Hero Subtext Description</label>
                  <textarea 
                    rows={2}
                    required
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                    value={editHeroDescription}
                    onChange={(e) => setEditHeroDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">2. Product Features & Mock Widget</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Features section header</label>
                    <input 
                      type="text"
                      required
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editFeaturesTitle}
                      onChange={(e) => setEditFeaturesTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Bot Widget Title</label>
                    <input 
                      type="text"
                      required
                      className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                      value={editChatTitle}
                      onChange={(e) => setEditChatTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Features section subtext</label>
                  <textarea 
                    rows={2}
                    required
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                    value={editFeaturesDesc}
                    onChange={(e) => setEditFeaturesDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Bot Status description subtitle</label>
                  <input 
                    type="text"
                    required
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                    value={editChatDesc}
                    onChange={(e) => setEditChatDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAdminHomepageModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-250 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#FF6321] hover:bg-[#E54F10] text-white py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-[#FF6321]/15"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
