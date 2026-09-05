import Link from "next/link";
import type { PublicAutomation } from "@convex/lib/publicShape";
import type { PublicTool } from "@convex/lib/toolShape";
import s from "./landing.module.css";
import { HeroDrawing } from "./hero-drawing";
import { HeroCanvas } from "./hero-canvas";
import { DrawingsLive } from "./drawings-live";
import { howTo } from "@/lib/schema-org";

type Props = {
  automations: PublicAutomation[];
  tools: PublicTool[];
  stacks: number;
};

const NAV = [
  { href: "/automations", label: "Automations" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/submit", label: "Submit" },
] as const;

/* Section 03. Satire. Every card stamped. Copy from the canvas, verbatim. */
const SHEETS = [
  ["Brush your teeth", "07:00 and 22:30", "The toothbrush is not on the network."],
  ["Fill the tank", "Gauge under a quarter", "The car has no API. You still stand there."],
  ["Take out the trash", "Night before pickup", "The bin does not move itself."],
  ["Water the plants", "Soil sensor dry", "The plant died in March."],
  ["Pay the rent", "First of the month", "The landlord wants a paper check."],
  ["Text your mom back", "Unread over 48 hours", "She can tell."],
  ["Reply sounds good", "Thread over six replies", "It did not sound good."],
  ["Renew the thing", "30 days before expiry", "You forgot which thing."],
  ["Get to the gym", "06:00", "Trigger fired. Nothing else did."],
  ["The weekly standup", "Monday 09:00", "The update is the same as last week."],
  ["Sleep", "23:00", "The phone is the trigger and the failure."],
  ["Your thoughts", "Continuous", "See sheets 01 through 11."],
] as const;

const Arrow = () => (
  <svg viewBox="0 0 14 14" aria-hidden><path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
);

function fmtDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function Landing({ automations, tools, stacks }: Props) {
  const latest = automations[0];
  const minutes = automations.reduce((a, x) => a + (x.timeSavedMinutes ?? 0), 0);
  const timeSaved = minutes > 0 ? `Time saved · ${minutes} min / run across the directory` : "Time saved · recorded per run";
  const slot = (i: number, fallback: string) => tools[i]?.name ?? fallback;
  const sample = latest ? JSON.stringify(howTo(latest), null, 2) : null;

  return (
    <main className={`${s.sheet} grid-paper flex-1`}>
      <DrawingsLive />
      <div className={`${s.frame} hidden md:block`} />
      <div className={`${s.corner} ${s.tl} hidden md:block`} /><div className={`${s.corner} ${s.tr} hidden md:block`} />
      <div className={`${s.corner} ${s.bl} hidden md:block`} /><div className={`${s.corner} ${s.br} hidden md:block`} />

      <div className={s.wrap}>
        {/* 01 hero */}
        <section className={s.hero}>
          <div>
            <div className={s.eyebrow}><span className={s.dash} /><span className={`${s.label} ${s.labelInk}`}>DWG 001 · Directory of working automations · Names withheld</span></div>
            <h1 className={s.title}>Stop doing it <span className={s.tag}>by hand.</span></h1>
            <p className={s.summary}>
              A public directory of real automations, each documented as a structured record: trigger, steps, prerequisites, failure modes, and the runnable payload. Submitted anonymously. Reviewed by hand.
            </p>
            <div className={s.ctas}>
              <Link href="/automations" className={`${s.btn} ${s.btnPrimary}`}>Browse the directory <Arrow /></Link>
              <Link href="/submit" className={`${s.btn} ${s.btnGhost}`}>Submit one anonymously</Link>
            </div>
            <div className={s.index}>
              <div><span className={s.label}>Automations</span><div className={s.n}>{automations.length}</div></div>
              <div><span className={s.label}>Tools</span><div className={s.n}>{tools.length}</div></div>
              <div><span className={s.label}>Stacks</span><div className={s.n}>{stacks}</div></div>
              <div><span className={s.label}>Last published</span><div className={`${s.n} ${s.nDate}`}>{latest ? fmtDate(latest.publishedAt) : "none"}</div></div>
            </div>
          </div>
          <div>
            <HeroCanvas>
              <HeroDrawing timeSaved={timeSaved} />
            </HeroCanvas>
            <div className={s.plate}>
              <div><span className={s.label}>View</span><b>Exploded, front</b></div>
              <div><span className={s.label}>Scale</span><b>NTS</b></div>
              <div><span className={s.label}>Record</span><b>{latest ? <Link href={`/automations/${latest.slug}`}>{latest.slug}</Link> : "none yet"}</b></div>
              <div><span className={s.label}>Drawn by</span><b>Withheld</b></div>
            </div>
          </div>
        </section>

        {/* 02 anatomy */}
        <section>
          <div className={s.secHead}>
            <div className={s.no}>02</div>
            <div>
              <h2>Every automation is a drawing set, not a blog post.</h2>
              <p className={s.lede}>One record, six fixed fields, the same order every time. The summary is written to stand alone as a single quotable sentence. The payload is the runnable artifact and is never paraphrased into prose.</p>
            </div>
          </div>
          <div className={s.anatomy}>
            <div className={s.drawing} data-dwg>
              <svg viewBox="0 0 560 620" aria-label="Wireframe of an automation record page with numbered callouts">
                <rect x="20" y="20" width="440" height="580" className="ln" />
                <path className="ln ln-hair" d="M20 60 H460" />
                <text x="34" y="46" className="t">automations / [slug]</text>
                <text x="360" y="46" className="t">Rev · Published [date]</text>
                <rect x="40" y="86" width="300" height="18" className="fill-ink" />
                <rect x="40" y="110" width="220" height="18" className="fill-ink" />
                <rect x="40" y="146" width="380" height="8" className="fill-soft" />
                <rect x="40" y="160" width="330" height="8" className="fill-soft" />
                <path className="ln ln-mark" d="M40 176 H370" />
                <rect x="40" y="196" width="72" height="16" className="ln ln-hair" />
                <rect x="120" y="196" width="72" height="16" className="ln ln-hair" />
                <rect x="200" y="196" width="96" height="16" className="ln ln-hair" />
                <text x="48" y="207" className="t t-sm">[tool]</text>
                <text x="128" y="207" className="t t-sm">[tool]</text>
                <text x="208" y="207" className="t t-sm">[difficulty]</text>
                <text x="40" y="242" className="t t-ink">Trigger</text>
                <rect x="40" y="250" width="380" height="6" className="fill-line" />
                <text x="40" y="288" className="t t-ink">Steps</text>
                <g className="t t-ink" style={{ fontSize: 8 }}>
                  <text x="40" y="308">01</text><rect x="64" y="301" width="300" height="6" className="fill-line" />
                  <text x="40" y="326">02</text><rect x="64" y="319" width="260" height="6" className="fill-line" />
                  <text x="40" y="344">03</text><rect x="64" y="337" width="320" height="6" className="fill-line" />
                  <text x="40" y="362">04</text><rect x="64" y="355" width="200" height="6" className="fill-line" />
                </g>
                <text x="40" y="398" className="t t-ink">Prerequisites</text>
                <rect x="40" y="406" width="180" height="6" className="fill-line" />
                <rect x="40" y="418" width="220" height="6" className="fill-line" />
                <text x="250" y="398" className="t t-ink">Failure modes</text>
                <rect x="250" y="406" width="170" height="6" className="fill-line" />
                <rect x="250" y="418" width="140" height="6" className="fill-line" />
                <rect x="40" y="450" width="380" height="120" className="ln" />
                <path className="ln ln-hair" d="M40 468 H420" />
                <text x="48" y="462" className="t t-sm">payload · [format]</text>
                <text x="372" y="462" className="t t-mark t-sm">Copy</text>
                {[482, 494, 506, 518, 530, 542].map((y, i) => (
                  <rect key={y} x="52" y={y} width={[180, 260, 140, 300, 220, 90][i]} height="5" className="fill-ink-3" />
                ))}
                {[96, 160, 253, 340, 412, 510].map((y, i) => (
                  <g key={y} className="balloon"><path className="ln ln-hair" d={`M${[340, 420, 420, 384, 420, 420][i]} ${y} L500 ${y}`} /><circle cx="512" cy={y} r="12" /><text x="512" y={y}>{i}</text></g>
                ))}
              </svg>
            </div>
            <div className={s.bom}>
              <div className={`${s.row} ${s.rowHead}`}><div>Item</div><div>Field</div><div>Note</div></div>
              <div className={s.row}><div className={s.item}>0</div><div className={s.field}>Title</div><div>Names the outcome. Never the submitter.</div></div>
              <div className={`${s.row} ${s.rowHot}`}><div className={s.item}>1</div><div className={s.field}>Summary</div><div>One sentence that stands alone. Rendered directly under the title before any chrome. This is the block an answer engine lifts.</div></div>
              <div className={s.row}><div className={s.item}>2</div><div className={s.field}>Trigger</div><div>What starts the run. An event, a schedule, or a manual kick.</div></div>
              <div className={s.row}><div className={s.item}>3</div><div className={s.field}>Steps</div><div>Ordered actions, each tied to a tool where one applies.</div></div>
              <div className={s.row}><div className={s.item}>4</div><div className={s.field}>Prerequisites and failure modes</div><div>What you need before you start, and how it breaks in practice.</div></div>
              <div className={s.row}><div className={s.item}>5</div><div className={s.field}>Payload</div><div>The runnable artifact: n8n JSON, a Zapier export, a shell script, a cron line. Copyable, never paraphrased.</div></div>
            </div>
          </div>
        </section>

        {/* 03 twelve sheets */}
        <section>
          <div className={s.secHead}>
            <div className={s.no}>03</div>
            <div>
              <h2>Twelve sheets. None of them shipped.</h2>
              <p className={s.lede}>The parts of a day that will not automate, drawn up anyway. Every sheet is stamped. Everything below this section is real, runnable, and reviewed by hand.</p>
            </div>
          </div>
          <div className={s.sheets}>
            {SHEETS.map(([title, trigger, fails], i) => (
              <div key={title} className={`${s.sh} ${i === SHEETS.length - 1 ? s.shLast : ""}`}>
                <span className={s.stamp}>Not for construction</span>
                <div className={s.no}>{String(i + 1).padStart(2, "0")}</div>
                <h3>{title}</h3>
                <div className={s.kv}><b>Trigger</b><span>{trigger}</span><b>Fails when</b><span>{fails}</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* 04 patterns */}
        <section>
          <div className={s.secHead}>
            <div className={s.no}>04</div>
            <div>
              <h2>Drawn from the real world, tool by tool.</h2>
              <p className={s.lede}>Browse by the tool you already have, or by the pair you are trying to connect. Three common patterns, shown as schematics. Tool slots fill from the record.</p>
            </div>
          </div>
          <div className={s.patterns}>
            <div className={s.pattern} data-dwg>
              <div className={s.phead}><span className={`${s.label} ${s.labelInk}`}>Pattern A-01</span><span className={s.label}>Elevation</span></div>
              <svg viewBox="0 0 300 150" aria-label="Envelope entering a sorting funnel and landing in a folder">
                <path className="ln ln-center" d="M10 90 H290" />
                <path className="ln draw d1" d="M20 62 h64 v44 h-64 z" />
                <path className="ln ln-hair draw d1" d="M20 62 l32 24 l32 -24" />
                <path className="ln draw d2" d="M92 90 H118" markerEnd="url(#arr)" />
                <path className="ln draw d2" d="M126 50 h70 l-22 46 v34 h-26 v-34 z" />
                <path className="ln ln-hidden draw d2" d="M140 60 h42" />
                <path className="ln draw d3" d="M204 90 H230" markerEnd="url(#arr)" />
                <path className="ln draw d3" d="M238 68 h16 l6 8 h30 v40 h-52 z" />
                <path className="ln ln-hair draw d3" d="M238 84 h52" />
                <path className="ln ln-dim" d="M20 126 H290" markerStart="url(#tick)" markerEnd="url(#tick)" />
                <text x="155" y="140" className="t t-sm" textAnchor="middle">Per message · time saved recorded per run</text>
              </svg>
              <h3>Inbox triage</h3>
              <p>A message matching a rule is filed to a folder and a note is posted to a channel.</p>
              <div className={s.slots}><span className={s.slot}>{slot(0, "[mail tool]")}</span><span className={s.slot}>{slot(1, "[rules engine]")}</span><span className={s.slot}>{slot(2, "[chat tool]")}</span></div>
            </div>
            <div className={s.pattern} data-dwg>
              <div className={s.phead}><span className={`${s.label} ${s.labelInk}`}>Pattern B-02</span><span className={s.label}>Plan</span></div>
              <svg viewBox="0 0 300 150" aria-label="Form submission written to a ledger row and posted as a chat message">
                <path className="ln ln-center" d="M10 90 H290" />
                <path className="ln draw d1" d="M20 50 h64 v80 h-64 z" />
                <path className="ln ln-hair draw d1" d="M28 62 h48 M28 76 h48 M28 90 h48" />
                <rect x="28" y="106" width="30" height="12" className="fill-ink pop p1" />
                <path className="ln draw d2" d="M92 90 H118" markerEnd="url(#arr)" />
                <path className="ln draw d2" d="M126 58 h72 v64 h-72 z" />
                <path className="ln ln-hair draw d2" d="M126 74 h72 M126 90 h72 M126 106 h72 M150 58 v64 M174 58 v64" />
                <path className="ln ln-mark draw d3" d="M126 106 h72 v16 h-72 z" />
                <path className="ln draw d3" d="M206 90 H232" markerEnd="url(#arr)" />
                <path className="ln draw d3" d="M240 64 h50 v36 h-32 l-10 10 v-10 h-8 z" />
                <path className="ln ln-hair draw d3" d="M250 76 h30 M250 86 h20" />
                <path className="ln ln-dim" d="M20 140 H290" markerStart="url(#tick)" markerEnd="url(#tick)" />
              </svg>
              <h3>Form to ledger to channel</h3>
              <p>A form submission becomes a row in a sheet, then a message with the row&apos;s key fields.</p>
              <div className={s.slots}><span className={s.slot}>{slot(3, "[form tool]")}</span><span className={s.slot}>{slot(4, "[sheet]")}</span><span className={s.slot}>{slot(2, "[chat tool]")}</span></div>
            </div>
            <div className={s.pattern} data-dwg>
              <div className={s.phead}><span className={`${s.label} ${s.labelInk}`}>Pattern C-03</span><span className={s.label}>Section</span></div>
              <svg viewBox="0 0 300 150" aria-label="Clock triggering a server to write to an archive box">
                <path className="ln ln-center" d="M10 90 H290" />
                <path className="ln draw d1" d="M52 90 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0" />
                <path className="ln draw d1" d="M52 90 V68 M52 90 L66 98" />
                <path className="ln ln-hair draw d1" d="M52 62 v4 M52 114 v4 M24 90 h4 M76 90 h4" />
                <path className="ln draw d2" d="M92 90 H118" markerEnd="url(#arr)" />
                <path className="ln draw d2" d="M126 46 h60 v88 h-60 z" />
                <path className="ln ln-hair draw d2" d="M126 68 h60 M126 90 h60 M126 112 h60" />
                <path className="ln ln-hair draw d2" d="M134 57 h4 M134 79 h4 M134 101 h4 M134 123 h4" />
                <path className="ln draw d3" d="M194 90 H220" markerEnd="url(#arr)" />
                <path className="ln draw d3" d="M228 76 h62 v48 h-62 z" />
                <path className="ln draw d3" d="M224 64 h70 v12 h-70 z" />
                <path className="ln ln-hair draw d3" d="M250 96 h18" />
                <path className="ln ln-hidden draw d3" d="M236 84 h46 v32 h-46 z" />
                <path className="ln ln-dim" d="M20 140 H290" markerStart="url(#tick)" markerEnd="url(#tick)" />
              </svg>
              <h3>Nightly archive</h3>
              <p>A cron line runs a script on a schedule and writes the result to cold storage.</p>
              <div className={s.slots}><span className={s.slot}>cron</span><span className={s.slot}>[shell]</span><span className={s.slot}>[storage]</span></div>
            </div>
          </div>
        </section>

        {/* 05 cited */}
        <section>
          <div className={s.secHead}>
            <div className={s.no}>05</div>
            <div>
              <h2>Built to be cited.</h2>
              <p className={s.lede}>Every published page is rendered on the server, structured as a HowTo, and mirrored into plain text for machines. No accounts, no author, no handle. The record is the whole story.</p>
            </div>
          </div>
          <div className={s.cited}>
            <div className={s.spec}>
              <div className={s.li}><div className={s.k}>5.1</div><div><h3>Summary first, always.</h3><p>The one-sentence summary sits directly under the title as its own paragraph, before any navigation or chrome.</p></div></div>
              <div className={s.li}><div className={s.k}>5.2</div><div><h3>HowTo on every automation.</h3><p>Name, description, total time as an ISO duration, tools, and each step as a HowToStep. Generated from the record by one typed builder.</p></div></div>
              <div className={s.li}><div className={s.k}>5.3</div><div><h3>Permanent slugs.</h3><p>A slug is assigned at publish and never derived from the title again. A citation made today resolves next year.</p></div></div>
              <div className={s.li}><div className={s.k}>5.4</div><div><h3><Link href="/llms.txt">llms.txt</Link> and <Link href="/llms-full.txt">llms-full.txt</Link>.</h3><p>A static index plus a full mirror generated from published records, payloads included.</p></div></div>
            </div>
            <div className={s.code}>
              <div className={s.bar}><span>application/ld+json</span><span>{sample ? "Generated from the latest record" : "Generated, not hand-written"}</span></div>
              <pre>{sample ?? `{\n  "@context": "https://schema.org",\n  "@type": "HowTo",\n  "name": "[title]",\n  "description": "[summary]",\n  "totalTime": "PT[n]M",\n  "tool": [{ "@type": "HowToTool", "name": "[tool]" }],\n  "step": [{ "@type": "HowToStep", "position": 1, "name": "[action]" }]\n}`}</pre>
              <div className={s.note}><span>No author field. By design.</span><span>Schema.org HowTo</span></div>
            </div>
          </div>

          <div className={s.modes}>
            <div className={s.mode}>
              <div className={s.mhead}><span className={`${s.label} ${s.labelInk}`}>Human mode</span><span className={s.label}>Default</span></div>
              <svg viewBox="0 0 520 200" aria-label="Wireframe of the record in human mode with prose and context">
                <rect x="0" y="0" width="520" height="200" className="ln ln-hair" />
                <rect x="24" y="24" width="220" height="14" className="fill-ink" />
                <rect x="24" y="50" width="300" height="6" className="fill-soft" />
                <rect x="24" y="62" width="260" height="6" className="fill-soft" />
                <rect x="24" y="86" width="472" height="5" className="fill-line" />
                <rect x="24" y="97" width="440" height="5" className="fill-line" />
                <rect x="24" y="108" width="460" height="5" className="fill-line" />
                <rect x="24" y="130" width="200" height="5" className="fill-line" />
                <rect x="24" y="141" width="180" height="5" className="fill-line" />
                <rect x="280" y="130" width="216" height="46" className="ln" />
              </svg>
              <p>Prose, context, framing. The record reads like a well-kept engineering note.</p>
            </div>
            <div className={s.mode}>
              <div className={s.mhead}><span className={`${s.label} ${s.labelInk}`}>Agent mode</span><span className={s.label}>Same record</span></div>
              <svg viewBox="0 0 520 200" aria-label="Wireframe of the record in agent mode with dense fields and raw JSON-LD">
                <rect x="0" y="0" width="520" height="200" className="ln ln-hair" />
                <rect x="24" y="20" width="160" height="10" className="fill-ink" />
                <rect x="24" y="36" width="472" height="6" className="fill-soft" />
                <path className="ln ln-hair" d="M24 54 H496" />
                <text x="24" y="70" className="t t-sm">prerequisites</text>
                <rect x="24" y="76" width="140" height="4" className="fill-ink-3" />
                <text x="200" y="70" className="t t-sm">steps</text>
                <rect x="200" y="76" width="120" height="4" className="fill-ink-3" />
                <rect x="200" y="84" width="100" height="4" className="fill-ink-3" />
                <text x="360" y="70" className="t t-sm">failure modes</text>
                <rect x="360" y="76" width="120" height="4" className="fill-ink-3" />
                <rect x="24" y="104" width="472" height="40" className="ln" />
                <text x="30" y="114" className="t t-sm">payload</text>
                <rect x="24" y="152" width="472" height="32" className="ln ln-mark" />
                <text x="30" y="162" className="t t-mark t-sm">json-ld · copy</text>
              </svg>
              <p>Strips to summary, prerequisites, steps, payload, failure modes, and raw JSON-LD. Same HTML from the server. Presentation only. Flip it in the header.</p>
            </div>
          </div>
        </section>

        {/* 06 submit */}
        <section className={s.submit}>
          <div>
            <div className={s.eyebrow}><span className={s.dash} /><span className={`${s.label} ${s.labelInk}`}>06 · Submit</span></div>
            <h2>Submit one. Leave the name blank.</h2>
            <p className={s.lede}>Describe the automation, paste the payload, done. An email is optional and is only ever used to reply. It is never rendered, never in the sitemap, never in the record. Every submission is reviewed by hand before it is published.</p>
            <div className={s.ctas}><Link href="/submit" className={`${s.btn} ${s.btnPrimary}`}>Submit anonymously</Link><Link href="/automations" className={`${s.btn} ${s.btnGhost}`}>See what gets published</Link></div>
          </div>
          <div className={s.tblock}>
            <div className={s.wide}><span className={s.tk}>Project</span><div className={s.tv}>automationsanonymous.com</div></div>
            <div><span className={s.tk}>Drawn by</span><div className={`${s.tv} ${s.blank}`}>name</div></div>
            <div><span className={s.tk}>Checked by</span><div className={s.tv}>Review queue</div></div>
            <div><span className={s.tk}>Status</span><div className={s.tv}>Pending</div></div>
            <div><span className={s.tk}>Origin</span><div className={s.tv}>Submitted</div></div>
            <div><span className={s.tk}>Slug</span><div className={s.tv}>Assigned at publish</div></div>
            <div><span className={s.tk}>Reply to</span><div className={s.tv}>Optional</div></div>
          </div>
        </section>

        <footer className={s.foot}>
          <div><span>Title block</span><b>automationsanonymous.com</b><span>Working digital automations, submitted anonymously, reviewed by hand.</span></div>
          <div><span>Sheet</span><b>01 of {automations.length + 1}</b></div>
          <div><span>Rev</span><b>A</b></div>
          <div><span>Scale</span><b>NTS</b></div>
          <div><span>Index</span>{NAV.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}<Link href="/llms.txt">llms.txt</Link></div>
        </footer>
      </div>
    </main>
  );
}
