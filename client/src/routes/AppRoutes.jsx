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

// Pages & Shells
import { PublicLandingPage } from "../pages/PublicLandingPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";

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
        </Route>
      </Route>

      {/* 6. Catch-All 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
