<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System – User Stories

## 1. Customer Relationship Management

### 1.1 Customer Prospect

1. **Lead intake** — Leads arrive via voicemail, text, or email. A sales
   rep checks the three inboxes several times daily and transforms leads
   with substance into prospects. (Manual and managed for now; a tracked
   `Lead` abstraction with automation and measurement is parking-lotted.)
2. **Prospect genesis** — The rep runs the onboarding wizard from the lead
   artifact, before any live conversation:
   - Primary contact — select or create the User who will be the Customer
     primary contact.
   - Customer record — name, primary account details, address
     (billing/mailing), status `prospect`.
   - Locations/sites to service (each with label, coordinates/address,
     acreage/notes) — as known; zero sites is legal at genesis.
3. **Return call** — Outbound call to the prospect: verify captured
   details, select potential services, draft scope of effort (acreage,
   ...), and schedule the onsite assessment. (This is the assessment
   flow's entry — see 2.1.)
4. **Additional contact assignment** — Add any additional customer contact Users as account relationships.

### 1.2 Prospect Pipeline Visibility _(future feature — stub)_

1. **Prospects widget** — An admin dashboard widget listing current
   prospects with time-since-creation, so aging leads surface before they
   go cold.
2. **Aging charts** — Time-since-creation distribution charts (the charts
   archetype's likely first consumer). Buildable against the current
   domain (`Customer.status = 'prospect'` + `createdAt`); enriched later
   by the parked `Lead` abstraction's conversion metrics.

## 2. Job Definition

### 2.1 Preliminary Job Assessment

1. **Service selection** — Choose a Service SKU and category (aerial/ground) for the prospect’s need.
2. **Assessment scheduling** — Schedule an initial onsite assessment window and assign assessor/crew.
3. **Workflow seeding** — Preload an assessment workflow based on the Service type (default workflow per category/SKU).

### 2.2 Onsite Job Assessment

1. **Workflow tailoring** — Add or remove additional workflows/tasks to match site-specific needs or hazards.
2. **Data capture prep** — Note required artifacts (maps, photos, checklists) to collect during the assessment.

### 2.3 Job Planning

1.
2.

### 2.4 Job Plan Finalization

1.
2.

### 2.5 Job Work Preparation

1.
2.

### 2.6 Onsite Job Work Preparation

1.
2.

### 2.7 Job Work Execution

1.
2.

### 2.8 Job Work Execution Variance

1.
2.

### 2.9 Job Followup

1.
2.

## 3. Asset Maintenance

### 3.1 Vehicle Maintenance

1.
2.

### 3.2 Tool & Machine Maintenance

1.
2.

## 4. Chemical Maintenance

1.
2.

## 5. Workflow Development

1.
2.

## 6. User Management _(complete — User Manager shipped, Phase 1)_

### 6.1 View Users

1. Admin opens the Users page and sees a list of all active users.
2. Admin scans the list to find a user by name, email, role, or status.

### 6.2 Edit User

1. Admin selects a user to review or update their details.
2. Admin updates the user's name, phone number, preferred channel, notes, or role assignments.
3. Admin saves the changes.

### 6.3 Deactivate / Activate User

1. Admin deactivates a user who no longer requires system access — the user cannot log in.
2. Admin reactivates a previously deactivated user to restore their access.

### 6.4 Remove User

1. Admin removes a user who has permanently left — the user no longer appears in the system.

### 6.5 Create User

1. Admin creates a new user by providing their name, email, phone, preferred channel, notes, and role.

### 6.6 Eject User

1. Admin ejects a user who is no longer authorized to access the system.

_End of User Stories Document_
