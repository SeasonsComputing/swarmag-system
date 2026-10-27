# Field Mapping — Brief

**Pending, design input.** Recorded 2026-10-24 from a CA + AI Architect session, while extending
the document storage brief (`effort/active/2026-10-23-document-storage-brief.md`). It records the
depth considered so far; job definition, the workflow workbench, and document storage will flesh
out the details. Chosen from the roadmap when job definition is.

## What triggered it

Maps and GPS-tagged photos are essential to swarmAg's service: every job is backed by an aerial
multispectral map of its region, and the work is planned, run, and shown to the customer on that
map. Hanging every attachment off a note, chosen for simplicity, has no place for a map's capture
or for the work it plans.

## The walkthrough

The onsite assessment is a walkthrough with the prospect around the site and pastures the services
are for: surveying and annotating the job's zones. The prospect is never kept waiting on media
processing, so the walkthrough needs no survey:

- **Base map.** USDA NAIP imagery: public domain, all of Texas at roughly 0.6–1 m, with a
  near-infrared band. Tiles for the site are cached on the iPad before the visit.
- **Pure GeoJSON.** Zones are drawn live: a tapped point, or a walked line or edge recorded from the
  iPad's GPS. A point with a 5 m radius is obvious on the ground.
- **The survey refines later.** Once the multispectral map is processed, zones snap to detected
  objects and tighten to survey precision.

## Ribbons, pins, and zones

The process uses three ribbons, and a bow is tied at each with the prospect as physical
confirmation:

| Ribbon | Intent  | Work                                            |
| ------ | ------- | ----------------------------------------------- |
| Red    | Protect | Do not touch; buffered; a geofence for machines |
| Green  | Remove  | Mechanical work                                 |
| Yellow | Spray   | Chemical application                            |

Choosing what not to touch matters as much as what to treat, above all for destructive ground
machinery and chemical applications.

- **A pin** is where a ribbon was tied: a position, the ribbon's intent, and a photo of the tied
  ribbon. Tying a ribbon is one act in the app: tie, tap the color, take the photo.
- **A zone** is what work applies to: a geometry (point, line, or polygon) and an intent. A pin tags
  a zone: by default its own 5 m circle, or a larger object (a ribbon on a small tree beside a pond
  tags the pond).
- **Zones are the plan's unit.** Selected zones are the basis for task order and assignment; a
  polygon's area times a rate gives quantities and quotes.
- **Object selection.** Zones may be selected from objects detected in the imagery rather than
  drawn: water from NDWI, canopy from NDVI and red edge, and segmentation (segment-geospatial)
  on the import node.
- **Zones are domain data.** The database holds the canonical zones; a Survey package carries a
  GeoJSON snapshot.

## One map, three apps

- **Admin** selects zones and plans the work.
- **Ops** runs the job against the zones, offline, with the job's metadata, and adds exceptions as
  pins. The Ops app is the most HCI-sensitive of the apps: outdoors, often one-handed, without
  signal.
- **Customer portal** is the planning map and workflow over a base map, with pins the customer
  opens to see the photo and notes from assessment, planning, and the work phase. It shows only
  `shared` notes (`Note.visibility`) and their photos.

## GeoJSON

GeoJSON (RFC 7946) is canonical in the domain: the `Geometry`, never a `Feature`, since the domain
type carries the properties. PostGIS holds a derived column for spatial queries; KML is an export
for DJI flight and spray planning. GeoJSON orders coordinates `[longitude, latitude]`: the order
lives in one constructor that takes `{ latitude, longitude }` by name, the position type labels its
elements, and the validator checks ranges, which rejects every swapped Texas coordinate.

## Domain edits anticipated

`domain/` is locked; the CA opens it for the productions that need these.

1. **A geometry type** beside `Location`'s point: point, line, and polygon.
2. **Zone and pin** abstractions, and the intent catalog (protect, remove, spray).
3. **A survey** owned by the job: capture time, sensor, bands, and its map's `DocumentPath`. Name
   open (`Survey`, `Reconnaissance`).
4. **Photo steps by composition.** The closed set of question types is generative: a photo step is
   a select question whose option requires a photo. `SelectOption.requiresNote` becomes something
   like `requires: 'note' | 'attachment'`.
5. **`ChemicalLabel.url` and `Attachment.url`** become `DocumentPath`s (document storage brief).

## Design moments

1. **Who selects zones:** the assessor, the planner, or both, with the plan building on the
   assessment.
2. **How selection starts:** objects offered from detection, or click-to-segment.
3. **Protect-zone buffers:** whether walkthrough precision suffices before machine work.
4. **The map widget's** placement and its three modes.
5. **When the survey is flown:** during the visit, processed in the field, or beforehand.
