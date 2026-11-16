import { Router } from "express";
import { asyncHandler } from "../middleware/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import * as companyController from "../controllers/companyController.js";
import * as contactController from "../controllers/contactController.js";
import * as dealController from "../controllers/dealController.js";
import * as activityController from "../controllers/activityController.js";

const router = Router();

// Authentication runs before all CRM permissions and organization-scoped queries.
router.use(requireAuth);
router.get("/dashboard", requirePermission("companies:read"), asyncHandler(activityController.dashboard));

router.get("/companies", requirePermission("companies:read"), asyncHandler(companyController.listCompanies));
router.post("/companies", requirePermission("companies:create"), asyncHandler(companyController.createCompany));
router.get("/companies/:id", requirePermission("companies:read"), asyncHandler(companyController.getCompany));
router.patch("/companies/:id", requirePermission("companies:update"), asyncHandler(companyController.updateCompany));
router.delete("/companies/:id", requirePermission("companies:delete"), asyncHandler(companyController.deleteCompany));

router.get("/contacts", requirePermission("contacts:read"), asyncHandler(contactController.listContacts));
router.post("/contacts", requirePermission("contacts:create"), asyncHandler(contactController.createContact));
router.get("/contacts/:id", requirePermission("contacts:read"), asyncHandler(contactController.getContact));
router.patch("/contacts/:id", requirePermission("contacts:update"), asyncHandler(contactController.updateContact));
router.delete("/contacts/:id", requirePermission("contacts:delete"), asyncHandler(contactController.deleteContact));

router.get("/deal-stages", requirePermission("deals:read"), asyncHandler(dealController.listStages));
router.get("/deals", requirePermission("deals:read"), asyncHandler(dealController.listDeals));
router.post("/deals", requirePermission("deals:create"), asyncHandler(dealController.createDeal));
router.get("/deals/:id", requirePermission("deals:read"), asyncHandler(dealController.getDeal));
router.patch("/deals/:id", requirePermission("deals:update"), asyncHandler(dealController.updateDeal));
router.delete("/deals/:id", requirePermission("deals:delete"), asyncHandler(dealController.deleteDeal));

router.get("/activities", requirePermission("contacts:read"), asyncHandler(activityController.listActivities));
router.post("/activities", requirePermission("contacts:create"), asyncHandler(activityController.createActivity));
router.patch("/activities/:id", requirePermission("contacts:update"), asyncHandler(activityController.updateActivity));
router.delete("/activities/:id", requirePermission("contacts:delete"), asyncHandler(activityController.deleteActivity));

export default router;
