import type { CampaignSnapshot } from "../types/campaignSnapshot";

/**
 * Default campaign snapshots for the demo admin dashboard.
 *
 * All data is fake, deterministic, and safe for public repository review.
 * No real user data, secrets, private keys, or live network calls are used.
 */
export const defaultCampaignSnapshots: CampaignSnapshot[] = [
  {
    id: "snap-20260715-q3-newsletter",
    name: "Q3 Community Newsletter",
    createdAt: "2026-07-15T14:30:00Z",
    draftCount: 3,
    data: [
      {
        id: "draft-q3-1",
        subject: "Stealth Protocol Update: Q3 Edition",
        body: "Hello community, here is your quarterly update...",
        recipients: ["community*stealth.demo"],
      },
      {
        id: "draft-q3-2",
        subject: "Developer Spotlight: Summer Projects",
        body: "Featuring new tools from our developer community...",
        recipients: ["devs*stealth.demo"],
      },
      {
        id: "draft-q3-3",
        subject: "Upcoming Event: AMA with the Core Team",
        body: "Join us for a live Q&A session next month.",
        recipients: ["events*stealth.demo"],
      },
    ],
  },
];