# swarmAg System – Data Dictionary

Comprehensive reference for all domain types, interfaces, and data structures defined in `source/domain`.

## 1. Primitives

Source: `source/utilities/identifier.ts`, `source/utilities/datetime.ts`

| Type   | Description                      | Format                     | Generator | Validator  |
| ------ | -------------------------------- | -------------------------- | --------- | ---------- |
| `ID`   | UUID v7 string identifier        | UUID v7 format             | `id()`    | `isID()`   |
| `When` | ISO 8601 UTC timestamp as string | `YYYY-MM-DDTHH:MM:SS.sssZ` | `when()`  | `isWhen()` |

## 2. User and Authorization

Source: `source/domain/user.ts`

### 2.1 User

Represents a user in the system with role memberships and contact information.

| Field          | Type                     | Required | Description                                         |
| -------------- | ------------------------ | -------- | --------------------------------------------------- |
| `id`           | `ID`                     | Yes      | Unique identifier                                   |
| `displayName`  | `string`                 | Yes      | User's display name                                 |
| `primaryEmail` | `string`                 | Yes      | Primary email address                               |
| `phoneNumber`  | `string`                 | Yes      | Phone number                                        |
| `avatarUrl`    | `string`                 | No       | URL to avatar image                                 |
| `roles`        | `UserRole[]`             | No       | Array of role memberships                           |
| `status`       | `'active' \| 'inactive'` | No       | User status (default: `'active'`)                   |
| `createdAt`    | `When`                   | No       | Creation timestamp                                  |
| `updatedAt`    | `When`                   | No       | Last update timestamp                               |
| `deletedAt`    | `When`                   | No       | Soft delete timestamp (undefined/null means active) |

### 2.2 UserRole

Allowed role memberships for users.

| Value           | Description                          |
| --------------- | ------------------------------------ |
| `administrator` | Full system access and configuration |
| `sales`         | Sales and customer management        |
| `operations`    | Field operations and job management  |

### 2.3 Author

Lightweight attribution slice of User with a curated attribution role.

| Field         | Type                      | Required | Description                                   |
| ------------- | ------------------------- | -------- | --------------------------------------------- |
| `id`          | `ID`                      | Yes      | User identifier                               |
| `displayName` | `string`                  | Yes      | User's display name                           |
| `roles`       | `UserRole[]`              | No       | User's role memberships                       |
| `role`        | `AuthorAttributionRoleId` | No       | Curated attribution role for specific context |

### 2.4 AuthorAttributionRole

Curated roles for attribution in specific contexts.

| Role ID             | Label             | Contexts              |
| ------------------- | ----------------- | --------------------- |
| `account-executive` | Account Executive | `customer-account`    |
| `assessment-lead`   | Assessment Lead   | `job-assessment`      |
| `crew-lead`         | Crew Lead         | `job-plan`, `job-log` |
| `field-tech`        | Field Tech        | `job-log`, `asset`    |
| `fleet-manager`     | Fleet Manager     | `asset`               |

## 3. Common Structures

Source: `source/domain/common.ts`

### 3.1 Note

Represents a note or comment with authorship and optional images.

| Field        | Type                     | Required | Description                          |
| ------------ | ------------------------ | -------- | ------------------------------------ |
| `id`         | `ID`                     | Yes      | Unique identifier                    |
| `createdAt`  | `When`                   | Yes      | Creation timestamp                   |
| `author`     | `Author`                 | No       | Author information                   |
| `content`    | `string`                 | Yes      | Note content                         |
| `visibility` | `'internal' \| 'shared'` | No       | Visibility scope                     |
| `tags`       | `string[]`               | No       | Categorization tags                  |
| `images`     | `Attachment[]`           | Yes      | Attached images (can be empty array) |

### 3.2 Coordinate

Geographic coordinates with optional altitude.

| Field            | Type     | Required | Description                  |
| ---------------- | -------- | -------- | ---------------------------- |
| `latitude`       | `number` | Yes      | Latitude in decimal degrees  |
| `longitude`      | `number` | Yes      | Longitude in decimal degrees |
| `altitudeMeters` | `number` | No       | Altitude in meters           |

### 3.3 Address

Physical postal address.

| Field        | Type     | Required | Description        |
| ------------ | -------- | -------- | ------------------ |
| `line1`      | `string` | Yes      | Address line 1     |
| `line2`      | `string` | No       | Address line 2     |
| `city`       | `string` | Yes      | City               |
| `state`      | `string` | Yes      | State or province  |
| `postalCode` | `string` | Yes      | ZIP or postal code |
| `country`    | `string` | Yes      | Country            |

### 3.4 Location

Location with coordinate and optional address.

| Field            | Type         | Required | Description                |
| ---------------- | ------------ | -------- | -------------------------- |
| `coordinate`     | `Coordinate` | Yes      | Geographic coordinates     |
| `address`        | `Address`    | No       | Postal address             |
| `recordedAt`     | `When`       | No       | When location was recorded |
| `accuracyMeters` | `number`     | No       | GPS accuracy in meters     |
| `description`    | `string`     | No       | Human-readable description |

### 3.5 Question

Represents a question in an assessment or form.

| Field      | Type               | Required | Description                        |
| ---------- | ------------------ | -------- | ---------------------------------- |
| `id`       | `ID`               | Yes      | Unique identifier                  |
| `prompt`   | `string`           | Yes      | Question text                      |
| `type`     | `QuestionType`     | Yes      | Type of question                   |
| `helpText` | `string`           | No       | Additional guidance                |
| `required` | `boolean`          | No       | Whether answer is required         |
| `options`  | `QuestionOption[]` | No       | Options for choice-based questions |

### 3.6 QuestionType

Types of questions that can be asked.

| Value           | Description                   |
| --------------- | ----------------------------- |
| `text`          | Free-form text response       |
| `number`        | Numeric response              |
| `boolean`       | Yes/no or true/false response |
| `single-select` | Single choice from options    |
| `multi-select`  | Multiple choices from options |

### 3.7 QuestionOption

An option for a multiple choice question.

| Field          | Type      | Required | Description                       |
| -------------- | --------- | -------- | --------------------------------- |
| `value`        | `string`  | Yes      | Option value                      |
| `label`        | `string`  | No       | Display label                     |
| `requiresNote` | `boolean` | No       | Whether selecting requires a note |

### 3.8 Answer

An answer to a question.

| Field        | Type          | Required | Description               |
| ------------ | ------------- | -------- | ------------------------- |
| `questionId` | `ID`          | Yes      | Question being answered   |
| `value`      | `AnswerValue` | Yes      | Answer value              |
| `capturedAt` | `When`        | Yes      | When answer was captured  |
| `capturedBy` | `Author`      | Yes      | Who captured the answer   |
| `note`       | `Note`        | No       | Optional explanatory note |

`AnswerValue` is `string | number | boolean | string[]`.

### 3.9 Attachment

Represents a file attachment with metadata.

| Field        | Type             | Required | Description           |
| ------------ | ---------------- | -------- | --------------------- |
| `id`         | `ID`             | Yes      | Unique identifier     |
| `filename`   | `string`         | Yes      | Original filename     |
| `url`        | `string`         | Yes      | Storage URL           |
| `kind`       | `AttachmentKind` | Yes      | Type of attachment    |
| `uploadedAt` | `When`           | Yes      | Upload timestamp      |
| `uploadedBy` | `Author`         | Yes      | Who uploaded the file |

### 3.10 AttachmentKind

Types of file attachments.

| Value      | Description         |
| ---------- | ------------------- |
| `photo`    | Photograph or image |
| `video`    | Video file          |
| `map`      | Map file            |
| `document` | Document file       |

## 4. Service

Source: `source/domain/service.ts`

Represents a service offering in the swarmAg system.

| Field                | Type              | Required | Description                           |
| -------------------- | ----------------- | -------- | ------------------------------------- |
| `id`                 | `ID`              | Yes      | Unique identifier                     |
| `name`               | `string`          | Yes      | Service name                          |
| `sku`                | `string`          | Yes      | Stock keeping unit code               |
| `description`        | `string`          | No       | Service description                   |
| `category`           | `ServiceCategory` | Yes      | Service category                      |
| `requiredAssetTypes` | `ID[]`            | Yes      | Asset types required for this service |
| `notes`              | `Note[]`          | No       | Service notes                         |
| `createdAt`          | `When`            | Yes      | Creation timestamp                    |
| `updatedAt`          | `When`            | Yes      | Last update timestamp                 |

### 4.1 ServiceCategory

Categories of services available.

| Value                       | Description                     |
| --------------------------- | ------------------------------- |
| `aerial-drone-services`     | Drone-based aerial services     |
| `ground-machinery-services` | Ground equipment-based services |

## 5. Asset

Source: `source/domain/asset.ts`

Represents equipment and resources used in operations.

| Field          | Type           | Required | Description                |
| -------------- | -------------- | -------- | -------------------------- |
| `id`           | `ID`           | Yes      | Unique identifier          |
| `label`        | `string`       | Yes      | Asset label/name           |
| `description`  | `string`       | No       | Asset description          |
| `serialNumber` | `string`       | No       | Manufacturer serial number |
| `type`         | `ID`           | Yes      | Reference to AssetType     |
| `status`       | `AssetStatus`  | Yes      | Current status             |
| `attachments`  | `Attachment[]` | No       | Photos, manuals, etc.      |
| `createdAt`    | `When`         | Yes      | Creation timestamp         |
| `updatedAt`    | `When`         | Yes      | Last update timestamp      |

### 5.1 AssetType

Type classification for assets.

| Field       | Type      | Required | Description                      |
| ----------- | --------- | -------- | -------------------------------- |
| `id`        | `ID`      | Yes      | Unique identifier                |
| `label`     | `string`  | Yes      | Type label                       |
| `active`    | `boolean` | Yes      | Whether type is currently active |
| `createdAt` | `When`    | Yes      | Creation timestamp               |
| `updatedAt` | `When`    | Yes      | Last update timestamp            |

### 5.2 AssetStatus

Possible statuses an asset can have.

| Value         | Description               |
| ------------- | ------------------------- |
| `active`      | In service and available  |
| `maintenance` | Under maintenance         |
| `retired`     | No longer in service      |
| `reserved`    | Reserved for specific job |

## 6. Chemical

Source: `source/domain/chemical.ts`

Represents chemicals used in operations (herbicides, pesticides, fertilizers, etc.).

| Field                  | Type                                 | Required | Description                        |
| ---------------------- | ------------------------------------ | -------- | ---------------------------------- |
| `id`                   | `ID`                                 | Yes      | Unique identifier                  |
| `name`                 | `string`                             | Yes      | Chemical name                      |
| `epaNumber`            | `string`                             | No       | EPA registration number            |
| `usage`                | `ChemicalUsage`                      | Yes      | Primary usage category             |
| `signalWord`           | `'danger' \| 'warning' \| 'caution'` | No       | EPA signal word                    |
| `restrictedUse`        | `boolean`                            | Yes      | Whether chemical is restricted use |
| `reEntryIntervalHours` | `number`                             | No       | Re-entry interval in hours         |
| `storageLocation`      | `string`                             | No       | Where chemical is stored           |
| `sdsUrl`               | `string`                             | No       | URL to Safety Data Sheet           |
| `labels`               | `ChemicalLabel[]`                    | No       | Product labels and documentation   |
| `attachments`          | `Attachment[]`                       | No       | Related files                      |
| `notes`                | `Note[]`                             | No       | Chemical notes                     |
| `createdAt`            | `When`                               | Yes      | Creation timestamp                 |
| `updatedAt`            | `When`                               | Yes      | Last update timestamp              |

### 6.1 ChemicalUsage

Different usages for chemicals.

| Value        | Description                |
| ------------ | -------------------------- |
| `herbicide`  | Weed control               |
| `pesticide`  | Pest control               |
| `fertilizer` | Nutrient application       |
| `fungicide`  | Fungal disease control     |
| `adjuvant`   | Spray additive or enhancer |

### 6.2 ChemicalLabel

Represents a label or documentation for a chemical.

| Field         | Type     | Required | Description              |
| ------------- | -------- | -------- | ------------------------ |
| `url`         | `string` | Yes      | URL to label document    |
| `description` | `string` | No       | Description of the label |

## 7. Workflow

Source: `source/domain/workflow.ts`

Defines sequenced steps for delivering a service.

| Field               | Type                | Required | Description                     |
| ------------------- | ------------------- | -------- | ------------------------------- |
| `id`                | `ID`                | Yes      | Unique identifier               |
| `serviceId`         | `ID`                | Yes      | Associated service              |
| `name`              | `string`            | Yes      | Workflow name                   |
| `description`       | `string`            | No       | Workflow description            |
| `locationsRequired` | `Location[]`        | No       | Required locations for workflow |
| `versions`          | `WorkflowVersion[]` | Yes      | Versioned workflow definitions  |
| `createdAt`         | `When`              | Yes      | Creation timestamp              |
| `updatedAt`         | `When`              | Yes      | Last update timestamp           |

### 7.1 WorkflowVersion

A version of the workflow with effective dates.

| Field           | Type             | Required | Description                         |
| --------------- | ---------------- | -------- | ----------------------------------- |
| `version`       | `number`         | Yes      | Version number                      |
| `effectiveFrom` | `When`           | Yes      | When this version becomes effective |
| `steps`         | `WorkflowStep[]` | Yes      | Ordered workflow steps              |

### 7.2 WorkflowStep

A step in a workflow with checklists and requirements.

| Field                     | Type         | Required | Description                           |
| ------------------------- | ------------ | -------- | ------------------------------------- |
| `id`                      | `ID`         | Yes      | Unique identifier                     |
| `title`                   | `string`     | Yes      | Step title                            |
| `description`             | `string`     | No       | Step description                      |
| `checklist`               | `Question[]` | Yes      | Checklist questions                   |
| `requiresLocationCapture` | `boolean`    | No       | Whether GPS location must be captured |
| `requiresPhoto`           | `boolean`    | No       | Whether photo must be taken           |
| `notes`                   | `Note[]`     | No       | Step notes                            |

## 8. Job

Source: `source/domain/job.ts`

Jobs represent operational tasks related to services, composed of assessments, plans, and logs.

### 8.1 Job

Core job entity linking assessment and plan.

| Field          | Type        | Required | Description               |
| -------------- | ----------- | -------- | ------------------------- |
| `id`           | `ID`        | Yes      | Unique identifier         |
| `assessmentId` | `ID`        | Yes      | Associated job assessment |
| `planId`       | `ID`        | Yes      | Associated job plan       |
| `serviceId`    | `ID`        | Yes      | Service being performed   |
| `customerId`   | `ID`        | Yes      | Customer for this job     |
| `status`       | `JobStatus` | Yes      | Current job status        |
| `createdAt`    | `When`      | Yes      | Creation timestamp        |
| `updatedAt`    | `When`      | Yes      | Last update timestamp     |

### 8.2 JobStatus

Possible statuses of a job.

| Value         | Description              |
| ------------- | ------------------------ |
| `draft`       | Initial draft state      |
| `ready`       | Ready to be scheduled    |
| `scheduled`   | Scheduled for execution  |
| `in-progress` | Currently being executed |
| `completed`   | Successfully completed   |
| `cancelled`   | Cancelled                |

### 8.3 JobAssessment

Initial evaluation of a prospective job.

| Field         | Type                        | Required | Description                              |
| ------------- | --------------------------- | -------- | ---------------------------------------- |
| `id`          | `ID`                        | Yes      | Unique identifier                        |
| `serviceId`   | `ID`                        | Yes      | Service being assessed                   |
| `customerId`  | `ID`                        | Yes      | Customer for assessment                  |
| `contactId`   | `ID`                        | No       | Primary contact for assessment           |
| `assessor`    | `Author`                    | Yes      | Who performed the assessment             |
| `assessedAt`  | `When`                      | Yes      | When assessment was performed            |
| `locations`   | `[Location, ...Location[]]` | Yes      | One or more locations (tuple ensures 1+) |
| `questions`   | `Answer[]`                  | Yes      | Assessment questionnaire responses       |
| `risks`       | `Note[]`                    | No       | Identified risks                         |
| `notes`       | `Note[]`                    | No       | General notes                            |
| `attachments` | `Attachment[]`              | No       | Photos, maps, etc.                       |
| `createdAt`   | `When`                      | Yes      | Creation timestamp                       |
| `updatedAt`   | `When`                      | Yes      | Last update timestamp                    |

### 8.4 JobPlan

Planned execution details for a job.

| Field             | Type                | Required | Description             |
| ----------------- | ------------------- | -------- | ----------------------- |
| `id`              | `ID`                | Yes      | Unique identifier       |
| `jobId`           | `ID`                | Yes      | Associated job          |
| `workflowId`      | `ID`                | Yes      | Workflow to follow      |
| `status`          | `JobStatus`         | Yes      | Current plan status     |
| `scheduledStart`  | `When`              | Yes      | Scheduled start time    |
| `scheduledEnd`    | `When`              | No       | Scheduled end time      |
| `targetLocations` | `Location[]`        | Yes      | Target work locations   |
| `assignments`     | `JobAssignment[]`   | Yes      | Team member assignments |
| `assets`          | `ID[]`              | Yes      | Required assets         |
| `chemicals`       | `JobChemicalPlan[]` | Yes      | Chemical usage plan     |
| `notes`           | `Note[]`            | No       | Plan notes              |
| `createdAt`       | `When`              | Yes      | Creation timestamp      |
| `updatedAt`       | `When`              | Yes      | Last update timestamp   |

### 8.5 JobAssignment

Assignment of a team member to a job with role.

| Field      | Type     | Required | Description                     |
| ---------- | -------- | -------- | ------------------------------- |
| `memberId` | `ID`     | Yes      | User ID of assigned team member |
| `role`     | `string` | Yes      | Role for this assignment        |
| `notes`    | `string` | No       | Assignment notes                |

### 8.6 JobChemicalPlan

Planned use of a chemical in a job.

| Field            | Type                                           | Required | Description             |
| ---------------- | ---------------------------------------------- | -------- | ----------------------- |
| `chemicalId`     | `ID`                                           | Yes      | Chemical to be used     |
| `amount`         | `number`                                       | Yes      | Amount to be applied    |
| `unit`           | `'gallon' \| 'liter' \| 'pound' \| 'kilogram'` | Yes      | Unit of measurement     |
| `targetArea`     | `number`                                       | No       | Target application area |
| `targetAreaUnit` | `'acre' \| 'hectare'`                          | No       | Area unit               |

### 8.7 JobLogEntry

Append-only log entry for a job.

| Field         | Type            | Required | Description                   |
| ------------- | --------------- | -------- | ----------------------------- |
| `id`          | `ID`            | Yes      | Unique identifier             |
| `jobId`       | `ID`            | Yes      | Associated job                |
| `planId`      | `ID`            | Yes      | Associated plan               |
| `type`        | `JobLogType`    | Yes      | Type of log entry             |
| `message`     | `string`        | Yes      | Log message                   |
| `occurredAt`  | `When`          | Yes      | When event occurred           |
| `createdAt`   | `When`          | Yes      | When log was created          |
| `createdBy`   | `Author`        | Yes      | Who created the log entry     |
| `location`    | `Location`      | No       | Location where event occurred |
| `attachments` | `Attachment[]`  | No       | Associated files              |
| `payload`     | `JobLogPayload` | No       | Additional structured data    |

### 8.8 JobLogType

Types of log entries for a job.

| Value        | Description                 |
| ------------ | --------------------------- |
| `status`     | Status change               |
| `checkpoint` | Workflow checkpoint reached |
| `note`       | General note or observation |
| `telemetry`  | Equipment telemetry data    |
| `exception`  | Exception or issue          |

`JobLogPayload` is `Record<string, unknown>` for flexible structured data.

## 9. Customer

Source: `source/domain/customer.ts`

Represents clients who purchase services.

| Field              | Type                                   | Required | Description                             |
| ------------------ | -------------------------------------- | -------- | --------------------------------------- |
| `id`               | `ID`                                   | Yes      | Unique identifier                       |
| `name`             | `string`                               | Yes      | Customer name                           |
| `status`           | `'active' \| 'inactive' \| 'prospect'` | Yes      | Customer status                         |
| `address`          | `Address`                              | Yes      | Primary address                         |
| `accountManager`   | `Author`                               | No       | Assigned account manager                |
| `primaryContactId` | `ID`                                   | No       | ID of primary contact                   |
| `sites`            | `CustomerSite[]`                       | Yes      | Customer sites                          |
| `contacts`         | `[Contact, ...Contact[]]`              | Yes      | One or more contacts (tuple ensures 1+) |
| `notes`            | `Note[]`                               | No       | Customer notes                          |
| `createdAt`        | `When`                                 | Yes      | Creation timestamp                      |
| `updatedAt`        | `When`                                 | Yes      | Last update timestamp                   |

### 9.1 Contact

Individual associated with a customer.

| Field              | Type                          | Required | Description                     |
| ------------------ | ----------------------------- | -------- | ------------------------------- |
| `id`               | `ID`                          | Yes      | Unique identifier               |
| `customerId`       | `ID`                          | Yes      | Associated customer             |
| `name`             | `string`                      | Yes      | Contact name                    |
| `email`            | `string`                      | No       | Email address                   |
| `phone`            | `string`                      | No       | Phone number                    |
| `preferredChannel` | `'email' \| 'sms' \| 'phone'` | No       | Preferred communication channel |
| `notes`            | `Note[]`                      | No       | Contact notes                   |
| `createdAt`        | `When`                        | Yes      | Creation timestamp              |
| `updatedAt`        | `When`                        | Yes      | Last update timestamp           |

### 9.2 CustomerSite

Site or location associated with a customer.

| Field        | Type       | Required | Description         |
| ------------ | ---------- | -------- | ------------------- |
| `id`         | `ID`       | Yes      | Unique identifier   |
| `customerId` | `ID`       | Yes      | Associated customer |
| `label`      | `string`   | Yes      | Site label/name     |
| `location`   | `Location` | Yes      | Site location       |
| `acreage`    | `number`   | No       | Site size in acres  |
| `notes`      | `Note[]`   | No       | Site notes          |
