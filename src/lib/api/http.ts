import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";

/**
 * HTTP helpers for the HeatGuard API: a consistent JSON envelope, typed error
 * classes, input parsing, and centralised error handling. Route handlers stay
 * thin — they parse input and delegate to services; all error-to-response
 * mapping happens here.
 */

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export interface ApiFailureBody {
  ok: false;
  error: ApiErrorPayload;
}

/** An error that maps to a specific HTTP status and error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 404 — a requested resource does not exist. */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found.") {
    super(404, "NOT_FOUND", message);
  }
}

/** Build a success envelope response. */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  const body: ApiSuccessBody<T> = { ok: true, data };
  return NextResponse.json(body, { status });
}

/** Build a failure envelope response. */
export function apiFailure(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  const body: ApiFailureBody = { ok: false, error: { code, message, details } };
  return NextResponse.json(body, { status });
}

/** Convert Zod issues into a compact, client-friendly list. */
function formatZodIssues(
  error: ZodError,
): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Run a route handler body, mapping known errors to consistent envelopes:
 * Zod validation → 400, {@link ApiError} → its status, anything else → 500.
 */
export async function handleRoute(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      return apiFailure(
        400,
        "VALIDATION_ERROR",
        "Invalid request.",
        formatZodIssues(error),
      );
    }
    if (error instanceof ApiError) {
      return apiFailure(error.status, error.code, error.message, error.details);
    }
    console.error("[api] Unhandled error:", error);
    return apiFailure(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

/** Parse and validate URL query parameters against a schema (throws ZodError). */
export function parseQuery<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
): z.output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}

/** Parse and validate a JSON request body against a schema. */
export async function parseJsonBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(json);
}
