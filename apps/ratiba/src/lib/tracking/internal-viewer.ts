import { and, eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { member } from '@repo/db/schema';
import { getSession } from '@/lib/session';

// Staff previewing their own org's proposal/invoice link (e.g. the "Preview"
// button before sending) shouldn't count as a client view - otherwise the
// Activity sheet's "did they open it?" signal is meaningless. An outside
// operator opening a link a client forwarded them still counts, since their
// session (if any) belongs to a different org.
export async function isOwnOrgViewer(organizationId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  const [membership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(and(eq(member.userId, session.user.id), eq(member.organizationId, organizationId)))
    .limit(1);

  return !!membership;
}
