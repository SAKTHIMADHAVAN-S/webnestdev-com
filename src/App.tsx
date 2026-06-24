import React, { useState, useEffect, useRef } from "react";
import { UserProfile, ChatbotSettings } from "./types";
import SaaSLanding from "./components/SaaSLanding";
import AdminPanel from "./components/AdminPanel";
import WidgetUI from "./components/WidgetUI";
import Logo from "./components/Logo";
import { MessageSquare, ShieldCheck, X } from "lucide-react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Auth Form State
  const [authError, setAuthError] = useState("");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  const [isWidgetRoute, setIsWidgetRoute] = useState(false);
  const [widgetUserId, setWidgetUserId] = useState("demo");

  // Floating preview widget state on WebNest homepage/dashboard
  const [showFloatingPreviewWidget, setShowFloatingPreviewWidget] = useState(false);
  
  // Toggles admin view between back-office dashboard and live homepage editor
  const [adminViewMode, setAdminViewMode] = useState<"dashboard" | "landing">("dashboard");

  // Payment notify states
  const [paymentSuccessInvoice, setPaymentSuccessInvoice] = useState<string | null>(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  // 1. Sniff URL search paths for the Widget Iframe Route & Paytm payment redirect status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    if (path.includes("/widget-iframe") || params.has("id")) {
      // If we are strictly in widget-iframe view or have an id search param
      if (path.includes("/widget-iframe")) {
        setIsWidgetRoute(true);
        setWidgetUserId(params.get("id") || "demo");
      }
    }
    
    // Sniff Paytm payment process redirect params
    const statusParam = params.get("payment_status");
    if (statusParam === "success") {
      const invNum = params.get("invoice") || "INV-PAYTM-DIRECT";
      setPaymentSuccessInvoice(invNum);
      
      // Update local storage and session profile immediately so UI receives the Active monthly level
      const saved = localStorage.getItem("webnest_session");
      if (saved) {
        try {
          const u = JSON.parse(saved);
          u.billingStatus = "Active";
          u.billingTier = "monthly";
          localStorage.setItem("webnest_session", JSON.stringify(u));
          setUser(u);
          setProfile(u);
        } catch(e) {}
      }
      
      // Clear URL parameters immediately for beautiful and clean state holding
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    } else if (statusParam === "cancelled") {
      setPaymentCancelled(true);
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, []);

  // 2. Real-time Firebase Auth listener (with offline/local storage backup)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Construct user profile from Firebase auth
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "demo.client@company.com",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "WebNest Client",
          billingStatus: "Active",
          billingTier: firebaseUser.email === "care.webnest@gmail.com" ? "annual" : "monthly",
          registeredAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now()
        };
        setUser(userProfile);
        setProfile(userProfile);
        localStorage.setItem("webnest_session", JSON.stringify(userProfile));

        // Sync with backend simulation route to keep simulation dashboard datasets healthy
        try {
          await fetch("/api/user_profiles_simulation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userProfile)
          });
        } catch (syncErr) {
          console.warn("Simulated profiles sync skipped during Google sign-in:", syncErr);
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem("webnest_session");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Method to Upgrade Own tier in simulated accounts configuration
  const upgradeProfileTier = async (tier: "monthly" | "annual" | "none") => {
    if (!profile) return;
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        billingStatus: tier === "none" ? "Free" : "Active",
        billingTier: tier
      };
      
      // Update local states
      setProfile(updatedProfile);
      setUser(updatedProfile);
      localStorage.setItem("webnest_session", JSON.stringify(updatedProfile));

      // Sync simulated profile state to server so the simulated accounts table gets it real-time
      await fetch("/api/user_profiles_simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
    } catch (err) {
      console.error("Failed to upgrade billing profile: ", err);
    }
  };

  // Sign In using Google Authentication Provider
  const handleGoogleSignIn = async () => {
    setAuthError("");
    setIsSendingMagicLink(true); // Re-use spinner state for visual click feedback
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Google login authentication error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed. Please try again.");
      } else {
        setAuthError(err.message || "Failed authentication handshake.");
      }
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem("webnest_session");
      setProfile(null);
      setUser(null);
    } catch (err) {
      console.error("Failed executing sign out: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading Screen Render
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="bg-teal-600 text-white p-3 rounded-2xl shadow-xl animate-bounce">
          <Logo size={42} showText={false} lightMode={true} />
        </div>
        <div className="space-y-1.5 text-center">
          <h3 className="font-display font-extrabold text-lg text-gray-850">WebNest.dev</h3>
          <p className="text-xs text-gray-400 font-mono">Syncing system memory matrices...</p>
        </div>
      </div>
    );
  }

  // A. IFRAME WIDGET RENDERING (Isolated view inside widget iframe)
  if (isWidgetRoute) {
    return (
      <div className="fixed inset-0 bg-transparent flex flex-col h-screen overflow-hidden">
        <WidgetUI userId={widgetUserId} />
      </div>
    );
  }

  // B. MAIN SAAS WEBSITE RENDERING
  return (
    <div id="webnest-app" className="min-h-screen relative flex flex-col justify-between">
      
      {/* Route Render */}
      {!profile ? (
        <SaaSLanding 
          onLogin={() => { setAuthError(""); setShowAuthModal(true); }}
          onLogout={handleLogout}
          userProfile={null}
          onUpgradeProfile={upgradeProfileTier}
        />
      ) : (
        adminViewMode === "dashboard" ? (
          <AdminPanel 
            userProfile={profile} 
            onLogout={handleLogout}
            onUpgradeProfile={upgradeProfileTier}
            onSwitchView={() => setAdminViewMode("landing")}
          />
        ) : (
          <SaaSLanding 
            onLogin={() => { setAuthError(""); setShowAuthModal(true); }}
            onLogout={handleLogout}
            userProfile={profile}
            onUpgradeProfile={upgradeProfileTier}
            onSwitchView={() => setAdminViewMode("dashboard")}
            viewMode="landing"
          />
        )
      )}

      {/* Floating Widget Live Simulator directly on WebNest.dev so users can play with it immediately! */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans">
        {showFloatingPreviewWidget && (
          <div className="w-[360px] h-[520px] max-w-[calc(100vw-32px)] text-left shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200">
            <WidgetUI 
              userId={profile?.uid || "demo"} 
              initialVisitorName={profile?.displayName || ""}
              initialVisitorEmail={profile?.email || ""}
            />
          </div>
        )}
        
        <button 
          onClick={() => setShowFloatingPreviewWidget(!showFloatingPreviewWidget)}
          className="w-14 h-14 bg-orange-500 hover:bg-orange-650 text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-500/35 border-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Simulate WebNest deployment live on page!"
        >
          {showFloatingPreviewWidget ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>

      {/* Paytm Checkout Outcome Alert Modals */}
      {paymentSuccessInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-250 shadow-2xl overflow-hidden p-6 relative text-center space-y-4">
            <button 
              onClick={() => setPaymentSuccessInvoice(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 text-2xl">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-gray-900 text-md">
                Upgrade Successful!
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Thank you for your purchase. Your payment transaction has been processed securely via the <strong>Paytm Payment Gateway</strong>.
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-[11px] font-mono text-gray-600 space-y-1 text-left">
              <p><strong>Reference:</strong> {paymentSuccessInvoice}</p>
              <p><strong>Method:</strong> Paytm Checkout Secure</p>
              <p><strong>Plan Tier:</strong> Pro Monthly Assistant</p>
              <p><strong>Status:</strong> Active & Authenticated</p>
            </div>

            <button
              onClick={() => setPaymentSuccessInvoice(null)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      )}

      {paymentCancelled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-250 shadow-2xl overflow-hidden p-6 relative text-center space-y-4">
            <button 
              onClick={() => setPaymentCancelled(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-2xl font-mono">
              !
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-gray-901 text-md">
                Payment Cancelled
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The checksum handshake or transaction was cancelled at the Paytm checkout secure page. No money was moved.
              </p>
            </div>

            <button
              onClick={() => setPaymentCancelled(false)}
              className="w-full bg-gray-901 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
            >
              Back to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Unified Google Sign-In Auth Modal popup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-250 shadow-2xl overflow-hidden p-6 relative text-left">
            <button 
              onClick={() => { 
                setShowAuthModal(false); 
                setAuthError(""); 
              }} 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 transition-colors cursor-pointer animate-none"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 mb-6 font-sans">
              <div className="p-1 bg-teal-50 rounded-2xl inline-block">
                <Logo size={42} showText={false} lightMode={true} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-gray-950">
                WebNest Console Access
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed font-normal">
                Connect your account securely to manage active Chat Widgets, scrapers, live logs, and embedding details.
              </p>
            </div>

            {/* Error notifications */}
            {authError && (
              <div className="bg-red-50 border border-red-150 text-red-800 p-3 rounded-lg text-xs leading-relaxed mb-4 font-sans font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-4 font-sans">
              <button 
                onClick={handleGoogleSignIn}
                disabled={isSendingMagicLink}
                className="w-full bg-white hover:bg-neutral-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl border border-gray-200 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs select-none active:scale-95"
              >
                {isSendingMagicLink ? (
                  <span className="w-4 h-4 rounded-full border-2 border-teal-650 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span className="text-[#4285F4] font-black text-sm pr-1">G</span>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
