import { createFileRoute } from "@tanstack/react-router";
import { ProductSettings } from "@/components/admin/product-settings";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/settings")({ head: () => pageMeta("Product settings", "Owner-only product settings for ManaCaptions."), component: Page });
function Page() { return <ProductSettings />; }
