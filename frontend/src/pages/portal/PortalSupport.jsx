import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, HelpCircle } from "lucide-react";

export default function PortalSupport() {
  useEffect(() => {
    document.title = "Portal Support | GaragePro";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Contact GaragePro support for portal access, billing help, and service queries.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-20 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        <div className="rounded-4xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 via-cyan-500 to-sky-500 p-10 text-white">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] font-semibold opacity-90">
                Portal Support
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
                Need fast help with your GaragePro portal?
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-blue-100/95 leading-relaxed">
                Our support team is ready to help with login issues, service
                tracking, invoice questions, and any portal-related requests.
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-12 space-y-10">
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  icon: HelpCircle,
                  title: "Quick answers",
                  description:
                    "Find help for portal login, invoice downloads, and garage tracking.",
                },
                {
                  icon: Mail,
                  title: "Email support",
                  description:
                    "Reach us at support@garageapp.com for fast response and trouble resolution.",
                },
                {
                  icon: Phone,
                  title: "Phone support",
                  description: "+91 98765 43210 available Mon–Sat, 9am–7pm.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <div className="inline-flex items-center justify-center rounded-3xl bg-white shadow-sm w-12 h-12 mb-4 text-blue-600">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 lg:p-8">
              <div className="flex flex-col gap-6 lg:gap-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] font-semibold text-blue-600">
                    Submit a request
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    Tell us how we can help.
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Portal access
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Trouble signing in or viewing your services? Our support
                      team will help you get back in quickly.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Billing & invoices
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Need help downloading your invoice or understanding
                      charges? Send us a quick note.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Garage details
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Want to update your garage profile, location, or contact
                      details? We'll take care of it.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      General requests
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Ask about features, onboarding, or how GaragePro can
                      support your workshop.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] font-semibold text-blue-600">
                    Ready to speak with support?
                  </p>
                  <p className="mt-2 text-base text-slate-600 leading-relaxed">
                    Email us directly or open a support ticket with your portal
                    details.
                  </p>
                </div>
                <a
                  href="mailto:support@garageapp.com"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
