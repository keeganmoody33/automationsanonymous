import Link from "next/link";
import type { PublicAutomation } from "@convex/lib/publicShape";

/*
  The canonical automation page body. The summary is rendered by Sheet as
  the standalone <p> under the h1; this component renders everything after
  it. The payload is shown verbatim in a block, never paraphrased.
*/

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t-hairline py-unit-2">
      <h2 className="text-chrome text-ink-2">{label}</h2>
      <div className="mt-unit">{children}</div>
    </section>
  );
}

export function AutomationRecord({ a }: { a: PublicAutomation }) {
  return (
    <article>
      <dl className="flex flex-wrap gap-x-unit-4 gap-y-unit pb-unit-2 text-chrome text-ink-2">
        <div>
          <dt className="inline">Difficulty: </dt>
          <dd className="inline text-ink">{a.difficulty}</dd>
        </div>
        {a.timeSavedMinutes ? (
          <div>
            <dt className="inline">Time saved: </dt>
            <dd className="inline text-ink">{a.timeSavedMinutes} min per run</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline">Tools: </dt>
          <dd className="inline">
            {a.toolSlugs.map((t, i) => (
              <span key={t}>
                {i > 0 ? ", " : ""}
                <Link href={`/tools/${t}`} className="text-ink hover:text-mark">
                  {t}
                </Link>
              </span>
            ))}
          </dd>
        </div>
      </dl>

      {a.problem ? (
        <Section label="Problem">
          <p className="max-w-[64ch]">{a.problem}</p>
        </Section>
      ) : null}
      {a.trigger ? (
        <Section label="Trigger">
          <p className="max-w-[64ch]">{a.trigger}</p>
        </Section>
      ) : null}

      {a.prerequisites.length > 0 ? (
        <Section label="Prerequisites">
          <ul className="list-none">
            {a.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-unit">
                <span className="text-chrome text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section label="Steps">
        <ol className="list-none">
          {[...a.steps]
            .sort((x, y) => x.order - y.order)
            .map((s) => (
              <li key={s.order} className="flex gap-unit border-b-hairline py-unit last:border-b-0">
                <span className="w-[3ch] shrink-0 text-chrome text-ink-3">
                  {String(s.order).padStart(2, "0")}
                </span>
                <div>
                  <p>
                    {s.action}
                    {s.toolSlug ? (
                      <>
                        {" "}
                        <Link href={`/tools/${s.toolSlug}`} className="text-chrome text-ink-2 hover:text-mark">
                          {s.toolSlug}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  {s.detail ? <p className="mt-tick text-ink-2">{s.detail}</p> : null}
                </div>
              </li>
            ))}
        </ol>
      </Section>

      {a.payload ? (
        <Section label={`Payload · ${a.payload.format}`}>
          <pre className="overflow-x-auto border-hairline bg-paper-deep p-unit-2 text-[0.75rem] leading-relaxed">
            <code>{a.payload.content}</code>
          </pre>
          {a.payload.sourceUrl ? (
            <p className="mt-unit text-chrome">
              <a href={a.payload.sourceUrl} rel="noopener noreferrer" className="text-ink-2 hover:text-mark">
                Source
              </a>
            </p>
          ) : null}
        </Section>
      ) : null}

      {a.failureModes.length > 0 ? (
        <Section label="Failure modes">
          <ul className="list-none">
            {a.failureModes.map((f, i) => (
              <li key={i} className="flex gap-unit">
                <span className="text-chrome text-mark">!</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {a.sourceUrl ? (
        <Section label="Origin">
          <p className="text-chrome">
            <a href={a.sourceUrl} rel="noopener noreferrer" className="text-ink-2 hover:text-mark">
              {a.origin} · source
            </a>
          </p>
        </Section>
      ) : null}
    </article>
  );
}
