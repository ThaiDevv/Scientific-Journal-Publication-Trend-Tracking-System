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
import Bookmarks from "./pages/Bookmarks";
import AdminPanel from "./pages/AdminPanel.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

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

// ─── Wrap a page in ProtectedRoute + Layout ───────────────────────────────────
function Protected({ children, role }) {
    return (
        <ProtectedRoute role={role}>
            <Layout>{children}</Layout>
        </ProtectedRoute>
    );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* Public routes */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes — wrapped in Layout */}
                <Route
                    path="/dashboard"
                    element={
                        <Protected>
                            <Dashboard />
                        </Protected>
                    }
                />
                <Route
                    path="/trends"
                    element={
                        <Protected>
                            <TrendAnalysis />
                        </Protected>
                    }
                />
                <Route
                    path="/topics"
                    element={
                        <Protected>
                            <TopicExplorer />
                        </Protected>
                    }
                />
                <Route
                    path="/following"
                    element={
                        <Protected>
                            <Following />
                        </Protected>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <Protected>
                            <Reports />
                        </Protected>
                    }
                />
                <Route
                    path="/papers/search"
                    element={
                        <Protected>
                            <SearchPapers />
                        </Protected>
                    }
                />
                <Route
                    path="/bookmarks"
                    element={
                        <Protected>
                            <Bookmarks />
                        </Protected>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <Protected role="ADMIN">
                            <AdminPanel />
                        </Protected>
                    }
                />
                <Route
                    path="/papers/:id"
                    element={
                        <Protected>
                            <PaperDetail />
                        </Protected>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;