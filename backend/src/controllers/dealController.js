import prisma from "../lib/prisma.js";
import { organizationScope, routeParamId } from "../lib/scope.js";
import { dealCreateSchema, dealUpdateSchema, parsePagination } from "../lib/validation.js";

const dealInclude = {
  stage: true,
  company: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  owner: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export async function listStages(req, res) {
  const items = await prisma.dealStage.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { order: "asc" } });
  res.json({ items });
}

async function assertDealRelationsBelongToOrganization(data, organizationId) {
  const checks = [
    ["ownerId", "user", data.ownerId],
    ["companyId", "company", data.companyId],
    ["contactId", "contact", data.contactId],
    ["stageId", "dealStage", data.stageId],
  ];

  for (const [field, model, id] of checks) {
    if (!id) continue;
    const record = await prisma[model].findFirst({ where: { id, organizationId } });
    if (!record) {
      const error = new Error(`${field} does not belong to this organization`);
      error.statusCode = 400;
      throw error;
    }
  }
}

export async function listDeals(req, res) {
  const { page, pageSize, skip } = parsePagination(req.query);
  const search = req.query.search?.trim();
  const stageId = req.query.stageId;
  const status = req.query.status;
  const companyId = req.query.companyId;
  const ownerId = req.query.ownerId;

  const where = organizationScope(req.user, {
    ...(stageId ? { stageId } : {}),
    ...(status ? { status } : {}),
    ...(companyId ? { companyId } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  });

  const [items, total] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      include: dealInclude,
      orderBy: [{ expectedCloseAt: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function getDeal(req, res) {
  const item = await prisma.deal.findFirst({
    where: organizationScope(req.user, { id: routeParamId(req) }),
    include: {
      ...dealInclude,
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!item) return res.status(404).json({ error: "Deal not found" });
  res.json(item);
}

export async function createDeal(req, res) {
  const data = dealCreateSchema.parse(req.body);
  await assertDealRelationsBelongToOrganization(data, req.user.organizationId);

  const item = await prisma.deal.create({
    data: { ...data, organizationId: req.user.organizationId },
    include: dealInclude,
  });

  res.status(201).json(item);
}

export async function updateDeal(req, res) {
  const data = dealUpdateSchema.parse(req.body);
  await assertDealRelationsBelongToOrganization(data, req.user.organizationId);

  const existing = await prisma.deal.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Deal not found" });

  const item = await prisma.deal.update({
    where: { id: existing.id },
    data,
    include: dealInclude,
  });

  res.json(item);
}

export async function deleteDeal(req, res) {
  const existing = await prisma.deal.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Deal not found" });

  await prisma.deal.delete({ where: { id: existing.id } });
  res.status(204).send();
}
