"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";

/*
  API CONFIGURATION

  Local development:
  http://127.0.0.1:8000

  Production:
  Vercel uses:
  NEXT_PUBLIC_API_BASE_URL
*/
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type Visitor = {
  visitor_id: string;
  name: string;
  phone: string;
  email: string;
  person_to_visit: string;
  purpose: string;
  status: string;
  entry_time: string | null;
  exit_time: string | null;
  created_at?: string | null;
};

type RepeatVisitor = {
  name: string;
  phone: string;
  visit_count: number;
};

type SecurityAlert = {
  type: string;
  visitor: string;
  message: string;
  severity: string;
};

type Analytics = {
  total_visitors: number;
  currently_inside: number;
  checked_out: number;
  pending: number;
  average_visit_minutes: number;
  longest_visit_minutes: number;
  longest_visit_name: string | null;
  most_visited_person: string | null;
  person_visit_counts: Record<string, number>;
  repeat_visitors: RepeatVisitor[];
  security_alerts: SecurityAlert[];
  alert_summary: {
    high: number;
    medium: number;
    low: number;
  };
};

type FilterType =
  | "All Visitors"
  | "Checked In"
  | "Checked Out"
  | "Not Checked In";

export default function Home() {
  const [authChecking, setAuthChecking] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    person_to_visit: "",
    purpose: "",
  });

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [selectedVisitor, setSelectedVisitor] =
    useState<Visitor | null>(null);

  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const [message, setMessage] = useState("");
  const [registerWarning, setRegisterWarning] =
    useState("");

  const [visitorId, setVisitorId] = useState("");
  const [registeredVisitorName, setRegisteredVisitorName] =
    useState("");

  const [returningVisitor, setReturningVisitor] =
    useState(false);

  const [previousVisits, setPreviousVisits] =
    useState(0);

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("All Visitors");

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  /*
    =====================================================
    ADMIN AUTHENTICATION
    =====================================================
  */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loggedIn =
      window.sessionStorage.getItem("adminLoggedIn");

    if (loggedIn === "true") {
      setAuthChecking(false);
    } else {
      window.location.replace("/login");
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("userRole");

    window.location.replace("/login");
  };

  /*
    =====================================================
    FETCH VISITORS
    =====================================================
  */

  const fetchVisitors = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/visitors`
      );

      if (!response.ok) {
        throw new Error("Failed to load visitors");
      }

      const data = await response.json();

      setVisitors(data);
    } catch (error) {
      console.error("Fetch visitors error:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
    =====================================================
    FETCH ANALYTICS
    =====================================================
  */

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/analytics`
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Fetch analytics error:",
        error
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /*
    =====================================================
    INITIAL DASHBOARD LOAD
    =====================================================
  */

  useEffect(() => {
    if (!authChecking) {
      fetchVisitors();
      fetchAnalytics();
    }
  }, [authChecking]);

  /*
    =====================================================
    REFRESH DASHBOARD
    =====================================================
  */

  const refreshDashboard = async () => {
    await Promise.all([
      fetchVisitors(),
      fetchAnalytics(),
    ]);
  };

  /*
    =====================================================
    FORM INPUT
    =====================================================
  */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRegisterWarning("");

    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNumbers = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setFormData((previous) => ({
        ...previous,
        phone: onlyNumbers,
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
    =====================================================
    REGISTER VISITOR
    =====================================================
  */

  const registerVisitor = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setRegisterWarning("");

    const phone = formData.phone.trim();
    const email = formData.email
      .trim()
      .toLowerCase();

    /*
      PHONE VALIDATION
    */

    if (!/^\d{10}$/.test(phone)) {
      setMessage(
        "Phone number must contain exactly 10 digits."
      );

      setRegisterWarning(
        "⚠️ Phone number must contain exactly 10 digits."
      );

      return;
    }

    /*
      GMAIL VALIDATION
    */

    if (
      !/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(
        email
      )
    ) {
      setMessage(
        "Please enter a valid Gmail address ending with @gmail.com."
      );

      setRegisterWarning(
        "⚠️ Please enter a valid Gmail address ending with @gmail.com."
      );

      return;
    }

    try {
      setLoading(true);

      setMessage("Registering visitor...");

      const response = await fetch(
        `${API_BASE_URL}/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...formData,
            phone,
            email,
          }),
        }
      );

      const data = await response.json();

      /*
        =================================================
        EXISTING PENDING VISIT
        =================================================
      */

      if (
        response.status === 409 &&
        data.detail?.code ===
          "VISITOR_REGISTRATION_INCOMPLETE"
      ) {
        setVisitorId("");
        setReturningVisitor(false);
        setPreviousVisits(0);
        setRegisteredVisitorName("");

        setMessage(
          `⚠️ ${data.detail.message}`
        );

        setRegisterWarning(
          `⚠️ Registration blocked. ${data.detail.message} Complete the current visit before registering again.`
        );

        return;
      }

      /*
        =================================================
        VISITOR ALREADY INSIDE
        =================================================
      */

      if (
        response.status === 409 &&
        data.detail?.code ===
          "VISITOR_ALREADY_INSIDE"
      ) {
        setVisitorId("");
        setReturningVisitor(false);
        setPreviousVisits(0);
        setRegisteredVisitorName("");

        setMessage(
          `⚠️ ${data.detail.message}`
        );

        setRegisterWarning(
          `⚠️ Registration blocked. ${data.detail.message} Please check out the current visit before registering a new visit.`
        );

        return;
      }

      /*
        =================================================
        OTHER API ERRORS
        =================================================
      */

      if (!response.ok) {
        const errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.message ||
              "Registration failed.";

        setMessage(errorMessage);

        setRegisterWarning(
          `⚠️ ${errorMessage}`
        );

        return;
      }

      /*
        =================================================
        SUCCESS
        =================================================
      */

      setVisitorId(
        data.visitor_id || ""
      );

      setReturningVisitor(
        Boolean(data.returning_visitor)
      );

      setPreviousVisits(
        Number(data.previous_visits || 0)
      );

      setRegisteredVisitorName(
        data.visitor?.name ||
          data.visitor_name ||
          formData.name
      );

      if (data.returning_visitor) {
        setMessage(
          `Welcome back, ${
            data.visitor_name ||
            data.visitor?.name ||
            formData.name
          }! Previous visits: ${
            data.previous_visits || 0
          }. New visit registered successfully.`
        );
      } else {
        setMessage(
          "Visitor registered successfully!"
        );
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        person_to_visit: "",
        purpose: "",
      });

      await refreshDashboard();
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setMessage(
        "Cannot connect to backend."
      );

      setRegisterWarning(
        "⚠️ Cannot connect to backend. Please check that the Render backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    =====================================================
    LOAD SINGLE VISITOR
    =====================================================
  */

  const loadVisitor = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/visitor/${id}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Visitor not found."
        );

        return;
      }

      setSelectedVisitor(data);
    } catch (error) {
      console.error(
        "Load visitor error:",
        error
      );

      setMessage(
        "Unable to connect to backend."
      );
    }
  };

  /*
    =====================================================
    CHECK IN
    =====================================================
  */

  const checkIn = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/check-in/${id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      setMessage(
        data.message ||
          "Check-in completed."
      );

      await refreshDashboard();
      await loadVisitor(id);
    } catch (error) {
      console.error(
        "Check-in error:",
        error
      );

      setMessage("Check-in failed.");
    }
  };

  /*
    =====================================================
    CHECK OUT
    =====================================================
  */

  const checkOut = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/check-out/${id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      setMessage(
        data.message ||
          "Check-out completed."
      );

      await refreshDashboard();
      await loadVisitor(id);
    } catch (error) {
      console.error(
        "Check-out error:",
        error
      );

      setMessage("Check-out failed.");
    }
  };

  /*
    =====================================================
    QR SCANNER
    =====================================================
  */

  const startScanner = async () => {
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const {
          Html5Qrcode,
        } = await import(
          "html5-qrcode"
        );

        const scanner =
          new Html5Qrcode(
            "qr-reader"
          );

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,

            qrbox: {
              width: 250,
              height: 250,
            },
          },

          async (decodedText) => {
            try {
              await scanner.stop();
            } catch {}

            setScannerOpen(false);

            let id =
              decodedText.trim();

            if (
              id.startsWith("VISITOR:")
            ) {
              id = id.replace(
                "VISITOR:",
                ""
              );
            }

            await loadVisitor(id);
          },

          () => {}
        );
      } catch (error) {
        console.error(
          "QR scanner error:",
          error
        );

        setScannerOpen(false);

        setMessage(
          "Unable to access camera. Please allow camera permission."
        );
      }
    }, 300);
  };

  /*
    =====================================================
    DASHBOARD COUNTS
    =====================================================
  */

  const totalVisitors =
    analytics?.total_visitors ??
    visitors.length;

  const currentlyInside =
    analytics?.currently_inside ??
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Checked In"
    ).length;

  const checkedOut =
    analytics?.checked_out ??
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Checked Out"
    ).length;

  const notCheckedIn =
    analytics?.pending ??
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Not Checked In"
    ).length;

  /*
    =====================================================
    SEARCH + FILTER
    =====================================================
  */

  const filteredVisitors =
    visitors.filter((visitor) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        searchText === "" ||
        visitor.name
          .toLowerCase()
          .includes(searchText) ||
        visitor.phone.includes(
          searchText
        ) ||
        visitor.email
          .toLowerCase()
          .includes(searchText) ||
        visitor.purpose
          .toLowerCase()
          .includes(searchText) ||
        visitor.person_to_visit
          .toLowerCase()
          .includes(searchText);

      const matchesFilter =
        activeFilter ===
          "All Visitors" ||
        visitor.status ===
          activeFilter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  /*
    =====================================================
    DATE FORMAT
    =====================================================
  */

  const formatDate = (
    value: string | null
  ) => {
    if (!value) return "-";

    return new Date(
      value
    ).toLocaleString();
  };

  /*
    =====================================================
    SIDEBAR NAVIGATION
    =====================================================
  */

  const scrollToSection = (
    id: string
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    setSidebarOpen(false);
  };

  /*
    =====================================================
    AUTH LOADING SCREEN
    =====================================================
  */

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="text-sm text-slate-400">
            Verifying admin session...
          </p>
        </div>
      </main>
    );
  }

  /*
    =====================================================
    MAIN DASHBOARD
    =====================================================
  */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-40 flex items-center justify-between bg-slate-950 px-5 py-4 text-white shadow-lg lg:hidden">
        <div>
          <h1 className="text-lg font-bold">
            Smart Visitor
          </h1>

          <p className="text-xs text-slate-400">
            AI Management
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
          className="rounded-lg p-2 hover:bg-slate-800"
        >
          {sidebarOpen ? (
            <X />
          ) : (
            <Menu />
          )}
        </button>
      </header>

      {/* SIDEBAR */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-950 p-6 text-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h1 className="font-bold">
              Smart Visitor
            </h1>

            <p className="text-xs text-slate-400">
              AI Management
            </p>
          </div>
        </div>

        <nav className="space-y-2">

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "dashboard"
              )
            }
            className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-left"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "register"
              )
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <UserPlus size={19} />
            Register Visitor
          </button>

          <button
            type="button"
            onClick={
              startScanner
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <ScanLine size={19} />
            QR Scanner
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "analytics"
              )
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <Brain size={19} />
            AI Analytics
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "records"
              )
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <Users size={19} />
            Visitor Records
          </button>

        </nav>

        <div className="absolute bottom-6 left-6 right-6">

          <div className="mb-3 rounded-2xl bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <Activity size={16} />

              <span className="text-sm">
                System Online
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              AI Visitor Security
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN */}

      <main
        id="dashboard"
        className="p-5 md:p-8 lg:ml-64"
      >

        {/* TOP BAR */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Security Control Center
            </p>

            <h2 className="text-3xl font-bold">
              Visitor Dashboard
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitor visitor activity and security
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                refreshDashboard
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
            >
              <RefreshCw
                size={18}
                className={
                  loading ||
                  analyticsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                startScanner
              }
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-white hover:bg-slate-800"
            >
              <ScanLine size={19} />
              Scan QR
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              <LogOut size={19} />
              Logout
            </button>

          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
            {message}
          </div>
        )}

        {/* STATISTICS */}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Visitors"
            value={
              totalVisitors
            }
            icon={<Users />}
            iconClass="bg-blue-100 text-blue-600"
          />

          <StatCard
            title="Currently Inside"
            value={
              currentlyInside
            }
            icon={<UserCheck />}
            iconClass="bg-green-100 text-green-600"
          />

          <StatCard
            title="Checked Out"
            value={
              checkedOut
            }
            icon={<LogOut />}
            iconClass="bg-purple-100 text-purple-600"
          />

          <StatCard
            title="Security Alerts"
            value={
              analytics
                ?.security_alerts
                ?.length ?? 0
            }
            icon={
              <AlertTriangle />
            }
            iconClass="bg-orange-100 text-orange-600"
          />

        </div>

        {/* AI ANALYTICS */}

        <section
          id="analytics"
          className="mb-8 rounded-3xl bg-slate-950 p-6 text-white md:p-8"
        >

          <div className="mb-8 flex items-center justify-between">

            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-blue-600 p-3">
                <Brain size={27} />
              </div>

              <div>
                <h3 className="text-2xl font-bold">
                  AI Security Analytics
                </h3>

                <p className="text-sm text-slate-400">
                  Intelligent visitor activity monitoring
                </p>
              </div>

            </div>

            <div className="hidden items-center gap-2 text-sm text-green-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Analytics Active
            </div>

          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* VISIT METRICS */}

            <div className="rounded-2xl bg-slate-900 p-6">

              <div className="mb-5 flex items-center gap-2">
                <Clock3 className="text-blue-400" />

                <h4 className="font-semibold">
                  Visit Metrics
                </h4>
              </div>

              <div className="space-y-5">

                <div>
                  <p className="text-sm text-slate-400">
                    Average Visit
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {
                      analytics?.average_visit_minutes ??
                      0
                    }

                    <span className="text-sm text-slate-400">
                      {" "}min
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Longest Visit
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {
                      analytics?.longest_visit_minutes ??
                      0
                    }

                    <span className="text-sm text-slate-400">
                      {" "}min
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      analytics?.longest_visit_name ||
                      "-"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Most Visited Person
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      analytics?.most_visited_person ||
                      "-"
                    }
                  </p>
                </div>

              </div>
            </div>

            {/* VISITOR ACTIVITY */}

            <div className="rounded-2xl bg-slate-900 p-6">

              <div className="mb-5 flex items-center gap-2">
                <BarChart3 className="text-purple-400" />

                <h4 className="font-semibold">
                  Visitor Activity
                </h4>
              </div>

              <div className="space-y-4">

                {analytics &&
                  Object.entries(
                    analytics.person_visit_counts
                  ).map(
                    ([person, count]) => {

                      const values =
                        Object.values(
                          analytics.person_visit_counts
                        );

                      const maximum =
                        values.length > 0
                          ? Math.max(
                              ...values
                            )
                          : 1;

                      const width =
                        (count /
                          maximum) *
                        100;

                      return (
                        <div
                          key={person}
                        >
                          <div className="mb-2 flex justify-between text-sm">
                            <span>
                              {person}
                            </span>

                            <span className="text-slate-400">
                              {count}
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}

                {(!analytics ||
                  Object.keys(
                    analytics.person_visit_counts
                  ).length === 0) && (
                  <p className="text-sm text-slate-500">
                    No visitor activity yet.
                  </p>
                )}

              </div>
            </div>

            {/* SECURITY */}

            <div className="rounded-2xl bg-slate-900 p-6">

              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="text-green-400" />

                <h4 className="font-semibold">
                  Security Monitoring
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3">

                <AlertBox
                  title="High"
                  value={
                    analytics
                      ?.alert_summary
                      .high ?? 0
                  }
                  className="text-red-400"
                />

                <AlertBox
                  title="Medium"
                  value={
                    analytics
                      ?.alert_summary
                      .medium ?? 0
                  }
                  className="text-orange-400"
                />

                <AlertBox
                  title="Low"
                  value={
                    analytics
                      ?.alert_summary
                      .low ?? 0
                  }
                  className="text-yellow-400"
                />

              </div>

              <div className="mt-5 rounded-xl bg-green-500/10 p-4">

                <div className="flex items-center gap-3">

                  <CheckCircle2 className="text-green-400" />

                  <div>
                    <p className="font-semibold text-green-400">
                      No Active Alerts
                    </p>

                    <p className="text-xs text-slate-400">
                      Security monitoring is active.
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* REPEAT VISITORS */}

          {analytics &&
            analytics.repeat_visitors
              .length > 0 && (
              <div className="mt-6 rounded-2xl bg-slate-900 p-6">

                <h4 className="mb-4 font-semibold">
                  Repeat Visitor Analysis
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  {analytics.repeat_visitors.map(
                    (visitor) => (
                      <div
                        key={
                          visitor.phone
                        }
                        className="rounded-xl bg-slate-800 p-4"
                      >
                        <p className="font-semibold">
                          {visitor.name}
                        </p>

                        <p className="text-sm text-slate-400">
                          {visitor.phone}
                        </p>

                        <p className="mt-2 text-sm text-blue-400">
                          {
                            visitor.visit_count
                          }{" "}
                          visits
                        </p>
                      </div>
                    )
                  )}

                </div>
              </div>
            )}

        </section>

        {/* REGISTER + SCANNER */}

        <section
          id="register"
          className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2"
        >

          {/* REGISTER */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6">

            <div className="mb-6 flex items-center gap-3">

              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <UserPlus />
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  Register Visitor
                </h3>

                <p className="text-sm text-slate-500">
                  Create a secure visitor identity
                </p>
              </div>

            </div>

            <form
              onSubmit={
                registerVisitor
              }
              className="space-y-4"
            >

              <input
                required
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                placeholder="Visitor Name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                type="tel"
                inputMode="numeric"
                name="phone"
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                maxLength={10}
                placeholder="Phone Number (10 digits)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                type="email"
                name="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                placeholder="Gmail (example@gmail.com)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                name="person_to_visit"
                value={
                  formData.person_to_visit
                }
                onChange={
                  handleChange
                }
                placeholder="Person to Visit"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                name="purpose"
                value={
                  formData.purpose
                }
                onChange={
                  handleChange
                }
                placeholder="Purpose of Visit"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <QrCode size={19} />

                {loading
                  ? "Registering..."
                  : "Register & Generate QR"}
              </button>

            </form>

            {/* WARNING */}

            {registerWarning && (
              <div
                role="alert"
                className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-4 text-amber-900"
              >
                <div className="flex items-start gap-3">

                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>

                    <p className="font-bold">
                      Registration Warning
                    </p>

                    <p className="mt-1 text-sm">
                      {registerWarning.replace(
                        "⚠️ ",
                        ""
                      )}
                    </p>

                  </div>
                </div>
              </div>
            )}

            {/* QR RESULT */}

            {visitorId && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                {returningVisitor && (
                  <div className="mb-4 rounded-xl bg-blue-50 p-4">

                    <p className="font-bold text-blue-800">
                      Welcome back,{" "}
                      {
                        registeredVisitorName
                      }!
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      Previous visits:{" "}
                      {
                        previousVisits
                      }
                    </p>

                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Visitor ID
                </p>

                <p className="mt-1 break-all font-mono text-sm">
                  {visitorId}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    <QrCode size={17} />
                    View QR
                  </a>

                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}/download`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800"
                  >
                    <QrCode size={17} />
                    Download QR
                  </a>

                </div>
              </div>
            )}

          </div>

          {/* SCANNER */}

          <div className="rounded-3xl bg-slate-950 p-6 text-white">

            <div className="mb-6 flex items-center gap-3">

              <div className="rounded-xl bg-blue-600 p-3">
                <ScanLine />
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  Security QR Scanner
                </h3>

                <p className="text-sm text-slate-400">
                  Scan visitor identity
                </p>
              </div>

            </div>

            {selectedVisitor ? (
              <div className="rounded-2xl bg-white p-5 text-slate-900">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      Visitor
                    </p>

                    <h4 className="mt-1 text-2xl font-bold">
                      {
                        selectedVisitor.name
                      }
                    </h4>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    VERIFIED
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  <p className="flex items-center gap-3 text-sm">
                    <Phone size={17} />
                    {
                      selectedVisitor.phone
                    }
                  </p>

                  <p className="flex items-center gap-3 text-sm">
                    <Mail size={17} />
                    {
                      selectedVisitor.email
                    }
                  </p>

                  <p className="flex items-center gap-3 text-sm">
                    <CalendarDays size={17} />
                    {
                      selectedVisitor.purpose
                    }
                  </p>

                </div>

                <div className="mt-6">

                  {selectedVisitor.status ===
                    "Not Checked In" && (
                    <button
                      type="button"
                      onClick={() =>
                        checkIn(
                          selectedVisitor.visitor_id
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                    >
                      <LogIn size={18} />
                      Check In
                    </button>
                  )}

                  {selectedVisitor.status ===
                    "Checked In" && (
                    <button
                      type="button"
                      onClick={() =>
                        checkOut(
                          selectedVisitor.visitor_id
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700"
                    >
                      <LogOut size={18} />
                      Check Out
                    </button>
                  )}

                  {selectedVisitor.status ===
                    "Checked Out" && (
                    <div className="rounded-xl bg-slate-100 py-3 text-center font-semibold text-slate-600">
                      Visit Completed
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 text-center">

                <QrCode
                  size={70}
                  className="mb-5 text-slate-600"
                />

                <p className="mb-5 text-slate-400">
                  Scan a visitor QR code
                </p>

                <button
                  type="button"
                  onClick={
                    startScanner
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
                >
                  Start Camera Scanner
                </button>

              </div>
            )}

          </div>

        </section>

        {/* VISITOR RECORDS */}

        <section
          id="records"
          className="rounded-3xl border border-slate-200 bg-white"
        >

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h3 className="text-xl font-bold">
                  Visitor Records
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Registered visitor activity
                </p>
              </div>

              <div className="flex gap-3">

                <div className="relative">

                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search visitors..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    refreshDashboard
                  }
                  className="rounded-xl border border-slate-200 px-4 hover:bg-slate-50"
                >
                  <RefreshCw
                    size={18}
                    className={
                      loading ||
                      analyticsLoading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>

              </div>

            </div>

            {/* FILTER BUTTONS */}

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

              <FilterButton
                label="All Visitors"
                count={
                  totalVisitors
                }
                active={
                  activeFilter ===
                  "All Visitors"
                }
                onClick={() =>
                  setActiveFilter(
                    "All Visitors"
                  )
                }
                icon={
                  <Users size={17} />
                }
              />

              <FilterButton
                label="Checked In"
                count={
                  currentlyInside
                }
                active={
                  activeFilter ===
                  "Checked In"
                }
                onClick={() =>
                  setActiveFilter(
                    "Checked In"
                  )
                }
                icon={
                  <UserCheck
                    size={17}
                  />
                }
              />

              <FilterButton
                label="Checked Out"
                count={
                  checkedOut
                }
                active={
                  activeFilter ===
                  "Checked Out"
                }
                onClick={() =>
                  setActiveFilter(
                    "Checked Out"
                  )
                }
                icon={
                  <LogOut size={17} />
                }
              />

              <FilterButton
                label="Not Checked In"
                count={
                  notCheckedIn
                }
                active={
                  activeFilter ===
                  "Not Checked In"
                }
                onClick={() =>
                  setActiveFilter(
                    "Not Checked In"
                  )
                }
                icon={
                  <UserX size={17} />
                }
              />

            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Visitor
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Contact
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Purpose
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Status
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Entry
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Exit
                  </th>

                  <th className="p-4 text-left text-xs uppercase text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredVisitors.map(
                  (visitor) => (
                    <tr
                      key={
                        visitor.visitor_id
                      }
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="p-4">

                        <p className="font-semibold">
                          {
                            visitor.name
                          }
                        </p>

                        <p className="mt-1 max-w-[180px] truncate font-mono text-xs text-slate-400">
                          {
                            visitor.visitor_id
                          }
                        </p>

                      </td>

                      <td className="p-4">

                        <p className="text-sm">
                          {
                            visitor.phone
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          {
                            visitor.email
                          }
                        </p>

                      </td>

                      <td className="p-4">

                        <p className="text-sm font-medium">
                          {
                            visitor.purpose
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          To:{" "}
                          {
                            visitor.person_to_visit
                          }
                        </p>

                      </td>

                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            visitor.status ===
                            "Checked In"
                              ? "bg-green-100 text-green-700"
                              : visitor.status ===
                                "Checked Out"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {
                            visitor.status
                          }
                        </span>

                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {
                          formatDate(
                            visitor.entry_time
                          )
                        }
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {
                          formatDate(
                            visitor.exit_time
                          )
                        }
                      </td>

                      <td className="p-4">

                        <div className="flex gap-2">

                          <a
                            href={`${API_BASE_URL}/qr/${visitor.visitor_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                          >
                            <QrCode
                              size={17}
                            />
                          </a>

                          {visitor.status ===
                            "Not Checked In" && (
                            <button
                              type="button"
                              onClick={() =>
                                checkIn(
                                  visitor.visitor_id
                                )
                              }
                              className="rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-green-700"
                            >
                              Check In
                            </button>
                          )}

                          {visitor.status ===
                            "Checked In" && (
                            <button
                              type="button"
                              onClick={() =>
                                checkOut(
                                  visitor.visitor_id
                                )
                              }
                              className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700"
                            >
                              Check Out
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

                {filteredVisitors.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-slate-500"
                    >
                      No visitors found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        <footer className="py-8 text-center text-sm text-slate-400">
          AI Smart Visitor Management System • Secure QR-Based Visitor Tracking
        </footer>

      </main>

      {/* QR SCANNER MODAL */}

      {scannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="text-xl font-bold">
                  Scan Visitor QR
                </h3>

                <p className="text-sm text-slate-500">
                  Point the camera at the QR code
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setScannerOpen(
                    false
                  )
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X />
              </button>

            </div>

            <div
              id="qr-reader"
              className="overflow-hidden rounded-xl"
            />

          </div>

        </div>
      )}

    </div>
  );
}

/*
=====================================================
STAT CARD
=====================================================
*/

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/*
=====================================================
ALERT BOX
=====================================================
*/

function AlertBox({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800 p-3 text-center">

      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p
        className={`text-xl font-bold ${className}`}
      >
        {value}
      </p>

    </div>
  );
}

/*
=====================================================
FILTER BUTTON
=====================================================
*/

function FilterButton({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: FilterType;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >

      <span className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </span>

      <span
        className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
          active
            ? "bg-white text-blue-600"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>

    </button>
  );
}