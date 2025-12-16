# Data Lists

Canonical lists used to seed and align catalog data (services, asset types). Service SKUs and asset types should stay in sync with `source/domain` and any persisted records.

## Services

## Aerial Drone Services

| Description                    | Equipment | SKU        |
| ------------------------------ | --------- | ---------- |
| Pesticide, Herbicide           | XAG P150  | A-CHEM-01  |
| Fertilizer                     | XAG P150  | A-CHEM-02  |
| Seed                           | XAG P150  | A-SEED-01  |
| Pond Weeds & Algae             | DJI T30   | A-CHEM-03  |
| Pond Feeding                   | DJI T30   | A-FEED-01  |
| Precision Mapping              | DJI P4    | A-MAP-01   |
| Mesquite Herbicide             | XAG P150  | A-CHEM-04  |
| Commercial Greenhouse Painting | DJI T30   | A-PAINT-01 |

## Ground Machinery Services

| Description                         | Equipment              | SKU        |
| ----------------------------------- | ---------------------- | ---------- |
| Mesquite, Hackberry, et al Removal  | John Deere Skidsteer   | G-MITI-01  |
| Fence-line Tree Trimming            | Bobcat Toolcat         | G-FENCE-01 |
| Rock Removal, Regrade               | Skidsteer, Toolcat     | G-MACH-01  |
| Brush Hogging                       | Skidsteer, Toolcat     | G-BRUSH-01 |

## Asset Types

| Description             |
| ----------------------- |
| Transport Truck         |
| Transport Trailer       |
| Skidsteer Vehicle       |
| Toolcat Vehicle         |
| Vehicle Tool Attachment |
| Mapping Drone           |
| Dispensing Drone        |
| Drone Spray Tank        |
| Drone Granular Hopper   |

## Author Attribution Roles

Curated roles used for authorship/attribution (`Author.role` in the domain). These should stay in sync with `AUTHOR_ATTRIBUTION_ROLES` in `source/domain/common.ts`.

| Role ID            | Label               | Contexts                                 |
| ------------------ | ------------------- | ---------------------------------------- |
| account-executive  | Account Executive   | customer-account                         |
| assessment-lead    | Assessment Lead     | job-assessment, job plan                 |
| crew-lead          | Crew Lead           | job-plan, job-log                        |
| crew-operator      | Crew Operator       | job-log                                  |
| crew

