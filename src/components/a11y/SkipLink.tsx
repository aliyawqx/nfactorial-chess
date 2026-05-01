"use client";

import { useT } from "@/lib/i18n/I18nProvider";

export function SkipLink() {
  const t = useT();
  return (
    <a href="#main" className="skip-link">
      {t.common.goToMain}
    </a>
  );
}
