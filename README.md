# Jobo Enterprise Node.js Client

Official TypeScript/Node.js client library for the [Jobo Enterprise Jobs API](https://api.jobo.ai). Access millions of job listings from 15+ ATS platforms including Greenhouse, Lever, Workday, SmartRecruiters, and more.

[![npm](https://img.shields.io/npm/v/jobo-enterprise)](https://www.npmjs.com/package/jobo-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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

const results = await client.searchJobs({ q: "software engineer", location: "San Francisco" });
for (const job of results.jobs) {
  console.log(`${job.title} at ${job.company.name}`);
}
```

## Authentication

All API requests require an API key passed via the `X-Api-Key` header. The client handles this automatically:

```typescript
const client = new JoboClient({ apiKey: "your-api-key" });
```

For self-hosted deployments:

```typescript
const client = new JoboClient({
  apiKey: "your-api-key",
  baseUrl: "https://your-instance.example.com",
});
```

## Usage

### Job Search (Simple)

Search jobs with simple query parameters:

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

### Job Search (Advanced)

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

### Jobs Feed (Bulk)

Fetch large batches of active jobs using cursor-based pagination:

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
  await processJob(job);
}
```

### Expired Job IDs

Sync expired jobs to keep your data fresh:

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
    console.error("Invalid API key");
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

## Supported Sources

| Category | Sources |
|---|---|
| **Tech/Startup** | `greenhouse`, `lever`, `ashby`, `workable`, `rippling`, `polymer` |
| **Enterprise** | `workday`, `smartrecruiters` |
| **SMB** | `bamboohr`, `breezy`, `jazzhr`, `recruitee`, `personio` |

## Configuration

| Option | Default | Description |
|---|---|---|
| `apiKey` | *required* | Your Jobo Enterprise API key |
| `baseUrl` | `https://api.jobo.ai` | API base URL |
| `timeout` | `30000` | Request timeout in milliseconds |
| `fetch` | `globalThis.fetch` | Custom fetch implementation |

## Requirements

- **Node.js 18+** (uses built-in `fetch`)
- Also works in Bun, Deno, and modern browsers

## Development

```bash
git clone https://github.com/jobo-ai/jobo-node.git
cd jobo-node
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT — see [LICENSE](LICENSE).
