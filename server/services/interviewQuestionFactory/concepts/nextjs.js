import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Next.js";

export const nextjsConcepts = buildTechConcepts(T, [
  {
    name: "App Router vs Pages Router",
    beginner: "app/ directory uses layouts, server components by default.",
    intermediate: "pages/ legacy getServerSideProps/getStaticProps patterns.",
    advanced: "Migrate incrementally; route groups (folder) don't affect URL.",
    mcq: builders.mcq(T, "router", "Default component type in app/?", ["Client only", "Server Component", "Class"], "Server Component", "Use 'use client' when needed."),
  },
  {
    name: "SSR SSG and ISR",
    beginner: "SSR renders per request; SSG at build; ISR revalidates on interval.",
    intermediate: "export const revalidate = 60 for ISR pages.",
    advanced: "Choose based on freshness vs load — not everything needs SSR.",
    scenario: builders.scenario(T, "render", "Product page TTFB slow globally.", "Move to SSG+ISR; edge cache; optimize data fetching.", "Measure p95 TTFB."),
  },
  {
    name: "Server Components and data fetching",
    beginner: "Fetch in Server Components avoids client bundle bloat.",
    intermediate: "Parallel fetch with Promise.all in layout/page.",
    advanced: "Don't pass non-serializable props to client components.",
    coding: builders.coding(T, "Fetch dashboard data in App Router — where?", "Server Component async page fetching DB directly or via service.", "No useEffect waterfall.", "", "O(1) network", "O(1)"),
  },
  {
    name: "hydration mismatches",
    beginner: "Server HTML must match client render on first paint.",
    intermediate: "Date/random in render causes mismatch — gate with useEffect or suppressHydrationWarning sparingly.",
    advanced: "Third-party widgets may need dynamic import ssr:false.",
    debug: builders.debug(T, "hydration", "Text content did not match warning.", ["Client-only data in initial render", "Delete node_modules", "Disable SSR"], "Client-only data in initial render", "Reproduce with view-source vs client."),
  },
  {
    name: "Next.js caching and revalidation",
    beginner: "fetch() cache in App Router; tags for on-demand revalidate.",
    intermediate: "revalidatePath / revalidateTag after mutations.",
    advanced: "Understand default no-store vs force-cache per route segment.",
    why: "Next 13+ interview focus.",
  },
  {
    name: "API routes and Route Handlers",
    beginner: "app/api/*/route.ts exports GET POST handlers.",
    intermediate: "Edge runtime vs Node runtime trade-offs.",
    advanced: "Don't expose secrets in edge-incompatible libs.",
    coding: builders.coding(T, "POST route handler validating webhook signature?", "Read raw body, HMAC verify, then parse JSON.", "Body parser order matters.", "", "O(1)", "O(1)"),
  },
  {
    name: "authentication patterns",
    beginner: "NextAuth/Auth.js for OAuth and sessions.",
    intermediate: "Middleware protects routes matching config.matcher.",
    advanced: "Session strategy: JWT vs database sessions.",
    scenario: builders.scenario(T, "auth", "Protected page flashes logged-out UI.", "middleware.ts redirect; avoid client-only guard flash.", "SSR session read."),
  },
  {
    name: "Image and font optimization",
    beginner: "next/image lazy loads and serves WebP/AVIF.",
    intermediate: "Fill vs fixed sizes; priority for LCP image.",
    advanced: "Remote patterns in next.config for CDN domains.",
    why: "Core Web Vitals interviews.",
  },
  {
    name: "middleware and edge",
    beginner: "middleware.ts runs before routes; geo, auth, redirects.",
    intermediate: "Edge limits — no Node fs; use Web APIs.",
    advanced: "Matcher patterns avoid running on static assets.",
    why: "Production routing.",
  },
  {
    name: "deployment on Vercel",
    beginner: "Git push triggers preview/production deployments.",
    intermediate: "Environment variables per environment.",
    advanced: "Serverless function duration limits — offload long jobs.",
    bestPractice: { question: "When not to use Vercel serverless?", answer: "Long-running WebSockets or heavy CPU without dedicated Node server.", explanation: "Platform constraints." },
  },
  {
    name: "SEO and metadata API",
    beginner: "export const metadata = { title, description }.",
    intermediate: "generateMetadata async from params for dynamic pages.",
    advanced: "OpenGraph images via file-based or dynamic OG routes.",
    why: "Marketing pages.",
  },
  {
    name: "performance and bundle size",
    beginner: "Analyze bundle with @next/bundle-analyzer.",
    intermediate: "Dynamic import heavy charts/editors.",
    advanced: "React Server Components reduce client JS.",
    scenario: builders.scenario(T, "perf", "Lighthouse TBT high on landing.", "Audit client components; code-split; defer third-party scripts.", "RUM vs lab."),
  },
]);
