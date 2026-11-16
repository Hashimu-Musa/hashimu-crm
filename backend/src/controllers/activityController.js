import prisma from "../lib/prisma.js";
import { organizationScope, routeParamId } from "../lib/scope.js";
import { activityCreateSchema, activityUpdateSchema, parsePagination } from "../lib/validation.js";

const activityInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, title: true } },
};

async function assertRelations(data, organizationId) {
  for (const [field, model] of [["companyId", "company"], ["contactId", "contact"], ["dealId", "deal"]]) {
    if (!data[field]) continue;
    const found = await prisma[model].findFirst({ where: { id: data[field], organizationId } });
    if (!found) {
      const error = new Error(`${field} does not belong to this organization`);
      error.statusCode = 400;
      throw error;
    }
  }
}

export async function listActivities(req, res) {
  const { page, pageSize, skip } = parsePagination(req.query);
  const where = organizationScope(req.user, {
    ...(req.query.type ? { type: req.query.type } : {}),
    ...(req.query.completed === "true" ? { completedAt: { not: null } } : {}),
    ...(req.query.completed === "false" ? { completedAt: null } : {}),
    ...(req.query.overdue === "true" ? { completedAt: null, dueAt: { lt: new Date() } } : {}),
  });
  const [items, total] = await prisma.$transaction([
    prisma.activity.findMany({ where, include: activityInclude, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], skip, take: pageSize }),
    prisma.activity.count({ where }),
  ]);
  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function createActivity(req, res) {
  const data = activityCreateSchema.parse(req.body);
  await assertRelations(data, req.user.organizationId);
  const item = await prisma.activity.create({ data: { ...data, organizationId: req.user.organizationId, createdById: req.user.id }, include: activityInclude });
  res.status(201).json(item);
}

export async function updateActivity(req, res) {
  const data = activityUpdateSchema.parse(req.body);
  await assertRelations(data, req.user.organizationId);
  const existing = await prisma.activity.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  const item = await prisma.activity.update({ where: { id: existing.id }, data, include: activityInclude });
  res.json(item);
}

export async function deleteActivity(req, res) {
  const existing = await prisma.activity.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Activity not found" });
  await prisma.activity.delete({ where: { id: existing.id } });
  res.status(204).send();
}

export async function dashboard(req, res) {
  const organizationId = req.user.organizationId;
  const today = new Date();
  const [companies, contacts, deals, openDeals, wonDeals, lostDeals, sales, recentActivities, birthdays, followUps] = await prisma.$transaction([
    prisma.company.count({ where: { organizationId } }),
    prisma.contact.count({ where: { organizationId } }),
    prisma.deal.count({ where: { organizationId } }),
    prisma.deal.count({ where: { organizationId, status: "OPEN" } }),
    prisma.deal.count({ where: { organizationId, status: "WON" } }),
    prisma.deal.count({ where: { organizationId, status: "LOST" } }),
    prisma.deal.aggregate({ where: { organizationId, status: "WON" }, _sum: { value: true } }),
    prisma.activity.findMany({ where: { organizationId }, include: activityInclude, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.contact.findMany({ where: { organizationId, dateOfBirth: { not: null } }, orderBy: [{ dateOfBirth: "asc" }, { lastName: "asc" }], take: 100 }),
    prisma.activity.findMany({ where: { organizationId, type: "FOLLOW_UP", completedAt: null, dueAt: { not: null } }, include: activityInclude, orderBy: { dueAt: "asc" }, take: 10 }),
  ]);
  const currentMonth = today.getMonth();
  const upcomingBirthdays = birthdays.filter((contact) => {
    const date = new Date(contact.dateOfBirth);
    return date.getMonth() === currentMonth || date.getMonth() === (currentMonth + 1) % 12;
  }).slice(0, 10);
  res.json({ counts: { companies, contacts, deals, openDeals, wonDeals, lostDeals }, totalWonValue: sales._sum.value ?? 0, recentActivities, upcomingBirthdays, upcomingFollowUps: followUps });
}
