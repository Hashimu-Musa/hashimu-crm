
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { companyService, contactService } from "../services/crmService";

const emptyForm = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  mobilePhone: "",
  companyId: "",
  status: "LEAD",
  dateOfBirth: "",
  preferredCommunicationChannel: "NONE",
  birthdayMessagingConsent: false,
  notes: "",
};

export default function ContactsPage() {
  const [result, setResult] = useState({ items: [], pagination: {} });
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await contactService.list({
        page: 1,
        pageSize: 25,
        search,
        companyId,
        status,
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [search, companyId, status]);

  useEffect(() => {
    companyService.list({ page: 1, pageSize: 100 })
      .then((data) => setCompanies(data.items))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadContacts, 250);
    return () => clearTimeout(timer);
  }, [loadContacts]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openForm() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
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
      phone: form.phone.trim() || null,
      mobilePhone: form.mobilePhone.trim() || null,
      jobTitle: form.jobTitle.trim() || null,
      companyId: form.companyId || null,
      dateOfBirth: form.dateOfBirth || null,
      notes: form.notes.trim() || null,
    };

    try {
      await contactService.create(payload);
      closeForm();
      setSuccess("Contact registered successfully.");
      await loadContacts();
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setError(details.map((item) =>
          `${item.path.join(".")}: ${item.message}`
        ).join(" | "));
      } else {
        setError(
          requestError.response?.data?.error ||
          "Unable to save contact. Please check your information."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact) {
    if (!window.confirm(
      `Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`
    )) return;

    setDeletingId(contact.id);
    setError("");
    try {
      await contactService.remove(contact.id);
      setSuccess("Contact deleted successfully.");
      await loadContacts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to delete contact.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CRM records</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Contacts</h1>
            <p className="mt-2 text-sm text-slate-500">Manage the people connected to your companies.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadContacts} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Refresh
            </button>
            <button type="button" onClick={openForm} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + Add Contact
            </button>
          </div>
        </header>

        {success && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Register New Contact</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the contact's information below.</p>
              </div>
              <button type="button" onClick={closeForm} className="text-xl text-slate-400 hover:text-slate-700" aria-label="Close form">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="First Name" name="firstName" value={form.firstName} onChange={updateField} required />
                <Field label="Last Name" name="lastName" value={form.lastName} onChange={updateField} required />
                <Field label="Job Title" name="jobTitle" value={form.jobTitle} onChange={updateField} placeholder="e.g. Manager" />
                <Field label="Email Address" name="email" type="email" value={form.email} onChange={updateField} placeholder="contact@example.com" />
                <Field label="Phone Number" name="phone" value={form.phone} onChange={updateField} placeholder="+234..." />
                <Field label="Mobile Phone" name="mobilePhone" value={form.mobilePhone} onChange={updateField} placeholder="+234..." />
                <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />

                <SelectField label="Company" name="companyId" value={form.companyId} onChange={updateField}>
                  <option value="">No company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </SelectField>

                <SelectField label="Contact Status" name="status" value={form.status} onChange={updateField}>
                  <option value="LEAD">Lead</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INACTIVE">Inactive</option>
                </SelectField>

                <SelectField label="Preferred Communication" name="preferredCommunicationChannel" value={form.preferredCommunicationChannel} onChange={updateField}>
                  <option value="NONE">Not specified</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PHONE">Phone</option>
                </SelectField>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="birthdayMessagingConsent"
                  checked={form.birthdayMessagingConsent}
                  onChange={updateField}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <strong>Birthday messaging consent</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    The contact has agreed to receive birthday messages.
                  </span>
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows="3"
                  placeholder="Additional information about this contact..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "Saving..." : "Save Contact"}
                </button>
                <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search contacts</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label>
            <span className="sr-only">Filter by company</span>
            <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm lg:w-52">
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter contact status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm lg:w-44">
              <option value="">All statuses</option>
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
            {result.pagination.total ?? 0} contacts
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading contacts...</div>
          ) : result.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No contacts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Contact</th>
                    <th className="px-5 py-3 font-semibold">Company</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Deals</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link to={`/contacts/${contact.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {contact.email || contact.phone || "No contact details"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {contact.company ? (
                          <Link to={`/companies/${contact.company.id}`} className="text-slate-700 hover:text-blue-600">
                            {contact.company.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{contact._count?.deals ?? 0}</td>
                      <td className="px-5 py-4 text-right">
                        <button type="button" disabled={deletingId === contact.id} onClick={() => handleDelete(contact)} className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
                          {deletingId === contact.id ? "Deleting..." : "Delete"}
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

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}
