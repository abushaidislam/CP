"use client";

import React, { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { StudioContainer } from "@/components/studio/studio-container";

export default function StudioWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const currentTemplateId = useStudioStore((state) => state.currentTemplateId);
  const userComponents = useStudioStore((state) => state.userComponents);
  const loadComponent = useStudioStore((state) => state.loadComponent);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (attemptedRef.current === id) return;
    attemptedRef.current = id;

    // Verify if ID exists
    const exists = Boolean(userComponents?.[id] || DEFAULT_TEMPLATES.some((t) => t.id === id));
    if (!exists) {
      // Fallback: load default and sync URL
      loadComponent(id);
      const fallbackId = useStudioStore.getState().currentTemplateId;
      router.replace(`/studio/${fallbackId}`);
      return;
    }

    if (currentTemplateId !== id) {
      loadComponent(id);
    }
  }, [id, currentTemplateId, userComponents, loadComponent, router]);

  return <StudioContainer componentId={id} />;
}
