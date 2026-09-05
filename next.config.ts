import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Blog posts are MDX under content/blog, imported by src/lib/blog.ts.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

// Plugins are named as strings so the same config works under Turbopack.
// remark-mdx-frontmatter exports the YAML block as `frontmatter`, which
// src/lib/blog.ts validates with zod at build time.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter"],
  },
});

export default withMDX(nextConfig);
