import { env } from '@/lib/env';

export async function GET() {
  if (!env.OPENAI_APPS_CHALLENGE_TOKEN) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(env.OPENAI_APPS_CHALLENGE_TOKEN, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
