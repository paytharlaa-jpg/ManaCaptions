import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/announcements")({ head: () => pageMeta("Announcements", "Owner-only announcements for ManaCaptions."), component: Page });
function Page() { return <AnnouncementManager />; }
