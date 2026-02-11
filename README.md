<img src="https://raw.githubusercontent.com/Prakkie91/jobo-node/main/jobo-logo.png" alt="Jobo" width="120" />

# Jobo Enterprise — Node.js / TypeScript Client

**Access millions of job listings from 45+ ATS platforms with a single API.**  
Build job boards, power job aggregators, or sync ATS data — Greenhouse, Lever, Workday, iCIMS, and more.

[![npm](https://img.shields.io/npm/v/jobo-enterprise)](https://www.npmjs.com/package/jobo-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why Jobo Enterprise?

- **45+ ATS integrations** — Greenhouse, Lever, Workday, iCIMS, SmartRecruiters, BambooHR, Ashby, and many more
- **Bulk feed endpoint** — Cursor-based pagination to sync millions of jobs efficiently
- **Real-time search** — Full-text search with location, remote, and source filters
- **Expired job sync** — Keep your job board fresh by removing stale listings
- **Fully typed** — First-class TypeScript support with complete type definitions
- **Zero dependencies** — Uses built-in `fetch` (Node 18+, Bun, Deno, browsers)

> **Get your API key** → [enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)
>
> **Learn more** → [jobo.world/enterprise](https://jobo.world/enterprise/)

---

## Installation

```bash
npm install jobo-enterprise
# or
yarn add jobo-enterprise
# or
pnpm add jobo-enterprise
```

## Quick Start

```typescript
import { JoboClient } from "jobo-enterprise";

const client = new JoboClient({ apiKey: "your-api-key" });

// Search for software engineering jobs from Greenhouse
const results = await client.searchJobs({
  q: "software engineer",
  location: "San Francisco",
  sources: "greenhouse,lever",
});

for (const job of results.jobs) {
  console.log(`${job.title} at ${job.company.name} — ${job.listing_url}`);
}
```

## Authentication

Get your API key at **[enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)**.

All requests require an API key passed via the `X-Api-Key` header. The client handles this automatically:

```typescript
const client = new JoboClient({ apiKey: "your-api-key" });
```

## Usage

### Search Jobs (Simple)

Search jobs with query parameters — ideal for building job board search pages:

```typescript
const results = await client.searchJobs({
  q: "data scientist",
  location: "New York",
  sources: "greenhouse,lever",
  remote: true,
  page: 1,
  pageSize: 50,
});

console.log(`Found ${results.total} jobs across ${results.total_pages} pages`);
for (const job of results.jobs) {
  console.log(`  ${job.title} at ${job.company.name} — ${job.listing_url}`);
}
```

### Search Jobs (Advanced)

Use the advanced endpoint for multiple queries and locations:

```typescript
const results = await client.searchJobsAdvanced({
  queries: ["machine learning engineer", "ML engineer", "AI engineer"],
  locations: ["San Francisco", "New York", "Remote"],
  sources: ["greenhouse", "lever", "ashby"],
  isRemote: true,
  pageSize: 100,
});
```

### Auto-Paginated Search

Iterate over all matching jobs without managing pagination:

```typescript
for await (const job of client.iterSearchJobs({
  queries: ["backend engineer"],
  locations: ["London"],
  pageSize: 100,
})) {
  console.log(`${job.title} — ${job.company.name}`);
}
```

### Bulk Jobs Feed

Fetch large batches of active jobs using cursor-based pagination — perfect for building a job aggregator or syncing to your database:

```typescript
import { JoboClient, LocationFilter } from "jobo-enterprise";

const response = await client.getJobsFeed({
  locations: [
    { country: "US", region: "California" },
    { country: "US", city: "New York" },
  ],
  sources: ["greenhouse", "workday"],
  isRemote: true,
  batchSize: 1000,
});

console.log(`Got ${response.jobs.length} jobs, has_more=${response.has_more}`);

// Continue with cursor
if (response.has_more) {
  const next = await client.getJobsFeed({
    cursor: response.next_cursor,
    batchSize: 1000,
  });
}
```

### Auto-Paginated Feed

Stream all jobs without managing cursors:

```typescript
for await (const job of client.iterJobsFeed({ batchSize: 1000, sources: ["greenhouse"] })) {
  await saveToDatabase(job);
}
```

### Expired Job IDs

Keep your job board fresh by syncing expired listings:

```typescript
const expiredSince = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

for await (const jobId of client.iterExpiredJobIds({ expiredSince })) {
  await markAsExpired(jobId);
}
```

## Error Handling

The client throws typed errors for different scenarios:

```typescript
import {
  JoboClient,
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
  JoboError,
} from "jobo-enterprise";

try {
  const results = await client.searchJobs({ q: "engineer" });
} catch (error) {
  if (error instanceof JoboAuthenticationError) {
    console.error("Invalid API key — get one at https://enterprise.jobo.world/api-keys");
  } else if (error instanceof JoboRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof JoboValidationError) {
    console.error(`Bad request: ${error.detail}`);
  } else if (error instanceof JoboServerError) {
    console.error("Server error — try again later");
  } else if (error instanceof JoboError) {
    console.error(`Unexpected error: ${error.message}`);
  }
}
```

## Types

All response data is fully typed. Key interfaces:

| Type | Description |
|---|---|
| `Job` | A job listing with title, company, locations, compensation, etc. |
| `JobCompany` | Company ID and name |
| `JobLocation` | City, state, country, coordinates |
| `JobCompensation` | Min/max salary, currency, period |
| `LocationFilter` | Structured filter for feed endpoint |
| `JobFeedResponse` | Feed response with cursor pagination |
| `ExpiredJobIdsResponse` | Expired job IDs with cursor pagination |
| `JobSearchResponse` | Search response with page-based pagination |

## Supported ATS Sources (45+)

Filter jobs by any of these applicant tracking systems:

| Category | Sources |
|---|---|
| **Enterprise ATS** | `workday`, `smartrecruiters`, `icims`, `successfactors`, `oraclecloud`, `taleo`, `dayforce`, `csod` (Cornerstone), `adp`, `ultipro`, `paycom` |
| **Tech & Startup** | `greenhouse`, `lever_co`, `ashby`, `workable`, `workable_jobs`, `rippling`, `polymer`, `gem`, `pinpoint`, `homerun` |
| **Mid-Market** | `bamboohr`, `breezy`, `jazzhr`, `recruitee`, `personio`, `jobvite`, `teamtailor`, `comeet`, `trakstar`, `zoho` |
| **SMB & Niche** | `gohire`, `recooty`, `applicantpro`, `hiringthing`, `careerplug`, `hirehive`, `kula`, `careerpuck`, `talnet`, `jobscore` |
| **Specialized** | `freshteam`, `isolved`, `joincom`, `eightfold`, `phenompeople` (via `eightfold`) |

> Pass source identifiers in the `sources` parameter, e.g. `sources: ["greenhouse", "lever_co", "workday"]`

## Configuration

| Option | Default | Description |
|---|---|---|
| `apiKey` | *required* | Your Jobo Enterprise API key ([get one here](https://enterprise.jobo.world/api-keys)) |
| `baseUrl` | `https://jobs-api.jobo.world` | API base URL |
| `timeout` | `30000` | Request timeout in milliseconds |
| `fetch` | `globalThis.fetch` | Custom fetch implementation |

## Requirements

- **Node.js 18+** (uses built-in `fetch`)
- Also works in **Bun**, **Deno**, and modern browsers

## Use Cases

- **Build a job board** — Search and display jobs from 45+ ATS platforms
- **Job aggregator** — Bulk-sync millions of listings with the feed endpoint
- **ATS data pipeline** — Pull jobs from Greenhouse, Lever, Workday, etc. into your data warehouse
- **Recruitment tools** — Power candidate-facing job search experiences
- **Market research** — Analyze hiring trends across companies and industries

## Development

```bash
git clone https://github.com/Prakkie91/jobo-node.git
cd jobo-node
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Publishing to npm

```bash
# Ensure you're logged in
npm login

# Bump version (patch/minor/major)
npm version patch

# Build and publish
npm run build
npm publish

# Push tags to GitHub
git push origin main --tags
```

## Pushing to GitHub

```bash
# Initial setup (one-time)
git remote set-url origin https://github.com/Prakkie91/jobo-node.git

# Push
git add -A
git commit -m "release: v$(node -p 'require(\"./package.json\").version')"
git push origin main
```

## Links

- **Website** — [jobo.world/enterprise](https://jobo.world/enterprise/)
- **Get API Key** — [enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)
- **GitHub** — [github.com/Prakkie91/jobo-node](https://github.com/Prakkie91/jobo-node)
- **npm** — [npmjs.com/package/jobo-enterprise](https://www.npmjs.com/package/jobo-enterprise)

## License

MIT — see [LICENSE](LICENSE).
