
import { useEffect, useMemo, useState } from "react";
import {
  activityService,
  companyService,
  contactService,
  dealService,
} from "../services/crmService";

const emptyForm = {
  type: "FOLLOW_UP",
  subject: "",
  description: "",
  dueAt: "",
  companyId: "",
  contactId: "",
  dealId: "",
};

const activityTypes = [
  "FOLLOW_UP",
  "CALL",
  "MEETING",
  "EMAIL",
  "WHATSAPP",
  "TASK",
  "NOTE",
];

function getError(err, fallback) {
  const details = err.response?.data?.details;

  if (Array.isArray(details) && details.length) {
    return details
      .map((item) => `${item.path?.join(".") || "Field"}: ${item.message}`)
      .join(" | ");
  }

  return err.response?.data?.error ||
    err.response?.data?.message ||
    fallback;
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function ActivitiesPage() {
  const [result, setResult] = useState({ items: [] });
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("false");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await activityService.list({
        page: 1,
        pageSize: 100,
        completed: filter,
      });
      setResult(data);
      setError("");
    } catch (err) {
      setError(getError(err, "Unable to load activities."));
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [companyData, contactData, dealData] = await Promise.all([
        companyService.list({ page: 1, pageSize: 100 }),
        contactService.list({ page: 1, pageSize: 100 }),
        dealService.list({ page: 1, pageSize: 100 }),
      ]);

      setCompanies(companyData.items || []);
      setContacts(contactData.items || []);
      setDeals(dealData.items || []);
    } catch (err) {
      setError(getError(err, "Unable to load company, contact and deal options."));
    }
  }

  useEffect(() => {
    loadActivities();
  }, [filter]);

  useEffect(() => {
    loadOptions();
  }, []);

  const visibleActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return result.items || [];

    return (result.items || []).filter((item) => {
      const company = item.company?.name || "";
      const contact = item.contact
        ? `${item.contact.firstName} ${item.contact.lastName}`
        : "";
      const deal = item.deal?.title || "";

      return [
        item.subject,
        item.description,
        item.type,
        company,
        contact,
        deal,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [result.items, search]);

  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function editActivity(item) {
    setForm({
      type: item.type || "FOLLOW_UP",
      subject: item.subject || "",
      description: item.description || "",
      dueAt: toLocalDateTime(item.dueAt),
      companyId: item.companyId || item.company?.id || "",
      contactId: item.contactId || item.contact?.id || "",
      dealId: item.dealId || item.deal?.id || "",
    });
    setEditingId(item.id);
    setError("");
    setShowForm(true);
  }

  async function saveActivity(e) {
    e.preventDefault();

    const payload = {
      type: form.type,
      subject: form.subject.trim(),
      description: form.description.trim(),
      dueAt: form.dueAt
        ? new Date(form.dueAt).toISOString()
        : null,
      companyId: form.companyId || null,
      contactId: form.contactId || null,
      dealId: form.dealId || null,
    };

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await activityService.update(editingId, payload);
      } else {
        await activityService.create(payload);
      }

      closeForm();
      await loadActivities();
    } catch (err) {
      setError(getError(err, "Unable to save activity."));
    } finally {
      setSaving(false);
    }
  }

  async function completeActivity(item) {
    try {
      setError("");
      await activityService.update(item.id, {
        completedAt: new Date().toISOString(),
      });
      await loadActivities();
    } catch (err) {
      setError(getError(err, "Unable to complete activity."));
    }
  }

  async function deleteActivity(item) {
    if (!window.confirm(`Are you sure you want to delete "${item.subject}"?`)) {
      return;
    }

    try {
      setError("");
      await activityService.remove(item.id);
      await loadActivities();
    } catch (err) {
      setError(getError(err, "Unable to delete activity."));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Customer follow-up
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Activities
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage calls, meetings, messages, notes and tasks in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewForm}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Activity
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={saveActivity}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Activity" : "Register New Activity"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close Form ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Activity Type *
                </label>
                <select
                  required
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Subject *
                </label>
                <input
                  required
                  maxLength={200}
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="Enter activity subject"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) =>
                    setForm({ ...form, dueAt: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Company
                </label>
                <select
                  value={form.companyId}
                  onChange={(e) =>
                    setForm({ ...form, companyId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No company selected</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Contact
                </label>
                <select
                  value={form.contactId}
                  onChange={(e) =>
                    setForm({ ...form, contactId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No contact selected</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deal
                </label>
                <select
                  value={form.dealId}
                  onChange={(e) =>
                    setForm({ ...form, dealId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No deal selected</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Add more details about this activity..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Activity"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-sm"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="false">Pending Activities</option>
            <option value="true">Completed Activities</option>
            <option value="">All Activities</option>
          </select>
        </div>

        <section className="space-y-3">
          {loading ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading activities...
            </p>
          ) : visibleActivities.length ? (
            visibleActivities.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {item.type.replace("_", " ")}
                    </span>
                    <h2 className="font-bold text-slate-900">
                      {item.subject}
                    </h2>
                    {item.completedAt && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {item.description || "No description"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Due: {item.dueAt
                        ? new Date(item.dueAt).toLocaleString()
                        : "No due date"}
                    </span>
                    {item.company && <span>Company: {item.company.name}</span>}
                    {item.contact && (
                      <span>
                        Contact: {item.contact.firstName} {item.contact.lastName}
                      </span>
                    )}
                    {item.deal && <span>Deal: {item.deal.title}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {!item.completedAt && (
                    <button
                      type="button"
                      onClick={() => completeActivity(item)}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => editActivity(item)}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteActivity(item)}
                    className="text-sm font-semibold text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              No activities found in this view.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
