import { readSingleRepoComponent } from "@/lib/registry/server-registry";
import { StudioRouteClient } from "@/components/studio/studio-route-client";

export const dynamic = "force-dynamic";

export default async function StudioWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || "");
  const repoEntry = decodedId ? await readSingleRepoComponent(decodedId) : null;

  return (
    <StudioRouteClient
      id={decodedId}
      initialComponent={repoEntry?.component ?? null}
      initialVariants={repoEntry?.manifest?.variants}
      initialActiveVariantId={repoEntry?.manifest?.activeVariantId}
    />
  );
}
