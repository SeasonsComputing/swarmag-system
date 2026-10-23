/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shared test fixtures                                                         ║
║ Single fixture barrel for domain samples used by tests.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Barrel export for shared test fixtures.

Single fixture barrel for domain samples used by tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetSamples  Shared fixture samples.
├ types                   Asset type catalog.
├ drone                   Active dispensing drone.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ type                   Asset type reference.
│ ├ notes                  Note collection.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ ├ serialNumber           Optional equipment serial number.
│ └ status                 Lifecycle status.
├ sprayerTruck            Spray truck awaiting maintenance.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ type                   Asset type reference.
│ ├ notes                  Note collection.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ ├ serialNumber           Optional equipment serial number.
│ └ status                 Lifecycle status.
└ all                     All asset records.
CustomerSamples  Shared fixture samples.
├ blueMesaRanch           Customer aggregate.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ accountManagerId       Optional account-manager reference.
│ ├ primaryContact         Primary reachability details.
│ ├ sites                  Customer sites.
│ ├ notes                  Note collection.
│ ├ name                   Account name.
│ ├ status                 Lifecycle status.
│ ├ line1                  Street address.
│ ├ line2                  Optional additional address.
│ ├ city                   City.
│ ├ state                  State or region.
│ ├ postalCode             Postal code.
│ └ country                Country code.
├ blueMesaRanchContact    Customer-to-User association.
│ ├ customerId             Customer reference.
│ └ userId                 User reference.
├ all                     All customer records.
└ users                   All customer-to-User associations.
FacetSamples  Shared fixture samples.
├ aerialSpray             Service classification fixture.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ scheme                 Classification scheme.
│ ├ code                   Classification code.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ └ active                 Catalog availability.
└ all                     All facet records.
JobSamples  Shared fixture samples.
├ ranchMappingAssessment  Job assessment.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ scheduledAt            Scheduled assessment time.
│ ├ startedAt              Optional assessment start.
│ ├ completedAt            Optional assessment completion.
│ ├ jobId                  Job reference.
│ ├ assessorId             Assessor reference.
│ ├ locations              Assessment locations.
│ ├ risks                  Risk notes.
│ └ notes                  Note collection.
├ fieldMetadataLogEntry   Job work-log entry.
│ ├ InstantiableOnly       Inherited InstantiableOnly fields.
│ ├ jobId                  Job reference.
│ ├ userId                 User reference.
│ └ answer                 Captured answer.
└ all                     Job fixture collection.
  ├ assessment                 Shared assessment record.
  └ logEntry                   Shared work-log record.
UserSamples  Shared fixture samples.
├ administrator           Administrator User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
├ operations              Operations User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
├ sales                   Sales User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
└ all                     All User records.
WorkflowSamples  Shared fixture samples.
├ preflightInspection     Required preflight selection.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ ├ type                   Question response format.
│ └ options                Selectable answers.
├ chemicalMixRatio        Numeric mix-ratio capture.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ └ type                   Question response format.
├ ppeVerification         Multiple crew-member selection.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ ├ type                   Question response format.
│ └ options                Selectable answers.
└ all                     All shared questions.
*/

export { AssetSamples } from './asset-samples.ts'
export { CustomerSamples } from './customer-samples.ts'
export { FacetSamples } from './facet-samples.ts'
export { JobSamples } from './job-samples.ts'
export { UserSamples } from './user-samples.ts'
export { WorkflowSamples } from './workflow-samples.ts'
