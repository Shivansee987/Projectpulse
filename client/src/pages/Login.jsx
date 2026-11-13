
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

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
    <div className="page-shell">
      <div
        className="glass-panel"
        style={{
          maxWidth: "420px",
          margin: "80px auto",
          padding: "32px",
        }}
      >
        <p className="eyebrow">PROJECT PULSE</p>

        <h1>{isRegister ? "Create account" : "Welcome back"}</h1>

        <p className="subtitle">
          {isRegister
            ? "Register your new account"
            : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          {isRegister && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={8}
              required
            />
          </label>

          {error && (
            <p style={{ color: "#dc2626" }}>{error}</p>
          )}

          {message && (
            <p style={{ color: "green" }}>{message}</p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          {isRegister
            ? "Already have an account? "
            : "Don't have an account? "}

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setMessage("");
            }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;