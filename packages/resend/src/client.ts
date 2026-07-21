import { Resend } from 'resend';
import { env } from './env';

// Hard stop against sending real email from tests. The @repo/resend mock relies
// on a bunfig preload; when that once failed to load, tests sent live mail. This
// refuses to construct a client under NODE_ENV=test so a slip fails loudly.
function createResend(): Resend {
  if (process.env.NODE_ENV === 'test') {
    return new Proxy({} as Resend, {
      get() {
        throw new Error(
          'Refusing to send email in test env. Mock @repo/resend (see __tests__/helpers/setup.ts + bunfig.toml).',
        );
      },
    });
  }
  return new Resend(env.RESEND_API_KEY);
}

export const resend = createResend();
