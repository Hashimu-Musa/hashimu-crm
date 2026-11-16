import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { loginSchema, registerSchema } from "../lib/authValidation.js";

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  organizationId: true,
  organization: { select: { id: true, name: true, slug: true } },
};

function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return process.env.JWT_SECRET;
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "1d" },
  );
}

function slugify(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "organization";
}

async function createUniqueOrganizationSlug(name, tx) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (await tx.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

const defaultStages = [
  { name: "New", order: 1, probability: 10 },
  { name: "Qualified", order: 2, probability: 25 },
  { name: "Proposal", order: 3, probability: 50 },
  { name: "Negotiation", order: 4, probability: 75 },
  { name: "Won", order: 5, probability: 100, isWon: true },
  { name: "Lost", order: 6, probability: 0, isLost: true },
];

function authResponse(user) {
  return {
    token: createAccessToken(user),
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organization: user.organization,
    },
  };
}

export async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const organizationSlug = await createUniqueOrganizationSlug(data.organizationName, tx);
    const organization = await tx.organization.create({
      data: {
        name: data.organizationName,
        slug: organizationSlug,
        dealStages: { create: defaultStages },
      },
    });

    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: "OWNER",
      },
      select: publicUserSelect,
    });

    return user;
  });

  res.status(201).json(authResponse(result));
}

export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const users = await prisma.user.findMany({
    where: {
      email: data.email,
      isActive: true,
      ...(data.organizationSlug
        ? { organization: { slug: data.organizationSlug } }
        : {}),
    },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  // Do not reveal whether an email exists.
  if (users.length === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (users.length > 1) {
    return res.status(400).json({
      error: "This email belongs to multiple organizations; organizationSlug is required",
    });
  }

  const user = users[0];
  const validPassword = await bcrypt.compare(data.password, user.passwordHash);

  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json(authResponse(user));
}

export async function me(req, res) {
  const user = await prisma.user.findFirst({
    where: { id: req.user.id, organizationId: req.user.organizationId, isActive: true },
    select: publicUserSelect,
  });

  if (!user) return res.status(401).json({ error: "User account is no longer active" });
  res.json({ user });
}
