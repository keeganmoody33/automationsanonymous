// Session replay never runs where someone types a submission or where the
// operator works. Inputs are masked everywhere else too.
const NO_REPLAY_PREFIXES = ["/submit", "/admin"];

export function isNoReplayPath(pathname: string): boolean {
  return NO_REPLAY_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
