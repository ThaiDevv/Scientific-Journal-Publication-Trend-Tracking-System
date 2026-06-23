import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import PaperDetail from "./pages/PaperDetail";
import SearchPapers from "./pages/SearchPapers.jsx";
import Dashboard from "./pages/Dashboard";
import TrendAnalysis from "./pages/TrendAnalysis";
import TopicExplorer from "./pages/TopicExplorer";
import Following from "./pages/Following";
import Reports from "./pages/Reports";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

import Bookmarks from "./pages/Bookmarks";

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

                {/* --- KHU VỰC ĐƯỢC BẢO VỆ CỦA ÔNG --- */}
                {/* Phải đăng nhập thành công mới được vào xem mấy trang này */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/papers/:id" element={<PaperDetail />} />
                <Route
                    path="/trends"
                    element={
                        <ProtectedRoute>
                            <TrendAnalysis />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/topics"
                    element={
                        <ProtectedRoute>
                            <TopicExplorer />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/following"
                    element={
                        <ProtectedRoute>
                            <Following />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/papers/search"
                    element={
                        <ProtectedRoute>
                            <SearchPapers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bookmarks"
                    element={
                        <ProtectedRoute>
                            <Bookmarks />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;