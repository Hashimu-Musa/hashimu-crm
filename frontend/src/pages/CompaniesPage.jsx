
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { companyService } from "../services/crmService";

const emptyForm = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
  notes: "",
  status: "PROSPECT",
};

function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div role="alert" className="flex justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>
      <button onClick={onRetry} className="font-semibold underline">
        Retry
      </button>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export default function CompaniesPage() {
  const [result, setResult] = useState({ items: [], pagination: {} });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState("");

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await companyService.list({
        page: 1,
        pageSize: 25,
        search,
        status,
      });

      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(loadCompanies, 250);
    return () => clearTimeout(timer);
  }, [loadCompanies]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(company) {
    setEditingId(company.id);
    setForm({
      ...emptyForm,
      ...company,
      email: company.email || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
    };

    try {
      if (editingId) {
        await companyService.update(editingId, payload);
        setSuccess("Company updated successfully.");
      } else {
        await companyService.create(payload);
        setSuccess("Company registered successfully.");
      }

      closeForm();
      await loadCompanies();
    } catch (err) {
  const details = err.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    setError(
      details
        .map((item) => `${item.path.join(".")}: ${item.message}`)
        .join(" | ")
    );
  } else {
    setError(
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Unable to save company. Please check your information."
    );
  }
}finally {
      setSaving(false);
    }
  }

  async function handleDelete(company) {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) return;

    setDeletingId(company.id);
    setError("");
    setSuccess("");

    try {
      await companyService.remove(company.id);
      setSuccess("Company deleted successfully.");
      await loadCompanies();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to delete company.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              CRM records
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Companies
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Register and manage your business customers.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadCompanies}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={openNewForm}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Company
            </button>
          </div>
        </header>

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <ErrorMessage message={error} onRetry={loadCompanies} />

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Company" : "Register New Company"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="text-xl text-slate-500 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Company Name" name="name" value={form.name} onChange={handleChange} required placeholder="Enter company name" />
                <Field label="Legal Name" name="legalName" value={form.legalName || ""} onChange={handleChange} placeholder="Registered legal name" />
                <Field label="Industry" name="industry" value={form.industry || ""} onChange={handleChange} placeholder="e.g. Technology" />
                <Field label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" placeholder="company@example.com" />
                <Field label="Phone Number" name="phone" value={form.phone || ""} onChange={handleChange} placeholder="+234..." />
                <Field label="Website" name="website" value={form.website || ""} onChange={handleChange} placeholder="https://example.com" />
                <Field label="Address Line 1" name="addressLine1" value={form.addressLine1 || ""} onChange={handleChange} />
                <Field label="Address Line 2" name="addressLine2" value={form.addressLine2 || ""} onChange={handleChange} />
                <Field label="City" name="city" value={form.city || ""} onChange={handleChange} />
                <Field label="State" name="state" value={form.state || ""} onChange={handleChange} />
                <Field label="Postal Code" name="postalCode" value={form.postalCode || ""} onChange={handleChange} />
                <Field label="Country" name="country" value={form.country || ""} onChange={handleChange} />
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Company Status
                </span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:w-1/3"
                >
                  <option value="PROSPECT">Prospect</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CHURNED">Churned</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  name="notes"
                  value={form.notes || ""}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional information about this company..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Company" : "Save Company"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search companies</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by company name or email..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-44"
          >
            <option value="">All statuses</option>
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
            <option value="CUSTOMER">Customer</option>
            <option value="INACTIVE">Inactive</option>
            <option value="CHURNED">Churned</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
            {result.pagination.total ?? 0} companies
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading companies...
            </div>
          ) : result.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No companies found. Click "Add Company" to register your first company.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Industry</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Records</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {result.items.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link
                          to={`/companies/${company.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {company.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {company.email || company.website || "No contact details"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {company.industry || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {company.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {company._count?.contacts ?? 0} contacts · {company._count?.deals ?? 0} deals
                      </td>

                      <td className="space-x-3 whitespace-nowrap px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openEditForm(company)}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === company.id}
                          onClick={() => handleDelete(company)}
                          className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === company.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
