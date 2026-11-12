-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Document storage policies                                                ║
-- ║ M-6 attachment and Binder grants within configured native roots.         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Namespace ids are the fixed reference identities in Attachments.namespaces.
-- SQL cannot import that catalog; policy integration tests exercise its entries.
DROP POLICY IF EXISTS docstore_buckets_read ON storage.buckets;
CREATE POLICY docstore_buckets_read ON storage.buckets FOR SELECT TO authenticated
USING (
  id = {{storage.attachments.root}} AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL
      AND roles ?| ARRAY['administrator', 'sales', 'operations']
  )
);

-- Retire the earlier runtime deletion grant when reapplying these policies.
DROP POLICY IF EXISTS docstore_buckets_delete ON storage.buckets;

DROP POLICY IF EXISTS docstore_objects_staff ON storage.objects;
CREATE POLICY docstore_objects_staff ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = {{storage.attachments.root}} AND split_part(name, '/', 1) IN (
    '019a6000-0000-7000-8000-000000000003', '019a6000-0000-7000-8000-000000000004',
    '019a6000-0000-7000-8000-000000000005', '019a6000-0000-7000-8000-000000000006'
  ) AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL
      AND roles ?| ARRAY['administrator', 'sales', 'operations']
  )
)
WITH CHECK (
  bucket_id = {{storage.attachments.root}} AND split_part(name, '/', 1) IN (
    '019a6000-0000-7000-8000-000000000003', '019a6000-0000-7000-8000-000000000004',
    '019a6000-0000-7000-8000-000000000005', '019a6000-0000-7000-8000-000000000006'
  ) AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL
      AND roles ?| ARRAY['administrator', 'sales', 'operations']
  )
);

-- Binder's private root uses the same active-User authority source. Availability
-- of an app route/local mirror grants no remote access. Logical namespace id is
-- FieldBinderMetadata.catalog.namespace.id; no native bucket creation is granted.
DROP POLICY IF EXISTS field_binder_buckets_read ON storage.buckets;
CREATE POLICY field_binder_buckets_read ON storage.buckets FOR SELECT TO authenticated
USING (
  id = {{storage.fieldBinder.root}} AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL
      AND roles ?| ARRAY['administrator', 'sales', 'operations']
  )
);

DROP POLICY IF EXISTS field_binder_objects_read ON storage.objects;
CREATE POLICY field_binder_objects_read ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = {{storage.fieldBinder.root}}
  AND split_part(name, '/', 1) = '019a6000-0000-7000-8000-000000000020'
  AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL
      AND roles ?| ARRAY['administrator', 'sales', 'operations']
  )
);

DROP POLICY IF EXISTS field_binder_objects_manage ON storage.objects;
CREATE POLICY field_binder_objects_manage ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = {{storage.fieldBinder.root}}
  AND split_part(name, '/', 1) = '019a6000-0000-7000-8000-000000000020'
  AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL AND roles ? 'administrator'
  )
)
WITH CHECK (
  bucket_id = {{storage.fieldBinder.root}}
  AND split_part(name, '/', 1) = '019a6000-0000-7000-8000-000000000020'
  AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid())
      AND status = 'active' AND deleted_at IS NULL AND roles ? 'administrator'
  )
);
