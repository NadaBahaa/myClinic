import type { PatientPhoto } from '../app/types';

/** Laravel sometimes nests single resources as `{ data: { ...fields } }`. */
function flattenApiRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = raw.data;
  if (
    inner &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    inner !== null &&
    ('url' in inner || 'id' in inner || 'path' in inner || 'uuid' in inner)
  ) {
    return { ...raw, ...(inner as Record<string, unknown>) };
  }
  return raw;
}

/** Map API / DB quirks (camelCase + optional snake_case) into `PatientPhoto`. */
export function normalizePatientPhoto(raw: unknown): PatientPhoto {
  if (raw == null || typeof raw !== 'object') {
    return {
      id: '',
      url: '',
      type: 'before',
      uploadedAt: new Date(),
      uploadedBy: '',
    };
  }
  const o = flattenApiRecord(raw as Record<string, unknown>);
  const id = String(o.id ?? o.uuid ?? '');
  const rawUrl = o.url ?? o.path ?? o.publicUrl ?? o.public_url;
  const url =
    rawUrl === null || rawUrl === undefined ? '' : String(rawUrl).trim();
  const type =
    o.type === 'before' || o.type === 'during' || o.type === 'after' ? o.type : 'before';
  const uploadedRaw = o.uploadedAt ?? o.uploaded_at;
  let uploadedAt: Date;
  if (uploadedRaw instanceof Date) uploadedAt = uploadedRaw;
  else if (typeof uploadedRaw === 'string' || typeof uploadedRaw === 'number')
    uploadedAt = new Date(uploadedRaw);
  else uploadedAt = new Date();
  const uploadedBy = String(o.uploadedBy ?? o.uploaded_by ?? '');
  const sessionId = o.sessionId ?? o.session_id;
  const notes = o.notes != null ? String(o.notes) : undefined;

  return {
    id,
    url,
    type,
    uploadedAt,
    uploadedBy,
    sessionId: typeof sessionId === 'string' && sessionId ? sessionId : undefined,
    notes,
  };
}
