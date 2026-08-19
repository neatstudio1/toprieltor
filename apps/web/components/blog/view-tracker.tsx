"use client";

import { useEffect, useRef } from "react";
import { trackArticleView } from "@/lib/cms/comments";

export function ViewTracker({ articleDocumentId }: { articleDocumentId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackArticleView(articleDocumentId);
  }, [articleDocumentId]);

  return null;
}
