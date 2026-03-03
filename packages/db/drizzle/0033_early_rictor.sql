CREATE TYPE "public"."workflow_action_type" AS ENUM('send_email');--> statement-breakpoint
CREATE TYPE "public"."workflow_execution_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."workflow_trigger_type" AS ENUM('proposal_completed', 'proposal_accepted', 'proposal_shared', 'trip_ended', 'trip_starting_soon');--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"proposal_id" text NOT NULL,
	"execution_status" "workflow_execution_status" DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp(3) NOT NULL,
	"executed_at" timestamp(3),
	"result" json,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" "workflow_trigger_type" NOT NULL,
	"trigger_config" json DEFAULT '{}'::json,
	"action_type" "workflow_action_type" NOT NULL,
	"action_config" json NOT NULL,
	"status" "workflow_status" DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workflow_executions_status_scheduled" ON "workflow_executions" USING btree ("execution_status","scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_workflow_executions_workflow" ON "workflow_executions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflows_org_status" ON "workflows" USING btree ("organization_id","status");