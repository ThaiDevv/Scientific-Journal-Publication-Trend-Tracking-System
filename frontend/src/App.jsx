import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa token
    localStorage.removeItem("token");

    // Quay về login
    navigate("/login");
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: 100,
      }}
    >
      <h1>Dashboard Page</h1>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Register */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;