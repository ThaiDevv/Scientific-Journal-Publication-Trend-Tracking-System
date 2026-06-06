import { createContext, useCallback, useEffect, useState } from "react";

export const AuthContext = createContext();

/**
 * Kiểm tra JWT còn hạn hay không bằng cách decode phần payload (base64).
 * Trả về true nếu token hợp lệ và chưa hết hạn.
 */
function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // payload.exp là Unix timestamp (giây)
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    // loading để tránh flash redirect trước khi đọc xong localStorage
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (isTokenValid(savedToken)) {
            setToken(savedToken);
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch {
                    // dữ liệu user bị corrupt → bỏ qua
                }
            }
        } else {
            // Token không tồn tại hoặc đã hết hạn → dọn sạch
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }

        setLoading(false);
    }, []);

    const login = useCallback((jwtToken, userData) => {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}