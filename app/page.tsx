"use client";

import { useRouter } from "next/navigation";
import { ComponentHub } from "@/components/hub/component-hub";

export default function Home() {
  const router = useRouter();

  return (
    <ComponentHub
      onNavigateStudio={(id) => {
        router.push(`/studio/${id}`);
      }}
    />
  );
}
