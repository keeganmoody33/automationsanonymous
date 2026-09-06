import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Blog posts are MDX under content/blog, imported by src/lib/blog.ts.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The MCP handler serves whatever path it is mounted at, so the route lives
  // at /api/mcp and this gives it the short public address agents expect.
  async rewrites() {
    return [{ source: "/mcp", destination: "/api/mcp" }];
  },
};

// remark-frontmatter strips the YAML block from the rendered output. The
// values are read off disk and validated in src/lib/blog.ts, so nothing has
// to import an MDX module just to list a post. Named as a string so the same
// config works under Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],
  },
});

export default withMDX(nextConfig);
