import React, { useEffect } from "react";
import { Navbar } from "../components/LandingPage/Navbar";
import { Hero } from "../components/LandingPage/Hero";
import { Features } from "../components/LandingPage/Features";
import { Pricing } from "../components/LandingPage/Pricing";
import { CTA } from "../components/LandingPage/CTA";
import { FAQ, Footer } from "../components/LandingPage/Footer";
const backgroundImage = () => {
  return (
    <div>
      <img
        src="blob:https://gemini.google.com/f2ce1f36-1d58-4f0d-a896-308966d8f8eb"
        alt="garageBg"
        className="w-full h-100 object-cover rounded-xl"
      />
    </div>
  );
};
const LandingPage = () => {
  useEffect(() => {
    document.title = "GaragePro | Modern Workshop Management Software";

    // Meta description
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "The all-in-one operating system for mechanical workshops. Manage job cards, inventory, and billing with ease.",
    );

    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80; // navbar height buffer
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <div
      className="min-h-screen relative bg-[#f8faff] dark:bg-[#030712] text-[#1e1b4b] dark:text-[#f8fafc]"
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Global subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none -z-20"
        style={{
          backgroundImage: backgroundImage,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Global ambient colour blobs */}
      <div
        className="fixed top-0 left-0 w-[55vw] h-[55vh] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(99,102,241,0.10) 0%, transparent 65%)",
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-[55vw] h-[55vh] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(59,130,246,0.10) 0%, transparent 65%)",
        }}
      />

      {/* Page sections */}
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
