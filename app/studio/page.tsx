"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store/studio-store";

export default function StudioRedirectPage() {
  const router = useRouter();
  const currentTemplateId = useStudioStore((state) => state.currentTemplateId);

  useEffect(() => {
    if (currentTemplateId) {
      router.replace(`/studio/${currentTemplateId}`);
    } else {
      router.replace("/");
    }
  }, [router, currentTemplateId]);

  return null;
}
