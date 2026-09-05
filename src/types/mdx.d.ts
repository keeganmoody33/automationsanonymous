declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  /** YAML frontmatter, exported by remark-mdx-frontmatter. Unvalidated here; see src/lib/blog.ts. */
  export const frontmatter: unknown;
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
