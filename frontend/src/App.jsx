import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getAccessToken } from "./config/authStorage";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import DealsPage from "./pages/DealsPage";
import ActivitiesPage from "./pages/ActivitiesPage";

function ProtectedRoute({ children }) {
  const location = useLocation();
  return getAccessToken() ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
        <a className="mt-4 inline-block font-semibold text-blue-600" href="/dashboard">Go to dashboard</a>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
