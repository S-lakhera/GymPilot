import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";
import { pool } from "../src/config/db.js";
import { pricingService } from "../src/services/pricingService.js";

describe("Discounts & Promotional Pricing Module (Milestone 4.3)", () => {
  let adminToken;
  let memberToken;
  let createdDiscountId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: "admin@gympilot.com", role: "admin" })}`;
    memberToken = `Bearer ${generateAccessToken({ id: 5, email: "rahul.sharma@gmail.com", role: "member" })}`;

    // Clean up test discount if lingering
    await pool.query("DELETE FROM discounts WHERE code IN (?, ?)", [
      "FESTIVE25",
      "TEMPEXPIRED",
    ]);
  });

  afterAll(async () => {
    if (createdDiscountId) {
      await pool.query("DELETE FROM discounts WHERE id = ?", [
        createdDiscountId,
      ]);
    }
    await pool.query("DELETE FROM discounts WHERE code IN (?, ?)", [
      "FESTIVE25",
      "TEMPEXPIRED",
    ]);
  });

  describe("1. Admin Discount Management (/api/discounts)", () => {
    it("POST /api/discounts should reject creation by non-admin with 403 Forbidden", async () => {
      const res = await request(app)
        .post("/api/discounts")
        .set("Authorization", memberToken)
        .send({
          code: "FESTIVE25",
          name: "Festive Season Offer",
          discountType: "PERCENTAGE",
          discountValue: 25,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        });

      expect(res.status).toBe(403);
    });

    it("POST /api/discounts should allow Admin to create a discount with plan mappings", async () => {
      const res = await request(app)
        .post("/api/discounts")
        .set("Authorization", adminToken)
        .send({
          code: "FESTIVE25",
          name: "Festive Season Offer",
          description: "Special 25% off up to ₹250 on quarterly packages.",
          discountType: "PERCENTAGE",
          discountValue: 25,
          maxDiscountAmount: 250,
          minPurchaseAmount: 1000,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          usageLimit: 50,
          perUserLimit: 1,
          eligiblePlanIds: [2, 5],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.discount).toHaveProperty("id");
      expect(res.body.data.discount.code).toBe("FESTIVE25");
      expect(res.body.data.discount.discount_value).toBe("25.00");
      expect(res.body.data.discount.eligible_plan_ids).toEqual([2, 5]);

      createdDiscountId = res.body.data.discount.id;
    });

    it("POST /api/discounts should return 409 Conflict on duplicate discount code", async () => {
      const res = await request(app)
        .post("/api/discounts")
        .set("Authorization", adminToken)
        .send({
          code: "FESTIVE25",
          name: "Duplicate Code Test",
          discountType: "PERCENTAGE",
          discountValue: 15,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DISCOUNT_CODE_EXISTS");
    });

    it("GET /api/discounts should list all discounts for Admin with pagination", async () => {
      const res = await request(app)
        .get("/api/discounts?page=1&limit=10")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4); // 3 seeded + 1 created
      expect(res.body).toHaveProperty("pagination");
    });

    it("GET /api/discounts/:id should return discount details including eligible plans", async () => {
      const res = await request(app)
        .get(`/api/discounts/${createdDiscountId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.discount.id).toBe(createdDiscountId);
      expect(res.body.data.discount.code).toBe("FESTIVE25");
      expect(res.body.data.discount.eligible_plan_ids).toEqual([2, 5]);
    });

    it("PATCH /api/discounts/:id should update discount fields", async () => {
      const res = await request(app)
        .patch(`/api/discounts/${createdDiscountId}`)
        .set("Authorization", adminToken)
        .send({
          name: "Updated Festive Season Promo",
          maxDiscountAmount: 300,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.discount.name).toBe("Updated Festive Season Promo");
      expect(res.body.data.discount.max_discount_amount).toBe("300.00");
    });

    it("PATCH /api/discounts/:id/status should toggle discount active state", async () => {
      const res = await request(app)
        .patch(`/api/discounts/${createdDiscountId}/status`)
        .set("Authorization", adminToken)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.discount.isActive).toBe(false);

      // Reactivate
      const reactivateRes = await request(app)
        .patch(`/api/discounts/${createdDiscountId}/status`)
        .set("Authorization", adminToken)
        .send({ isActive: true });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.discount.isActive).toBe(true);
    });
  });

  describe("2. Pricing Engine Calculation & Eligibility Validation", () => {
    it("should calculate standard full price when no discount code is provided", async () => {
      const plan = { id: 1, price: 899.0 };
      const quote = await pricingService.validateAndCalculateDiscount({ plan });

      expect(quote.baseAmount).toBe(899);
      expect(quote.discount).toBeNull();
      expect(quote.discountAmount).toBe(0);
      expect(quote.finalAmount).toBe(899);
    });

    it("should calculate percentage discount correctly (WELCOME10 - 10% off ₹899 = ₹89.90 off)", async () => {
      const plan = { id: 1, price: 899.0 };
      const quote = await pricingService.validateAndCalculateDiscount({
        plan,
        discountCode: "WELCOME10",
        userId: 5,
      });

      expect(quote.baseAmount).toBe(899);
      expect(quote.discount.code).toBe("WELCOME10");
      expect(quote.discountAmount).toBe(89.9);
      expect(quote.finalAmount).toBe(809.1);
    });

    it("should calculate fixed discount correctly (NEWYEAR2026 - flat ₹200 off ₹2299 = ₹2099)", async () => {
      const plan = { id: 2, price: 2299.0 };
      const quote = await pricingService.validateAndCalculateDiscount({
        plan,
        discountCode: "NEWYEAR2026",
        userId: 5,
      });

      expect(quote.baseAmount).toBe(2299);
      expect(quote.discount.code).toBe("NEWYEAR2026");
      expect(quote.discountAmount).toBe(200.0);
      expect(quote.finalAmount).toBe(2099.0);
    });

    it("should apply plan-specific discount when plan is eligible (STRENGTH50 on Plan 1)", async () => {
      const plan = { id: 1, price: 899.0 }; // Plan 1 is Strength Monthly
      const quote = await pricingService.validateAndCalculateDiscount({
        plan,
        discountCode: "STRENGTH50",
        userId: 5,
      });

      expect(quote.baseAmount).toBe(899);
      expect(quote.discountAmount).toBe(50.0);
      expect(quote.finalAmount).toBe(849.0);
    });

    it("should reject plan-specific discount when plan is ineligible (STRENGTH50 on Plan 6 - Yoga)", async () => {
      const plan = { id: 6, price: 749.0 }; // Plan 6 is Yoga Monthly
      await expect(
        pricingService.validateAndCalculateDiscount({
          plan,
          discountCode: "STRENGTH50",
          userId: 5,
        }),
      ).rejects.toThrow(
        "This discount code is not applicable to the selected membership plan.",
      );
    });

    it("should reject discount when purchase amount is below minimum threshold", async () => {
      const plan = { id: 4, price: 699.0 }; // Plan 4 is ₹699, but NEWYEAR2026 requires ₹1500
      await expect(
        pricingService.validateAndCalculateDiscount({
          plan,
          discountCode: "NEWYEAR2026",
          userId: 5,
        }),
      ).rejects.toThrow("does not meet the minimum purchase amount");
    });

    it("should reject expired or inactive discount codes", async () => {
      // Create temporary expired discount
      await pool.query(
        `INSERT INTO discounts (code, name, discount_type, discount_value, start_date, end_date, is_active)
         VALUES ('TEMPEXPIRED', 'Expired Promo', 'FIXED', 100, '2020-01-01', '2020-01-31', TRUE)`,
      );

      const plan = { id: 1, price: 899.0 };
      await expect(
        pricingService.validateAndCalculateDiscount({
          plan,
          discountCode: "TEMPEXPIRED",
          userId: 5,
        }),
      ).rejects.toThrow("Discount code has expired or is not yet active.");
    });
  });
});
