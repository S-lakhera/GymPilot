import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../src/utils/jwt.js";
import { hashToken } from "../src/utils/crypto.js";

describe("GymPilot Phase 3: Backend Foundation Test Suite", () => {
  let adminToken;
  let trainerToken;
  let memberToken;

  beforeAll(() => {
    // Generate valid tokens for testing
    adminToken = generateAccessToken({
      id: 1,
      email: "admin@gympilot.com",
      role: "admin",
    });
    trainerToken = generateAccessToken({
      id: 2,
      email: "trainer@gympilot.com",
      role: "trainer",
    });
    memberToken = generateAccessToken({
      id: 5,
      email: "member@gympilot.com",
      role: "member",
    });
  });

  afterAll(async () => {
    // Clean up any test records and close pool
    await pool.query("DELETE FROM plan_categories WHERE name IN (?, ?)", [
      "Rollback Category",
      "Committed Category",
    ]);
    await pool.end();
  });

  describe("1. Health Check & OpenAPI / Swagger Docs", () => {
    it("GET /api/health should return 200 and healthy status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("healthy");
      expect(res.body.data).toHaveProperty("environment");
      expect(res.body.data).toHaveProperty("timezone", "+05:30");
    });

    it("GET /api/docs.json should serve OpenAPI 3.0 specification", async () => {
      const res = await request(app).get("/api/docs.json");
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe("3.0.0");
      expect(res.body.info.title).toBe("GymPilot API");
      expect(res.body.components.securitySchemes).toHaveProperty("bearerAuth");
    });

    it("GET /api/docs should serve Swagger UI HTML", async () => {
      const res = await request(app).get("/api/docs/");
      expect(res.status).toBe(200);
      expect(res.text).toContain("swagger-ui");
    });
  });

  describe("2. Custom AppError Hierarchy & Global Error Handler", () => {
    it("should return 400 for BadRequestError", async () => {
      const res = await request(app).get("/api/test/error-bad-request");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: "error",
        message: "Invalid input parameter supplied",
        code: "BAD_REQUEST",
      });
    });

    it("should return 401 for UnauthorizedError", async () => {
      const res = await request(app).get("/api/test/error-unauthorized");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        status: "error",
        message: "Token is expired or invalid",
        code: "UNAUTHORIZED",
      });
    });

    it("should return 403 for ForbiddenError", async () => {
      const res = await request(app).get("/api/test/error-forbidden");
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        status: "error",
        message: "You do not have permission to perform this action",
        code: "FORBIDDEN",
      });
    });

    it("should return 404 for NotFoundError", async () => {
      const res = await request(app).get("/api/test/error-not-found");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: "error",
        message: "User record does not exist",
        code: "NOT_FOUND",
      });
    });

    it("should return 409 for ConflictError", async () => {
      const res = await request(app).get("/api/test/error-conflict");
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        status: "error",
        message: "A category with this name already exists",
        code: "CONFLICT",
      });
    });

    it("should handle unmapped routes with 404 JSend response", async () => {
      const res = await request(app).get("/api/non-existent-route-xyz");
      expect(res.status).toBe(404);
      expect(res.body.status).toBe("error");
      expect(res.body.code).toBe("ROUTE_NOT_FOUND");
    });
  });

  describe("3. MySQL Database Error Mapping", () => {
    it("should automatically map MySQL duplicate key (1062) to 409 DUPLICATE_ENTRY", async () => {
      const res = await request(app).get("/api/test/mysql-duplicate");
      expect(res.status).toBe(409);
      expect(res.body.status).toBe("error");
      expect(res.body.code).toBe("DUPLICATE_ENTRY");
      expect(res.body.message).toContain("already exists");
    });
  });

  describe("4. Request Validation (express-validator + validateRequest)", () => {
    it("should return 400 VALIDATION_ERROR with field errors on invalid input", async () => {
      const res = await request(app)
        .post("/api/test/validate")
        .send({ email: "not-an-email", age: 14 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors.length).toBe(2);
      expect(res.body.errors.some((e) => e.field === "email")).toBe(true);
      expect(res.body.errors.some((e) => e.field === "age")).toBe(true);
    });

    it("should pass validation when input meets schema criteria", async () => {
      const res = await request(app)
        .post("/api/test/validate")
        .send({ email: "john.doe@example.com", age: 28 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe("john.doe@example.com");
      expect(res.body.data.age).toBe(28);
    });
  });

  describe("5. JWT Bearer Authentication (verifyToken)", () => {
    it("should reject request when Authorization header is missing", async () => {
      const res = await request(app).get("/api/test/protected");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("NO_AUTH_HEADER");
    });

    it("should reject request when Authorization header is malformed", async () => {
      const res = await request(app)
        .get("/api/test/protected")
        .set("Authorization", "Basic 123456");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("MALFORMED_AUTH_HEADER");
    });

    it("should reject request with an invalid or tampered JWT", async () => {
      const res = await request(app)
        .get("/api/test/protected")
        .set("Authorization", "Bearer invalid.tampered.token");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });

    it("should authenticate successfully with a valid access token", async () => {
      const res = await request(app)
        .get("/api/test/protected")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user.id).toBe(5);
      expect(res.body.data.user.role).toBe("member");
    });
  });

  describe("6. Role-Based Access Control (requireRoles)", () => {
    it("should deny member access to admin-only endpoint (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/test/admin-only")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should permit admin access to admin-only endpoint (200 OK)", async () => {
      const res = await request(app)
        .get("/api/test/admin-only")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("admin");
    });

    it("should permit trainer access to trainer-only endpoint (200 OK)", async () => {
      const res = await request(app)
        .get("/api/test/trainer-only")
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("trainer");
    });
  });

  describe("7. Refresh Token & Cryptographic Hash Utilities", () => {
    it("should generate, verify, and hash refresh tokens", () => {
      const rawRefresh = generateRefreshToken({ id: 5 }, "session-12345");
      expect(typeof rawRefresh).toBe("string");

      const decoded = verifyRefreshToken(rawRefresh);
      expect(decoded.id).toBe(5);
      expect(decoded.tokenId).toBe("session-12345");
      expect(decoded.type).toBe("refresh");

      // Test SHA-256 hash
      const hash = hashToken(rawRefresh);
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);

      // Deterministic hash check
      expect(hashToken(rawRefresh)).toBe(hash);
    });
  });

  describe("8. ACID Transaction Runner (withTransaction)", () => {
    it("should automatically roll back database changes on error", async () => {
      const res = await request(app).post("/api/test/transaction-rollback");
      expect(res.status).toBe(500);

      // Verify that 'Rollback Category' was NOT saved in database
      const [rows] = await pool.query(
        "SELECT * FROM plan_categories WHERE name = ?",
        ["Rollback Category"],
      );
      expect(rows.length).toBe(0);
    });

    it("should commit database changes on success", async () => {
      const res = await request(app).post("/api/test/transaction-commit");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("insertId");
    });
  });
});
