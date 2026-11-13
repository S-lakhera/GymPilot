import React from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES, USER_ROLES } from "../utils/constants.js";

// Layouts
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { AdminLayout } from "../layouts/AdminLayout.jsx";
import { TrainerLayout } from "../layouts/TrainerLayout.jsx";
import { MemberLayout } from "../layouts/MemberLayout.jsx";

// Route Guards & Dispatchers
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleRoute } from "./RoleRoute.jsx";
import { GuestRoute } from "./GuestRoute.jsx";
import { PwaGateway } from "./PwaGateway.jsx";
import { DashboardDispatcher } from "./DashboardDispatcher.jsx";
import { ProfileDispatcher } from "./ProfileDispatcher.jsx";
import { PlansDispatcher } from "../pages/plans/PlansDispatcher.jsx";

// Pages & Shells
import { PublicLandingPage } from "../pages/PublicLandingPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { FeaturePlaceholderShell } from "../pages/FeaturePlaceholderShell.jsx";

// Role-Restricted Feature Probes (Milestone 5.3)
import { MembersManagementShell } from "../pages/admin/MembersManagementShell.jsx";
import { MemberPassesShell } from "../pages/member/MemberPassesShell.jsx";
import { TrainerScheduleShell } from "../pages/trainer/TrainerScheduleShell.jsx";

/**
 * Centralized Application Route Map.
 * Implements a flat URL hierarchy with role-aware dispatching under `/dashboard` and `/profile`.
 *
 * @returns {JSX.Element}
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Pages (Accessible to all) */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<PublicLandingPage />} />
      </Route>

      {/* 2. Guest-Only Authentication Pages (Bounces authenticated visitors to /dashboard) */}
      <Route element={<GuestRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>
      </Route>

      {/* 3. PWA Silent Entry Point (/app) */}
      <Route path={ROUTES.APP_GATE} element={<PwaGateway />} />

      {/* Role-Aware Plans Dispatcher (Public catalog for guests, Member catalog for members, Admin workspace for admins) */}
      <Route path={ROUTES.PLANS} element={<PlansDispatcher />} />

      {/* 4. Authenticated Protected Routes (Common flat URLs) */}
      <Route element={<ProtectedRoute />}>
        {/* Role-Aware Dashboard Dispatcher (renders Admin, Trainer, or Member dashboard at /dashboard) */}
        <Route path={ROUTES.DASHBOARD} element={<DashboardDispatcher />} />

        {/* Role-Aware Profile Dispatcher (renders user profile inside their active role layout) */}
        <Route path={ROUTES.PROFILE} element={<ProfileDispatcher />} />

        {/* 5. Role-Restricted Feature Routes */}
        {/* Admin Features */}
        <Route element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
          <Route
            path={ROUTES.MEMBERS}
            element={
              <AdminLayout>
                <MembersManagementShell />
              </AdminLayout>
            }
          />
          <Route
            path={ROUTES.TRAINERS}
            element={
              <AdminLayout>
                <FeaturePlaceholderShell
                  title="Trainers Directory"
                  description="Onboard, manage, and monitor gym personal trainers and staff."
                  moduleName="Admin Management"
                  phase="Milestone 5.6"
                />
              </AdminLayout>
            }
          />
          <Route
            path={ROUTES.PAYMENTS}
            element={
              <AdminLayout>
                <FeaturePlaceholderShell
                  title="Payment Ledger & Transactions"
                  description="View all member payment transactions, receipts, and front-desk checkouts."
                  moduleName="Admin Management"
                  phase="Milestone 5.6"
                />
              </AdminLayout>
            }
          />
          <Route
            path={ROUTES.DISCOUNTS}
            element={
              <AdminLayout>
                <FeaturePlaceholderShell
                  title="Discount Codes & Promotions"
                  description="Create and manage promotional discount vouchers and validity windows."
                  moduleName="Admin Management"
                  phase="Milestone 5.6"
                />
              </AdminLayout>
            }
          />
          <Route
            path={ROUTES.REFUNDS}
            element={
              <AdminLayout>
                <FeaturePlaceholderShell
                  title="Refund Management"
                  description="Process and audit payment refunds with ceiling balance controls."
                  moduleName="Admin Management"
                  phase="Milestone 5.6"
                />
              </AdminLayout>
            }
          />
        </Route>

        {/* Member Features */}
        <Route element={<RoleRoute allowedRoles={[USER_ROLES.MEMBER]} />}>
          <Route
            path={ROUTES.PASSES}
            element={
              <MemberLayout>
                <MemberPassesShell />
              </MemberLayout>
            }
          />
          <Route
            path={ROUTES.WORKOUTS}
            element={
              <MemberLayout>
                <FeaturePlaceholderShell
                  title="My Workout Plans"
                  description="Review your customized exercise routines and trainer instructions."
                  moduleName="Member Portal"
                  phase="Phase 6"
                />
              </MemberLayout>
            }
          />
        </Route>

        {/* Trainer Features */}
        <Route element={<RoleRoute allowedRoles={[USER_ROLES.TRAINER]} />}>
          <Route
            path={ROUTES.SCHEDULE}
            element={
              <TrainerLayout>
                <TrainerScheduleShell />
              </TrainerLayout>
            }
          />
          <Route
            path={ROUTES.CLIENTS}
            element={
              <TrainerLayout>
                <FeaturePlaceholderShell
                  title="Assigned Clients"
                  description="Monitor client progress, assigned workout plans, and attendance."
                  moduleName="Trainer Workspace"
                  phase="Phase 6"
                />
              </TrainerLayout>
            }
          />
          <Route
            path="/workouts"
            element={
              <TrainerLayout>
                <FeaturePlaceholderShell
                  title="Workout Library"
                  description="Build, assign, and distribute exercise routines to members."
                  moduleName="Trainer Workspace"
                  phase="Phase 6"
                />
              </TrainerLayout>
            }
          />
        </Route>
      </Route>

      {/* 6. Catch-All 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
