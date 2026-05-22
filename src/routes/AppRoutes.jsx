import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import GuestRoute from "../components/GuestRoute.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Landing from "../pages/Landing.jsx";
import Signup from "../pages/Signup.jsx";
import Login from "../pages/Login.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Profile from "../pages/Profile.jsx";
import Roadmap from "../pages/Roadmap.jsx";
import Interview from "../pages/Interview.jsx";
import Resume from "../pages/Resume.jsx";
import Dsa from "../pages/Dsa.jsx";
import Achievements from "../pages/Achievements.jsx";
import Progress from "../pages/Progress.jsx";
import Planner from "../pages/Planner.jsx";
import Trending from "../pages/Trending.jsx";
import Saved from "../pages/Saved.jsx";
import Guidance from "../pages/Guidance.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/dsa" element={<Dsa />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/guidance" element={<Guidance />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
