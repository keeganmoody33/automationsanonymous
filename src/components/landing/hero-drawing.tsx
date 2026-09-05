/* The exploded assembly from the canvas. Server-rendered; animations start
   when scrolled into view. The Three.js layer sits over it on the client. */
export function HeroDrawing({ timeSaved }: { timeSaved: string }) {
  return (
    <svg viewBox="0 0 640 560" aria-label="Exploded drawing of an automation moving an inbox item through a machine to a notification and a ledger">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="fill-ink" /></marker>
        <marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M2 8L8 2" className="ln ln-dim" /></marker>
      </defs>
      <path className="ln ln-center" d="M20 350 H620" />
      <path className="ln ln-center" d="M335 200 V480" />
      <path className="ln ln-hair ln-faint" d="M40 500 H600" />
      <g className="pop p4">
        <path className="ln ln-dim" d="M40 150 V135 M600 150 V135" />
        <path className="ln ln-dim" d="M40 140 H600" markerStart="url(#tick)" markerEnd="url(#tick)" />
        <rect x="235" y="128" width="170" height="22" className="fill-paper" />
        <text x="320" y="143" className="t t-ink" textAnchor="middle">{timeSaved}</text>
      </g>
      <g className="draw d1">
        <path className="ln" d="M60 380 L80 420 H200 L220 380 Z" />
        <path className="ln ln-hidden" d="M60 380 H220" />
        <path className="ln" d="M84 372 h112 v-40 h-112 z" />
        <path className="ln ln-hair" d="M84 332 l56 34 l56 -34" />
        <path className="ln" d="M92 322 h112 v-8 h-112 z" />
        <path className="ln" d="M100 312 h112 v-8 h-112 z" />
        <path className="ln ln-heavy" d="M60 380 L80 420" />
      </g>
      <g className="draw d2">
        <path className="ln" d="M220 400 H250" markerEnd="url(#arr)" />
        <path className="ln ln-hair" d="M235 392 v16" />
      </g>
      <g className="draw d2">
        <path className="ln ln-heavy" d="M250 250 h170 v170 h-170 z" />
        <path className="ln ln-hidden" d="M262 262 h146 v146 h-146 z" />
        <path className="ln" d="M250 250 l22 -22 h170 v170 l-22 22" />
        <path className="ln" d="M420 250 l22 -22" />
        <path className="ln ln-hair" d="M270 275 h130 M270 285 h130 M270 295 h130" />
        <path className="ln" d="M335 330 m-46 0 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0" />
        <g className="spin">
          <path className="ln" d="M335 330 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0" />
          <path className="ln ln-hair" d="M335 300 V360 M305 330 H365 M314 309 L356 351 M356 309 L314 351" />
          <path className="ln" d="M335 330 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" />
        </g>
        <path className="ln" d="M300 395 h70 v14 h-70 z" />
        <text x="335" y="405" className="t t-sm" textAnchor="middle">Steps 1 to n</text>
      </g>
      <g className="draw d3">
        <path className="ln" d="M292 452 h86 v40 h-86 z" />
        <path className="ln ln-hair" d="M300 462 h50 M300 470 h70 M300 478 h40" />
        <path className="ln ln-hidden" d="M335 420 V452" />
      </g>
      <g className="draw d4">
        <path className="ln" d="M420 300 H470 V236 H500" markerEnd="url(#arr)" />
        <path className="ln" d="M420 380 H472" markerEnd="url(#arr)" />
        <path className="ln" d="M540 236 m-24 0 v-22 a24 24 0 0 1 48 0 v22 z" />
        <path className="ln" d="M508 236 h64" />
        <path className="ln" d="M540 206 v-12" />
        <path className="ln ln-hair" d="M532 244 a8 8 0 0 0 16 0" />
        <path className="ln" d="M482 352 h118 v76 h-118 z" />
        <path className="ln ln-hair" d="M482 371 h118 M482 390 h118 M482 409 h118 M522 352 v76 M562 352 v76" />
        <path className="ln ln-mark" d="M482 409 h118 v19 h-118 z" />
      </g>
      <g className="sweep">
        <path className="ln ln-mark ln-hair" d="M40 170 V495" />
        <path d="M34 170 h12 v10 l-6 6 l-6 -6 z" className="fill-mark" />
        <path d="M34 495 h12 v-10 l-6 -6 l-6 6 z" className="fill-mark" />
        <text x="40" y="164" className="t t-mark t-sm" textAnchor="middle">A</text>
        <text x="40" y="514" className="t t-mark t-sm" textAnchor="middle">A</text>
      </g>
      <g className="balloon pop p1"><path className="ln ln-hair" d="M140 330 L118 268" /><circle cx="112" cy="254" r="13" /><text x="112" y="254">1</text><text x="132" y="258" className="t" style={{ textAnchor: "start" }}>Trigger</text></g>
      <g className="balloon pop p2"><path className="ln ln-hair" d="M335 284 L378 190" /><circle cx="384" cy="176" r="13" /><text x="384" y="176">2</text><text x="404" y="180" className="t" style={{ textAnchor: "start" }}>Steps</text></g>
      <g className="balloon pop p3"><path className="ln ln-hair" d="M378 472 L440 500" /><circle cx="454" cy="504" r="13" /><text x="454" y="504">3</text><text x="474" y="508" className="t" style={{ textAnchor: "start" }}>Payload</text></g>
      <g className="balloon pop p4"><path className="ln ln-hair" d="M560 350 L580 300" /><circle cx="586" cy="286" r="13" /><text x="586" y="286">4</text><text x="606" y="290" className="t" style={{ textAnchor: "start" }}>Result</text></g>
      <path className="ln ln-hair" d="M12 548 h16 M20 540 v16" />
      <text x="32" y="552" className="t t-sm">0,0</text>
    </svg>
  );
}
