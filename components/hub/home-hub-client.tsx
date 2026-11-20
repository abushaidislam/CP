"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ComponentHub } from "./component-hub";
import type { RepoSummaryInput } from "@/lib/store/studio-store";

export interface HomeHubClientProps {
  initialSummaries?: RepoSummaryInput[];
}

export function HomeHubClient({ initialSummaries }: HomeHubClientProps) {
  const router = useRouter();
  const handleNavigateStudio = useCallback(
    (id: string) => {
      router.push(`/studio/${id}`);
    },
    [router]
  );

  return (
    <ComponentHub
      initialSummaries={initialSummaries}
      onNavigateStudio={handleNavigateStudio}
    />
  );
}
