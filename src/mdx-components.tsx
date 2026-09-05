import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/*
  Elements rendered by MDX blog posts. Tokens only. Headings inside a post
  start at h2; the post title is the page h1 in the Sheet frame.
*/
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (p) => <h2 className="mt-major text-2xl" {...p} />,
    h2: (p) => <h2 className="mt-major text-2xl" {...p} />,
    h3: (p) => <h3 className="mt-unit-4 text-xl" {...p} />,
    p: (p) => <p className="mt-unit-2 max-w-[64ch] leading-relaxed" {...p} />,
    a: ({ href = "", ...p }) =>
      href.startsWith("/") ? (
        <Link href={href} className="underline hover:text-mark" {...p} />
      ) : (
        <a href={href} rel="noopener noreferrer" className="underline hover:text-mark" {...p} />
      ),
    ul: (p) => <ul className="mt-unit-2 max-w-[64ch] list-none border-l-hairline pl-unit-2" {...p} />,
    ol: (p) => <ol className="mt-unit-2 max-w-[64ch] list-decimal pl-unit-4" {...p} />,
    li: (p) => <li className="mt-tick" {...p} />,
    blockquote: (p) => <blockquote className="mt-unit-2 border-l-thin border-mark pl-unit-2 text-ink-2" {...p} />,
    code: (p) => <code className="bg-paper-deep px-tick" {...p} />,
    pre: (p) => (
      <pre className="mt-unit-2 overflow-x-auto border-hairline bg-paper-deep p-unit-2 text-[0.75rem] leading-relaxed" {...p} />
    ),
    hr: () => <hr className="my-major border-0 border-t-hairline" />,
    ...components,
  };
}
