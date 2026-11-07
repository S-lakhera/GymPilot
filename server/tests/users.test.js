import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";

describe("Users & Members Module (Milestone 4.1)", () => {
  let adminToken;
  let memberToken;

  beforeAll(() => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: "admin@gympilot.com", role: "admin" })}`;
    // Member 5 is Rahul Sharma (seeded active member)
    memberToken = `Bearer ${generateAccessToken({ id: 5, email: "rahul.sharma@gmail.com", role: "member" })}`;
  });

  describe("1. Member Profile (GET & PATCH /api/users/profile)", () => {
    it("GET /api/users/profile should return 401 without authorization", async () => {
      const res = await request(app).get("/api/users/profile");
      expect(res.status).toBe(401);
    });

    it("GET /api/users/profile should return member profile and completeness status", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user.id).toBe(5);
      expect(res.body.data.user.email).toBe("rahul.sharma@gmail.com");
      expect(res.body.data).toHaveProperty("profile");
      expect(res.body.data).toHaveProperty("isProfileComplete");
    });

    it("PATCH /api/users/profile should update profile fields and calculate completeness", async () => {
      const updateData = {
        firstName: "Rahul",
        lastName: "Sharma",
        dateOfBirth: "1995-04-12",
        gender: "male",
        emergencyContactName: "Sunita Sharma",
        emergencyContactPhone: "+91-9855599991",
        healthConditions: "Lower back stiffness on heavy deadlifts",
      };

      const res = await request(app)
        .patch("/api/users/profile")
        .set("Authorization", memberToken)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.profile.date_of_birth).toContain("1995-04-12");
      expect(res.body.data.profile.gender).toBe("male");
      expect(res.body.data.isProfileComplete).toBe(true);
    });
  });

  describe("2. Admin Member Management (/api/users/members)", () => {
    it("GET /api/users/members should return 403 Forbidden for non-admin user", async () => {
      const res = await request(app)
        .get("/api/users/members")
        .set("Authorization", memberToken);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("GET /api/users/members should return paginated member list for Admin", async () => {
      const res = await request(app)
        .get("/api/users/members?page=1&limit=5")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination).toHaveProperty("totalRecords");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });

    it("GET /api/users/members should filter members by search term", async () => {
      const res = await request(app)
        .get("/api/users/members?search=Rahul")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.every(
          (m) => m.first_name.includes("Rahul") || m.email.includes("rahul"),
        ),
      ).toBe(true);
    });

    it("GET /api/users/members/:id should return complete member details", async () => {
      const res = await request(app)
        .get("/api/users/members/5")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(5);
      expect(res.body.data.email).toBe("rahul.sharma@gmail.com");
      expect(res.body.data).toHaveProperty("profile");
    });

    it("GET /api/users/members/:id should return 404 for invalid member ID", async () => {
      const res = await request(app)
        .get("/api/users/members/99999")
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("PATCH /api/users/members/:id/status should toggle account active status", async () => {
      // Deactivate Member 7 (Amit Verma)
      const deactivateRes = await request(app)
        .patch("/api/users/members/7/status")
        .set("Authorization", adminToken)
        .send({ isActive: false });

      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.data.isActive).toBe(false);

      // Verify login fails for deactivated account
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "amit.verma@gmail.com", password: "Password@123" });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.code).toBe("ACCOUNT_DEACTIVATED");

      // Reactivate Member 7
      const reactivateRes = await request(app)
        .patch("/api/users/members/7/status")
        .set("Authorization", adminToken)
        .send({ isActive: true });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.isActive).toBe(true);

      // Verify login succeeds after reactivation
      const activeLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "amit.verma@gmail.com", password: "Password@123" });

      expect(activeLoginRes.status).toBe(200);
    });
  });
});
