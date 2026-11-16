import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return process.env.JWT_SECRET;
}

function getBearerToken(req) {
  const header = req.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload !== "object" ||
      !payload.sub ||
      typeof payload.sub !== "string" ||
      !payload.organizationId ||
      typeof payload.organizationId !== "string"
    ) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Re-check the database on every request so disabled users and deleted
    // organizations lose access immediately, even if their JWT has not expired.
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        organizationId: payload.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User account is not active" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Authentication token expired" });
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    next(error);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }

    next();
  };
}
