import { Resend } from 'resend';
import { env } from './env';

// Hard stop against sending real email from tests. The test suite mocks
// @repo/resend, but that mock relies on a bunfig preload; when it once failed
// to load, the acceptance-flow tests sent live mail to @test.com addresses and
// bounced against the production sending domain. Even with the mock in place,
// refuse to construct a live client under NODE_ENV=test so no config slip can
// reach Resend again. Throwing on send makes the mistake loud instead of silent.
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
