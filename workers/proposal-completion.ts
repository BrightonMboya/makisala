import { Resource } from "sst";
import postgres from "postgres";

export default {
  async scheduled(
    _event: ScheduledEvent,
    _env: Record<string, string>,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(processCompletions());
  },
};

async function processCompletions() {
  const sql = postgres(Resource.DatabaseUrl.value, {
    ssl: "prefer",
    max: 1,
    idle_timeout: 10,
  });

  try {
    // Find proposals where trip has ended:
    // status is 'shared' or 'accepted' AND startDate + day_count - 1 < today
    const completedProposals = await sql`
      UPDATE proposals
      SET status = 'completed', updated_at = NOW()
      WHERE id IN (
        SELECT p.id
        FROM proposals p
        LEFT JOIN (
          SELECT proposal_id, COUNT(*) AS day_count
          FROM proposal_days
          GROUP BY proposal_id
        ) d ON d.proposal_id = p.id
        WHERE p.status IN ('shared', 'accepted')
          AND p.start_date IS NOT NULL
          AND p.start_date + INTERVAL '1 day' * COALESCE(d.day_count, 1) < NOW()
      )
      RETURNING id
    `;

    console.log(`Auto-completed ${completedProposals.length} proposals`);

    // Process pending workflow executions
    const pendingExecutions = await sql`
      SELECT
        we.id AS execution_id,
        we.workflow_id,
        we.proposal_id,
        w.action_type,
        w.action_config,
        p.tour_title,
        p.name AS proposal_name,
        c.name AS client_name,
        c.email AS client_email,
        o.name AS org_name,
        o.notification_email AS org_email
      FROM workflow_executions we
      JOIN workflows w ON w.id = we.workflow_id
      JOIN proposals p ON p.id = we.proposal_id
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN organizations o ON o.id = p.organization_id
      WHERE we.status = 'pending'
        AND we.scheduled_for <= NOW()
        AND w.status = 'active'
      ORDER BY we.scheduled_for ASC
      LIMIT 50
    `;

    for (const exec of pendingExecutions) {
      try {
        await sql`
          UPDATE workflow_executions
          SET status = 'running'
          WHERE id = ${exec.execution_id}
        `;

        if (exec.action_type === "send_email") {
          const config = exec.action_config as {
            emailSubject: string;
            emailBody: string;
            recipientType: "client" | "team";
          };

          const recipientEmail =
            config.recipientType === "client"
              ? exec.client_email
              : exec.org_email;

          if (!recipientEmail) {
            throw new Error(
              `No ${config.recipientType} email found for proposal ${exec.proposal_id}`,
            );
          }

          // Template variable replacement
          const subject = replaceVariables(config.emailSubject, exec);
          const body = replaceVariables(config.emailBody, exec);

          const resendApiKey = process.env.RESEND_API_KEY;
          if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

          const emailResult = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${exec.org_name} <noreply@makisala.com>`,
              to: recipientEmail,
              subject,
              html: body,
            }),
          });

          if (!emailResult.ok) {
            const errorText = await emailResult.text();
            throw new Error(`Resend API error: ${errorText}`);
          }

          const emailData = (await emailResult.json()) as { id?: string };

          await sql`
            UPDATE workflow_executions
            SET status = 'completed', executed_at = NOW(),
                result = ${JSON.stringify({ success: true, emailId: emailData.id })}::jsonb
            WHERE id = ${exec.execution_id}
          `;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Workflow execution ${exec.execution_id} failed:`,
          errorMsg,
        );

        await sql`
          UPDATE workflow_executions
          SET status = 'failed', executed_at = NOW(),
              result = ${JSON.stringify({ success: false, error: errorMsg })}::jsonb
          WHERE id = ${exec.execution_id}
        `;
      }
    }

    console.log(`Processed ${pendingExecutions.length} workflow executions`);
  } finally {
    await sql.end();
  }
}

function replaceVariables(
  template: string,
  data: Record<string, unknown>,
): string {
  return template
    .replace(/\{\{clientName\}\}/g, String(data.client_name || "Guest"))
    .replace(
      /\{\{proposalTitle\}\}/g,
      String(data.tour_title || data.proposal_name || "Your Trip"),
    )
    .replace(
      /\{\{organizationName\}\}/g,
      String(data.org_name || "Your Travel Agency"),
    );
}
