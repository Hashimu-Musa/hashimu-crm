import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAccount } from "../services/authService";
import {
  AuthError,
  AuthField,
  AuthSubmitButton,
  getApiErrorMessage,
} from "../components/auth/AuthField";

const initialForm = {
  organizationName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      await registerAccount({
        organizationName: form.organizationName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CRM portal</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Create your CRM</h1>
          <p className="mt-2 text-sm text-slate-600">Set up your organization and owner account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthError message={error} />

          <AuthField
            label="Organization name"
            id="organizationName"
            autoComplete="organization"
            value={form.organizationName}
            onChange={updateField}
            placeholder="Acme Corporation"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField
              label="First name"
              id="firstName"
              autoComplete="given-name"
              value={form.firstName}
              onChange={updateField}
              placeholder="Jane"
            />
            <AuthField
              label="Last name"
              id="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={updateField}
              placeholder="Smith"
            />
          </div>

          <AuthField
            label="Email address"
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            placeholder="jane@example.com"
          />

          <AuthField
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField}
            placeholder="At least 10 characters"
          />

          <AuthField
            label="Confirm password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={updateField}
            placeholder="Repeat your password"
          />

          <AuthSubmitButton loading={loading}>Create account</AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
