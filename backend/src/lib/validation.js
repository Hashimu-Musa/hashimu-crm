import { z } from "zod";

const optionalText = z.string().trim().max(500).nullable().optional();
const optionalUrl = z.string().url().nullable().optional();

export const companyCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  legalName: optionalText,
  website: optionalUrl,
  industry: optionalText,
  phone: optionalText,
  email: z.string().email().nullable().optional(),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: optionalText,
  country: optionalText,
  notes: optionalText,
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE", "CUSTOMER", "CHURNED"]).optional(),
  ownerId: z.string().cuid().nullable().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const contactCreateSchema = z.object({
  companyId: z.string().cuid().nullable().optional(),
  ownerId: z.string().cuid().nullable().optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  jobTitle: optionalText,
  email: z.string().email().nullable().optional(),
  phone: optionalText,
  mobilePhone: optionalText,
  linkedinUrl: optionalUrl,
  notes: optionalText,
  status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE"]).optional(),
  category: z.string().trim().max(100).nullable().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
  address: optionalText,
  preferredCommunicationChannel: z.enum(["WHATSAPP", "EMAIL", "SMS", "PHONE", "NONE"]).optional(),
  birthdayMessagingConsent: z.boolean().optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const dealCreateSchema = z.object({
  ownerId: z.string().cuid().nullable().optional(),
  companyId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
  stageId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  description: optionalText,
  value: z.coerce.number().finite().nonnegative(),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  expectedCloseAt: z.coerce.date().nullable().optional(),
  closedAt: z.coerce.date().nullable().optional(),
  status: z.enum(["OPEN", "WON", "LOST"]).optional(),
  source: optionalText,
  lossReason: optionalText,
});

export const dealUpdateSchema = dealCreateSchema.partial();

export const activityCreateSchema = z.object({
  companyId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
  dealId: z.string().cuid().nullable().optional(),
  type: z.enum(["NOTE", "TASK", "CALL", "EMAIL", "WHATSAPP", "MEETING", "FOLLOW_UP"]),
  subject: z.string().trim().min(1).max(200),
  description: optionalText,
  dueAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const activityUpdateSchema = activityCreateSchema.partial();

export function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "25", 10) || 25, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}
