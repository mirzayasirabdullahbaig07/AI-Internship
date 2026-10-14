export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** The server answered 200 but the body was not valid JSON - retrying will not help. */
export class InvalidResponseError extends Error {
  constructor(message = "Invalid JSON in response body") {
    super(message);
    this.name = "InvalidResponseError";
  }
}

export interface FetchOptions {
  token: string;
  retries?: number; // extra attempts after the first
  baseDelayMs?: number; // exponential backoff base
  fetchImpl?: typeof fetch; // injectable for tests
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch JSON with a bearer token and retry on transient failures
 * (network drops and 5xx). Client errors (4xx, incl. 401/403) are NOT retried:
 * retrying a bad request or missing token can never succeed.
 */
export async function fetchWithRetry<T>(url: string, opts: FetchOptions): Promise<T> {
  const { token, retries = 2, baseDelayMs = 100, fetchImpl = fetch } = opts;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) throw new HttpError(401, "Auth required");
      if (!res.ok) throw new HttpError(res.status, `HTTP error: ${res.status}`);
      try {
        return (await res.json()) as T;
      } catch {
        throw new InvalidResponseError();
      }
    } catch (err) {
      const retryable =
        err instanceof InvalidResponseError
          ? false
          : !(err instanceof HttpError) || err.status >= 500;
      if (!retryable || attempt >= retries) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

/** Lab target: JSONPlaceholder posts (needs internet; the tests use a local mock instead). */
export function fetchPosts(token = "demo-token") {
  return fetchWithRetry<Post[]>("https://jsonplaceholder.typicode.com/posts", { token });
}
