import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  useEffect(() => {
    document.title = "About GaragePro | Garage Workshop Management";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "GaragePro is the modern workshop management platform that helps garage owners, technicians, and service advisors reduce paperwork, speed up invoicing, and better serve customers.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-[#030712] text-[#1e1b4b] dark:text-[#f8fafc] px-6 py-16 sm:px-8 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.24em] font-bold text-blue-600 dark:text-blue-300">
            About GaragePro
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Built for garage owners who want cleaner operations and happier
            customers.
          </h1>
          <p className="mt-5 text-base md:text-lg max-w-3xl mx-auto leading-relaxed text-slate-600 dark:text-slate-300">
            GaragePro was created to replace paper-based service logs, inventory
            spreadsheets, and confusing billing flows with one intuitive system
            that runs your workshop.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-10">
            <section className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                We help small and medium-size garages run more efficiently by
                combining service scheduling, repair tracking, parts management,
                customer communications, and invoicing inside one powerful
                application.
              </p>
            </section>

            <section className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <h2 className="text-2xl font-bold mb-4">What We Value</h2>
              <ul className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Clarity:
                  </strong>{" "}
                  Every workflow should be simple enough for a busy workshop to
                  adopt immediately.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Reliability:
                  </strong>{" "}
                  Your job cards and customer records must always be available
                  when you need them.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Growth:
                  </strong>{" "}
                  We build tools that help garages save time, deliver better
                  service, and increase revenue.
                </li>
              </ul>
            </section>

            <section className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <h2 className="text-2xl font-bold mb-4">How We Help Garages</h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  From creating service estimates and generating invoices to
                  sending reminders and tracking spare parts, GaragePro gives
                  every garage owner the tools to operate with confidence.
                </p>
                <p>
                  Our platform is built for workshops of all sizes, whether you
                  manage a single bay or multiple teams. Every feature is
                  designed to make daily operations smoother for mechanics,
                  advisors, and owners alike.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-linear-to-br from-blue-600 to-violet-600 p-8 shadow-xl text-white">
              <div className="text-sm uppercase tracking-[0.24em] font-bold mb-3">
                Why GaragePro
              </div>
              <p className="text-lg leading-relaxed">
                Modern garage management with the speed of a web app and the
                clarity of a well-designed dashboard.
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <h3 className="text-xl font-bold mb-4">Our Commitment</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We partner with workshops to launch faster, reduce manual tasks,
                and deliver a better service experience for every customer.
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <h3 className="text-xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Join hundreds of garages already using GaragePro to manage
                invoicing, service workflows, and customer communication.
              </p>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
