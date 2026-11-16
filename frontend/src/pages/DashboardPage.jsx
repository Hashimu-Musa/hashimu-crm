
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  dashboardService,
  dealService,
} from "../services/crmService";

const initialData = {
  counts: {
    companies: 0,
    contacts: 0,
    deals: 0,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
  },
  totalWonValue: 0,
  recentActivities: [],
  upcomingBirthdays: [],
  upcomingFollowUps: [],
};

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  } catch {
    return Number(value ?? 0).toLocaleString();
  }
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString();
}

function formatBirthday(value) {
  if (!value) return "Date not available";

  const parts = String(value).split("T")[0].split("-");
  if (parts.length < 3) return formatDate(value);

  const date = new Date(2000, Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function SummaryCard({ label, value, detail, href, accent }) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${accent}`} />
      </div>
    </Link>
  );
}

function EmptyState({ message }) {
  return (
    <p className="py-8 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

function SectionHeader({ title, subtitle, href, linkText }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {href && (
        <Link
          to={href}
          className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {linkText || "View all"}
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(initialData);
  const [openDeals, setOpenDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summary, deals] = await Promise.all([
        dashboardService.summary(),
        dealService.list({
          page: 1,
          pageSize: 100,
          status: "OPEN",
        }),
      ]);

      setData({
        ...initialData,
        ...summary,
        counts: {
          ...initialData.counts,
          ...(summary.counts || {}),
        },
      });

      setOpenDeals(deals.items || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "We could not load the dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const pipeline = useMemo(() => {
    const stages = new Map();

    for (const deal of openDeals) {
      const name = deal.stage?.name || "Unassigned";

      const current = stages.get(name) || {
        name,
        count: 0,
        color: deal.stage?.color || "#2563eb",
        currencies: {},
      };

      current.count += 1;
      const currency = deal.currency || "USD";
      current.currencies[currency] =
        (current.currencies[currency] || 0) + Number(deal.value || 0);

      stages.set(name, current);
    }

    return [...stages.values()].sort((a, b) => b.count - a.count);
  }, [openDeals]);

  const pipelineCurrencyTotals = useMemo(() => {
    const totals = {};

    for (const deal of openDeals) {
      const currency = deal.currency || "USD";
      totals[currency] =
        (totals[currency] || 0) + Number(deal.value || 0);
    }

    return totals;
  }, [openDeals]);

  const recentDeals = useMemo(
    () =>
      [...openDeals]
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )
        .slice(0, 6),
    [openDeals]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-slate-200"
              />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  const counts = data.counts || initialData.counts;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              CRM overview
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Monitor your customers, sales, activities and business performance.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh data
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={loadDashboard}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            label="Companies"
            value={counts.companies}
            detail="Accounts in your CRM"
            href="/companies"
            accent="bg-blue-500"
          />
          <SummaryCard
            label="Contacts"
            value={counts.contacts}
            detail="People connected to accounts"
            href="/contacts"
            accent="bg-violet-500"
          />
          <SummaryCard
            label="Total deals"
            value={counts.deals}
            detail="All sales opportunities"
            href="/deals"
            accent="bg-indigo-500"
          />
          <SummaryCard
            label="Open deals"
            value={counts.openDeals}
            detail="Active opportunities"
            href="/deals"
            accent="bg-amber-500"
          />
          <SummaryCard
            label="Won deals"
            value={counts.wonDeals}
            detail="Successfully closed deals"
            href="/deals"
            accent="bg-emerald-500"
          />
          <SummaryCard
            label="Lost deals"
            value={counts.lostDeals}
            detail="Unsuccessful opportunities"
            href="/deals"
            accent="bg-red-500"
          />
        </section>

        {/* Pipeline and recent deals */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Sales pipeline"
              subtitle="Your active opportunities by stage."
              href="/deals"
              linkText="View deals"
            />

            {pipeline.length === 0 ? (
              <EmptyState message="No open deals yet." />
            ) : (
              <div className="mt-6 space-y-5">
                {pipeline.map((stage) => {
                  const percentage = counts.openDeals
                    ? Math.round((stage.count / counts.openDeals) * 100)
                    : 0;

                  return (
                    <div key={stage.name}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                          <span className="text-slate-400">
                            ({stage.count})
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {percentage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {Object.entries(stage.currencies).map(
                          ([currency, value]) => (
                            <span key={currency}>
                              {formatCurrency(value, currency)}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700">
                Open pipeline value
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {Object.entries(pipelineCurrencyTotals).length ? (
                  Object.entries(pipelineCurrencyTotals).map(
                    ([currency, value]) => (
                      <span
                        key={currency}
                        className="text-lg font-bold text-slate-900"
                      >
                        {formatCurrency(value, currency)}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-lg font-bold text-slate-900">
                    0
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Recent open deals"
              subtitle="Your latest sales opportunities."
              href="/deals"
            />

            {recentDeals.length === 0 ? (
              <EmptyState message="No recent deals yet." />
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    to="/deals"
                    className="flex items-center justify-between gap-4 py-4 first:pt-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {deal.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {deal.company?.name || "No company"} · Close{" "}
                        {formatDate(deal.expectedCloseAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(deal.value, deal.currency)}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {deal.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Activities and follow-ups */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Recent activities"
              subtitle="Latest interactions recorded in your CRM."
              href="/activities"
            />

            {data.recentActivities?.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {data.recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    to="/activities"
                    className="block py-4 first:pt-2 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        {activity.type?.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {activity.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activity.contact
                        ? `${activity.contact.firstName} ${activity.contact.lastName}`
                        : activity.company?.name || "No linked contact"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent activities yet." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Upcoming follow-ups"
              subtitle="Follow-ups that still need attention."
              href="/activities"
            />

            {data.upcomingFollowUps?.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {data.upcomingFollowUps.map((activity) => (
                  <Link
                    key={activity.id}
                    to="/activities"
                    className="block py-4 first:pt-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {activity.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activity.contact
                        ? `${activity.contact.firstName} ${activity.contact.lastName}`
                        : activity.company?.name || "No linked contact"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Due: {formatDateTime(activity.dueAt)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming follow-ups." />
            )}
          </div>
        </section>

        {/* Birthdays */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Upcoming birthdays"
            subtitle="Contacts celebrating birthdays this month and next month."
            href="/contacts"
            linkText="View contacts"
          />

          {data.upcomingBirthdays?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.upcomingBirthdays.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xl">
                    🎂
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBirthday(contact.dateOfBirth)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming birthdays found for this period." />
          )}
        </section>
      </div>
    </main>
  );
}
