import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginAccount } from "../services/authService";
import {
  AuthError,
  AuthField,
  AuthSubmitButton,
  getApiErrorMessage,
} from "../components/auth/AuthField";

const initialForm = {
  email: "",
  password: "",
  organizationSlug: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAccount({
        email: form.email,
        password: form.password,
        ...(form.organizationSlug ? { organizationSlug: form.organizationSlug } : {}),
      });
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CRM portal</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage your customer relationships.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthError message={error} />

          <AuthField
            label="Email address"
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
          />

          <AuthField
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={updateField}
            placeholder="Enter your password"
          />

          <AuthField
            label="Organization slug (optional)"
            id="organizationSlug"
            autoComplete="organization"
            required={false}
            value={form.organizationSlug}
            onChange={updateField}
            placeholder="Only needed for duplicate emails"
          />

          <AuthSubmitButton loading={loading}>Sign in</AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to the CRM?{" "}
          <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
