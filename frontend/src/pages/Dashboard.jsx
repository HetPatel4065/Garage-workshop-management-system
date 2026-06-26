import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  PieChart,
  Pie,
  Cell,
  Line,
} from "recharts";
import {
  Users,
  Wrench,
  IndianRupee,
  AlertTriangle,
  History,
  Bell,
  Calendar as FiCalendar,
  Clock,
  TrendingUp,
} from "lucide-react";

// Components
import StatsCard from "../components/Dashboard/StatsCard";
import LowStockAlert from "../components/Dashboard/LowStockAlert";
import QuickActionButtons from "../components/Dashboard/QuickActionButtons";
import RecentServices from "../components/Dashboard/RecentServices";
import PendingApprovals from "../components/Dashboard/PendingApprovals";
import DashboardSkeleton from "../components/Dashboard/DashboardSkeleton";
import { useAuth } from "../context/AuthContext";
import AdminDirectory from "../components/Dashboard/AdminDirectory";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "../utils/roles";

const STATUS_COLORS = {
  Completed: "#10b981",
  "In Progress": "#3b82f6",
  Pending: "#f59e0b",
  Cancelled: "#ef4444",
};

// Fallback color for any other status
const DEFAULT_COLOR = "#8b5cf6";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const uniquePayload = payload.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.dataKey === item.dataKey),
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 text-xs min-w-50">
      {/* Date Header */}
      <div className="mb-2 text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">
        {typeof label === "string" && label.includes("-")
          ? new Date(label).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : label}
      </div>

      <div className="space-y-1.5">
        {uniquePayload.map((item, i) => {
          const isPaid = item.dataKey === "paid";

          return (
            <div
              key={i}
              className="flex justify-between items-center gap-4 px-1"
            >
              <div className="flex items-center gap-2">
                {/* Visual indicator matching the chart colors */}
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isPaid ? "#059669" : "#334155" }}
                />
                <span
                  className={`font-bold ${isPaid ? "text-emerald-600" : "text-slate-700"}`}
                >
                  {isPaid ? "Revenue Collected" : "Total Work Invoiced"}
                </span>
              </div>

              <span className="font-black text-slate-900">
                ₹{Math.floor(item.value).toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token, selectedGarage } = useAuth();
  const rawRole = user?.role || "user";
  const role = rawRole === "admin" && selectedGarage ? "owner" : rawRole;
  const roleLabel =
    ROLE_LABELS[rawRole] ||
    `${rawRole.charAt(0).toUpperCase()}${rawRole.slice(1)}`;
  const roleDescription = ROLE_DESCRIPTIONS[rawRole];

  const [data, setData] = useState({
    stats: {
      totalRevenue: 0,
      todayRevenue: 0,
      activeServices: 0,
      newCustomers: 0,
      todayStats: {
        invoiced: 0,
        paid: 0,
        pending: 0,
        previousPayments: 0,
      },
      reminderStats: {
        dueToday: 0,
        dueThisWeek: 0,
        overdue: 0,
        pending: 0,
      },
    },
    serviceBreakdown: [],
    recentServices: [],
    lowStockItems: [],
    revenueHistory: [],
    trends: {
      revenue: 0,
      services: 0,
      customers: 0,
    },
  });
  const [inspections, setInspections] = useState([]);
  const [timeRange, setTimeRange] = useState();
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowCharts(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (rawRole === "admin" && !selectedGarage) {
      setLoading(false);
      return;
    }
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard data
        const dashRes = await fetch(
          `${import.meta.env.VITE_API_URL}/v1/dashboard?range=${timeRange}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!dashRes.ok) throw new Error("Dashboard fetch failed");
        const json = await dashRes.json();

        // Fetch today's inspections separately to avoid breaking the dashboard if it fails
        let inspJson = [];
        try {
          const inspRes = await fetch(
            `${import.meta.env.VITE_API_URL}/requested-customers/today`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (inspRes.ok) {
            inspJson = await inspRes.json();
          }
        } catch (inspErr) {
          console.error("Inspections Fetch Error:", inspErr);
        }

        setData({
          stats: {
            totalRevenue: json?.totalRevenue || 0,
            todayRevenue: json?.todayStats?.paid || 0,
            activeServices: json?.activeServices || 0,
            newCustomers: json?.newCustomers || 0,
            todayStats: json?.todayStats || {
              invoiced: 0,
              paid: 0,
              pending: 0,
              previousPayments: 0,
            },
          },
          serviceBreakdown: json?.serviceBreakdown || [],
          recentServices: (json?.recentServices || []).map((s) => ({
            ...s,
            id: s._id || s.id,
          })),
          lowStockItems: (json?.lowStockItems || []).map((i) => ({
            ...i,
            id: i._id || i.id,
          })),
          revenueHistory: json?.revenueHistory || [],
          trends: json?.trends || { revenue: 0, services: 0, customers: 0 },
          reminderStats: json?.reminderStats || {
            dueToday: 0,
            dueThisWeek: 0,
            overdue: 0,
            pending: 0,
          },
        });
        setInspections(inspJson);
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, timeRange, selectedGarage]);

  const filteredRevenue = useMemo(() => {
    return [...data.revenueHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [data.revenueHistory]);

  const periodTotal = useMemo(() => {
    return filteredRevenue.reduce((acc, curr) => acc + (curr.invoiced || 0), 0);
  }, [filteredRevenue]);

  if (rawRole === "admin" && !selectedGarage) {
    return <AdminDirectory />;
  }

  if (loading || !showCharts) return <DashboardSkeleton />;

  return (
    <div className="w-full min-h-screen bg-gray-100 px-2 xs:px-3 sm:px-6 lg:px-8 3xl:px-12 4xl:px-16 py-3 xs:py-4 sm:py-6 overflow-y-auto">
      {/* ── Header ── */}
      <div className="mb-4 xs:mb-6 flex flex-col gap-3 xs:gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:mb-8">
        {/* Left Side: Identity & Greetings */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Hi, {user?.name}
            </p>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
            {roleLabel} Dashboard
          </h1>

          <p className="text-sm font-medium text-slate-500 mt-3">
            {roleDescription}
          </p>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="shrink-0 pt-2 sm:pt-0">
          <div className="flex flex-nowrap gap-2.5">
            <QuickActionButtons
              role={role}
              onAddCustomer={() => navigate("/customers")}
              onAddService={() => navigate("/services")}
              onAddInventory={() => navigate("/inventory")}
            />
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {["owner", "admin"].includes(role) && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <StatsCard
            title="Total Revenue"
            value={`₹ ${Math.floor(data.stats.totalRevenue).toLocaleString("en-IN")}`}
            icon={<IndianRupee />}
            color="blue"
          />
          <StatsCard
            title="Today"
            value={`₹ ${Math.floor(data.stats.todayRevenue).toLocaleString("en-IN")}`}
            icon={<IndianRupee />}
            color="emerald"
          />
          <StatsCard
            title="Previous Payment"
            value={`₹ ${Number(data.stats.todayStats.previousPayments).toLocaleString("en-IN")}`}
            icon={<History />}
            color="purple"
          />

          <StatsCard
            title="Due Today"
            value={data.reminderStats?.dueToday || 0}
            icon={<Bell />}
            color="yellow"
            navigateTo="/reminders?filter=Today"
          />
          <StatsCard
            title="Due This Week"
            value={data.reminderStats?.dueThisWeek || 0}
            icon={<FiCalendar />}
            color="blue"
            navigateTo="/reminders?filter=Upcoming"
          />
          <StatsCard
            title="Overdue"
            value={data.reminderStats?.overdue || 0}
            icon={<AlertTriangle />}
            color="red"
            navigateTo="/reminders?filter=Overdue"
          />
        </div>
      )}

      {/* ── Charts Row ── */}
      {["owner", "admin"].includes(role) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 3xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 mb-4 xs:mb-6 sm:mb-8">
          {/* Business Analytics — takes 2 of 3 cols on lg+ */}
          <div className="lg:col-span-2 bg-white rounded-2xl xs:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 xs:p-4 sm:p-5 md:p-6 pb-4 flex flex-col xs:flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 mb-4 xs:mb-6 gap-3 xs:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-100">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                    Business Analytics
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black text-blue-600">{`₹ ${Math.floor(periodTotal).toLocaleString("en-IN")}`}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Period Total
                    </span>
                  </div>
                </div>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full sm:w-auto text-[10px] font-black uppercase tracking-wider bg-slate-100 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 cursor-auto"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>
            <div className="px-3 xs:px-4 sm:px-6 pb-4 xs:pb-6 flex-1">
              <div className="h-44 xs:h-52 sm:h-56 md:h-64 lg:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredRevenue}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="paidGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        const day = d.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        if (timeRange === "30") return d.getDate();
                        return `${day} ${d.getDate()}`;
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      domain={[0, "auto"]}
                      allowDecimals={false}
                      tickFormatter={(v) =>
                        `₹${v >= 1000 ? `${v / 1000}k` : v}`
                      }
                    />

                    <RechartsTooltip content={CustomTooltip} />

                    <Bar
                      dataKey="invoiced"
                      fill="#e2e8f0"
                      radius={[6, 6, 0, 0]}
                    />

                    <Area
                      dataKey="paid"
                      type="monotone"
                      stroke="none"
                      fill="url(#paidGradient)"
                      tooltipType="none"
                    />

                    <Line
                      dataKey="paid"
                      type="monotone"
                      stroke="#10b981"
                      strokeWidth={4}
                      dot={{
                        r: 4,
                        stroke: "#fff",
                        strokeWidth: 2,
                        fill: "#10b981",
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Job Distribution — takes 1 of 3 cols on lg+ */}
          <div className="bg-white rounded-2xl xs:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 xs:p-4 sm:p-5 md:p-6 pb-4 flex items-center gap-3 border-b border-slate-50 mb-4 xs:mb-6">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shadow-emerald-100">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                  Job Distribution
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Workload Status
                </p>
              </div>
            </div>
            <div className="px-3 xs:px-4 sm:px-6 pb-4 xs:pb-6">
              <div className="h-44 xs:h-52 sm:h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.serviceBreakdown}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.serviceBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR}
                          cornerRadius={6}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 xs:grid-cols-2">
                {data.serviceBreakdown.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                  >
                    <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                      {/* Status Dot */}
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.name] || DEFAULT_COLOR,
                        }}
                      />

                      {/* Service Name */}
                      <span className="truncate  text-[10px] font-black uppercase text-slate-700">
                        {item.name} {" : "}
                      </span>

                      {/* Service Value (Pushed to the right) */}
                      <span className="ml-1 text-[10px] font-black text-slate-800">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Row: Recent Activity + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 3xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 items-start">
        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl xs:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-800/50 text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100">
                <History size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                  Recent Activity
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Latest service logs
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/services")}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
            >
              View History
            </button>
          </div>
          <RecentServices services={data.recentServices} />
        </div>

        {/* Sidebar — 1 col */}

        <div className="space-y-4 sm:space-y-6">
          {user?.role !== "mechanic" && user?.role !== "advisor" && (
            <PendingApprovals inspections={inspections} />
          )}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm shadow-red-100">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                    Critical Inventory
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Action Required
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/inventory")}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 dark:bg-red-950/50 hover:bg-red-600 hover:text-white rounded-xl transition-all"
              >
                Manage
              </button>
            </div>
            <div className="px-4 pb-4">
              <LowStockAlert items={data.lowStockItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
