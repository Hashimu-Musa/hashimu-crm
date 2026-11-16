
import prisma from "../lib/prisma.js";
import { organizationScope, routeParamId } from "../lib/scope.js";
import { companyCreateSchema, companyUpdateSchema, parsePagination } from "../lib/validation.js";

const companyInclude = {
  owner: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { contacts: true, deals: true } },
};

async function assertOwnerBelongsToOrganization(ownerId, organizationId) {
  if (!ownerId) return;
  const owner = await prisma.user.findFirst({ where: { id: ownerId, organizationId } });
  if (!owner) {
    const error = new Error("Owner does not belong to this organization");
    error.statusCode = 400;
    throw error;
  }
}

export async function listCompanies(req, res) {
  const { page, pageSize, skip } = parsePagination(req.query);
  const search = req.query.search?.trim();
  const status = req.query.status;

  const where = organizationScope(req.user, {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  });

  const [items, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      include: companyInclude,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.company.count({ where }),
  ]);

  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function getCompany(req, res) {
  const item = await prisma.company.findFirst({
    where: organizationScope(req.user, { id: routeParamId(req) }),
    include: {
      ...companyInclude,
      contacts: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      deals: { include: { stage: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!item) return res.status(404).json({ error: "Company not found" });
  res.json(item);
}

export async function createCompany(req, res) {
  const data = companyCreateSchema.parse(req.body);
  await assertOwnerBelongsToOrganization(data.ownerId, req.user.organizationId);

  const item = await prisma.company.create({
    data: { ...data, organizationId: req.user.organizationId },
    include: companyInclude,
  });

  res.status(201).json(item);
}

export async function updateCompany(req, res) {
  const data = companyUpdateSchema.parse(req.body);
  await assertOwnerBelongsToOrganization(data.ownerId, req.user.organizationId);

  const existing = await prisma.company.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Company not found" });

  const item = await prisma.company.update({
    where: { id: existing.id },
    data,
    include: companyInclude,
  });

  res.json(item);
}

export async function deleteCompany(req, res) {
  const existing = await prisma.company.findFirst({ where: organizationScope(req.user, { id: routeParamId(req) }) });
  if (!existing) return res.status(404).json({ error: "Company not found" });

  await prisma.company.delete({ where: { id: existing.id } });
  res.status(204).send();
}
