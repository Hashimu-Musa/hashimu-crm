import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuthSession, getCurrentUser } from "../config/authStorage";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/companies", label: "Companies" },
  { to: "/contacts", label: "Contacts" },
  { to: "/deals", label: "Deals" },
  { to: "/activities", label: "Activities" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-lg font-bold text-slate-900">CRM Portal</Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
            {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{link.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs text-slate-500 sm:block"><strong className="block text-sm text-slate-700">{user ? `${user.firstName} ${user.lastName}` : "Account"}</strong>{user?.organization?.name}</span>
            <button type="button" onClick={logout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log out</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
