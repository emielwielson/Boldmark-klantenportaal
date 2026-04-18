import type { ReactNode } from "react";

import { BoldmarkLogo } from "@/components/branding/boldmark-logo";

/**
 * Fixed top-left wordmark (does not affect centered main layout).
 */
export function DashboardLogoShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed left-4 top-10 z-30 sm:left-6 lg:left-8">
        <div className="pointer-events-auto">
          <BoldmarkLogo />
        </div>
      </div>
      {children}
    </>
  );
}
