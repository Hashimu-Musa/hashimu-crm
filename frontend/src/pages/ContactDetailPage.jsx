import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { companyService, contactService } from "../services/crmService";

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", jobTitle: "", email: "", phone: "", mobilePhone: "", companyId: "", status: "LEAD", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([contactService.get(id), companyService.list({ page: 1, pageSize: 100 })]).then(([data, companyResult]) => {
      setContact(data); setCompanies(companyResult.items); setForm({ firstName: data.firstName || "", lastName: data.lastName || "", jobTitle: data.jobTitle || "", email: data.email || "", phone: data.phone || "", mobilePhone: data.mobilePhone || "", companyId: data.companyId || "", status: data.status || "LEAD", notes: data.notes || "" });
    }).catch((requestError) => setError(requestError.response?.data?.error || "Unable to load contact.")).finally(() => setLoading(false));
  }, [id]);

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSaved(false);
    try { const updated = await contactService.update(id, { ...form, companyId: form.companyId || null }); setContact((current) => ({ ...current, ...updated })); setSaved(true); }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to save contact."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`)) return;
    try { await contactService.remove(id); navigate("/contacts"); }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to delete contact."); }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">Loading contact...</main>;
  if (!contact) return <main className="min-h-screen bg-slate-50 p-8"><div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error || "Contact not found."}</div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6"><Link to="/contacts" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to contacts</Link><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Contact detail</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{contact.firstName} {contact.lastName}</h1><p className="mt-2 text-sm text-slate-500">{contact.jobTitle || "No job title"} · {contact.status}</p></div><button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete contact</button></header>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{saved && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Contact saved.</div>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Contact information</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" name="firstName" value={form.firstName} onChange={updateField} required /><Field label="Last name" name="lastName" value={form.lastName} onChange={updateField} required /></div><Field label="Job title" name="jobTitle" value={form.jobTitle} onChange={updateField} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Email" name="email" type="email" value={form.email} onChange={updateField} /><Field label="Phone" name="phone" value={form.phone} onChange={updateField} /></div><Field label="Mobile phone" name="mobilePhone" value={form.mobilePhone} onChange={updateField} /><label className="block text-sm font-medium text-slate-700">Company<select name="companyId" value={form.companyId} onChange={updateField} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">No company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Status<select name="status" value={form.status} onChange={updateField} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>LEAD</option><option>PROSPECT</option><option>CUSTOMER</option><option>INACTIVE</option></select></label><label className="block text-sm font-medium text-slate-700">Notes<textarea name="notes" value={form.notes} onChange={updateField} rows="4" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></label><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></form><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Related deals <span className="text-sm font-normal text-slate-400">({contact.deals?.length ?? 0})</span></h2><div className="mt-4 space-y-3">{contact.deals?.length ? contact.deals.map((deal) => <div key={deal.id} className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-900">{deal.title}</p><span className="text-sm font-bold text-slate-700">{Number(deal.value || 0).toLocaleString()} {deal.currency}</span></div><p className="mt-1 text-xs text-slate-500">{deal.company?.name || "No company"} · {deal.stage?.name || "No stage"} · {deal.status}</p></div>) : <p className="text-sm text-slate-500">No deals linked to this contact.</p>}</div></section></div></div></main>;
}

function Field({ label, name, value, onChange, type = "text", required = false }) { return <label className="block text-sm font-medium text-slate-700">{label}<input required={required} type={type} name={name} value={value} onChange={onChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>; }
