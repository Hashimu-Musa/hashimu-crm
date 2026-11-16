
import { useEffect, useMemo, useState } from "react";
import {
  companyService,
  contactService,
  dealService,
} from "../services/crmService";

const emptyForm = {
  title: "",
  value: "",
  currency: "NGN",
  stageId: "",
  companyId: "",
  contactId: "",
  expectedCloseAt: "",
  description: "",
  status: "OPEN",
};

function dateForInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getErrorMessage(err, fallback) {
  const details = err.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((item) => `${item.path.join(".")}: ${item.message}`)
      .join(" | ");
  }

  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    fallback
  );
}

export default function DealsPage() {
  const [result, setResult] = useState({
    items: [],
    pagination: {},
  });

  const [stages, setStages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadDeals() {
    try {
      setLoading(true);

      const data = await dealService.list({
        page: 1,
        pageSize: 100,
        status,
      });

      setResult(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load deals."));
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [stageData, companyData, contactData] =
        await Promise.all([
          dealService.stages(),
          companyService.list({ page: 1, pageSize: 100 }),
          contactService.list({ page: 1, pageSize: 100 }),
        ]);

      setStages(stageData.items || []);
      setCompanies(companyData.items || []);
      setContacts(contactData.items || []);

      if (stageData.items?.length) {
        setForm((current) => ({
          ...current,
          stageId: current.stageId || stageData.items[0].id,
        }));
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load companies, contacts or deal stages."
        )
      );
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadDeals();
  }, [status]);

  const filteredDeals = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return result.items;

    return result.items.filter((deal) =>
      [
        deal.title,
        deal.company?.name,
        deal.contact?.firstName,
        deal.contact?.lastName,
        deal.stage?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(term)
        )
    );
  }, [result.items, search]);

  const availableContacts = contacts.filter(
    (contact) =>
      !form.companyId ||
      contact.companyId === form.companyId
  );

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "companyId"
        ? { contactId: "" }
        : {}),
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      stageId: stages[0]?.id || "",
    });

    setEditingId(null);
    setShowForm(false);
  }

  function openNewDealForm() {
    setError("");
    setForm({
      ...emptyForm,
      stageId: stages[0]?.id || "",
    });
    setEditingId(null);
    setShowForm(true);
  }

  function editDeal(deal) {
    setEditingId(deal.id);

    setForm({
      title: deal.title || "",
      value: String(deal.value ?? ""),
      currency: deal.currency || "NGN",
      stageId: deal.stageId || "",
      companyId: deal.companyId || "",
      contactId: deal.contactId || "",
      expectedCloseAt: dateForInput(deal.expectedCloseAt),
      description: deal.description || "",
      status: deal.status || "OPEN",
    });

    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveDeal(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      value: Number(form.value),
      currency: form.currency,
      stageId: form.stageId,
      companyId: form.companyId || null,
      contactId: form.contactId || null,
      expectedCloseAt: form.expectedCloseAt
        ? new Date(
            `${form.expectedCloseAt}T12:00:00`
          ).toISOString()
        : null,
      description: form.description.trim() || null,
      status: form.status,
    };

    try {
      if (editingId) {
        await dealService.update(editingId, payload);
      } else {
        await dealService.create(payload);
      }

      resetForm();
      await loadDeals();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          editingId
            ? "Unable to update deal."
            : "Unable to create deal."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeDeal(deal) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${deal.title}"?`
      )
    ) {
      return;
    }

    try {
      await dealService.remove(deal.id);
      await loadDeals();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete deal.")
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Sales pipeline
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Deals
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage opportunities, customers and sales progress.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewDealForm}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Deal
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Deal Registration Form */}
        {showForm && (
          <form
            onSubmit={saveDeal}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Deal"
                    : "Register New Deal"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the opportunity details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close Form
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Deal Title *
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  placeholder="e.g. Website Development"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Deal Value *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    updateField("value", e.target.value)
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Currency
                <select
                  value={form.currency}
                  onChange={(e) =>
                    updateField("currency", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Company
                <select
                  value={form.companyId}
                  onChange={(e) =>
                    updateField("companyId", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">No company selected</option>

                  {companies.map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Contact
                <select
                  value={form.contactId}
                  onChange={(e) =>
                    updateField("contactId", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">No contact selected</option>

                  {availableContacts.map((contact) => (
                    <option
                      key={contact.id}
                      value={contact.id}
                    >
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Deal Stage *
                <select
                  required
                  value={form.stageId}
                  onChange={(e) =>
                    updateField("stageId", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Select stage</option>

                  {stages.map((stage) => (
                    <option
                      key={stage.id}
                      value={stage.id}
                    >
                      {stage.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Expected Closing Date
                <input
                  type="date"
                  value={form.expectedCloseAt}
                  onChange={(e) =>
                    updateField(
                      "expectedCloseAt",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    updateField("status", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="OPEN">Open</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                Description
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Describe this deal..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !stages.length}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Deal"
                    : "Save Deal"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search and Filter */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals, companies or contacts..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-md"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          {/* Deals Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
              {filteredDeals.length} deals shown
            </div>

            {loading ? (
              <p className="p-12 text-center text-sm text-slate-500">
                Loading deals...
              </p>
            ) : filteredDeals.length === 0 ? (
              <p className="p-12 text-center text-sm text-slate-500">
                No deals found. Click + Add Deal to register your first deal.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Deal</th>
                      <th className="px-5 py-3">Company / Contact</th>
                      <th className="px-5 py-3">Stage</th>
                      <th className="px-5 py-3">Value</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDeals.map((deal) => (
                      <tr key={deal.id}>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {deal.title}

                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {deal.expectedCloseAt
                              ? `Expected: ${dateForInput(
                                  deal.expectedCloseAt
                                )}`
                              : "No closing date"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>
                            {deal.company?.name || "No company"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {deal.contact
                              ? `${deal.contact.firstName} ${deal.contact.lastName}`
                              : "No contact"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {deal.stage?.name || "—"}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {Number(deal.value).toLocaleString()}{" "}
                          {deal.currency}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {deal.status}
                          </span>
                        </td>

                        <td className="space-x-3 whitespace-nowrap px-5 py-4">
                          <button
                            type="button"
                            onClick={() => editDeal(deal)}
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => removeDeal(deal)}
                            className="font-semibold text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
