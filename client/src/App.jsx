
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Dependencies from "./pages/Dependencies";
import Simulator from "./pages/Simulator";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";

import ProtectedRoute from "./routes/ProtectedRoute";
import { ThemeProvider } from "./components/layout/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Login Page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/dependencies"
              element={<Dependencies />}
            />

            <Route
              path="/simulator"
              element={<Simulator />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />
          </Route>

          {/* Redirect unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
