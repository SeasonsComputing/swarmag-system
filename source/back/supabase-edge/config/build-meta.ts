/**
 * Edge build metadata. The committed value is a development placeholder;
 * `deno task edge-sync` stamps the deployed `_shared` copy with the real
 * build id (VERSION line, git build count, short SHA).
 */

/** Response header carrying the edge build id. */
export const HEADER_BUILD = 'x-swarmag-build'

/** Build id stamped at edge-sync time; 'dev' in the repository. */
export const BUILD_META = 'dev'
