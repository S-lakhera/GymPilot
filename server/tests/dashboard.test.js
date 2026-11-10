import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";

describe("Role-Tailored Dashboards & Aggregations (Milestone 4.4)", () => {
  let adminToken;
  let trainerToken;
  let memberToken;
  let member2Token;

  const adminId = 1;
  const trainerId = 2; // Alex Fernandes
  const memberId = 5; // Rahul Sharma
  const member2Id = 8; // Sneha Reddy

  beforeAll(() => {
    adminToken = `Bearer ${generateAccessToken({ id: adminId, email: "admin@gympilot.com", role: "admin" })}`;
    trainerToken = `Bearer ${generateAccessToken({ id: trainerId, email: "trainer.alex@gympilot.com", role: "trainer" })}`;
    memberToken = `Bearer ${generateAccessToken({ id: memberId, email: "rahul.sharma@gmail.com", role: "member" })}`;
    member2Token = `Bearer ${generateAccessToken({ id: member2Id, email: "sneha.reddy@gmail.com", role: "member" })}`;
  });

  // ===========================================================================
  // 1. Authentication & RBAC Authorization
  // ===========================================================================
  describe("1. Authentication & Strict RBAC Enforcement", () => {
    it("GET /api/dashboard/admin should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/dashboard/admin");
      expect(res.status).toBe(401);
    });

    it("GET /api/dashboard/admin should reject trainer with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", trainerToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard/admin should reject member with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", memberToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard/trainer should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/dashboard/trainer");
      expect(res.status).toBe(401);
    });

    it("GET /api/dashboard/trainer should reject admin with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/trainer")
        .set("Authorization", adminToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard/trainer should reject member with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/trainer")
        .set("Authorization", memberToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard/member should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/dashboard/member");
      expect(res.status).toBe(401);
    });

    it("GET /api/dashboard/member should reject admin with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/member")
        .set("Authorization", adminToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard/member should reject trainer with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/member")
        .set("Authorization", trainerToken);
      expect(res.status).toBe(403);
    });

    it("GET /api/dashboard (unified/generic route) should return 404 Route Not Found", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", adminToken);
      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 2. Admin Dashboard (GET /api/dashboard/admin)
  // ===========================================================================
  describe("2. Admin Dashboard Aggregations & Metrics", () => {
    it("GET /api/dashboard/admin should return complete gym-wide overview metrics", async () => {
      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("Admin dashboard");

      const data = res.body.data;
      expect(data).toBeDefined();

      // Membership stats
      expect(data.membership).toBeDefined();
      expect(typeof data.membership.totalMembers).toBe("number");
      expect(typeof data.membership.activeMembers).toBe("number");
      expect(typeof data.membership.activeTrainers).toBe("number");
      expect(data.membership.totalMembers).toBeGreaterThanOrEqual(
        data.membership.activeMembers,
      );

      // Subscription stats
      expect(data.subscriptions).toBeDefined();
      expect(typeof data.subscriptions.activeSubscriptions).toBe("number");
      expect(typeof data.subscriptions.queuedSubscriptions).toBe("number");
      expect(typeof data.subscriptions.expiringSoon).toBe("number");
      expect(typeof data.subscriptions.expiredSubscriptions).toBe("number");

      // Financial stats (Gross vs Net separation)
      expect(data.financials).toBeDefined();
      expect(typeof data.financials.grossRevenue).toBe("number");
      expect(typeof data.financials.grossRevenueMtd).toBe("number");
      expect(typeof data.financials.grossRevenueToday).toBe("number");
      expect(typeof data.financials.totalRefunded).toBe("number");
      expect(typeof data.financials.refundedMtd).toBe("number");
      expect(typeof data.financials.refundedToday).toBe("number");
      expect(typeof data.financials.netRevenue).toBe("number");
      expect(typeof data.financials.netRevenueMtd).toBe("number");
      expect(typeof data.financials.netRevenueToday).toBe("number");
      expect(typeof data.financials.pendingPayments).toBe("number");

      // Net Revenue invariant check: Net = Gross - Refunded
      const computedNet = Number(
        (data.financials.grossRevenue - data.financials.totalRefunded).toFixed(
          2,
        ),
      );
      expect(data.financials.netRevenue).toBe(computedNet);

      // Category distribution
      expect(Array.isArray(data.categoryDistribution)).toBe(true);
      if (data.categoryDistribution.length > 0) {
        const cat = data.categoryDistribution[0];
        expect(cat).toHaveProperty("categoryId");
        expect(cat).toHaveProperty("categoryName");
        expect(cat).toHaveProperty("activeCount");
      }

      // Recent transactions feed
      expect(Array.isArray(data.recentTransactions)).toBe(true);
      expect(data.recentTransactions.length).toBeLessThanOrEqual(5);
      if (data.recentTransactions.length > 0) {
        const txn = data.recentTransactions[0];
        expect(txn).toHaveProperty("payment_id");
        expect(txn).toHaveProperty("amount");
        expect(txn).toHaveProperty("member_name");
      }

      // Recent members feed
      expect(Array.isArray(data.recentMembers)).toBe(true);
      expect(data.recentMembers.length).toBeLessThanOrEqual(5);
      if (data.recentMembers.length > 0) {
        const member = data.recentMembers[0];
        expect(member).toHaveProperty("id");
        expect(member).toHaveProperty("full_name");
        expect(member).toHaveProperty("email");
      }
    });
  });

  // ===========================================================================
  // 3. Trainer Dashboard (GET /api/dashboard/trainer)
  // ===========================================================================
  describe("3. Trainer Dashboard & Phase 6 Stubs", () => {
    it("GET /api/dashboard/trainer should return trainer profile and Phase 6 placeholder structures", async () => {
      const res = await request(app)
        .get("/api/dashboard/trainer")
        .set("Authorization", trainerToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("Trainer dashboard");

      const data = res.body.data;
      expect(data).toBeDefined();

      // Profile details
      expect(data.profile).toBeDefined();
      expect(data.profile.user_id).toBe(trainerId);
      expect(data.profile.full_name).toBe("Alex Fernandes");
      expect(data.profile.specialization).toBe("Strength & Hypertrophy");
      expect(data.profile.experience_years).toBe(6);
      expect(data.profile.certification).toContain("CSCS");

      // Phase 6 Stubs
      expect(data.totalAssignedMembers).toBe(0);
      expect(Array.isArray(data.assignedMembers)).toBe(true);
      expect(data.assignedMembers).toHaveLength(0);
      expect(Array.isArray(data.upcomingSessions)).toBe(true);
      expect(data.upcomingSessions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 4. Member Dashboard (GET /api/dashboard/member)
  // ===========================================================================
  describe("4. Member Dashboard & Strict Data Isolation", () => {
    it("GET /api/dashboard/member should return member passes, nearest expiration, payments, and profile completeness", async () => {
      const res = await request(app)
        .get("/api/dashboard/member")
        .set("Authorization", memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("Member dashboard");

      const data = res.body.data;
      expect(data).toBeDefined();

      // Active Passes
      expect(Array.isArray(data.activePasses)).toBe(true);
      expect(Array.isArray(data.queuedRenewals)).toBe(true);

      // Verify structure of active pass if present
      if (data.activePasses.length > 0) {
        const pass = data.activePasses[0];
        expect(pass).toHaveProperty("subscriptionId");
        expect(pass).toHaveProperty("planName");
        expect(pass).toHaveProperty("categoryName");
        expect(pass).toHaveProperty("startDate");
        expect(pass).toHaveProperty("endDate");
        expect(pass).toHaveProperty("status", "active");
        expect(pass).toHaveProperty("daysRemaining");
        expect(typeof pass.daysRemaining).toBe("number");
        expect(pass.daysRemaining).toBeGreaterThanOrEqual(0);
      }

      // Nearest expiration
      if (data.nearestExpiration) {
        expect(data.nearestExpiration).toHaveProperty("subscriptionId");
        expect(data.nearestExpiration).toHaveProperty("planName");
        expect(data.nearestExpiration).toHaveProperty("endDate");
        expect(data.nearestExpiration).toHaveProperty("daysRemaining");
      }

      // Recent payments
      expect(Array.isArray(data.recentPayments)).toBe(true);
      expect(data.recentPayments.length).toBeLessThanOrEqual(5);

      // Profile completeness
      expect(data.profileCompleteness).toBeDefined();
      expect(typeof data.profileCompleteness.completedFields).toBe("number");
      expect(typeof data.profileCompleteness.totalFields).toBe("number");
      expect(typeof data.profileCompleteness.percentage).toBe("number");
      expect(data.profileCompleteness.percentage).toBeGreaterThanOrEqual(0);
      expect(data.profileCompleteness.percentage).toBeLessThanOrEqual(100);
      expect(data.profileCompleteness.fields).toBeDefined();
      expect(typeof data.profileCompleteness.fields.phone).toBe("boolean");
    });

    it("GET /api/dashboard/member should enforce strict data isolation between members", async () => {
      // Member 5 (Rahul) vs Member 8 (Sneha)
      const res1 = await request(app)
        .get("/api/dashboard/member")
        .set("Authorization", memberToken);

      const res2 = await request(app)
        .get("/api/dashboard/member")
        .set("Authorization", member2Token);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Sneha has different profile completeness or payments than Rahul
      expect(
        res2.body.data.profileCompleteness.fields.emergencyContactName,
      ).toBe(true); // Kiran Reddy
      // Verify payment isolation: no payments in res2 should belong to member 5
      for (const p of res2.body.data.recentPayments) {
        // If Sneha has payments, verify none match Rahul's known transaction
        expect(p.transaction_reference).not.toContain("RAHUL");
      }
    });
  });
});
