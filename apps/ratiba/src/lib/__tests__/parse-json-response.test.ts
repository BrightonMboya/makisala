import { describe, expect, test } from 'bun:test';
import { parseJsonResponse } from '../parse-json-response';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('parseJsonResponse', () => {
  test('parses a normal JSON success body', async () => {
    const result = await parseJsonResponse<{ success: boolean }>(jsonResponse({ success: true }));
    expect(result).toEqual({ success: true });
  });

  test('parses a JSON error body on a non-2xx status without throwing', async () => {
    // Our route returns structured { success:false, error } with a 4xx/5xx — the
    // helper must hand that back so the caller can read the real error message.
    const result = await parseJsonResponse<{ success: boolean; error: string }>(
      jsonResponse({ success: false, error: 'Proposal not found' }, { status: 404 }),
    );
    expect(result).toEqual({ success: false, error: 'Proposal not found' });
  });

  test('throws a readable timeout message when a killed function returns a non-JSON body', async () => {
    // This is the exact regression: a platform-killed serverless function returns
    // a plain error page like "An error occurred...". response.json() would throw
    // "Unexpected token 'A' ... is not valid JSON"; we must not surface that.
    const response = new Response('An error occurred with this application.', { status: 500 });
    await expect(parseJsonResponse(response)).rejects.toThrow(
      'The server took too long to respond. Please try again in a moment.',
    );
  });

  test('does not leak the raw SyntaxError text', async () => {
    const response = new Response('<html>502 Bad Gateway</html>', { status: 502 });
    await expect(parseJsonResponse(response)).rejects.not.toThrow(/Unexpected token|not valid JSON/);
  });

  test('throws the ok-branch message when a 2xx body is unexpectedly non-JSON', async () => {
    const response = new Response('not json', { status: 200 });
    await expect(parseJsonResponse(response)).rejects.toThrow(
      'The server returned an unexpected response. Please try again.',
    );
  });

  test('treats an empty body as an empty object rather than throwing', async () => {
    const response = new Response('', { status: 200 });
    await expect(parseJsonResponse(response)).resolves.toEqual({});
  });
});
