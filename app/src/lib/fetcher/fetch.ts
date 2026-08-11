// Adapted from @open-resource-discovery/crawler
export function wait(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export const responseValidationError = new Error("Response validation failed");

export class HttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  public constructor(status: number, statusText: string) {
    super(statusText);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

type ValidateFn<T> = (body: unknown) => body is T | never;

/**
 *
 * @param url URL to fetch.
 * @param validate Validate function to check the response body.
 * @param init
 * @throws Error if validation fails
 */
export async function customFetch<T>(
  url: URL | string,
  validate?: ValidateFn<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (response.ok) {
    const body = await response.json();
    if (validate) {
      if (validate(body)) {
        return body;
      }
      throw responseValidationError;
    }
    return body as T;
  }

  throw new HttpError(response.status, response.statusText);
}

type RetryOptions = {
  // Default is 0.
  retry?: number;
  // Default is 0ms.
  delay?: number;
};

// 10s
const MAX_DELAY = 10000;

function getDelay(
  currentRetry: number,
  maxRetries: number,
  delay: number,
): number {
  if (maxRetries === 0 || delay === 0 || currentRetry === 0) return 0;
  if (currentRetry === maxRetries) return MAX_DELAY;
  return delay * currentRetry;
}

/**
 * Fetch implementation with retries.
 * Before each retry, a delay is added.
 * By default, it retries 0 times with 0ms delay.
 */
export function retryFetch(
  url: URL | string,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const totalRetries = options?.retry || 0;

    const wrapper = (n: number): void => {
      const retryFetch = async (): Promise<void> => {
        const numberOfRetries = totalRetries - n + 1;
        await wait(
          getDelay(numberOfRetries, totalRetries, options?.delay || 0),
        );
        // console.log(`Retry ${numberOfRetries} ${url}`);
        wrapper(--n);
      };

      fetch(url, { ...init })
        .then(async (res) => {
          if (!res.ok && n > 0) {
            await retryFetch();
          } else {
            resolve(res);
          }
        })
        .catch(async (err) => {
          if (n > 0) {
            await retryFetch();
          } else {
            return reject(err);
          }
        });
    };

    return wrapper(options?.retry || 0);
  });
}
