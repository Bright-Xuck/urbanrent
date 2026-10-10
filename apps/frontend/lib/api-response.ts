export async function readApiJson<T extends object>(
  response: Response,
  service: string
): Promise<T & { message?: string }> {
  const text = await response.text();
  if (!text) {
    throw new Error(`${service} returned an empty response (${response.status}).`);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${service} returned an invalid JSON response (${response.status}).`);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error(`${service} returned an unexpected response (${response.status}).`);
  }

  return body as T & { message?: string };
}
