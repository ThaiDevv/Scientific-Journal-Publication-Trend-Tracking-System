import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute – bảo vệ các route yêu cầu đăng nhập.
 *
 * Props:
 *   children  – component cần render
 *   role      – (tùy chọn) role yêu cầu, ví dụ "ADMIN"
 */
function ProtectedRoute({ children, role }) {
    const { isAuthenticated, user, loading } = useAuth();

    // Chờ AuthContext đọc xong localStorage trước khi quyết định redirect
    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "16px",
                    color: "#666",
                }}
            >
                Đang xác thực...
            </div>
        );
    }

    // Chưa đăng nhập → redirect về /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Đã đăng nhập nhưng không đủ role → trang 403
    if (role && user?.role !== role) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    gap: "12px",
                }}
            >
                <h1 style={{ fontSize: "72px", margin: 0, color: "#ff4d4f" }}>
                    403
                </h1>
                <p style={{ fontSize: "18px", color: "#555", margin: 0 }}>
                    Bạn không có quyền truy cập trang này.
                </p>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;