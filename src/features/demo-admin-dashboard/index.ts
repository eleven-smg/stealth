
export { DemoAdminDashboard } from "./components/DemoAdminDashboard";
export {
  ADMIN_DASHBOARD_MIN_SUPPORTED_WIDTH,
  getAdminDashboardBreakpoint,
  getAdminDashboardWidthNote,
  isAdminDashboardWidthSupported,
} from "./layout";
export {
  adminDashboardLayoutChecks,
  adminDashboardPanels,
  adminDashboardWidthNotes,
} from "./fixtures/demoData";
export type {
  AdminDashboardBreakpoint,
  AdminDashboardLayoutCheck,
  AdminDashboardPanel,
  AdminDashboardWidthNote,
=======
export { DemoAdminDashboard } from "./DemoAdminDashboard";
export type {
  DashboardNavItem,
  DashboardSection,
  DemoAdminDashboardProps,
  StatCard,

} from "./types";

export {
  TemplatePicker,
  messageTemplates,
  searchTemplates,
  groupByCategory,
  templateToDraft,
  draftIdForTemplate,
  isTemplateInserted,
  insertTemplate,
  removeDraft,
  TEMPLATE_CATEGORY_LABEL,
  type InsertResult,
  type MessageTemplate,
  type TemplateCategory,
} from "./templates";
