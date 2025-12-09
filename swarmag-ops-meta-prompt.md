# swarmAg System - Meta Architecture Prompt

_This is the original meta prompt used to initiate the system design and project plan located in
project/_

Domain & system meta-gen-AI prompt to create an architecture.md gen-AI prompt to generate the software foundation.

## Task

Write an architecture.md document for a software system with an desktop feature-set and a mobile app feature-set to be used by gen-AI developer tools to create the software foundation, including: naming conventions, coding style, asset directory structure, configurations, devops, build (dev & prod), packaging, deployment (host, monitor), models, runtimes, etc.

## Role

You are a software architect ensuring the project is completed according to contemporary best practices. I am an 40 year veteran of the software industry and your co-architect.

## Purpose

This is a system to support the administration and operations of an agricultural services start-up. Scan the site https://swarmag.com for an understanding of the start-up.

Key points: essentially 2 classes of services: aerial services and ground services. Services employ expensive and complex machinery, vehicles, equipment, tools, chemicals, and workflows. Safety, efficiency, repeatability, and performance are underlying first principles of the services. The system quality is measured against these principles.

## Constraints

1. Work within the tech stack. Minimize additional frameworks & services not prescribed.
2. Zero cost deployment. As both an exercise in feasibility and a genuine budget necessity.

## Domain Model

### Service

Service is a listed-product that represents something we sell with a SKU. Services are part of a category (aerial, ground); have a description; an inventory of assets required (machines, tools, supplies, workers).

Many services require the use of Regulated Chemicals. We must manage the acquisition, storage, mixing, and application of chemicals to maintain our license.

Service Category is type of service we offer (aerial-drone-service, ground-machinery-service). A Service Category has one or more Workflows suitable to the category.

### Workflow & Tasks

Workflow may be composed of a graph of Tasks of which a Workflow is one kind (Composite). For example "Drone Chemical Prep", "Mesquite Chemical Prepare", "Mesquite Mitigation Procedure", "Drone Obstacle Preflight". Each Task in a Workflow is either a Note or a Question. Note is static text used to inform and warn Operations. Each Question is constrained as yes-no, one-of, date, time, quantity (real number), or comment. A Workflow informs a Job Assessment.

### Job: Assessment, Plan, & Log

A Job is an aggregate of Assessment, Plan, and Log.

A Job Assessment is an assessment of work to be completed on-behalf of a Customer. Job Assessments define the location(s), price estimate, service(s) (see Service), schedule start, and duration estimate. Once a Job Assessment has been agreed-to (signed obligation) then a Job Plan is created for the Job Assessment.

We use sophisticated multispectral mapping drones for aerial and ground services. A Job Assessment will contain 1 more of these maps to inform the Job Plan and direct the Job Log.

Job Plan is used to define the specialized workflow for a Job Assessment. Job Plans are the primary means to inform the job crew of work to be completed. The Job Plan lists the members of the crew to complete the work. Job Plans detail the physical assets required. Job Plans have a schedule divided into phases (preparation, setup, operations, clean-up, complete, retrospective). Job Phases are composed of one or more Workflows. A Workflow may not span phases to simplify the system. A Job Plan can be structured (phases derived from workflows) or free-form (one-off built by hand).

Job Log memorializes the physical work of executing a Job Plan. The Job Log follows the Job Plan sequentially, capturing photos, GPS coordinates, comments, records actual time accrued and any exceptions or changes made in the field. The Job Log saves any issues or notes about the job _in general_.

### Customer & Contact

Customer has a name, address, Contact(s), note(s), and job history (Job Log).

Contact has a name, email address, phone number, and note(s).

### ADT's

- Note - uuid, when, severity (normal|warning|critical), comment
- Location - uuid, idiomatic address fields
- Coordinate - uuid, latitude, longitude, elevation
- Question - uuid, label, is-required, default-value, type (yes-no|one-of|any-of|date|time|date-time|quantity|comment)
- Answer - question-uuid, when, value

## Features

### Admin Portal (Website)

The Admin Portal is intended to be used from minimally a tablet. So desktop design constraints are acceptable.

The Admin Portal primary is access controlled. There is only 1 authorization level for the admin.
Authentication is authorization simplifying development reducing the feature scope.

The Admin Portal primary screen is a Dashboard containing current and historical Jobs, Equipment, Tools, Chemicals, Crews & Scheduling.

The Admin Portal is the primary CRUD interface for Service Details, Workflow Templates, Equipment & Tool & Chemical Inventories, Crew Memebers, & Job Scheduling.

Some functionality of the Admin Portal may be delegated to the Ops App for job site inputs.

### Operations Application (Mobile)

### Customer Portal (Website)

The customer portal is passwordless. The customer will enter their phone number or email address;
a short-lived access code will be created and delivered to the customer via sms or email.

## Implementation

### Coding Style

- Prefer Typescript as the primary coding language
- Prefer UUID v7 as object/entity universal ID's
- Prefer well-encapsulated, minimalist API's classes/entities
- Use Classes whenever needed. This is not purely functional programming.

### Technology Stack

- Netlify PaaS (Compute, Networking, Block store, HTTPS)
- Supabase PaaS (RDBMS, Auth)
- Docker Containerization
- Typescript Language
- Solid JS Framework
- TanStack Framework
- Kobalte UI Library
- Everything Layout UI Patterns
- Progressive Web App
- JWT, SSO
- github Revision Control

### Deployment Stack

|  Feature Set     |  Endpoint              |  Platform                                     |
|------------------|------------------------|-----------------------------------------------|
|  Operations      |  ops.swarmag.com       |  Netlify, SolidJS, TanStack, Radix UI, Docker |
|  Administration  |  admin.swarmag.com     |  Netlify, SolidJS, TanStack, Radix UI, Docker |
|  Customer        |  customer.swarmag.com  |  Netlify, SolidJS, TanStack, Radix UI, Docker |
|  API             |  api.swarmag.com       |  Netlify, NestJS, Node, JWT, Swagger, Docker  |
|  Data            |  data.swarmag.com      |  supebase, postgreSQL                         |

### Network Diagram

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

### Software

#### Domain Driven

A domain-specialized REST API and abstractions commensurate for the Domain Model.

#### DevOps

Monorepo.

| Package              | Type         | Endpoint          |
|----------------------|--------------|-------------------|
| swarmag-system-ops   | Mobile PWA   | ops.swarmag.com   |
| swarmag-system-admin    | Desktop PWA  | admin.swarmag.com |
| swarmag-system-customer | Website      | me.swarmag.com    |
| swarmag-system-backend  | REST Service | api.swarmag.com   |
