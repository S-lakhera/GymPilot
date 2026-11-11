# GymPilot — Frontend Architecture & Client Implementation Guide

---

## 1. Overview & Technology Stack

The GymPilot client is a responsive, mobile-first Progressive Web Application (PWA) built for gym administrators, trainers, and members.

### Core Stack

- **Framework:** [React 18](https://react.dev/) (JavaScript, ESM)
- **Build Tool:** [Vite 6](https://vitejs.dev/) with Fast Refresh and production chunk optimization
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/) with `@tailwindcss/forms` and `@tailwindcss/typography`
- **Routing:** [React Router v6/v7](https://reactrouter.com/) with role-based route guards and lazy code-splitting
- **HTTP Client:** [Axios](https://axios-http.com/) configured with in-memory token injection, single-flight refresh mutex, and HttpOnly cookie credentials
- **Icons:** [Lucide React](https://lucide.dev/) (single, unified iconography library with consistent stroke/size)
- **State Management:** React Context (`AuthContext`) for in-memory session persistence, user profiles, and global alerts

---

## 2. Visual Identity & Design System Tokens

GymPilot implements a **Hybrid Dark Athletic + Clean Workspace** design system:

- **Brand & Structural Surfaces:** Dark slate surfaces provide high visual contrast and athletic branding for headers, hero sections, and navigation sidebars.
- **Workspace Surfaces:** Light, clean canvas backgrounds with neutral white cards maximize readability for data-dense tables, checkout forms, and member ledgers.
- **Accents:** Vibrant Emerald for primary calls to action; Lime for promotional highlights and discounts.

### Design Token Reference (`client/tailwind.config.js`)

| Token Category       | Tailwind Class / Token                      | Hex Value | Semantic Purpose                                       |
| :------------------- | :------------------------------------------ | :-------- | :----------------------------------------------------- |
| **Brand Dark**       | `bg-brand-dark`                             | `#0F172A` | Main header, hero banners, dark layout sidebars        |
| **Brand Surface**    | `bg-brand-surface`                          | `#1E293B` | Nav items, dark cards, container backgrounds           |
| **Brand Border**     | `border-brand-border`                       | `#334155` | Borders on dark structural surfaces                    |
| **Emerald Accent**   | `bg-emerald-accent` / `text-emerald-accent` | `#34D399` | Primary action buttons, active badges, key icons       |
| **Emerald Dark**     | `bg-emerald-dark`                           | `#10B981` | Button hover states, confirmed statuses                |
| **Lime Accent**      | `bg-lime-accent` / `text-lime-accent`       | `#A3E635` | Special offers, discount pills, promotional badges     |
| **Workspace Canvas** | `bg-workspace`                              | `#F8FAFC` | Light application background for dashboards & tables   |
| **Workspace Card**   | `bg-workspace-card`                         | `#FFFFFF` | Information cards, data tables, modals                 |
| **Workspace Border** | `border-workspace-border`                   | `#E2E8F0` | Subtle neutral dividers and card borders               |
| **Primary Text**     | `text-text-primary`                         | `#0F172A` | High-contrast body text on light surfaces              |
| **Secondary Text**   | `text-text-secondary`                       | `#64748B` | Muted labels, table headers, descriptions              |
| **Inverted Text**    | `text-text-inverted`                        | `#F8FAFC` | High-contrast text on dark brand surfaces              |
| **Status: Success**  | `status.success`                            | `#10B981` | Completed payments, active memberships                 |
| **Status: Warning**  | `status.warning`                            | `#F59E0B` | Expiring passes (within 7 days), pending checkouts     |
| **Status: Danger**   | `status.danger`                             | `#EF4444` | Expired subscriptions, failed payments, logout actions |

### Typography

- **Body / Sans:** `Inter`, system-ui, -apple-system, sans-serif
- **Headings / Display:** `Plus Jakarta Sans`, Inter, sans-serif

---

## 3. Four-Layer Frontend Architecture

The client enforces a clean unidirectional data flow:

$$\mathbf{API} \longrightarrow \mathbf{Hooks} \longrightarrow \mathbf{State} \longrightarrow \mathbf{UI}$$

```mermaid
flowchart TD
    subgraph Layer1["1. API Layer (client/src/api/)"]
        Axios["axiosClient.js\n(BaseURL /api, withCredentials, Mutex Interceptors)"]
        AuthApi["authApi.js"]
        DashboardApi["dashboardApi.js (Phase 5.5)"]
        PlansApi["planApi.js (Phase 5.6)"]
        SubApi["subscriptionApi.js (Phase 5.6)"]
    end

    subgraph Layer2["2. Hooks Layer (client/src/hooks/)"]
        UseAuth["useAuth.js"]
        UseDashboard["useDashboard.js"]
        UsePlans["usePlans.js"]
    end

    subgraph Layer3["3. State Layer (client/src/context/)"]
        AuthContext["AuthContext.jsx\n(inMemoryAccessToken, user, profile, isRestoring)"]
        ToastContext["ToastContext.jsx (Phase 5.8)"]
    end

    subgraph Layer4["4. UI Layer (client/src/components/ & client/src/pages/)"]
        Layouts["PublicLayout, AdminLayout, TrainerLayout, MemberLayout"]
        Pages["LandingPage, LoginPage, Dashboards, Checkout"]
        Components["StatCards, Buttons, Modals, Badges"]
    end

    Axios --> AuthApi
    Axios --> DashboardApi
    Axios --> PlansApi
    Axios --> SubApi

    AuthApi --> AuthContext
    AuthContext --> UseAuth
    UseAuth --> UI
    DashboardApi --> UseDashboard
    UseDashboard --> UI
    Layer3 --> Layer4
```

### Layer Responsibilities

1. **API Layer (`client/src/api/`):**
   - Pure HTTP communication via Axios.
   - Unwraps backend JSend response envelopes (`res.data.data` + `res.data.message` + `res.data.pagination`).
   - Normalizes all errors using `normalizeApiError` to return clean `{ message, code, errors, status }` objects.
   - **Rule:** API modules never touch React state or navigate routes.

2. **Hooks Layer (`client/src/hooks/`):**
   - Consumes API modules and manages asynchronous loading states, cache, and error notifications.
   - Exposes clean interfaces to UI components (e.g. `useAuth()`, `useDashboard()`).

3. **State Layer (`client/src/context/`):**
   - Coordinates application-wide state: in-memory JWT authentication, active user profile, profile completeness, and notifications.
   - Handles silent startup session restoration and terminal session teardown.

4. **UI Layer (`client/src/pages/` & `client/src/components/`):**
   - Presentational components styled strictly with Tailwind design system tokens.
   - Role-segregated layouts (`AdminLayout`, `TrainerLayout`, `MemberLayout`, `PublicLayout`).
   - Route guards preventing unauthorized navigation.

---

## 4. Dual JWT Authentication & In-Memory Token Security

GymPilot eliminates XSS token theft vectors by enforcing **in-memory access token storage**:

```mermaid
sequenceDiagram
    autonumber
    actor User as Member / Admin
    participant Client as React Client (Memory)
    participant Axios as axiosClient Interceptor
    participant Backend as Express API (/api/auth)
    participant Cookie as HttpOnly Cookie Jar

    User->>Client: Enters Credentials on /login
    Client->>Backend: POST /api/auth/login
    Backend-->>Cookie: Set-Cookie: refreshToken (HttpOnly, 7d, SameSite=Lax)
    Backend-->>Client: 200 OK { accessToken, user }
    Note over Client: Stores accessToken in JavaScript memory only.<br/>Never written to localStorage.

    Note over Client,Backend: Subsequent Protected API Request
    Client->>Axios: Call /api/subscriptions
    Axios->>Axios: Attach Header: Authorization: Bearer <accessToken>
    Axios->>Backend: GET /api/subscriptions
    Backend-->>Client: 200 OK (Data returned)

    Note over Client,Backend: Token Expiry & Silent Refresh (Single-Flight Mutex)
    Client->>Axios: Call /api/subscriptions (token expired after 60m)
    Axios->>Backend: GET /api/subscriptions
    Backend-->>Axios: 401 Unauthorized (TOKEN_EXPIRED)
    Note over Axios: Intercepts 401.<br/>Buffers concurrent requests in failedQueue.
    Axios->>Backend: POST /api/auth/refresh (Cookie sent automatically)
    Backend-->>Cookie: Set-Cookie: rotatedRefreshToken
    Backend-->>Axios: 200 OK { accessToken: newAccessToken }
    Note over Axios: Updates inMemoryAccessToken.<br/>Replays failedQueue with new Bearer token.
    Axios->>Backend: Replayed GET /api/subscriptions
    Backend-->>Client: 200 OK (Original call succeeds seamlessly)
```

### 1. Single-Flight Refresh Mutex

When a user opens a dashboard that initiates multiple concurrent API calls (e.g. membership stats, recent payments, user profile) and the access token has expired:

- Without a mutex: 3 parallel 401s would fire 3 concurrent `/auth/refresh` calls, causing token rotation race conditions where the second request is treated as a token reuse attack.
- **GymPilot Implementation:** `axiosClient.js` flags `isRefreshing = true` on the first 401. Subsequent 401 requests push their resolve/reject promises into a `failedQueue`. Once the primary refresh resolves, all queued requests receive the new token and execute seamlessly.

### 2. Terminal Session Teardown

When the refresh token itself is expired, invalid, or revoked (e.g. user logged out on another device or changed password):

- `POST /api/auth/refresh` returns terminal `401 Unauthorized`.
- The interceptor calls the registered `onSessionExpiredCallback`.
- `AuthContext` purges the in-memory token, resets user state, and triggers React Router navigation to `/login?session_expired=true` with `{ replace: true }`.
- **Transient Network Protection:** Network timeouts, internet drops, and 5xx server errors do NOT terminate the user's session.

---

## 5. Startup Session Restoration Lifecycle

```mermaid
flowchart TD
    Boot([Browser Launches / Page Reloads / Opens /app]) --> Splash[Render Full-Screen SplashLoader]
    Splash --> RefreshReq[AuthContext calls authApi.refreshToken]

    RefreshReq -->|Cookie Valid: 200 OK| StoreToken[Store new AccessToken in Memory]
    StoreToken --> FetchMe[AuthContext calls authApi.getMe]
    FetchMe --> PopulateState[Set user, profile, isProfileComplete\nisAuthenticated = true]
    PopulateState --> EndRestore[Set isRestoring = false]
    EndRestore --> TargetView[Render Target Route / Role Dashboard]

    RefreshReq -->|Cookie Expired/Missing: 401| ClearState[Clear in-memory state\nisAuthenticated = false]
    ClearState --> EndRestore
    EndRestore --> PublicView[Render Public / Landing Page / Login]
```

---

## 6. Directory Structure Map (`client/`)

```text
client/
├── public/
│   ├── favicon.svg              # Branded emerald dumbbell favicon
│   └── manifest.json            # PWA Web App Manifest (Phase 5.7)
├── src/
│   ├── api/                     # Layer 1: Pure API Axios Calls
│   │   ├── axiosClient.js       # Centralized instance + refresh mutex interceptor
│   │   ├── authApi.js           # Login, register, refresh, logout, getMe, password
│   │   ├── userApi.js           # (Phase 5.6) Member management
│   │   ├── trainerApi.js        # (Phase 5.6) Trainer roster & profile
│   │   ├── planApi.js           # (Phase 5.6) Categories & plans catalog
│   │   ├── subscriptionApi.js   # (Phase 5.6) Quote, checkout, cancel
│   │   ├── paymentApi.js        # (Phase 5.6) Confirm, receipts, audit log
│   │   ├── refundApi.js         # (Phase 5.6) Admin refund operations
│   │   └── dashboardApi.js      # (Phase 5.5) Admin, Trainer, Member dashboards
│   ├── context/                 # Layer 3: Shared Application State
│   │   ├── AuthContext.jsx      # In-memory auth, profile & session restoration
│   │   └── ToastContext.jsx     # (Phase 5.8) Toast notifications
│   ├── hooks/                   # Layer 2: Custom Reusable Hooks
│   │   ├── useAuth.js           # Hook to consume AuthContext
│   │   └── useDashboard.js      # (Phase 5.5) Role-aware dashboard data
│   ├── layouts/                 # Structural Page Layout Wrappers
│   │   ├── PublicLayout.jsx     # Header, public footer, role-aware navbar
│   │   ├── AdminLayout.jsx      # Admin sidebar, topbar, content outlet
│   │   ├── TrainerLayout.jsx    # Trainer sidebar, content outlet
│   │   └── MemberLayout.jsx     # Member navigation (bottom bar on mobile PWA)
│   ├── routes/                  # Route Definitions & Security Guards
│   │   ├── AppRoutes.jsx        # Route definitions with React.lazy
│   │   ├── ProtectedRoute.jsx   # Role-guarded route wrapper
│   │   └── PublicRoute.jsx      # Non-blocking public route wrapper
│   ├── components/              # Layer 4: Reusable UI Components
│   │   ├── common/              # SplashLoader, Navbar, Footer, Button, Input
│   │   ├── admin/               # StatCards, FinancialCards, AuditTables
│   │   ├── trainer/             # TrainerProfileCard
│   │   └── member/              # PassBadge, CompletenessMeter
│   ├── pages/                   # Route Page Views
│   │   ├── public/              # LandingPage, NotFoundPage
│   │   ├── auth/                # LoginPage, RegisterPage
│   │   ├── pwa/                 # AppGatePage (/app)
│   │   ├── admin/               # AdminDashboard, MemberList, PaymentAudit
│   │   ├── trainer/             # TrainerDashboard
│   │   └── member/              # MemberDashboard, MySubscriptions, Checkout
│   ├── utils/                   # Foundational Helpers
│   │   ├── cn.js                # Tailwind class variant merger (clsx + twMerge)
│   │   ├── formatters.js        # formatCurrency (₹), formatDate (IST), daysRemaining
│   │   └── constants.js         # USER_ROLES, ROUTES, SUBSCRIPTION_STATUS
│   ├── App.jsx                  # Root App shell with AuthProvider & router
│   ├── main.jsx                 # React 18 createRoot bootstrap
│   └── index.css                # Tailwind base, components, and scrollbar styling
├── index.html                   # HTML entry point with Google Fonts
├── package.json                 # Client scripts and dependencies
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # GymPilot Dark Athletic design tokens
└── vite.config.js               # Vite config with React plugin and /api proxy
```

---

## 7. Developer Workflow & Scripts

From the repository root:

- **`npm run dev`**: Uses `concurrently` to run both the Express backend (`http://localhost:5001`) and the Vite client (`http://localhost:5173`) in a single terminal.
- **`npm run client`**: Boots the Vite development server independently with hot module replacement.
- **`npm run client:build`**: Bundles the production client assets into `client/dist/`.
- **`npm run client:preview`**: Serves the compiled production build locally for verification.
- **`npm run server`**: Boots the backend Express API with `nodemon`.
- **`npm test`**: Runs the 10 backend integration test suites (139 tests).
