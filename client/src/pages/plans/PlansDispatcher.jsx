import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { USER_ROLES } from "../../utils/constants.js";
import { PublicLayout } from "../../layouts/PublicLayout.jsx";
import { MemberLayout } from "../../layouts/MemberLayout.jsx";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { TrainerLayout } from "../../layouts/TrainerLayout.jsx";
import { PublicPlanCatalog } from "./PublicPlanCatalog.jsx";
import { MemberPlanCatalog } from "./MemberPlanCatalog.jsx";
import { AdminPlanManagement } from "./AdminPlanManagement.jsx";

/**
 * Role-aware Plans Dispatcher.
 * Dispatches the appropriate catalog or management interface under /plans:
 * - Guests: PublicPlanCatalog wrapped in PublicLayout
 * - Members: MemberPlanCatalog wrapped in MemberLayout
 * - Admins: AdminPlanManagement wrapped in AdminLayout
 * - Trainers: PublicPlanCatalog wrapped in TrainerLayout
 *
 * @returns {JSX.Element}
 */
export function PlansDispatcher() {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <PublicPlanCatalog />
      </PublicLayout>
    );
  }

  switch (role) {
    case USER_ROLES.ADMIN:
      return (
        <AdminLayout>
          <AdminPlanManagement />
        </AdminLayout>
      );
    case USER_ROLES.TRAINER:
      return (
        <TrainerLayout>
          <PublicPlanCatalog />
        </TrainerLayout>
      );
    case USER_ROLES.MEMBER:
    default:
      return (
        <MemberLayout>
          <MemberPlanCatalog />
        </MemberLayout>
      );
  }
}

export default PlansDispatcher;

