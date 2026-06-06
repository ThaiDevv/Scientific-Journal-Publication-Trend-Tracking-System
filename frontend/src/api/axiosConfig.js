import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Tự động gắn Authorization: Bearer <token> vào mọi request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Nếu server trả 401 (token hết hạn / không hợp lệ) → logout và redirect /login
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes("/auth/login");

        if (error.response?.status === 401 && !isLoginRequest) {
            // Xóa dữ liệu xác thực khỏi localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Dùng window.location.href để reset toàn bộ React state (bao gồm AuthContext)
            // khi navigate về /login, AuthContext sẽ được khởi tạo lại với state null
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;