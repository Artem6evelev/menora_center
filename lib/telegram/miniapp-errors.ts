import "server-only";

export class MiniAppAuthError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
    this.name = "MiniAppAuthError";
  }
}

export function miniAppFailure(error: unknown) {
  // Never serialize driver errors, request data, provider secrets or tokens.
  return error instanceof MiniAppAuthError
    ? { status: error.status, body: { ok: false as const, error: error.code } }
    : { status: 503, body: { ok: false as const, error: "temporarily_unavailable" } };
}
