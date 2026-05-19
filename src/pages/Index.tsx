import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoBar from "@/components/landing/LogoBar";
import LiveSocialProof from "@/components/landing/LiveSocialProof";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Integrations from "@/components/landing/Integrations";
import OpenClawBanner from "@/components/landing/OpenClawBanner";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CTAFinal from "@/components/landing/CTAFinal";
import Footer from "@/components/landing/Footer";

const SectionDivider = () => (
  <div
    className="h-[1px]"
    style={{
      background: "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.3) 30%, rgba(124,58,237,0.3) 70%, transparent 100%)",
    }}
  />
);

const Index = () => {
  // Track affiliate ref code on landing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      sessionStorage.setItem("affiliate_code", refCode.toUpperCase());
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      fetch(`${supabaseUrl}/functions/v1/affiliate-tracker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          action: "track_click",
          payload: {
            code: refCode,
            landing_page: window.location.pathname,
            referer_url: document.referrer,
            utm_source: params.get("utm_source") || undefined,
            utm_medium: params.get("utm_medium") || undefined,
            utm_campaign: params.get("utm_campaign") || undefined,
          },
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.click_id) sessionStorage.setItem("affiliate_click_id", data.click_id);
        })
        .catch(() => {});
    }
  }, []);

  return (
  <div className="bg-background min-h-screen relative">
    <div
      className="fixed inset-0 pointer-events-none z-[9999] dark-only-grain"
      style={{
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />

    <Navbar />
    <Hero />
    <LiveSocialProof />
    <LogoBar />
    <SectionDivider />
    <Problem />
    <SectionDivider />
    <HowItWorks />
    <SectionDivider />
    <Features />
    <SectionDivider />
    <Integrations />
    <SectionDivider />
    <OpenClawBanner />
    <SectionDivider />
    <Pricing />
    <SectionDivider />
    <Testimonials />
    <SectionDivider />
    <FAQ />
    <SectionDivider />
    <CTAFinal />
    <Footer />
    </div>
  );
};

export default Index;
