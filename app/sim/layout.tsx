import type { ReactNode } from "react";
import SimNav from "./_SimNav";

export default function SimLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container py-6">
      <SimNav />
      {children}
    </div>
  );
}

