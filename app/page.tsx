"use client";

import dynamic from "next/dynamic";
import { StudioSkeleton } from "@/components/studio/studio-skeleton";

const StudioContainer = dynamic(
  () =>
    import("@/components/studio/studio-container").then(
      (mod) => mod.StudioContainer
    ),
  {
    ssr: false,
    loading: () => <StudioSkeleton />,
  }
);

export default function Home() {
  return <StudioContainer />;
}
