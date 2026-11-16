import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { companyService } from "../services/crmService";

const emptyForm = { name: "", legalName: "", website: "", industry: "", phone: "", email: "", notes: "", status: "PROSPECT" };

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    companyService.get(id).then((data) => {
      if (!active) return;
      setCompany(data);
      setForm({ name: data.name || "", legalName: data.legalName || "", website: data.website || "", industry: data.industry || "", phone: data.phone || "", email: data.email || "", notes: data.notes || "", status: data.status || "PROSPECT" });
    }).catch((requestError) => { if (active) setError(requestError.response?.data?.error || "Unable to load company."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try { const updated = await companyService.update(id, form); setCompany((current) => ({ ...current, ...updated })); setSaved(true); }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to save company."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) return;
    try { await companyService.remove(id); navigate("/companies"); }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to delete company."); }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">Loading company...</main>;
  if (!company) return <main className="min-h-screen bg-slate-50 p-8"><div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error || "Company not found."}</div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6"><Link to="/companies" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to companies</Link><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Company detail</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{company.name}</h1><p className="mt-2 text-sm text-slate-500">{company.industry || "No industry"} · {company.status}</p></div><button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete company</button></header>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{saved && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Company saved.</div>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Company information</h2><Field label="Company name" name="name" value={form.name} onChange={updateField} required /><Field label="Legal name" name="legalName" value={form.legalName} onChange={updateField} /><Field label="Website" name="website" type="url" value={form.website} onChange={updateField} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Industry" name="industry" value={form.industry} onChange={updateField} /><label className="block text-sm font-medium text-slate-700">Status<select name="status" value={form.status} onChange={updateField} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>PROSPECT</option><option>ACTIVE</option><option>CUSTOMER</option><option>INACTIVE</option><option>CHURNED</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Phone" name="phone" value={form.phone} onChange={updateField} /><Field label="Email" name="email" type="email" value={form.email} onChange={updateField} /></div><label className="block text-sm font-medium text-slate-700">Notes<textarea name="notes" value={form.notes} onChange={updateField} rows="4" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></label><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></form><div className="space-y-6"><RelatedCard title="Contacts" items={company.contacts} empty="No contacts linked to this company.">{(contact) => <Link to={`/contacts/${contact.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-blue-300"><p className="font-semibold text-slate-900">{contact.firstName} {contact.lastName}</p><p className="mt-1 text-xs text-slate-500">{contact.email || contact.phone || "No contact details"}</p></Link>}</RelatedCard><RelatedCard title="Deals" items={company.deals} empty="No deals linked to this company.">{(deal) => <div className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-900">{deal.title}</p><span className="text-sm font-bold text-slate-700">{Number(deal.value || 0).toLocaleString()} {deal.currency}</span></div><p className="mt-1 text-xs text-slate-500">{deal.stage?.name || "No stage"} · {deal.status}</p></div>}</RelatedCard></div></div></div></main>;
}

function Field({ label, name, value, onChange, type = "text", required = false }) { return <label className="block text-sm font-medium text-slate-700">{label}<input required={required} type={type} name={name} value={value} onChange={onChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>; }
function RelatedCard({ title, items = [], empty, children }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">{title} <span className="text-sm font-normal text-slate-400">({items.length})</span></h2><div className="mt-4 space-y-3">{items.length ? items.map((item) => <div key={item.id}>{children(item)}</div>) : <p className="text-sm text-slate-500">{empty}</p>}</div></section>; }
