import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

function Register() {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        fullName: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Guard: wait for AuthContext
    if (loading) return null;

    // Guard: already logged in
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username) newErrors.username = "Username is required.";
        if (!formData.fullName) newErrors.fullName = "Full name is required.";
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = "A valid email is required.";
        if (!formData.role) newErrors.role = "Please select your role.";
        if (!formData.password || formData.password.length < 6)
            newErrors.password = "Password must be at least 6 characters.";
        if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match.";
        if (!termsAccepted) newErrors.terms = "You must accept the terms.";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setSubmitting(true);
        try {
            const res = await registerApi({
                username: formData.username,
                email: formData.email,
                fullName: formData.fullName,
                password: formData.password,
                role: formData.role,
            });
            const authData = res.data.body;
            login(authData.accessToken, authData.refreshToken, {
                username: authData.username,
                role: authData.role,
            });
            navigate("/dashboard");
        } catch (err) {
            setErrors({
                general:
                    err?.response?.data?.message ||
                    "Username or Email already exists!",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="af-register-page">
            <main className="af-register-main">
                {/* Header / Branding */}
                <header className="af-register-header">
                    <span className="material-symbols-outlined">school</span>
                    <h1>Academic Forum</h1>
                    <p>Join the global network of researchers and scholars</p>
                </header>

                {/* Form */}
                <form className="af-register-form" onSubmit={handleSubmit} noValidate>
                    {errors.general && (
                        <div
                            style={{
                                padding: "12px 16px",
                                background: "var(--color-error-container)",
                                border: "1px solid var(--color-error)",
                                borderRadius: "var(--radius)",
                                color: "var(--color-on-error-container)",
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--fs-body-sm)",
                            }}
                        >
                            {errors.general}
                        </div>
                    )}

                    {/* Username + Full Name */}
                    <div className="af-register-grid">
                        <div className="af-register-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className={`af-input-underline${errors.username ? " af-input-error" : ""}`}
                                placeholder="jdoe_academic"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            {errors.username && <p className="af-error-msg">{errors.username}</p>}
                        </div>
                        <div className="af-register-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                className={`af-input-underline${errors.fullName ? " af-input-error" : ""}`}
                                placeholder="Dr. John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            {errors.fullName && <p className="af-error-msg">{errors.fullName}</p>}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="af-register-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={`af-input-underline${errors.email ? " af-input-error" : ""}`}
                            placeholder="john.doe@university.edu"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="af-error-msg">{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div className="af-register-group">
                        <label htmlFor="role">Professional Role</label>
                        <div className="af-register-select-wrap">
                            <select
                                id="role"
                                name="role"
                                className={`af-input-underline${errors.role ? " af-input-error" : ""}`}
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="" disabled>Select your role</option>
                                <option value="RESEARCHER">Researcher</option>
                                <option value="LECTURER">Lecturer</option>
                                <option value="STUDENT">Student</option>
                            </select>
                            <span className="material-symbols-outlined">expand_more</span>
                        </div>
                        {errors.role && <p className="af-error-msg">{errors.role}</p>}
                    </div>

                    {/* Password + Confirm */}
                    <div className="af-register-grid">
                        <div className="af-register-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className={`af-input-underline${errors.password ? " af-input-error" : ""}`}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min. 6 characters"
                            />
                            {errors.password && <p className="af-error-msg">{errors.password}</p>}
                        </div>
                        <div className="af-register-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className={`af-input-underline${errors.confirmPassword ? " af-input-error" : ""}`}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat password"
                            />
                            {errors.confirmPassword && (
                                <p className="af-error-msg">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="af-register-terms">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => {
                                setTermsAccepted(e.target.checked);
                                if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                            }}
                        />
                        <label htmlFor="terms">
                            I agree to the{" "}
                            <a href="#">Terms of Service</a> and{" "}
                            <a href="#">Privacy Policy</a>.
                        </label>
                    </div>
                    {errors.terms && <p className="af-error-msg">{errors.terms}</p>}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="af-register-submit"
                        disabled={submitting}
                    >
                        {submitting ? "Creating Account…" : "Create Account"}
                    </button>
                </form>

                {/* Footer */}
                <footer className="af-register-footer">
                    <p>Already have an account?</p>
                    <Link to="/login">Sign In</Link>
                </footer>
            </main>
        </div>
    );
}

export default Register;