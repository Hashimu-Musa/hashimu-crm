import prisma from "../lib/prisma.js";
import { organizationScope, routeParamId } from "../lib/scope.js";
import { contactCreateSchema, contactUpdateSchema, parsePagination } from "../lib/validation.js";

const contactInclude = {
  company: { select: { id: true, name: true, status: true } },
  owner: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { deals: true, activities: true } },
};

async function assertContactRelationsBelongToOrganization(data, organizationId) {
  if (data.ownerId) {
    const owner = await prisma.user.findFirst({ where: { id: data.ownerId, organizationId } });
    if (!owner) {
      const error = new Error("Owner does not belong to this organization");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.companyId) {
    const company = await prisma.company.findFirst({ where: { id: data.companyId, organizationId } });
    if (!company) {
      const error = new Error("Company does not belong to this organization");
      error.statusCode = 400;
      throw error;
    }
  }
}

export async function listContacts(req, res) {
  const { page, pageSize, skip } = parsePagination(req.query);
  const search = req.query.search?.trim();
  const companyId = req.query.companyId;
  const status = req.query.status;

  const where = organizationScope(req.user, {
    ...(companyId ? { companyId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  });

  const [items, total] = await prisma.$transaction([
    prisma.contact.findMany({
      where,
      include: contactInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function getContact(req, res) {
  const item = await prisma.contact.findFirst({
    where: organizationScope(req.user, { id: routeParamId(req) }),
    include: {
      ...contactInclude,
      deals: { include: { stage: true, company: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!item) return res.status(404).json({ error: "Contact not found" });
  res.json(item);
}

export async function createContact(req, res) {
  const data = contactCreateSchema.parse(req.body);
  await assertContactRelationsBelongToOrganization(data, req.user.organizationId);

  const item = await prisma.contact.create({
    data: { ...data, organizationId: req.user.organizationId },
    include: contactInclude,
  });

  res.status(201).json(item);
}

export async function updateContact(req, res) {
  const data = contactUpdateSchema.parse(req.body);
  await assertContactRelationsBelongToOrganization(data, req.user.organizationId);

  const existing = await prisma.contact.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  const item = await prisma.contact.update({
    where: { id: existing.id },
    data,
    include: contactInclude,
  });

  res.json(item);
}

export async function deleteContact(req, res) {
  const existing = await prisma.contact.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  await prisma.contact.delete({ where: { id: existing.id } });
  res.status(204).send();
}
