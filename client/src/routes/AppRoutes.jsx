import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES, USER_ROLES } from "../utils/constants.js";
import { RouteLoadingSpinner } from "../components/ui/RouteLoadingSpinner.jsx";

// Layouts (eagerly loaded for shell layout stability)
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { AdminLayout } from "../layouts/AdminLayout.jsx";
import { TrainerLayout } from "../layouts/TrainerLayout.jsx";
import { MemberLayout } from "../layouts/MemberLayout.jsx";

// Route Guards (eagerly loaded for zero-latency auth evaluation)
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleRoute } from "./RoleRoute.jsx";
import { GuestRoute } from "./GuestRoute.jsx";
import { PwaGateway } from "./PwaGateway.jsx";

// Lazy-Loaded Dispatchers & Standalone Pages (Domain Code-Splitting)
const DashboardDispatcher = lazy(() => import("./DashboardDispatcher.jsx"));
const ProfileDispatcher = lazy(() => import("./ProfileDispatcher.jsx"));
const PlansDispatcher = lazy(() => import("../pages/plans/PlansDispatcher.jsx"));
const PublicLandingPage = lazy(() => import("../pages/PublicLandingPage.jsx"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const FeaturePlaceholderShell = lazy(() => import("../pages/FeaturePlaceholderShell.jsx"));

// Lazy-Loaded Role Workspaces
const MembersManagementPage = lazy(() =>
  import("../pages/admin/MembersManagementPage.jsx").then((m) => ({
    default: m.default || m.MembersManagementPage,
  }))
);
const PaymentsManagementPage = lazy(() => import("../pages/admin/PaymentsManagementPage.jsx"));
const DiscountsManagementPage = lazy(() => import("../pages/admin/DiscountsManagementPage.jsx"));
const MemberPassesPage = lazy(() =>
  import("../pages/member/MemberPassesPage.jsx").then((m) => ({
    default: m.default || m.MemberPassesPage,
  }))
);
const TrainerScheduleShell = lazy(() => import("../pages/trainer/TrainerScheduleShell.jsx"));

/**
 * Centralized Application Route Map.
 * Implements code-split dynamic imports via React.lazy and Suspense,
 * paired with a flat URL hierarchy and role-aware dispatchers.
 *
 * @returns {JSX.Element}
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingSpinner fullScreen />}>
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
          {/* Admin Workspaces */}
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
            <Route
              path={ROUTES.MEMBERS}
              element={
                <AdminLayout>
                  <MembersManagementPage />
                </AdminLayout>
              }
            />
            <Route
              path={ROUTES.PAYMENTS}
              element={
                <AdminLayout>
                  <PaymentsManagementPage />
                </AdminLayout>
              }
            />
            <Route
              path={ROUTES.DISCOUNTS}
              element={
                <AdminLayout>
                  <DiscountsManagementPage />
                </AdminLayout>
              }
            />
            <Route
              path={ROUTES.REFUNDS}
              element={
                <AdminLayout>
                  <PaymentsManagementPage initialTab="refunds" />
                </AdminLayout>
              }
            />
            <Route
              path="/trainers"
              element={
                <AdminLayout>
                  <FeaturePlaceholderShell
                    title="Trainer Management"
                    description="Assign trainers, review certifications, and oversee coaching allocations."
                    moduleName="Admin Console"
                    phase="Phase 6"
                  />
                </AdminLayout>
              }
            />
          </Route>

          {/* Member Workspaces */}
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.MEMBER]} />}>
            <Route
              path={ROUTES.PASSES}
              element={
                <MemberLayout>
                  <MemberPassesPage />
                </MemberLayout>
              }
            />
            <Route
              path={ROUTES.WORKOUTS}
              element={
                <MemberLayout>
                  <FeaturePlaceholderShell
                    title="My Workouts"
                    description="Access assigned daily workouts, exercise logs, and coaching notes."
                    moduleName="Member Workspace"
                    phase="Phase 6"
                  />
                </MemberLayout>
              }
            />
          </Route>

          {/* Trainer Workspaces */}
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
              path="/clients"
              element={
                <TrainerLayout>
                  <FeaturePlaceholderShell
                    title="Assigned Clients"
                    description="View active member rosters, health profiles, and training progress."
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
    </Suspense>
  );
}

export default AppRoutes;
