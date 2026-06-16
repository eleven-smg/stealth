
export type AdminDashboardBreakpoint = "tablet" | "laptop" | "desktop";

export type AdminDashboardPanel = {
  id: string;
  title: string;
  description: string;
  status: "ready" | "needs-review" | "draft";
  demoRecords: number;
};

export type AdminDashboardWidthNote = {
  breakpoint: AdminDashboardBreakpoint;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  sidebarMode: "stacked" | "rail" | "expanded";
  note: string;
};

export type AdminDashboardLayoutCheck = {
  id: string;
  label: string;
  breakpoint: AdminDashboardBreakpoint;
  expected: string;
};

/**
 * Types for the Demo Admin Dashboard feature shell.
 *
 * All data is fake, deterministic, and safe for public repository review.
 * No real user data, secrets, private keys, or live network calls are used.
 */

/** A navigable section within the admin dashboard. */
export interface DashboardNavItem {
  /** Unique identifier for the section. */
  id: DashboardSection;
  /** Display label shown in the nav bar. */
  label: string;
  /** Optional short description for tooltips or aria labels. */
  description?: string;
}

/** The available top-level sections in the admin dashboard. */
export type DashboardSection = "overview" | "accounts" | "mail" | "templates" | "audit";

/** Props passed to the dashboard shell. */
export interface DemoAdminDashboardProps {
  /** Optional className override for the root element. */
  className?: string;
}

/** A summary stat card shown in the overview section. */
export interface StatCard {
  label: string;
  value: string;
  /** Optional comparison indicator (e.g., "+12%"). */
  delta?: string;
}

