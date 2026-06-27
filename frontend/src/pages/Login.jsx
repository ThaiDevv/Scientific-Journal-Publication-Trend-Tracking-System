import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [formData, setFormData] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Guard: Wait for AuthContext to finish loading
    if (loading) return null;

    // Guard: Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            setError("Please enter your username and password.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await loginApi(formData);
            const authData = res.data.body;
            login(authData.accessToken, authData.refreshToken, {
                username: authData.username,
                role: authData.role,
            });
            navigate("/dashboard");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Incorrect username or password."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="af-login-page">
            {/* Main container */}
            <main className="af-login-main">
                {/* Branding */}
                <header className="af-login-header">
                    <div className="af-login-header__icon">
                        <span className="material-symbols-outlined">menu_book</span>
                    </div>
                    <h1>Academic Forum</h1>
                    <p>Scientific Journal Publication Trend Tracking System</p>
                </header>

                {/* Login Card */}
                <div className="af-login-card">
                    <form className="af-login-form" onSubmit={handleSubmit}>
                        {/* Username field */}
                        <div className="af-input-group">
                            <label className="af-input-label" htmlFor="username">
                                Username
                            </label>
                            <div className={`af-input-wrap${error ? " af-input-error" : ""}`}>
                                <span className="material-symbols-outlined af-input-icon">person</span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="e.g. researcher_01"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="af-input-group">
                            <label className="af-input-label" htmlFor="password">
                                Password
                            </label>
                            <div className={`af-input-wrap${error ? " af-input-error" : ""}`}>
                                <span className="material-symbols-outlined af-input-icon">lock</span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    style={{ paddingRight: "48px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--color-on-surface-variant)",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "4px",
                                        transition: "color 0.2s ease",
                                    }}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {error && <p className="af-error-msg">{error}</p>}
                        </div>

                        {/* Remember & Forgot */}
                        <div className="af-login-form__footer">
                            <label className="af-remember-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Remember me
                            </label>
                            <a href="#" className="af-forgot-link">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="af-login-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Signing in…" : "Sign In"}
                            {!submitting && (
                                <span className="material-symbols-outlined arrow-icon">
                                    arrow_forward
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Sign Up CTA */}
                    <div className="af-login-signup-cta">
                        <p>
                            New to Academic Forum?
                            <Link to="/register">Sign Up</Link>
                        </p>
                    </div>
                </div>

                {/* Info Bento Cards */}
                <div className="af-login-bento">
                    <div className="af-login-bento__card">
                        <span className="material-symbols-outlined">verified</span>
                        <div>
                            <h3>Peer Reviewed</h3>
                            <p>Access 2M+ verified citations.</p>
                        </div>
                    </div>
                    <div className="af-login-bento__card">
                        <span className="material-symbols-outlined">trending_up</span>
                        <div>
                            <h3>Live Analytics</h3>
                            <p>Real-time journal trend mapping.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="af-login-footer">
                <div className="af-login-footer__links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Support</a>
                </div>
                <p>© 2026 Academic Forum — Journal Trend Tracking. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Login;