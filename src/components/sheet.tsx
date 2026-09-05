import type { ReactNode } from "react";

/*
  Sheet: the page frame every route renders inside for now. A drawing sheet
  with a title block: sheet number, route name, and a status stamp. Tokens
  only. Replaced or extended as each phase fills the route in.
*/

type SheetProps = {
  /** Sheet number shown in the title block, e.g. "03". */
  number: string;
  /** Route path shown in the title block, e.g. "/automations". */
  route: string;
  title: string;
  /** Standalone sentence rendered directly under the h1, before any chrome. */
  summary?: string;
  children?: ReactNode;
};

export function Sheet({ number, route, title, summary, children }: SheetProps) {
  return (
    <main className="flex-1 grid-paper">
      <div className="mx-auto max-w-[1280px] px-major py-major">
        <header className="border-b-hairline pb-unit">
          <p className="text-chrome text-ink-2">
            Sheet {number} · {route}
          </p>
          <h1 className="mt-unit text-5xl leading-none">{title}</h1>
          {summary ? (
            <p className="mt-unit max-w-[48ch] text-ink">{summary}</p>
          ) : null}
        </header>
        {children ? <div className="mt-major">{children}</div> : null}
      </div>
    </main>
  );
}

/** Empty state. Says the thing is empty, nothing else. */
export function Empty({ what }: { what: string }) {
  return (
    <p className="border-hairline border-dashed p-unit text-chrome text-ink-3">
      {what}: empty
    </p>
  );
}

/** Stamp for work that is not built yet. */
export function NotBuilt({ phase }: { phase: number }) {
  return (
    <p className="inline-block border-thin border-mark px-unit py-tick text-chrome text-mark">
      Not built · Phase {phase}
    </p>
  );
}
