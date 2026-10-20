"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStudioStore } from "@/lib/store/studio-store";
import { StudioContainer } from "@/components/studio/studio-container";

export default function StudioWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const currentTemplateId = useStudioStore((state) => state.currentTemplateId);
  const loadComponent = useStudioStore((state) => state.loadComponent);

  useEffect(() => {
    if (id && currentTemplateId !== id) {
      loadComponent(id);
    }
  }, [id, currentTemplateId, loadComponent]);

  return <StudioContainer componentId={id} />;
}
