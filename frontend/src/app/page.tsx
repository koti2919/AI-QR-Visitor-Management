"use client";

import {
  useEffect,
  useState,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

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
  approval_status?: string;
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
  const [authReady, setAuthReady] = useState(false);

  const [userRole, setUserRole] = useState<
    "admin" | "visitor" | null
  >(null);

  const [authUser, setAuthUser] =
    useState<any>(null);

  // ====================================================
  // AUTH HEADERS
  // ====================================================

  const getAuthHeaders = (): Record<
    string,
    string
  > => {
    if (typeof window === "undefined") {
      return {};
    }

    const token =
      window.localStorage.getItem(
        "access_token"
      );

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const logout = () => {
    if (
      typeof window !== "undefined"
    ) {
      window.localStorage.removeItem(
        "access_token"
      );

      window.localStorage.removeItem(
        "user"
      );

      window.localStorage.removeItem(
        "visitorUser"
      );

      window.localStorage.removeItem(
        "visitorProfile"
      );

      window.sessionStorage.removeItem(
        "adminLoggedIn"
      );

      window.sessionStorage.removeItem(
        "visitorLoggedIn"
      );

      window.sessionStorage.removeItem(
        "userRole"
      );

      window.location.replace(
        "/login"
      );
    }
  };

  // ====================================================
  // FORM
  // ====================================================

  const [formData, setFormData] =
    useState({
      name: "",
      phone: "",
      email: "",
      person_to_visit: "",
      purpose: "",
    });

  // ====================================================
  // VISITORS
  // ====================================================

  const [visitors, setVisitors] =
    useState<Visitor[]>([]);

  const [
    selectedVisitor,
    setSelectedVisitor,
  ] = useState<Visitor | null>(
    null
  );

  // ====================================================
  // ANALYTICS
  // ====================================================

  const [analytics, setAnalytics] =
    useState<Analytics | null>(
      null
    );

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] = useState(false);

  // ====================================================
  // UI
  // ====================================================

  const [visitorId, setVisitorId] =
    useState("");

  const [
    returningVisitor,
    setReturningVisitor,
  ] = useState(false);

  const [
    previousVisits,
    setPreviousVisits,
  ] = useState(0);

  const [
    registeredVisitorName,
    setRegisteredVisitorName,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [
    registerWarning,
    setRegisterWarning,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    scannerOpen,
    setScannerOpen,
  ] = useState(false);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<VisitorFilter>(
    "All Visitors"
  );

  // ====================================================
  // FETCH VISITORS
  // ====================================================

  const fetchVisitors = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/visitors`,
        {
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch visitors"
        );
      }

      const data =
        await response.json();

      setVisitors(data);
    } catch (error) {
      console.error(
        "Visitor fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FETCH ANALYTICS
  // ====================================================

  const fetchAnalytics =
    async () => {
      try {
        setAnalyticsLoading(
          true
        );

        const response =
          await fetch(
            `${API_BASE_URL}/analytics`,
            {
              headers: {
                ...getAuthHeaders(),
                "Cache-Control":
                  "no-cache",
              },
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch analytics"
          );
        }

        const data =
          await response.json();

        setAnalytics(data);
      } catch (error) {
        console.error(
          "Analytics error:",
          error
        );
      } finally {
        setAnalyticsLoading(
          false
        );
      }
    };

  // ====================================================
  // LOAD SINGLE VISITOR
  // ====================================================

  const loadVisitor = async (
    id: string
  ) => {
    if (!id) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/visitor/${id}`,
          {
            method: "GET",
            headers: {
              ...getAuthHeaders(),
              "Cache-Control":
                "no-cache",
              Pragma: "no-cache",
            },
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.visitor_id
      ) {
        setSelectedVisitor(
          data
        );

        if (
          typeof window !==
          "undefined"
        ) {
          window.localStorage.setItem(
            "last_visitor_id",
            data.visitor_id
          );
        }
      } else {
        setMessage(
          typeof data.detail ===
            "string"
            ? data.detail
            : "Visitor not found."
        );
      }
    } catch (error) {
      console.error(
        "Load visitor error:",
        error
      );

      setMessage(
        "Unable to load visitor."
      );
    }
  };

  // ====================================================
  // LOAD SAVED VISITOR AFTER LOGIN
  // ====================================================

  const loadSavedVisitor =
    async () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const savedVisitorId =
        window.localStorage.getItem(
          "last_visitor_id"
        );

      if (!savedVisitorId) {
        return;
      }

      setVisitorId(
        savedVisitorId
      );

      await loadVisitor(
        savedVisitorId
      );
    };

  // ====================================================
  // INITIAL AUTHENTICATION
  // ====================================================

  useEffect(() => {
    const initializeAuth =
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        const token =
          window.localStorage.getItem(
            "access_token"
          );

        if (!token) {
          window.location.href =
            "/login";

          return;
        }

        try {
          const response =
            await fetch(
              `${API_BASE_URL}/auth/me`,
              {
                headers:
                  getAuthHeaders(),
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              "Authentication expired"
            );
          }

          const user =
            await response.json();

          setAuthUser(user);

          setUserRole(
            user.role === "admin"
              ? "admin"
              : "visitor"
          );

          window.localStorage.setItem(
            "user",
            JSON.stringify(user)
          );

          if (
            user.role !== "admin"
          ) {
            setFormData(
              (previous) => ({
                ...previous,
                name:
                  user.name ||
                  "",
                phone:
                  String(
                    user.phone ||
                      ""
                  ).replace(
                    /\D/g,
                    ""
                  ),
                email:
                  String(
                    user.email ||
                      ""
                  )
                    .trim()
                    .toLowerCase(),
              })
            );
          }

          if (
            user.role ===
            "admin"
          ) {
            await Promise.all([
              fetchVisitors(),
              fetchAnalytics(),
            ]);
          } else {
            await loadSavedVisitor();
          }
        } catch (error) {
          console.error(
            "Authentication error:",
            error
          );

          window.localStorage.removeItem(
            "access_token"
          );

          window.localStorage.removeItem(
            "user"
          );

          window.sessionStorage.removeItem(
            "adminLoggedIn"
          );

          window.sessionStorage.removeItem(
            "visitorLoggedIn"
          );

          window.sessionStorage.removeItem(
            "userRole"
          );

          window.location.href =
            "/login";

          return;
        } finally {
          setAuthReady(true);
        }
      };

    initializeAuth();
  }, []);

  // ====================================================
  // AUTOMATIC VISITOR STATUS REFRESH
  // ====================================================

  useEffect(() => {
    if (
      !authReady ||
      userRole !== "visitor" ||
      !visitorId
    ) {
      return;
    }

    // Get the newest status immediately.
    loadVisitor(visitorId);

    // Continue checking every 5 seconds.
    const intervalId =
      window.setInterval(() => {
        loadVisitor(visitorId);
      }, 5000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    authReady,
    userRole,
    visitorId,
  ]);

  // ====================================================
  // REFRESH DASHBOARD
  // ====================================================

  const refreshDashboard =
    async () => {
      if (
        userRole !== "admin"
      ) {
        return;
      }

      await Promise.all([
        fetchVisitors(),
        fetchAnalytics(),
      ]);
    };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRegisterWarning("");

    const {
      name,
      value,
    } = e.target;

    if (name === "phone") {
      const digitsOnly =
        value
          .replace(/\D/g, "")
          .slice(0, 10);

      setFormData({
        ...formData,
        phone: digitsOnly,
      });

      return;
    }

    if (name === "email") {
      setFormData({
        ...formData,
        email:
          value
            .trim()
            .toLowerCase(),
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

  const registerVisitor =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      setRegisterWarning("");
      setMessage("");

      const visitorPhone =
        userRole === "visitor"
          ? String(
              authUser?.phone ||
                formData.phone ||
                ""
            )
              .replace(
                /\D/g,
                ""
              )
              .slice(0, 10)
          : String(
              formData.phone || ""
            )
              .replace(
                /\D/g,
                ""
              )
              .slice(0, 10);

      const visitorEmail =
        userRole === "visitor"
          ? String(
              authUser?.email ||
                formData.email ||
                ""
            )
              .trim()
              .toLowerCase()
          : String(
              formData.email || ""
            )
              .trim()
              .toLowerCase();

      const visitorName =
        userRole === "visitor"
          ? String(
              authUser?.name ||
                formData.name ||
                ""
            ).trim()
          : String(
              formData.name || ""
            ).trim();

      const personToVisit =
        String(
          formData.person_to_visit ||
            ""
        ).trim();

      const purpose =
        String(
          formData.purpose || ""
        ).trim();

      if (
        !/^\d{10}$/.test(
          visitorPhone
        )
      ) {
        setMessage(
          "Phone number must contain exactly 10 digits."
        );

        setRegisterWarning(
          "⚠️ Phone number must contain exactly 10 digits."
        );

        return;
      }

      if (
        !/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(
          visitorEmail
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

      if (!visitorName) {
        setMessage(
          "Visitor name is required."
        );

        setRegisterWarning(
          "⚠️ Visitor name is required."
        );

        return;
      }

      if (!personToVisit) {
        setMessage(
          "Please enter the person you want to visit."
        );

        setRegisterWarning(
          "⚠️ Please enter the person you want to visit."
        );

        return;
      }

      if (!purpose) {
        setMessage(
          "Please enter the purpose of your visit."
        );

        setRegisterWarning(
          "⚠️ Please enter the purpose of your visit."
        );

        return;
      }

      const registrationPayload = {
        name: visitorName,
        phone: visitorPhone,
        email: visitorEmail,
        person_to_visit:
          personToVisit,
        purpose: purpose,
      };

      console.log(
        "Visitor registration payload:",
        registrationPayload
      );

      setMessage(
        "Registering visitor..."
      );

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...getAuthHeaders(),
              },

              body: JSON.stringify(
                registrationPayload
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
              409 &&
            data.detail?.code ===
              "VISITOR_REGISTRATION_INCOMPLETE"
          ) {
            setVisitorId("");
            setReturningVisitor(
              false
            );
            setPreviousVisits(0);
            setRegisteredVisitorName(
              ""
            );

            setMessage(
              `⚠️ ${data.detail.message}`
            );

            setRegisterWarning(
              `⚠️ Registration blocked. ${data.detail.message} Complete the current visit before registering again.`
            );

            return;
          }

          if (
            response.status ===
              409 &&
            data.detail?.code ===
              "VISITOR_ALREADY_INSIDE"
          ) {
            setVisitorId("");
            setReturningVisitor(
              false
            );
            setPreviousVisits(0);
            setRegisteredVisitorName(
              ""
            );

            setMessage(
              `⚠️ ${data.detail.message}`
            );

            setRegisterWarning(
              `⚠️ Registration blocked. ${data.detail.message} Please check out the current visit before registering a new visit.`
            );

            return;
          }

          const errorMessage =
            typeof data.detail ===
            "string"
              ? data.detail
              : data.detail?.message ||
                "Registration failed.";

          setMessage(
            errorMessage
          );

          setRegisterWarning(
            `⚠️ ${errorMessage}`
          );

          return;
        }

        setRegisterWarning("");

        setVisitorId(
          data.visitor_id
        );

        if (
          typeof window !==
          "undefined"
        ) {
          window.localStorage.setItem(
            "last_visitor_id",
            data.visitor_id
          );
        }

        setReturningVisitor(
          Boolean(
            data.returning_visitor
          )
        );

        setPreviousVisits(
          Number(
            data.previous_visits ||
              0
          )
        );

        setRegisteredVisitorName(
          data.visitor?.name ||
            visitorName
        );

        await loadVisitor(
          data.visitor_id
        );

        if (
          data.returning_visitor
        ) {
          setMessage(
            `Welcome back, ${
              data.visitor_name ||
              data.visitor?.name ||
              visitorName
            }! Previous visits: ${Number(
              data.previous_visits ||
                0
            )}. New visit registered successfully.`
          );
        } else {
          setMessage(
            "Visitor registered successfully! Waiting for host approval."
          );
        }

        if (
          userRole === "visitor"
        ) {
          setFormData({
            name:
              authUser?.name ||
              visitorName,
            phone:
              visitorPhone,
            email:
              visitorEmail,
            person_to_visit: "",
            purpose: "",
          });
        } else {
          setFormData({
            name: "",
            phone: "",
            email: "",
            person_to_visit: "",
            purpose: "",
          });
        }

        setActiveFilter(
          "All Visitors"
        );

        await refreshDashboard();
      } catch (error) {
        console.error(error);

        setMessage(
          "Cannot connect to backend."
        );
      }
    };

  // ====================================================
  // CHECK IN
  // ====================================================

  const checkIn = async (
    id: string
  ) => {
    try {
      const response =
        await fetch(
          `${API_BASE_URL}/check-in/${id}`,
          {
            method: "POST",
            headers:
              getAuthHeaders(),
          }
        );

      const data =
        await response.json();

      setMessage(
        data.message ||
          "Check-in completed."
      );

      await refreshDashboard();

      await loadVisitor(id);
    } catch (error) {
      console.error(error);

      setMessage(
        "Check-in failed."
      );
    }
  };

  // ====================================================
  // CHECK OUT
  // ====================================================

  const checkOut = async (
    id: string
  ) => {
    try {
      const response =
        await fetch(
          `${API_BASE_URL}/check-out/${id}`,
          {
            method: "POST",
            headers:
              getAuthHeaders(),
          }
        );

      const data =
        await response.json();

      setMessage(
        data.message ||
          "Check-out completed."
      );

      await refreshDashboard();

      await loadVisitor(id);
    } catch (error) {
      console.error(error);

      setMessage(
        "Check-out failed."
      );
    }
  };

  // ====================================================
  // HOST APPROVAL
  // ====================================================

  const approveVisitor =
    async (id: string) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/visitor/${id}/approve`,
            {
              method: "POST",
              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setMessage(
            typeof data.detail ===
              "string"
              ? data.detail
              : "Approval failed."
          );

          return;
        }

        setMessage(
          "Visitor request approved successfully. QR is now active. Approval email with QR is being sent to the visitor."
        );

        await refreshDashboard();

        if (
          selectedVisitor?.visitor_id ===
          id
        ) {
          await loadVisitor(id);
        }
      } catch (error) {
        console.error(error);

        setMessage(
          "Approval failed."
        );
      }
    };

  const rejectVisitor =
    async (id: string) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/visitor/${id}/reject`,
            {
              method: "POST",
              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setMessage(
            typeof data.detail ===
              "string"
              ? data.detail
              : "Rejection failed."
          );

          return;
        }

        setMessage(
          "Visitor request rejected. A notification email will be sent to the visitor."
        );

        await refreshDashboard();

        if (
          selectedVisitor?.visitor_id ===
          id
        ) {
          await loadVisitor(id);
        }
      } catch (error) {
        console.error(error);

        setMessage(
          "Rejection failed."
        );
      }
    };

  // ====================================================
  // QR SCANNER
  // ====================================================

  const startScanner =
    async () => {
      setScannerOpen(true);

      setTimeout(
        async () => {
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
                facingMode:
                  "environment",
              },
              {
                fps: 10,
                qrbox: {
                  width: 250,
                  height: 250,
                },
              },
              async (
                decodedText
              ) => {
                try {
                  await scanner.stop();
                } catch {}

                setScannerOpen(
                  false
                );

                let id =
                  decodedText;

                if (
                  decodedText.startsWith(
                    "VISITOR:"
                  )
                ) {
                  id =
                    decodedText.replace(
                      "VISITOR:",
                      ""
                    );
                }

                await loadVisitor(
                  id
                );
              },
              () => {}
            );
          } catch (error) {
            console.error(
              "Scanner error:",
              error
            );

            setScannerOpen(
              false
            );

            setMessage(
              "Unable to access camera. Please allow camera permission."
            );
          }
        },
        300
      );
    };

  // ====================================================
  // COUNTS
  // ====================================================

  const allVisitorsCount =
    visitors.length;

  const checkedInCount =
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Checked In"
    ).length;

  const checkedOutCount =
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Checked Out"
    ).length;

  const notCheckedInCount =
    visitors.filter(
      (visitor) =>
        visitor.status ===
        "Not Checked In"
    ).length;

  const pendingApprovalCount =
    visitors.filter(
      (visitor) =>
        visitor.approval_status ===
        "Pending Approval"
    ).length;

  // ====================================================
  // FILTER
  // ====================================================

  const filteredVisitors =
    visitors.filter(
      (visitor) => {
        const value =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          value === "" ||
          visitor.name
            .toLowerCase()
            .includes(value) ||
          visitor.phone.includes(
            search
          ) ||
          visitor.email
            .toLowerCase()
            .includes(value) ||
          visitor.purpose
            .toLowerCase()
            .includes(value) ||
          visitor.person_to_visit
            .toLowerCase()
            .includes(value);

        const matchesFilter =
          activeFilter ===
            "All Visitors" ||
          visitor.status ===
            activeFilter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  const filterButtons: {
    label: VisitorFilter;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      label: "All Visitors",
      count:
        allVisitorsCount,
      icon: (
        <Users size={17} />
      ),
    },
    {
      label: "Checked In",
      count:
        checkedInCount,
      icon: (
        <UserCheck size={17} />
      ),
    },
    {
      label: "Checked Out",
      count:
        checkedOutCount,
      icon: (
        <LogOut size={17} />
      ),
    },
    {
      label: "Not Checked In",
      count:
        notCheckedInCount,
      icon: (
        <UserX size={17} />
      ),
    },
  ];

  // ====================================================
  // DATE FORMAT
  // ====================================================

  const formatDate = (
    value: string | null
  ) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleString();
  };

  // ====================================================
  // NAVIGATION
  // ====================================================

  const scrollToSection = (
    id: string
  ) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setSidebarOpen(false);
  };

  // ====================================================
  // AUTH LOADING
  // ====================================================

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6 text-center">
          <ShieldCheck
            className="mx-auto text-blue-600 mb-3"
            size={36}
          />

          <p className="font-semibold">
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // VISITOR PORTAL
  // ====================================================

  if (userRole === "visitor") {
    const approvalStatus =
      selectedVisitor?.approval_status ||
      "Pending Approval";

    const isApproved =
      approvalStatus ===
      "Approved";

    const isRejected =
      approvalStatus ===
      "Rejected";

    const isPending =
      approvalStatus ===
      "Pending Approval";

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-5 md:p-10">
        <div className="max-w-4xl mx-auto">

          {/* HEADER */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-slate-500">
                Visitor Portal
              </p>

              <h1 className="text-3xl font-bold">
                Welcome,{" "}
                {authUser?.name}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Submit a visit request and
                track host approval.
              </p>
            </div>

            <button
              onClick={logout}
              className="bg-slate-950 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {/* REGISTER VISIT */}

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-1">
              Register Visit
            </h2>

            <p className="text-sm text-slate-500 mb-6">
              Your account credentials are used
              for this visitor request.
            </p>

            <form
              onSubmit={
                registerVisitor
              }
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                name="name"
                value={
                  authUser?.name ||
                  formData.name ||
                  ""
                }
                readOnly
                placeholder="Full name"
                required
                className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 cursor-not-allowed"
              />

              <input
                name="phone"
                value={
                  String(
                    authUser?.phone ||
                      formData.phone ||
                      ""
                  ).replace(
                    /\D/g,
                    ""
                  )
                }
                readOnly
                inputMode="numeric"
                placeholder="10-digit phone"
                required
                maxLength={10}
                className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 cursor-not-allowed"
              />

              <input
                name="email"
                type="email"
                value={
                  String(
                    authUser?.email ||
                      formData.email ||
                      ""
                  )
                    .trim()
                    .toLowerCase()
                }
                readOnly
                placeholder="Gmail address"
                required
                className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 cursor-not-allowed"
              />

              <input
                name="person_to_visit"
                value={
                  formData.person_to_visit
                }
                onChange={
                  handleChange
                }
                placeholder="Person to visit"
                required
                className="border border-slate-200 rounded-xl px-4 py-3"
              />

              <input
                name="purpose"
                value={
                  formData.purpose
                }
                onChange={
                  handleChange
                }
                placeholder="Purpose of visit"
                required
                className="border border-slate-200 rounded-xl px-4 py-3 md:col-span-2"
              />

              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold"
              >
                Submit Visit Request
              </button>
            </form>
          </section>

          {/* MESSAGE */}

          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6">
              {message}
            </div>
          )}

          {/* VISITOR STATUS */}

          {visitorId && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    Visit Request
                  </p>

                  <p className="font-mono text-xs break-all mt-1">
                    {visitorId}
                  </p>

                  {/* LIVE STATUS INDICATOR */}

                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Status updates automatically
                  </p>
                </div>

                <button
                  onClick={() =>
                    loadVisitor(
                      visitorId
                    )
                  }
                  className="border border-slate-200 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw
                      size={16}
                    />
                    Refresh Status
                  </span>
                </button>
              </div>

              {/* PENDING */}

              {isPending && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Clock3
                      className="text-amber-600 mt-0.5"
                      size={24}
                    />

                    <div>
                      <p className="font-bold text-amber-800">
                        Pending Host Approval
                      </p>

                      <p className="text-sm text-amber-700 mt-1">
                        Your visit request has
                        been submitted successfully.
                        Please wait for the host
                        to approve or reject it.
                      </p>

                      <p className="text-xs text-amber-600 mt-2">
                        This page automatically checks
                        for approval updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* APPROVED */}

              {isApproved && (
                <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="text-green-600 mt-0.5"
                      size={26}
                    />

                    <div>
                      <p className="font-bold text-green-800 text-lg">
                        Visit Approved
                      </p>

                      <p className="text-sm text-green-700 mt-1">
                        Your host has approved your
                        visit request.
                      </p>

                      <p className="text-sm text-green-700 mt-2">
                        An approval email containing
                        your QR code has been sent
                        to your Gmail address.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    <a
                      href={`${API_BASE_URL}/qr/${visitorId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold text-center"
                    >
                      View QR
                    </a>

                    <a
                      href={`${API_BASE_URL}/qr/${visitorId}/download`}
                      className="flex-1 bg-slate-950 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-semibold text-center"
                    >
                      Download QR
                    </a>
                  </div>
                </div>
              )}

              {/* REJECTED */}

              {isRejected && (
                <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <UserX
                      className="text-red-600 mt-0.5"
                      size={26}
                    />

                    <div>
                      <p className="font-bold text-red-800 text-lg">
                        Visit Request Rejected
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        Unfortunately, your visit
                        request was rejected by the
                        host.
                      </p>

                      <p className="text-sm text-red-700 mt-2">
                        A notification email has been
                        sent to your Gmail address.
                      </p>

                      <p className="text-xs text-red-600 mt-3">
                        Thank you for using AI Smart
                        Visitor Management System.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CURRENT VISIT DETAILS */}

              {selectedVisitor &&
                selectedVisitor.visitor_id ===
                  visitorId && (
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <h3 className="font-bold text-lg mb-4">
                      Visit Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-500">
                          Visitor
                        </p>

                        <p className="font-semibold">
                          {
                            selectedVisitor.name
                          }
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-500">
                          Person to Visit
                        </p>

                        <p className="font-semibold">
                          {
                            selectedVisitor.person_to_visit
                          }
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-500">
                          Purpose
                        </p>

                        <p className="font-semibold">
                          {
                            selectedVisitor.purpose
                          }
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-500">
                          Visit Status
                        </p>

                        <p className="font-semibold">
                          {
                            selectedVisitor.status
                          }
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-slate-500">
                          Approval Status
                        </p>

                        <p className="font-semibold">
                          {
                            selectedVisitor.approval_status ||
                            "Pending Approval"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </section>
          )}
        </div>
      </div>
    );
  }

  // ====================================================
  // ADMIN DASHBOARD
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* MOBILE HEADER */}

      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-950 text-white px-5 py-4 shadow-lg">
        <div>
          <h1 className="font-bold text-lg">
            Smart Visitor
          </h1>

          <p className="text-xs text-slate-400">
            AI Management
          </p>
        </div>

        <button
          onClick={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
          className="p-2 rounded-lg hover:bg-slate-800"
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
        className={`
          fixed
          z-50
          left-0
          top-0
          h-screen
          w-64
          bg-slate-950
          text-white
          p-6
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <ShieldCheck
                size={25}
              />
            </div>

            <div>
              <h1 className="font-bold text-lg">
                Smart Visitor
              </h1>

              <p className="text-xs text-slate-400">
                AI Management
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() =>
              scrollToSection(
                "dashboard"
              )
            }
            className="w-full flex items-center gap-3 bg-blue-600 px-4 py-3 rounded-xl text-left"
          >
            <LayoutDashboard
              size={19}
            />
            Dashboard
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "register"
              )
            }
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl text-left"
          >
            <UserPlus size={19} />
            Register Visitor
          </button>

          <button
            onClick={() =>
              startScanner()
            }
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl text-left"
          >
            <ScanLine size={19} />
            QR Scanner
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "analytics"
              )
            }
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl text-left"
          >
            <Brain size={19} />
            AI Analytics
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "records"
              )
            }
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl text-left"
          >
            <Users size={19} />
            Visitor Records
          </button>
        </nav>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 mt-6 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-left transition"
        >
          <LogOut size={19} />
          Logout
        </button>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="bg-slate-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-green-400">
              <Activity size={16} />

              <span className="text-sm">
                System Online
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              AI Visitor Security
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <main
        id="dashboard"
        className="lg:ml-64 p-5 md:p-8"
      >
        {/* TOP BAR */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-500">
              Security Control Center
            </p>

            <h2 className="text-3xl font-bold">
              Visitor Dashboard
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Monitor visitor activity and
              security
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={
                refreshDashboard
              }
              className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 rounded-xl hover:bg-slate-50"
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
              onClick={
                startScanner
              }
              className="flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition"
            >
              <ScanLine size={19} />
              Scan QR
            </button>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className={`mb-6 px-5 py-4 rounded-xl border ${
              message.startsWith("⚠️")
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : message
                    .toLowerCase()
                    .includes(
                      "successfully"
                    ) ||
                  message
                    .toLowerCase()
                    .includes(
                      "welcome back"
                    )
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <div className="font-medium">
              {message}
            </div>
          </div>
        )}

        {/* STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Visitors
                </p>

                <p className="text-3xl font-bold mt-2">
                  {analytics?.total_visitors ??
                    0}
                </p>
              </div>

              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                <Users />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Currently Inside
                </p>

                <p className="text-3xl font-bold mt-2">
                  {analytics?.currently_inside ??
                    0}
                </p>
              </div>

              <div className="bg-green-100 text-green-600 p-3 rounded-xl">
                <UserCheck />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Checked Out
                </p>

                <p className="text-3xl font-bold mt-2">
                  {analytics?.checked_out ??
                    0}
                </p>
              </div>

              <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                <LogOut />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Security Alerts
                </p>

                <p className="text-3xl font-bold mt-2">
                  {analytics
                    ?.security_alerts
                    .length ?? 0}
                </p>
              </div>

              <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                <AlertTriangle />
              </div>
            </div>
          </div>
        </div>

        {/* HOST APPROVAL */}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold">
                Host Approval Requests
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Review visitor requests before
                activating their QR codes.
              </p>
            </div>

            <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl font-bold text-sm">
              {pendingApprovalCount}{" "}
              Pending
            </div>
          </div>

          {visitors.filter(
            (visitor) =>
              visitor.approval_status ===
              "Pending Approval"
          ).length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 />

                <div>
                  <p className="font-semibold">
                    No pending approval requests
                  </p>

                  <p className="text-sm mt-1">
                    New visitor requests will
                    appear here automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {visitors
                .filter(
                  (visitor) =>
                    visitor.approval_status ===
                    "Pending Approval"
                )
                .map((visitor) => (
                  <div
                    key={
                      visitor.visitor_id
                    }
                    className="border border-amber-200 bg-amber-50 rounded-2xl p-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">
                          {visitor.name}
                        </p>

                        <p className="text-sm text-slate-600">
                          {visitor.email} •{" "}
                          {visitor.phone}
                        </p>

                        <p className="text-sm text-slate-600 mt-1">
                          Visiting:{" "}
                          {
                            visitor.person_to_visit
                          }
                        </p>

                        <p className="text-sm text-slate-600">
                          Purpose:{" "}
                          {visitor.purpose}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            approveVisitor(
                              visitor.visitor_id
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            rejectVisitor(
                              visitor.visitor_id
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* AI ANALYTICS */}

        <section
          id="analytics"
          className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl">
                <Brain size={28} />
              </div>

              <div>
                <h3 className="text-2xl font-bold">
                  AI Security Analytics
                </h3>

                <p className="text-slate-400 text-sm">
                  Intelligent visitor activity
                  monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Analytics Active
            </div>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
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

                    <p className="text-2xl font-bold mt-1">
                      {
                        analytics.average_visit_minutes
                      }

                      <span className="text-sm text-slate-400 ml-1">
                        min
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Longest Visit
                    </p>

                    <p className="text-2xl font-bold mt-1">
                      {
                        analytics.longest_visit_minutes
                      }

                      <span className="text-sm text-slate-400 ml-1">
                        min
                      </span>
                    </p>

                    {analytics.longest_visit_name && (
                      <p className="text-xs text-slate-500 mt-1">
                        {
                          analytics.longest_visit_name
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Most Visited Person
                    </p>

                    <p className="text-lg font-semibold mt-1">
                      {analytics.most_visited_person ??
                        "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
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
                  ).map(
                    ([person, count]) => {
                      const maximum =
                        Math.max(
                          ...Object.values(
                            analytics.person_visit_counts
                          )
                        );

                      const width =
                        maximum > 0
                          ? (count /
                              maximum) *
                            100
                          : 0;

                      return (
                        <div
                          key={person}
                        >
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">
                              {person}
                            </span>

                            <span className="text-slate-400">
                              {count}
                            </span>
                          </div>

                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}

                  {Object.keys(
                    analytics.person_visit_counts
                  ).length === 0 && (
                    <p className="text-sm text-slate-500">
                      No visitor activity yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck
                    size={20}
                    className="text-green-400"
                  />

                  <h4 className="font-semibold">
                    Security Monitoring
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">
                      High
                    </p>

                    <p className="text-xl font-bold text-red-400">
                      {
                        analytics.alert_summary
                          .high
                      }
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">
                      Medium
                    </p>

                    <p className="text-xl font-bold text-orange-400">
                      {
                        analytics.alert_summary
                          .medium
                      }
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">
                      Low
                    </p>

                    <p className="text-xl font-bold text-yellow-400">
                      {
                        analytics.alert_summary
                          .low
                      }
                    </p>
                  </div>
                </div>

                {analytics.security_alerts
                  .length === 0 ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-400" />

                      <div>
                        <p className="font-semibold text-green-400">
                          No Active Alerts
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          No unusual activity
                          detected.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.security_alerts
                      .slice(0, 5)
                      .map(
                        (
                          alert,
                          index
                        ) => (
                          <div
                            key={index}
                            className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3"
                          >
                            <p className="text-sm font-semibold text-orange-300">
                              {alert.type}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {alert.visitor}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {alert.message}
                            </p>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {analytics &&
            analytics.repeat_visitors
              .length > 0 && (
              <div className="mt-6 bg-slate-900 rounded-2xl p-6">
                <h4 className="font-semibold mb-4">
                  Repeat Visitor Analysis
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.repeat_visitors.map(
                    (
                      visitor,
                      index
                    ) => (
                      <div
                        key={`${visitor.phone}-${index}`}
                        className="bg-slate-800 rounded-xl p-4"
                      >
                        <p className="font-semibold">
                          {visitor.name}
                        </p>

                        <p className="text-sm text-slate-400">
                          {visitor.phone}
                        </p>

                        <p className="text-sm text-blue-400 mt-2">
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

        <div
          id="register"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8"
        >

          {/* REGISTER */}

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
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
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                pattern="[0-9]{10}"
                maxLength={10}
                title="Phone number must contain exactly 10 digits"
                placeholder="Phone Number (10 digits)"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                pattern="[A-Za-z0-9._%+-]+@gmail\.com"
                title="Please enter a valid Gmail address ending with @gmail.com"
                placeholder="Email (example@gmail.com)"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <span className="flex items-center justify-center gap-2">
                  <QrCode size={19} />
                  Register & Generate QR
                </span>
              </button>
            </form>

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
                    <p className="font-bold text-base">
                      Registration Warning
                    </p>

                    <p className="text-sm mt-1">
                      {registerWarning.replace(
                        "⚠️ ",
                        ""
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {visitorId && (
              <div className="mt-6 bg-slate-50 rounded-xl p-4">
                {returningVisitor && (
                  <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <p className="font-bold text-blue-800">
                      Welcome back,{" "}
                      {
                        registeredVisitorName
                      }
                      !
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      Previous visits:{" "}
                      {previousVisits}
                    </p>

                    <p className="text-xs text-blue-600 mt-1">
                      This registration has
                      been created as a new
                      visit with a new QR code.
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Generated Visitor ID
                </p>

                <p className="font-mono text-sm break-all mt-1">
                  {visitorId}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    <QrCode size={17} />
                    View QR
                  </a>

                  <a
                    href={`${API_BASE_URL}/qr/${visitorId}/download`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-950 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-800 transition"
                  >
                    <QrCode size={17} />
                    Download QR
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* SECURITY SCANNER */}

          <section className="bg-slate-950 text-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-3 rounded-xl">
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
              <div className="border border-dashed border-slate-700 rounded-2xl min-h-[310px] flex flex-col items-center justify-center text-center">
                <QrCode
                  size={70}
                  className="text-slate-600 mb-5"
                />

                <p className="text-slate-400 mb-5">
                  Scan a visitor QR code
                </p>

                <button
                  onClick={
                    startScanner
                  }
                  className="bg-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                  Start Camera Scanner
                </button>
              </div>
            ) : (
              <div className="bg-white text-slate-900 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-500">
                      Verified Visitor
                    </p>

                    <h4 className="text-2xl font-bold mt-1">
                      {
                        selectedVisitor.name
                      }
                    </h4>
                  </div>

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-3 mt-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={17} />
                    {
                      selectedVisitor.phone
                    }
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={17} />
                    {
                      selectedVisitor.email
                    }
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays
                      size={17}
                    />
                    {
                      selectedVisitor.purpose
                    }
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {selectedVisitor.status ===
                    "Not Checked In" && (
                    <button
                      onClick={() =>
                        checkIn(
                          selectedVisitor.visitor_id
                        )
                      }
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
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
                      className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Check Out
                    </button>
                  )}

                  {selectedVisitor.status ===
                    "Checked Out" && (
                    <div className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-center font-semibold">
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
          className="bg-white rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">
                  Visitor Records
                </h3>

                <p className="text-sm text-slate-500 mt-1">
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
                    className="border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={
                    refreshDashboard
                  }
                  className="border border-slate-200 rounded-xl px-4 hover:bg-slate-50"
                  title="Refresh"
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {filterButtons.map(
                (filter) => {
                  const isActive =
                    activeFilter ===
                    filter.label;

                  return (
                    <button
                      key={
                        filter.label
                      }
                      onClick={() =>
                        setActiveFilter(
                          filter.label
                        )
                      }
                      className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border transition ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {filter.icon}

                        {
                          filter.label
                        }
                      </span>

                      <span
                        className={`min-w-7 h-7 px-2 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? "bg-white text-blue-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {
                          filter.count
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
              <p className="text-sm text-slate-500">
                Showing:{" "}
                <span className="font-semibold text-slate-800">
                  {activeFilter}
                </span>
              </p>

              <p className="text-sm text-slate-500">
                {
                  filteredVisitors.length
                }{" "}
                {filteredVisitors.length ===
                1
                  ? "visitor"
                  : "visitors"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Visitor
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Contact
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Purpose
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Status
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Approval
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Entry
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
                    Exit
                  </th>

                  <th className="text-left p-4 text-xs uppercase text-slate-500">
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
                        <div className="font-semibold">
                          {visitor.name}
                        </div>

                        <div className="text-xs text-slate-400 font-mono mt-1 max-w-[180px] truncate">
                          {
                            visitor.visitor_id
                          }
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
                          To:{" "}
                          {
                            visitor.person_to_visit
                          }
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
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

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            visitor.approval_status ===
                            "Approved"
                              ? "bg-green-100 text-green-700"
                              : visitor.approval_status ===
                                "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {visitor.approval_status ||
                            "Pending Approval"}
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
                        <div className="flex gap-2 flex-wrap">
                          {visitor.approval_status ===
                            "Approved" && (
                            <a
                              href={`${API_BASE_URL}/qr/${visitor.visitor_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg"
                              title="View QR"
                            >
                              <QrCode
                                size={17}
                              />
                            </a>
                          )}

                          {visitor.approval_status ===
                            "Pending Approval" && (
                            <>
                              <button
                                onClick={() =>
                                  approveVisitor(
                                    visitor.visitor_id
                                  )
                                }
                                className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-bold"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  rejectVisitor(
                                    visitor.visitor_id
                                  )
                                }
                                className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-bold"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {visitor.approval_status ===
                            "Approved" &&
                            visitor.status ===
                              "Not Checked In" && (
                              <button
                                onClick={() =>
                                  checkIn(
                                    visitor.visitor_id
                                  )
                                }
                                className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-bold"
                              >
                                Check In
                              </button>
                            )}

                          {visitor.approval_status ===
                            "Approved" &&
                            visitor.status ===
                              "Checked In" && (
                              <button
                                onClick={() =>
                                  checkOut(
                                    visitor.visitor_id
                                  )
                                }
                                className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold"
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
                      colSpan={8}
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

        <div className="text-center text-sm text-slate-400 mt-8 pb-5">
          AI Smart Visitor Management System •
          Secure QR-Based Visitor Tracking
        </div>
      </main>

      {/* QR SCANNER MODAL */}

      {scannerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold">
                  Scan Visitor QR
                </h3>

                <p className="text-sm text-slate-500">
                  Point the camera at the QR
                  code
                </p>
              </div>

              <button
                onClick={() =>
                  setScannerOpen(
                    false
                  )
                }
                className="p-2 hover:bg-slate-100 rounded-lg"
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