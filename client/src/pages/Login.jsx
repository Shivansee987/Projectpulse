
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import { useTheme } from "../components/layout/ThemeContext";

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await api.post("/auth/register", {
          name,
          email,
          password,
        });

        setMessage(response.data.message + ". Please login.");
        setIsRegister(false);
        setName("");
        setPassword("");
      } else {
        const response = await api.post("/auth/login", {
          email,
          password,
        });

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <button
        type="button"
        className="theme-toggle auth-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <ThemeIcon size={18} aria-hidden="true" />
      </button>

      <div className="auth-layout">
        <section className="auth-intro" aria-label="About ProjectPulse">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">P</span>
            <span>ProjectPulse</span>
          </div>
          <div className="auth-intro-copy">
            <span className="auth-kicker">
              <Sparkles size={15} aria-hidden="true" />
              Plan with clarity
            </span>
            <h1>Make meaningful progress, together.</h1>
            <p>
              Bring your projects, tasks, and timelines into one calm,
              considered workspace.
            </p>
          </div>
          <div className="auth-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-heading">
            <p className="eyebrow">
              {isRegister ? "GET STARTED" : "YOUR WORKSPACE"}
            </p>
            <h2 id="auth-title">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="subtitle">
              {isRegister
                ? "Set up your space and bring your next project to life."
                : "Sign in to pick up where your team left off."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="auth-field">
                <span>Name</span>
                <span className="auth-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </span>
              </label>
            )}

            <label className="auth-field">
              <span>Email</span>
              <span className="auth-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  minLength={8}
                  required
                />
              </span>
              {isRegister && (
                <small className="auth-field-hint">
                  Use at least 8 characters.
                </small>
              )}
            </label>

            {error && (
              <p className="auth-feedback auth-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-feedback auth-success" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </span>
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "New to ProjectPulse?"}
            <button
              type="button"
              className="auth-switch-button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setMessage("");
              }}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;