"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react";

type AuthMode = "signin" | "signup";
type LoginRole = "admin" | "visitor";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [loginRole, setLoginRole] = useState<LoginRole>("admin");

  // Sign In
  const [username, setUsername] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  // --------------------------------------------------
  // INITIALS
  // --------------------------------------------------

  const initials = useMemo(() => {
    const words = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return "U";

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }, [fullName]);

  // --------------------------------------------------
  // PASSWORD STRENGTH
  // --------------------------------------------------

  const passwordChecks = useMemo(() => {
    return {
      length: signupPassword.length >= 8,
      uppercase: /[A-Z]/.test(signupPassword),
      lowercase: /[a-z]/.test(signupPassword),
      number: /[0-9]/.test(signupPassword),
      special: /[^A-Za-z0-9]/.test(signupPassword),
    };
  }, [signupPassword]);

  const passwordScore =
    Object.values(passwordChecks).filter(Boolean).length;

  const passwordStrength =
    signupPassword.length === 0
      ? {
          label: "Enter a password",
          width: "0%",
          className: "bg-slate-700",
          textClass: "text-slate-500",
        }
      : passwordScore <= 2
        ? {
            label: "Weak",
            width: "30%",
            className: "bg-red-500",
            textClass: "text-red-400",
          }
        : passwordScore === 3
          ? {
              label: "Medium",
              width: "55%",
              className: "bg-amber-400",
              textClass: "text-amber-400",
            }
          : passwordScore === 4
            ? {
                label: "Strong",
                width: "80%",
                className: "bg-cyan-400",
                textClass: "text-cyan-300",
              }
            : {
                label: "Very Strong",
                width: "100%",
                className: "bg-emerald-400",
                textClass: "text-emerald-300",
              };

  // --------------------------------------------------
  // NAME VALIDATION
  // --------------------------------------------------

  const validateName = () => {
    const name = fullName.trim();

    if (!name) {
      setError("Please enter your full name.");
      return false;
    }

    if (name.length < 3) {
      setError("Full name must contain at least 3 characters.");
      return false;
    }

    if (name.length > 50) {
      setError("Full name must contain less than 50 characters.");
      return false;
    }

    if (!/^[A-Za-z\s.'-]+$/.test(name)) {
      setError(
        "Please enter a valid name using letters, spaces, apostrophes or hyphens."
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // GMAIL VALIDATION
  // --------------------------------------------------

  const validateGmail = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your Gmail address.");
      return false;
    }

    if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
      setError("Please enter a valid Gmail address ending with @gmail.com.");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // MOBILE VALIDATION
  // --------------------------------------------------

  const validateMobile = () => {
    if (!mobile) {
      setError("Please enter your mobile number.");
      return false;
    }

    if (!/^\d+$/.test(mobile)) {
      setError("Mobile number must contain numbers only.");
      return false;
    }

    if (mobile.length !== 10) {
      setError("Mobile number must contain exactly 10 digits.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError(
        "Please enter a valid Indian mobile number starting with 6, 7, 8 or 9."
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // PASSWORD VALIDATION
  // --------------------------------------------------

  const validateSignupPassword = () => {
    if (!signupPassword) {
      setError("Please create a password.");
      return false;
    }

    if (!passwordChecks.length) {
      setError("Password must contain at least 8 characters.");
      return false;
    }

    if (!passwordChecks.uppercase) {
      setError("Password must contain at least one uppercase letter.");
      return false;
    }

    if (!passwordChecks.lowercase) {
      setError("Password must contain at least one lowercase letter.");
      return false;
    }

    if (!passwordChecks.number) {
      setError("Password must contain at least one number.");
      return false;
    }

    if (!passwordChecks.special) {
      setError("Password must contain at least one special character.");
      return false;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // SIGN IN
  // --------------------------------------------------

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (loginRole === "admin") {
      if (!username.trim()) {
        setError("Please enter your admin username.");
        return;
      }
    } else {
      if (!signinEmail.trim()) {
        setError("Please enter your Gmail address.");
        return;
      }

      if (
        !/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(signinEmail.trim())
      ) {
        setError("Please enter a valid Gmail address.");
        return;
      }
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    // Demo admin login
    if (
      loginRole === "admin" &&
      username.trim().toLowerCase() === "admin" &&
      password === "admin123"
    ) {
      sessionStorage.setItem("adminLoggedIn", "true");
      sessionStorage.setItem("userRole", "admin");

      window.location.replace("/");
      return;
    }

    setError(
      loginRole === "admin"
        ? "Invalid admin credentials. Please check your username and password."
        : "Visitor authentication is not connected to the backend yet."
    );

    setLoading(false);
  };

  // --------------------------------------------------
  // SIGN UP
  // --------------------------------------------------

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!validateName()) return;
    if (!validateGmail()) return;
    if (!validateMobile()) return;
    if (!validateSignupPassword()) return;

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const visitorProfile = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile,
      createdAt: new Date().toISOString(),
      profileType: "visitor",
    };

    /*
      Demo/local profile storage.

      Password is intentionally NOT stored here.
      Real authentication should be handled by the backend.
    */
    localStorage.setItem(
      "visitorProfile",
      JSON.stringify(visitorProfile)
    );

    setLoading(false);
    setSignupComplete(true);
  };

  // --------------------------------------------------
  // SWITCH MODE
  // --------------------------------------------------

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");
    setMessage("");
    setSignupComplete(false);
    setLoading(false);
  };

  // --------------------------------------------------
  // RESET SIGNUP
  // --------------------------------------------------

  const resetSignup = () => {
    setFullName("");
    setEmail("");
    setMobile("");
    setSignupPassword("");
    setConfirmPassword("");
    setSignupComplete(false);
    setError("");
    setMessage("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[110px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:55px_55px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">

          {/* LEFT PANEL */}
          <section className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-violet-500/[0.08] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              {/* BRAND */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-lg shadow-cyan-500/10">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-cyan-300">
                    SMART SECURITY
                  </p>

                  <h1 className="text-lg font-bold text-white">
                    QR Visitor Management
                  </h1>
                </div>
              </div>

              {/* MAIN HEADING */}
              <div className="mt-20 max-w-lg">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-xs font-medium text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Next-generation visitor security
                </div>

                <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                  Smarter visitor
                  <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                    management starts here.
                  </span>
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                  A modern security platform for registering visitors,
                  managing QR access, monitoring visits and maintaining
                  real-time security records.
                </p>
              </div>

              {/* FEATURES */}
              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                <Feature
                  icon={<Fingerprint />}
                  title="QR Identity"
                  text="Fast visitor identification"
                />

                <Feature
                  icon={<Zap />}
                  title="Real-time"
                  text="Instant access monitoring"
                />

                <Feature
                  icon={<ShieldCheck />}
                  title="Secure"
                  text="Controlled visitor access"
                />

                <Feature
                  icon={<Users />}
                  title="Analytics"
                  text="Smart visitor insights"
                />
              </div>
            </div>

            {/* BOTTOM */}
            <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-500">
              <span>© 2026 QR Visitor Management</span>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                All systems operational
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <section className="flex min-h-[700px] flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-14">

            {/* MOBILE BRAND */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-cyan-300">
                  SMART SECURITY
                </p>

                <p className="font-bold">
                  QR Visitor Management
                </p>
              </div>
            </div>

            {/* HEADER */}
            <div className="mb-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                {authMode === "signin" ? (
                  <LogIn className="h-6 w-6 text-cyan-300" />
                ) : (
                  <UserPlus className="h-6 w-6 text-violet-300" />
                )}
              </div>

              <h2 className="text-3xl font-bold tracking-tight">
                {authMode === "signin"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {authMode === "signin"
                  ? "Sign in to access your visitor management dashboard."
                  : "Create your visitor account using your name, Gmail, mobile number and password."}
              </p>
            </div>

            {/* TABS */}
            <div className="mb-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1.5">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  authMode === "signin"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  authMode === "signup"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* SIGN IN */}
            {authMode === "signin" && (
              <form
                onSubmit={handleSignIn}
                className="space-y-6"
              >
                {/* ROLE */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    Continue as
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <RoleCard
                      active={loginRole === "admin"}
                      icon={<ShieldCheck />}
                      title="Admin"
                      description="Dashboard access"
                      onClick={() => {
                        setLoginRole("admin");
                        setError("");
                      }}
                    />

                    <RoleCard
                      active={loginRole === "visitor"}
                      icon={<User />}
                      title="Visitor"
                      description="Visitor access"
                      onClick={() => {
                        setLoginRole("visitor");
                        setError("");
                      }}
                    />
                  </div>
                </div>

                {/* ADMIN USERNAME */}
                {loginRole === "admin" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Username
                    </label>

                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setError("");
                        }}
                        type="text"
                        placeholder="Enter your username"
                        autoComplete="username"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-400/5"
                      />
                    </div>
                  </div>
                )}

                {/* VISITOR GMAIL */}
                {loginRole === "visitor" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Gmail Address
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        value={signinEmail}
                        onChange={(e) => {
                          setSigninEmail(e.target.value);
                          setError("");
                        }}
                        type="email"
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-400/5"
                      />
                    </div>
                  </div>
                )}

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-400/5"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR */}
                {error && <ErrorMessage message={error} />}

                {/* ADMIN DEMO */}
                {loginRole === "admin" && (
                  <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

                      <div>
                        <p className="text-xs font-semibold text-cyan-200">
                          Demo administrator access
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Username:{" "}
                          <span className="text-slate-300">
                            admin
                          </span>{" "}
                          • Password:{" "}
                          <span className="text-slate-300">
                            admin123
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-slate-950 shadow-xl shadow-cyan-500/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Demo/local authentication
                </div>
              </form>
            )}

            {/* SIGN UP */}
            {authMode === "signup" && !signupComplete && (
              <form
                onSubmit={handleSignUp}
                className="space-y-5"
              >
                {/* PROGRESS */}
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">
                      Account setup
                    </span>

                    <span className="text-cyan-300">
                      Visitor registration
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
                  </div>
                </div>

                {/* PROFILE PREVIEW */}
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-white shadow-lg">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      Account preview
                    </p>

                    <p className="truncate font-semibold text-white">
                      {fullName.trim() || "Your Name"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {email.trim() || "yourname@gmail.com"}
                    </p>
                  </div>
                </div>

                {/* FULL NAME */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Full Name
                    </label>

                    <span
                      className={`text-xs ${
                        fullName.length > 45
                          ? "text-amber-400"
                          : "text-slate-600"
                      }`}
                    >
                      {fullName.length}/50
                    </span>
                  </div>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError("");
                      }}
                      type="text"
                      placeholder="Enter your full name"
                      maxLength={50}
                      autoComplete="name"
                      autoFocus
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-400/5"
                    />
                  </div>
                </div>

                {/* GMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Gmail Address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      type="email"
                      placeholder="example@gmail.com"
                      autoComplete="email"
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-400/5"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-600">
                    Only Gmail addresses ending with @gmail.com are accepted.
                  </p>
                </div>

                {/* MOBILE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Mobile Number
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={mobile}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);

                        setMobile(digits);
                        setError("");
                      }}
                      type="tel"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      autoComplete="tel"
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm tracking-wider text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-400/5"
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Indian mobile number only
                    </p>

                    <span
                      className={`text-xs ${
                        mobile.length === 10
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      {mobile.length}/10
                    </span>
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Create Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setError("");
                      }}
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-400/5"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowSignupPassword(!showSignupPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* PASSWORD STRENGTH */}
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Password strength
                      </span>

                      <span
                        className={`text-xs font-semibold ${passwordStrength.textClass}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.className}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>

                  {/* PASSWORD REQUIREMENTS */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                    <PasswordRule
                      valid={passwordChecks.length}
                      text="8+ characters"
                    />

                    <PasswordRule
                      valid={passwordChecks.uppercase}
                      text="Uppercase letter"
                    />

                    <PasswordRule
                      valid={passwordChecks.lowercase}
                      text="Lowercase letter"
                    />

                    <PasswordRule
                      valid={passwordChecks.number}
                      text="Number"
                    />

                    <PasswordRule
                      valid={passwordChecks.special}
                      text="Special character"
                    />
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-400/5"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div
                      className={`mt-2 flex items-center gap-2 text-xs ${
                        signupPassword === confirmPassword
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {signupPassword === confirmPassword ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Passwords do not match
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ERROR */}
                {error && <ErrorMessage message={error} />}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !fullName.trim() ||
                    !email.trim() ||
                    mobile.length !== 10 ||
                    !signupPassword ||
                    !confirmPassword
                  }
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white shadow-xl shadow-violet-500/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-slate-600">
                  Your account details are used for visitor identification
                  and visitor management.
                </p>
              </form>
            )}

            {/* SIGNUP SUCCESS */}
            {authMode === "signup" && signupComplete && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
                    <Check className="h-7 w-7 text-emerald-300" />
                  </div>
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Account Created
                </p>

                <h3 className="mt-3 text-2xl font-bold">
                  Welcome, {fullName.trim()}
                </h3>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
                  Your visitor account profile has been created successfully.
                  Your registered Gmail and mobile number are ready for visitor
                  identification.
                </p>

                {/* PROFILE CARD */}
                <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 font-bold">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {fullName.trim()}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {email.trim().toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Mobile
                      </p>

                      <p className="mt-1 text-xs text-slate-300">
                        {mobile}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Account
                      </p>

                      <p className="mt-1 text-xs text-emerald-400">
                        Visitor
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setLoginRole("visitor");
                    setSignupComplete(false);
                    setPassword("");
                    setSigninEmail(email);
                    setMessage(
                      "Your account profile was created successfully. Visitor authentication will be connected to the backend later."
                    );
                  }}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Continue to Sign In
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={resetSignup}
                  className="mt-4 text-sm text-slate-500 transition hover:text-white"
                >
                  Create another account
                </button>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {message && authMode === "signin" && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300">
                {message}
              </div>
            )}

            {/* BOTTOM */}
            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <Building2 className="h-3.5 w-3.5" />
                QR Visitor Management Platform
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ==================================================
// FEATURE COMPONENT
// ==================================================

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition duration-300 hover:border-cyan-300/20 hover:bg-white/[0.05]">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <p className="text-sm font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {text}
      </p>
    </div>
  );
}

// ==================================================
// ROLE CARD
// ==================================================

function RoleCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-cyan-400/40 bg-cyan-400/[0.08] shadow-lg shadow-cyan-500/5"
          : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
          <Check className="h-3 w-3" />
        </span>
      )}

      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
          active
            ? "bg-cyan-400/15 text-cyan-300"
            : "bg-white/5 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </button>
  );
}

// ==================================================
// PASSWORD RULE
// ==================================================

function PasswordRule({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${
        valid ? "text-emerald-400" : "text-slate-600"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid ? "bg-emerald-400/15" : "bg-white/5"
        }`}
      >
        <Check className="h-2.5 w-2.5" />
      </span>

      {text}
    </div>
  );
}

// ==================================================
// ERROR MESSAGE
// ==================================================

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}