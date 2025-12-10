# swarmAg System - Architecture

The definitive architecture document for the swarmAg System.

## 1. Executive summary

The **swarmAg System** is composed of SolidJS web and mobile applications orchestrated via a serverless api (functions backend).
It supports administration, operations workflows & logs, and customer-facing features for agricultural services that involve regulated chemicals and industrial equipment.

### Core Platforms

- **Netlify** — frontends, functions compute, DNS, SSL  
- **Supabase** — Postgres, Auth, Storage, Realtime  
- **GitHub Actions** — CI/CD  
- **SolidJS + TanStack + Kobalte + vanilla CSS** — UI platform  

## 2. Goals, constraints, and guiding principles

- Offline-Capable PWA  
- Append-only logs  
- Zero-cost infrastructure  
- TypeScript ontology  

## 3. System overview

Components: Ops PWA, Admin Portal, Customer Portal, API Functions, Supabase Data.

```text
       ┌─────────────────┐
       │ ops.swarmag.com │─────╮
       └─────────────────┘     │
     ┌───────────────────┐     │
     │ admin.swarmag.com │─────│
     └───────────────────┘     │
        ┌────────────────┐     │
        │ me.swarmag.com │─────│
        └────────────────┘     │
                               ▼
                        ┌─────────────────┐
                     ╭──│ api.swarmag.com │
                     ▼  └─────────────────┘
            ┌──────────────────┐
            │ data.swarmag.com │
            └──────────────────┘
```

## 4. Domain model summary

Entities: Service, Asset, Chemical, Workflow, JobAssessment, JobPlan, JobLog, Customer, Contact.

## 5. API design

Netlify Functions for REST, Supabase Edge Functions for async workflows.

## 6. Coding conventions & UI

SolidJS, Kobalte, & vanilla CSS

## 7. Repository layout

See `orchestration.md` for the detailed monorepo structure.

## 8. Build, CI/CD, Deployment

- GitHub Actions for CI/CD.  
- Netlify for builds and deploys.  
- Supabase for schema, data, auth, and storage.  
- TypeScript compiler set to `module: ESNext` with `moduleResolution: bundler` so imports and aliases match the bundler/runtime behavior.

## 9. Environment variables

At minimum:

- Supabase: URL, anon key, service role key.  
- Netlify: auth token, site IDs for each app.  
- Optional: Mapbox or similar mapping API key.  

## 10. Offline model (Ops PWA)

- IndexedDB cache.  
- Append-only queue of operations.  
- Background sync via Service Worker.  

## 11. Map pipeline

- Files uploaded to Supabase Storage.  
- Edge Function processes metadata/derivatives.  

## 12. Document storage

- Supabase Storage buckets serve as the shared document store for manuals, job maps, photos, and other binary assets referenced via the `Attachment` domain type.  
- Domain entities only persist attachment metadata (filename, uploader, URL, timestamps) while the files live in storage.  
- Buckets follow a `<context>-attachments` naming convention (e.g., `assets-attachments`, `jobs-attachments`, `assessments-attachments`) with folder paths such as `jobs/{jobId}/photos/*.jpg` or `job-assessments/{assessmentId}/maps/*.tif`.  
- Retention: production buckets keep files indefinitely with lifecycle rules for temporary uploads; preview/staging buckets auto-expire after 30 days.  
- Access: Netlify Functions broker signed URLs for uploads/downloads, while Supabase RLS ensures only authorized users can request those URLs.  

## 13. Security & compliance

- JWT-based auth (Supabase).  
- Row Level Security (RLS) on all key tables.  
- Immutable JobLogs with retention policies.  

## 14. Observability

- Telemetry into Supabase (or equivalent).  
- Error tracking with a service such as Sentry.  

## 15. MVP roadmap

- Foundation → Admin Portal → Ops PWA → Customer Portal

## 16. Compliance & safety

- Digital checklists.  
- Geotagged logs as needed.  

## 17. Implementation recommendations

- Stateless functions.  
- Schema validation at boundaries.  
