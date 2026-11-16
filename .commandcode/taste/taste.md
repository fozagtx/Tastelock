# Taste

## Stack & Architecture
- Use full-stack Next.js for web apps (UI + API routes in one Next.js app), not a separate Vite frontend + Fastify/Express API split. Confidence: 0.95

## Deployment & Naming
- Hosted deploys must use a project/domain name derived from the project's own name (e.g. `tastelock.vercel.app`) — never accept the platform's auto-generated default name, random suffix, or unrelated animal-word name. Confidence: 0.6

## Testing & Code
- Never use mocks in code or tests — no MockProvider, no fixtures, no fake services. Always use real integrations (e.g., real SERV API, real HydraDB). Confidence: 0.95
