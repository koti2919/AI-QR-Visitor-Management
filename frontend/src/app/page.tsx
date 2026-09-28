"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  LayoutDashboard,
  UserPlus,
  QrCode,
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  ScanLine,
  LogIn,
  LogOut,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  Activity,
  Menu,
  X,
  Brain,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

// ======================================================
// TYPES
// ======================================================

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
};

type SecurityAlert = {
  type: string;
  visitor: string;
  message: string;
  severity: string;
};

type RepeatVisitor = {
  name: string;
  phone: string;
  visit_count: number;
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

type VisitorFilter =
  | "All Visitors"
  | "Checked In"
  | "Checked Out"
  | "Not Checked In";

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Home() {
  // ====================================================
  // AUTHENTICATION
  // ====================================================

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loggedIn = window.sessionStorage.getItem("adminLoggedIn");

    console.log("Admin session:", loggedIn);

    if (loggedIn === "true") {
      setAuthChecking(false);
      return;
    }

    window.location.replace("/login");
  }, []);

  // ====================================================
  // FORM
  // ====================================================

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    person_to_visit: "",
    purpose: "",
  });

  // ====================================================
  // VISITORS
  // ====================================================

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] =
    useState<Visitor | null>(null);

  // ====================================================
  // ANALYTICS
  // ====================================================

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ====================================================
  // UI
  // ====================================================

  const [visitorId, setVisitorId] = useState("");
  const [returningVisitor, setReturningVisitor] = useState(false);
  const [previousVisits, setPreviousVisits] = useState(0);
  const [registeredVisitorName, setRegisteredVisitorName] = useState("");

  const [message, setMessage] = useState("");
  const [registerWarning, setRegisterWarning] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeFilter, setActiveFilter] =
    useState<VisitorFilter>("All Visitors");

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("userRole");

    window.location.replace("/login");
  };

  // ====================================================
  // FETCH VISITORS
  // ====================================================

  const fetchVisitors = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/visitors`);

      if (!response.ok) {
        throw new Error("Failed to fetch visitors");
      }

      const data = await response.json();
      setVisitors(data);
    } catch (error) {
      console.error("Visitor fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FETCH ANALYTICS
  // ====================================================

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const response = await fetch(`${API_BASE_URL}/analytics`);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    if (!authChecking) {
      fetchVisitors();
      fetchAnalytics();
    }
  }, [authChecking]);

  // ====================================================
  // REFRESH
  // ====================================================

  const refreshDashboard = async () => {
    await Promise.all([fetchVisitors(), fetchAnalytics()]);
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRegisterWarning("");

    const { name, value } = e.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setFormData({
        ...formData,
        phone: digitsOnly,
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ====================================================
  // REGISTER VISITOR
  // ====================================================

  const registerVisitor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setRegisterWarning("");

    if (!/^\d{10}$/.test(formData.phone)) {
      setMessage("Phone number must contain exactly 10 digits.");

      setRegisterWarning(
        "⚠️ Phone number must contain exactly 10 digits."
      );

      return;
    }

    if (
      !/^[A-Za-z0-9._%+-]+@gmail\.com$/.test(
        formData.email.trim()
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

    setMessage("Registering visitor...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 409 &&
          data.detail?.code ===
            "VISITOR_REGISTRATION_INCOMPLETE"
        ) {
          setVisitorId("");
          setReturningVisitor(false);
          setPreviousVisits(0);
          setRegisteredVisitorName("");

          setMessage(`⚠️ ${data.detail.message}`);

          setRegisterWarning(
            `⚠️ Registration blocked. ${data.detail.message} Complete the current visit before registering again.`
          );

          return;
        }

        if (
          response.status === 409 &&
          data.detail?.code === "VISITOR_ALREADY_INSIDE"
        ) {
          setVisitorId("");
          setReturningVisitor(false);
          setPreviousVisits(0);
          setRegisteredVisitorName("");

          setMessage(`⚠️ ${data.detail.message}`);

          setRegisterWarning(
            `⚠️ Registration blocked. ${data.detail.message} Please check out the current visit before registering a new visit.`
          );

          return;
        }

        const errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.message || "Registration failed.";

        setMessage(errorMessage);
        setRegisterWarning(`⚠️ ${errorMessage}`);

        return;
      }

      setRegisterWarning("");

      setVisitorId(data.visitor_id);

      setReturningVisitor(Boolean(data.returning_visitor));

      setPreviousVisits(Number(data.previous_visits || 0));

      setRegisteredVisitorName(
        data.visitor?.name || formData.name
      );

      if (data.returning_visitor) {
        setMessage(
          `Welcome back, ${
            data.visitor_name ||
            data.visitor?.name ||
            formData.name
          }! Previous visits: ${Number(
            data.previous_visits || 0
          )}. New visit registered successfully.`
        );
      } else {
        setMessage("Visitor registered successfully!");
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        person_to_visit: "",
        purpose: "",
      });

      setActiveFilter("All Visitors");

      await refreshDashboard();
    } catch (error) {
      console.error(error);

      setMessage("Cannot connect to backend.");
    }
  };

  // ====================================================
  // LOAD SINGLE VISITOR
  // ====================================================

  const loadVisitor = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/visitor/${id}`
      );

      const data = await response.json();

      if (response.ok && data.visitor_id) {
        setSelectedVisitor(data);
      } else {
        setMessage("Visitor not found.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load visitor.");
    }
  };

  // ====================================================
  // CHECK IN
  // ====================================================

  const checkIn = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/check-in/${id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      setMessage(data.message);

      await refreshDashboard();
      await loadVisitor(id);
    } catch (error) {
      console.error(error);
      setMessage("Check-in failed.");
    }
  };

  // ====================================================
  // CHECK OUT
  // ====================================================

  const checkOut = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/check-out/${id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      setMessage(data.message);

      await refreshDashboard();
      await loadVisitor(id);
    } catch (error) {
      console.error(error);
      setMessage("Check-out failed.");
    }
  };

  // ====================================================
  // QR SCANNER
  // ====================================================

  const startScanner = async () => {
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        const scanner = new Html5Qrcode("qr-reader");

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

            let id = decodedText;

            if (decodedText.startsWith("VISITOR:")) {
              id = decodedText.replace("VISITOR:", "");
            }

            await loadVisitor(id);
          },
          () => {}
        );
      } catch (error) {
        console.error("Scanner error:", error);

        setScannerOpen(false);

        setMessage(
          "Unable to access camera. Please allow camera permission."
        );
      }
    }, 300);
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const allVisitorsCount = visitors.length;

  const checkedInCount = visitors.filter(
    (visitor) => visitor.status === "Checked In"
  ).length;

  const checkedOutCount = visitors.filter(
    (visitor) => visitor.status === "Checked Out"
  ).length;

  const notCheckedInCount = visitors.filter(
    (visitor) => visitor.status === "Not Checked In"
  ).length;

  // ====================================================
  // FILTER VISITORS
  // ====================================================

  const filteredVisitors = visitors.filter((visitor) => {
    const value = search.toLowerCase().trim();

    const matchesSearch =
      value === "" ||
      visitor.name.toLowerCase().includes(value) ||
      visitor.phone.includes(search) ||
      visitor.email.toLowerCase().includes(value) ||
      visitor.purpose.toLowerCase().includes(value) ||
      visitor.person_to_visit.toLowerCase().includes(value);

    const matchesFilter =
      activeFilter === "All Visitors" ||
      visitor.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const filterButtons: {
    label: VisitorFilter;
    count: number;
    icon: ReactNode;
  }[] = [
    {
      label: "All Visitors",
      count: allVisitorsCount,
      icon: <Users size={17} />,
    },
    {
      label: "Checked In",
      count: checkedInCount,
      icon: <UserCheck size={17} />,
    },
    {
      label: "Checked Out",
      count: checkedOutCount,
      icon: <LogOut size={17} />,
    },
    {
      label: "Not Checked In",
      count: notCheckedInCount,
      icon: <UserX size={17} />,
    },
  ];

  // ====================================================
  // DATE FORMAT
  // ====================================================

  const formatDate = (value: string | null) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  };

  // ====================================================
  // NAVIGATION
  // ====================================================

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setSidebarOpen(false);
  };

  // ====================================================
  // AUTH LOADING SCREEN
  // ====================================================

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

  // ====================================================
  // RETURN UI
  // ====================================================

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
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 hover:bg-slate-800"
          type="button"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* SIDEBAR */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-950 p-6 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* LOGO */}

        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Smart Visitor
              </h1>

              <p className="text-xs text-slate-400">
                AI Management
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="space-y-2">
          <button
            onClick={() =>
              scrollToSection("dashboard")
            }
            className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-left"
            type="button"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            onClick={() =>
              scrollToSection("register")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
            type="button"
          >
            <UserPlus size={19} />
            Register Visitor
          </button>

          <button
            onClick={startScanner}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
            type="button"
          >
            <ScanLine size={19} />
            QR Scanner
          </button>

          <button
            onClick={() =>
              scrollToSection("analytics")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
            type="button"
          >
            <Brain size={19} />
            AI Analytics
          </button>

          <button
            onClick={() =>
              scrollToSection("records")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
            type="button"
          >
            <Users size={19} />
            Visitor Records
          </button>
        </nav>

        {/* ADMIN / LOGOUT */}

        <div className="absolute bottom-8 left-6 right-6 space-y-3">
          <div className="rounded-2xl bg-slate-900 p-4">
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
            onClick={handleLogout}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
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
              onClick={refreshDashboard}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
            >
              <RefreshCw
                size={18}
                className={
                  loading || analyticsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              onClick={startScanner}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
            >
              <ScanLine size={19} />
              Scan QR
            </button>

            {/* DESKTOP LOGOUT BUTTON */}

            <button
              onClick={handleLogout}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 ${
              message.startsWith("⚠️")
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : message
                    .toLowerCase()
                    .includes("successfully") ||
                  message
                    .toLowerCase()
                    .includes("welcome back")
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            <div className="font-medium">
              {message}
            </div>
          </div>
        )}

        {/* STATISTICS */}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Visitors
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analytics?.total_visitors ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users />
              </div>
            </div>
          </div>

          {/* INSIDE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Currently Inside
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analytics?.currently_inside ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <UserCheck />
              </div>
            </div>
          </div>

          {/* CHECKED OUT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Checked Out
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analytics?.checked_out ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <LogOut />
              </div>
            </div>
          </div>

          {/* ALERTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Security Alerts
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analytics?.security_alerts.length ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <AlertTriangle />
              </div>
            </div>
          </div>
        </div>

        {/* AI ANALYTICS */}

        <section
          id="analytics"
          className="mb-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl md:p-8"
        >
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-600 p-3">
                <Brain size={28} />
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

            <div className="flex items-center gap-2 text-sm text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Analytics Active
            </div>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* VISIT METRICS */}

              <div className="rounded-2xl bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Clock3
                    size={20}
                    className="text-blue-400"
                  />

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
                      {analytics.average_visit_minutes}

                      <span className="ml-1 text-sm text-slate-400">
                        min
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Longest Visit
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {analytics.longest_visit_minutes}

                      <span className="ml-1 text-sm text-slate-400">
                        min
                      </span>
                    </p>

                    {analytics.longest_visit_name && (
                      <p className="mt-1 text-xs text-slate-500">
                        {analytics.longest_visit_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Most Visited Person
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {analytics.most_visited_person ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* VISITOR ACTIVITY */}

              <div className="rounded-2xl bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <BarChart3
                    size={20}
                    className="text-purple-400"
                  />

                  <h4 className="font-semibold">
                    Visitor Activity
                  </h4>
                </div>

                <div className="space-y-4">
                  {Object.entries(
                    analytics.person_visit_counts
                  ).map(([person, count]) => {
                    const maximum = Math.max(
                      ...Object.values(
                        analytics.person_visit_counts
                      )
                    );

                    const width =
                      maximum > 0
                        ? (count / maximum) * 100
                        : 0;

                    return (
                      <div key={person}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-slate-300">
                            {person}
                          </span>

                          <span className="text-slate-400">
                            {count}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(
                    analytics.person_visit_counts
                  ).length === 0 && (
                    <p className="text-sm text-slate-500">
                      No visitor activity yet.
                    </p>
                  )}
                </div>
              </div>

              {/* SECURITY */}

              <div className="rounded-2xl bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck
                    size={20}
                    className="text-green-400"
                  />

                  <h4 className="font-semibold">
                    Security Monitoring
                  </h4>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-400">
                      High
                    </p>

                    <p className="text-xl font-bold text-red-400">
                      {analytics.alert_summary.high}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-400">
                      Medium
                    </p>

                    <p className="text-xl font-bold text-orange-400">
                      {analytics.alert_summary.medium}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-400">
                      Low
                    </p>

                    <p className="text-xl font-bold text-yellow-400">
                      {analytics.alert_summary.low}
                    </p>
                  </div>
                </div>

                {analytics.security_alerts.length === 0 ? (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-400" />

                      <div>
                        <p className="font-semibold text-green-400">
                          No Active Alerts
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          No unusual activity detected.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.security_alerts
                      .slice(0, 5)
                      .map((alert, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3"
                        >
                          <p className="text-sm font-semibold text-orange-300">
                            {alert.type}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {alert.visitor}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {alert.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPEAT VISITORS */}

          {analytics &&
            analytics.repeat_visitors.length > 0 && (
              <div className="mt-6 rounded-2xl bg-slate-900 p-6">
                <h4 className="mb-4 font-semibold">
                  Repeat Visitor Analysis
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {analytics.repeat_visitors.map(
                    (visitor, index) => (
                      <div
                        key={`${visitor.phone}-${index}`}
                        className="rounded-xl bg-slate-800 p-4"
                      >
                        <p className="font-semibold">
                          {visitor.name}
                        </p>

                        <p className="text-sm text-slate-400">
                          {visitor.phone}
                        </p>

                        <p className="mt-2 text-sm text-blue-400">
                          {visitor.visit_count} visits
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </section>

        {/* REGISTER + SCANNER */}

        <div
          id="register"
          className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2"
        >
          {/* REGISTER */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              onSubmit={registerVisitor}
              className="space-y-4"
            >
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Visitor Name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                required
                type="tel"
                inputMode="numeric"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                pattern="[0-9]{10}"
                maxLength={10}
                title="Phone number must contain exactly 10 digits"
                placeholder="Phone Number (10 digits)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                pattern="^[A-Za-z0-9._%+-]+@gmail\.com$"
                title="Please enter a valid Gmail address ending with @gmail.com"
                placeholder="Email (example@gmail.com)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                required
                name="person_to_visit"
                value={formData.person_to_visit}
                onChange={handleChange}
                placeholder="Person to Visit"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                required
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Purpose of Visit"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <QrCode size={19} />
                  Register & Generate QR
                </span>
              </button>
            </form>

            {/* REGISTRATION WARNING */}

            {registerWarning && (
              <div
                className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-4 text-amber-900 shadow-sm"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-base font-bold">
                      Registration Warning
                    </p>

                    <p className="mt-1 text-sm">
                      {registerWarning.replace("⚠️ ", "")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GENERATED QR */}

            {visitorId && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                {returningVisitor && (
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-bold text-blue-800">
                      Welcome back, {registeredVisitorName}!
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      Previous visits: {previousVisits}
                    </p>

                    <p className="mt-1 text-xs text-blue-600">
                      This registration has been created as a new visit with a new QR code.
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Generated Visitor ID
                </p>

                <p className="mt-1 break-all font-mono text-sm">
                  {visitorId}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <QrCode size={17} />
                    View QR
                  </a>

                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}/download`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    <QrCode size={17} />
                    Download QR
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* SECURITY SCANNER */}

          <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
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

            {!selectedVisitor ? (
              <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 text-center">
                <QrCode
                  size={70}
                  className="mb-5 text-slate-600"
                />

                <p className="mb-5 text-slate-400">
                  Scan a visitor QR code
                </p>

                <button
                  onClick={startScanner}
                  type="button"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
                >
                  Start Camera Scanner
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-5 text-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Verified Visitor
                    </p>

                    <h4 className="mt-1 text-2xl font-bold">
                      {selectedVisitor.name}
                    </h4>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    VERIFIED
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={17} />
                    {selectedVisitor.phone}
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={17} />
                    {selectedVisitor.email}
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays size={17} />
                    {selectedVisitor.purpose}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {selectedVisitor.status ===
                    "Not Checked In" && (
                    <button
                      onClick={() =>
                        checkIn(
                          selectedVisitor.visitor_id
                        )
                      }
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white"
                    >
                      <LogIn size={18} />
                      Check In
                    </button>
                  )}

                  {selectedVisitor.status ===
                    "Checked In" && (
                    <button
                      onClick={() =>
                        checkOut(
                          selectedVisitor.visitor_id
                        )
                      }
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white"
                    >
                      <LogOut size={18} />
                      Check Out
                    </button>
                  )}

                  {selectedVisitor.status ===
                    "Checked Out" && (
                    <div className="flex-1 rounded-xl bg-slate-100 py-3 text-center font-semibold text-slate-600">
                      Visit Completed
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* VISITOR RECORDS */}

        <section
          id="records"
          className="rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                      setSearch(e.target.value)
                    }
                    placeholder="Search visitors..."
                    className="rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={refreshDashboard}
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCw
                    size={18}
                    className={
                      loading || analyticsLoading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>

            {/* FILTERS */}

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {filterButtons.map((filter) => {
                const isActive =
                  activeFilter === filter.label;

                return (
                  <button
                    key={filter.label}
                    onClick={() =>
                      setActiveFilter(filter.label)
                    }
                    type="button"
                    className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {filter.icon}
                      {filter.label}
                    </span>

                    <span
                      className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
                        isActive
                          ? "bg-white text-blue-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing:{" "}
                <span className="font-semibold text-slate-800">
                  {activeFilter}
                </span>
              </p>

              <p className="text-sm text-slate-500">
                {filteredVisitors.length}{" "}
                {filteredVisitors.length === 1
                  ? "visitor"
                  : "visitors"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
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
                {filteredVisitors.map((visitor) => (
                  <tr
                    key={visitor.visitor_id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <div className="font-semibold">
                        {visitor.name}
                      </div>

                      <div className="mt-1 max-w-[180px] truncate font-mono text-xs text-slate-400">
                        {visitor.visitor_id}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm">
                        {visitor.phone}
                      </div>

                      <div className="text-xs text-slate-400">
                        {visitor.email}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm font-medium">
                        {visitor.purpose}
                      </div>

                      <div className="text-xs text-slate-400">
                        To: {visitor.person_to_visit}
                      </div>
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
                        {visitor.status}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {formatDate(
                        visitor.entry_time
                      )}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {formatDate(
                        visitor.exit_time
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <a
                          href={`${API_BASE_URL}/qr/${visitor.visitor_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                          title="View QR"
                        >
                          <QrCode size={17} />
                        </a>

                        {visitor.status ===
                          "Not Checked In" && (
                          <button
                            onClick={() =>
                              checkIn(
                                visitor.visitor_id
                              )
                            }
                            type="button"
                            className="rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-green-700"
                          >
                            Check In
                          </button>
                        )}

                        {visitor.status ===
                          "Checked In" && (
                          <button
                            onClick={() =>
                              checkOut(
                                visitor.visitor_id
                              )
                            }
                            type="button"
                            className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredVisitors.length === 0 && (
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

        {/* FOOTER */}

        <div className="mt-8 pb-5 text-center text-sm text-slate-400">
          AI Smart Visitor Management System • Secure
          QR-Based Visitor Tracking
        </div>
      </main>

      {/* QR SCANNER MODAL */}

      {scannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
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
                onClick={() =>
                  setScannerOpen(false)
                }
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100"
                title="Close scanner"
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