# Data Lists

Canonical lists used to seed and align catalog data (services, asset types).
Service SKUs and asset types should stay in sync with `source/domain` and any persisted records.

## 1. Services

## 2. Aerial Drone Services

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

## 3. Ground Machinery Services

| Description                        | Equipment            | SKU        |
| ---------------------------------- | -------------------- | ---------- |
| Mesquite, Hackberry, et al Removal | John Deere Skidsteer | G-MITI-01  |
| Fence-line Tree Trimming           | Bobcat Toolcat       | G-FENCE-01 |
| Rock Removal, Regrade              | Skidsteer, Toolcat   | G-MACH-01  |
| Brush Hogging                      | Skidsteer, Toolcat   | G-BRUSH-01 |

## 4. Asset Types

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

## 5. Internal Questions

Canonical `Question` instances with `type = 'internal'` used for system-generated telemetry and operational log entries.
These are seed data and are referenced by `JobWorkLogEntry.answer.questionId`.
The Key is the `Question.prompt` value — for internal questions it serves as both the display value and machine-readable identifier.

| Key (Question.prompt)                    | Answer Type |
| ---------------------------------------- | ----------- |
| telemetry.gps.latitude                   | number      |
| telemetry.gps.longitude                  | number      |
| telemetry.gps.altitude                   | number      |
| telemetry.gps.accuracy                   | number      |
| telemetry.battery.percent                | number      |
| telemetry.battery.voltage                | number      |
| telemetry.environment.temperatureCelsius | number      |
| telemetry.environment.windSpeedMph       | number      |
| telemetry.environment.windDirection      | text        |
| telemetry.environment.humidityPercent    | number      |
| execution.durationSeconds                | number      |
| execution.crewCount                      | number      |
| response.skipped                         | boolean     |
| response.skipReason                      | text        |
