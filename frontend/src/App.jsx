import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

// ─── Dashboard tạm (placeholder) ────────────────────────────────────────────
function Dashboard() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        // Navigate sẽ xảy ra tự động vì isAuthenticated = false sau khi logout
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            {user && (
                <p>
                    Xin chào, <strong>{user.username}</strong> ({user.role})
                </p>
            )}
            <button className="logout-btn" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

// ─── Root redirect ────────────────────────────────────────────────────────────
function RootRedirect() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null; // tránh flash redirect

    return isAuthenticated ? (
        <Navigate to="/dashboard" replace />
    ) : (
        <Navigate to="/login" replace />
    );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRedirect />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Route được bảo vệ – phải đăng nhập mới vào được */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Ví dụ route chỉ dành cho ADMIN */}
                {/* <Route
                    path="/admin"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <AdminPage />
                        </ProtectedRoute>
                    }
                /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;