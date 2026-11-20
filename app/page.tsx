import { readRegistrySummaries } from "@/lib/registry/server-registry";
import { HomeHubClient } from "@/components/hub/home-hub-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { summaries } = await readRegistrySummaries();
  return <HomeHubClient initialSummaries={summaries} />;
}
