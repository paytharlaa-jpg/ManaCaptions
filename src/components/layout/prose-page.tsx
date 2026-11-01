import type { ReactNode } from "react";
import { PublicLayout } from "./public-layout";

export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>}
        <div className="mt-10 space-y-6 leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">
          {children}
        </div>
      </article>
    </PublicLayout>
  );
}
