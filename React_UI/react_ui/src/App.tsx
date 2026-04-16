import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { Prediction } from "./pages/Prediction";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import Login from "./pages/Login";
import { Signup } from "./pages/Signup";

function App() {
  const token = localStorage.getItem("token");

  return (
    <ThemeProvider>
      <Routes>

        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/alerts"
          element={token ? <Alerts /> : <Navigate to="/login" />}
        />

        <Route
          path="/prediction"
          element={token ? <Prediction /> : <Navigate to="/login" />}
        />

        <Route
          path="/reports"
          element={token ? <Reports /> : <Navigate to="/login" />}
        />

        <Route
          path="/settings"
          element={token ? <Settings /> : <Navigate to="/login" />}
        />

      </Routes>
    </ThemeProvider>
  );
}

export default App;