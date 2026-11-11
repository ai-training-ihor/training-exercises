/**
 * Service request handler — refactored in Session 5.
 *
 * Handles service request creation, updates and statistics.
 *
 * The functions in the "Security exercise" section at the bottom of this file
 * are intentionally left untouched: they are the Session 10 vulnerability-hunt
 * exercise and will be addressed there.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

export const CATEGORIES = ['electrical', 'plumbing', 'hvac', 'structural', 'safety', 'general'] as const;
export const PRIORITIES = ['emergency', 'urgent', 'routine', 'low'] as const;
export const STATUSES = ['open', 'assigned', 'in-progress', 'completed', 'cancelled'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;
const MIN_LOCATION_LENGTH = 2;

const DEFAULT_CATEGORY: Category = 'general';
const DEFAULT_PRIORITY: Priority = 'routine';
const DEFAULT_REPORTER = 'Anonymous';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Maximum time to resolve a request, per priority. */
export const SLA_MS: Record<Priority, number> = {
  emergency: MS_PER_HOUR,
  urgent: 4 * MS_PER_HOUR,
  routine: MS_PER_DAY,
  low: 3 * MS_PER_DAY,
};

export interface ServiceRequestRecord {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  location: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; code: number };

export interface RequestUpdates {
  title?: string;
  description?: string;
  location?: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assignedTo?: string;
  /** Original creation time; needed to compute `sameDayResolution` on completion. */
  createdAt?: string;
}

export type AppliedUpdates = RequestUpdates & {
  updatedAt: string;
  completionTime?: number;
  sameDayResolution?: boolean;
};

type CountMap = Record<string, number>;

export interface RequestStats {
  byPriority: CountMap;
  byCategory: CountMap;
  byStatus: CountMap;
  avgResolutionTime: number;
  total: number;
  slaCompliance: Record<Priority, number>;
}

interface Technician {
  id: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Validation (single source of truth for create and update)
// ---------------------------------------------------------------------------

const TITLE_MESSAGE = `Title is required and must be at least ${MIN_TITLE_LENGTH} characters`;
const DESCRIPTION_MESSAGE = `Description is required and must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
const LOCATION_MESSAGE = 'Location is required';

const titleSchema = z.string({ error: TITLE_MESSAGE }).min(MIN_TITLE_LENGTH, TITLE_MESSAGE);
const descriptionSchema = z.string({ error: DESCRIPTION_MESSAGE }).min(MIN_DESCRIPTION_LENGTH, DESCRIPTION_MESSAGE);
const locationSchema = z.string({ error: LOCATION_MESSAGE }).min(MIN_LOCATION_LENGTH, LOCATION_MESSAGE);
const categorySchema = z.enum(CATEGORIES, {
  error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`,
});
const prioritySchema = z.enum(PRIORITIES, { error: 'Invalid priority' });
const statusSchema = z.enum(STATUSES, { error: 'Invalid status' });

const newRequestSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  location: locationSchema,
  category: categorySchema.optional(),
  priority: prioritySchema.optional(),
  reportedBy: z.string().optional(),
});

const updateRequestSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  location: locationSchema.optional(),
  category: categorySchema.optional(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string().optional(),
});

/**
 * Drops `null`/`undefined` values, and (for the given keys) any other falsy
 * value too, so an empty-string optional field behaves as "not provided".
 */
function normalizeInput(input: object, dropFalsyKeys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      return !(dropFalsyKeys.includes(key) && !value);
    })
  );
}

function validate<S extends z.ZodType>(schema: S, input: unknown): Result<z.infer<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error.issues[0].message, code: 400 };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/** Validates, builds, auto-assigns (emergencies only) and returns a new service request. */
export async function processNewRequest(data: unknown): Promise<Result<ServiceRequestRecord>> {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'No data provided', code: 400 };
  }

  const validated = validate(newRequestSchema, normalizeInput(data, ['category', 'priority', 'reportedBy']));
  if (!validated.ok) return validated;

  const request = await tryAutoAssign(buildRequest(validated.data));
  return { ok: true, data: request };
}

function buildRequest(input: z.infer<typeof newRequestSchema>): ServiceRequestRecord {
  const now = new Date().toISOString();
  return {
    id: generateRequestId(),
    title: input.title,
    description: input.description,
    category: input.category ?? DEFAULT_CATEGORY,
    priority: input.priority ?? DEFAULT_PRIORITY,
    status: 'open',
    location: input.location,
    reportedBy: input.reportedBy ?? DEFAULT_REPORTER,
    createdAt: now,
    updatedAt: now,
  };
}

// TODO: Math.random() IDs can collide and are guessable; use a DB sequence or UUID.
function generateRequestId(): string {
  return `SR-${Math.floor(Math.random() * 900000 + 100000)}`;
}

/** Emergency requests are assigned to the first available technician and notified immediately. */
async function tryAutoAssign(request: ServiceRequestRecord): Promise<ServiceRequestRecord> {
  if (request.priority !== 'emergency') return request;

  const [technician] = await getAvailableTechnicians();
  if (!technician) return request;

  sendNotification(
    technician.email,
    `EMERGENCY: ${request.title}`,
    `Urgent service request requires immediate attention at ${request.location}`
  );
  return { ...request, status: 'assigned', assignedTo: technician.id };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/** Validates and applies updates to a request. Throws `Error` on invalid input. */
export async function updateRequest(id: string, updates: RequestUpdates): Promise<AppliedUpdates> {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid request ID');
  }

  const validated = validate(updateRequestSchema, normalizeInput(updates ?? {}, ['category', 'priority', 'status']));
  if (!validated.ok) throw new Error(validated.error);

  const applied: AppliedUpdates = { ...validated.data, updatedAt: new Date().toISOString() };

  if (applied.status === 'completed') {
    Object.assign(applied, completionFields(applied.createdAt));
  }

  if (applied.status === 'assigned' && applied.assignedTo) {
    await notifyAssignment(id, applied.assignedTo);
  }

  return applied;
}

function completionFields(createdAt: string | undefined): Pick<AppliedUpdates, 'completionTime' | 'sameDayResolution'> {
  const now = Date.now();
  return {
    completionTime: now,
    // Without a known creation time we cannot tell, so leave it unset rather than guess.
    sameDayResolution: createdAt ? now - new Date(createdAt).getTime() < MS_PER_DAY : undefined,
  };
}

async function notifyAssignment(requestId: string, technicianId: string): Promise<void> {
  const email = await getTechnicianEmail(technicianId);
  if (email) {
    sendNotification(email, `New Assignment: ${requestId}`, `You have been assigned to service request ${requestId}`);
  }
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export async function getRequestStats(timeRange: unknown): Promise<RequestStats> {
  const [byPriority, byCategory, byStatus, avgResolutionTime, total] = await Promise.all([
    countByField('priority', timeRange),
    countByField('category', timeRange),
    countByField('status', timeRange),
    calculateAvgResolutionTime(timeRange),
    getTotalCount(timeRange),
  ]);

  return {
    byPriority,
    byCategory,
    byStatus,
    avgResolutionTime,
    total,
    slaCompliance: buildSlaCompliance(byPriority),
  };
}

// TODO: these keys are not produced by countByField; compute SLA compliance from
// resolution times against SLA_MS once the real queries exist.
function buildSlaCompliance(byPriority: CountMap): Record<Priority, number> {
  return Object.fromEntries(
    PRIORITIES.map((priority) => [priority, byPriority[`${priority}_resolved_in_time`] || 0])
  ) as Record<Priority, number>;
}

// ---------------------------------------------------------------------------
// Helper functions (stubs for training)
// ---------------------------------------------------------------------------

async function getAvailableTechnicians(): Promise<Technician[]> {
  // In production, this queries the database
  return [];
}

async function getTechnicianEmail(_techId: string): Promise<string | null> {
  // In production, this looks up the technician
  return null;
}

function sendNotification(email: string, subject: string, _body: string): void {
  // In production, this sends an email
  console.log(`[NOTIFICATION] To: ${email}, Subject: ${subject}`);
}

async function countByField(_field: string, _timeRange: unknown): Promise<CountMap> {
  return {};
}

async function calculateAvgResolutionTime(_timeRange: unknown): Promise<number> {
  return 0;
}

async function getTotalCount(_timeRange: unknown): Promise<number> {
  return 0;
}

// ===========================================================================
// Security exercise (Session 10) — INTENTIONALLY UNCHANGED. Do not refactor.
// ===========================================================================

// search service requests - WARNING: has SQL injection vulnerability (Session 10 exercise)
export function searchRequests(query: any, filters: any) {
  var results: any[] = [];
  var sql = "SELECT * FROM service_requests WHERE 1=1";

  // ⚠️ DELIBERATE VULNERABILITY — Session 10 Security Exercise
  // This concatenates user input directly into SQL
  if (query) {
    sql += " AND (title LIKE '%" + query + "%' OR description LIKE '%" + query + "%')";
  }

  if (filters) {
    if (filters.category) {
      sql += " AND category = '" + filters.category + "'";
    }
    if (filters.priority) {
      sql += " AND priority = '" + filters.priority + "'";
    }
    if (filters.status) {
      sql += " AND status = '" + filters.status + "'";
    }
  }

  // In a real app, this would execute the SQL
  // For training, we just return the constructed query for demonstration
  console.log('Executing query:', sql);

  return { query: sql, results: results };
}


// ⚠️ DELIBERATE VULNERABILITY — Session 10 Security Exercise
// Hardcoded API key in source code
export const INTERNAL_API_KEY = 'sk-acme-prod-2026-xK9mP2nQ4rT6';

// Admin endpoint with no authentication check
export function getAdminDashboardData() {
  return {
    totalRequests: 1247,
    activeRequests: 89,
    avgResponseTime: '2.4 hours',
    technicianCount: 23,
    monthlyBudget: 45000,
    // ⚠️ Exposes sensitive data without auth
    apiKeys: [INTERNAL_API_KEY],
    databaseUrl: 'postgresql://admin:supersecret@db.internal:5432/acme',
  };
}
