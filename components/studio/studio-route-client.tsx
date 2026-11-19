"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useStudioStore,
  type ComponentVariant,
  type UserComponent,
} from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { StudioContainer } from "./studio-container";

export interface StudioRouteClientProps {
  id: string;
  initialComponent?: UserComponent | null;
  initialVariants?: ComponentVariant[];
  initialActiveVariantId?: string;
}

export function StudioRouteClient({
  id,
  initialComponent,
  initialVariants,
  initialActiveVariantId,
}: StudioRouteClientProps) {
  const router = useRouter();
  const seededIdRef = useRef<string | null>(null);

  // Synchronously seed server-loaded component into store before StudioContainer reads it
  if (initialComponent && seededIdRef.current !== initialComponent.id) {
    seededIdRef.current = initialComponent.id;
    useStudioStore
      .getState()
      .hydrateSingleComponentFromServer(
        initialComponent,
        initialVariants,
        initialActiveVariantId
      );
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const resolveRouteComponent = async () => {
      const store = useStudioStore.getState();

      // If SSR already provided the exact component (even via slug), activate it cleanly
      if (initialComponent) {
        if (store.currentTemplateId !== initialComponent.id) {
          store.loadComponent(initialComponent.id);
        }
        return;
      }

      // Check local store or built-in templates
      const existingLocal = store.userComponents?.[id];
      const isDefaultTemplate = DEFAULT_TEMPLATES.some((t) => t.id === id);

      if (existingLocal || isDefaultTemplate) {
        if (store.currentTemplateId !== id) {
          store.loadComponent(id);
        }
        if (existingLocal?.filesLoaded === false) {
          await store.ensureComponentFilesLoaded(id);
        }
        return;
      }

      // Fallback: ask server API for this specific component before redirecting
      const fetched = await store.ensureComponentFilesLoaded(id);
      if (cancelled) return;

      if (fetched) {
        useStudioStore.getState().loadComponent(fetched.id);
        return;
      }

      // Truly nonexistent component ID -> redirect to active fallback template
      const latest = useStudioStore.getState();
      const fallbackId = latest.currentTemplateId || DEFAULT_TEMPLATES[0].id;
      latest.loadComponent(fallbackId);
      router.replace(`/studio/${fallbackId}`);
    };

    void resolveRouteComponent();
    return () => {
      cancelled = true;
    };
  }, [id, initialComponent, router]);

  return <StudioContainer componentId={initialComponent?.id || id} />;
}
