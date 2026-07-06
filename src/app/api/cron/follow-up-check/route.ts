import { CommandCenterTag, DecisionBranch } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getAutomationSettings } from "@/lib/automation-settings";
import { renderEmailTemplate } from "@/lib/email-template-store";
import { prisma } from "@/lib/prisma";

type CronSummary = {
  errors: string[];
  scenarioA_sent: number;
  scenarioB_sent: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === secret);
}

function isValidEmail(value?: string | null): value is string {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: CronSummary = {
    errors: [],
    scenarioA_sent: 0,
    scenarioB_sent: 0,
  };
  const now = new Date();
  const automationSettings = await getAutomationSettings();
  const discoveryFollowUpCutoff = new Date(
    now.getTime() - automationSettings.discoveryFollowUpDays * DAY_IN_MS,
  );
  const reEngagementFollowUpCutoff = new Date(
    now.getTime() - automationSettings.reEngagementFollowUpDays * DAY_IN_MS,
  );

  if (automationSettings.discoveryFollowUpEnabled) {
    const phase4Pipelines = await prisma.phase4Pipeline.findMany({
      where: {
        decisionBranch: DecisionBranch.PENDING,
        followUpEmailSentAt: null,
        updatedAt: {
          lte: discoveryFollowUpCutoff,
        },
      },
      select: {
        contact: {
          select: {
            assignedLO: {
              select: {
                fullName: true,
              },
            },
            prospectEmail: true,
            prospectName: true,
          },
        },
        id: true,
      },
    });

    for (const pipeline of phase4Pipelines) {
      const email = pipeline.contact.prospectEmail;

      if (!isValidEmail(email)) {
        const message = `Skipped Phase4Pipeline ${pipeline.id}: missing valid prospect email.`;
        console.warn(message);
        summary.errors.push(message);
        continue;
      }

      try {
        const emailTemplate = await renderEmailTemplate({
          loanOfficerName: pipeline.contact.assignedLO?.fullName,
          prospectName: pipeline.contact.prospectName,
          templateKey: "DISCOVERY_FOLLOW_UP",
        });

        await sendEmail({
          html: emailTemplate.html,
          subject: emailTemplate.subject,
          to: email,
        });

        await prisma.phase4Pipeline.update({
          where: {
            id: pipeline.id,
          },
          data: {
            followUpEmailSentAt: now,
          },
        });

        summary.scenarioA_sent += 1;
      } catch (error) {
        const message = `Failed Phase4Pipeline ${pipeline.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.warn(message);
        summary.errors.push(message);
      }
    }
  }

  if (automationSettings.reEngagementFollowUpEnabled) {
    const commandCenterEntries = await prisma.commandCenterEntry.findMany({
      where: {
        followUpEmailSentAt: null,
        lastContactDate: {
          lte: reEngagementFollowUpCutoff,
        },
        tag: CommandCenterTag.RE_ENGAGEMENT,
      },
      select: {
        contact: {
          select: {
            assignedLO: {
              select: {
                fullName: true,
              },
            },
            prospectEmail: true,
            prospectName: true,
          },
        },
        id: true,
      },
    });

    for (const entry of commandCenterEntries) {
      const email = entry.contact.prospectEmail;

      if (!isValidEmail(email)) {
        const message = `Skipped CommandCenterEntry ${entry.id}: missing valid prospect email.`;
        console.warn(message);
        summary.errors.push(message);
        continue;
      }

      try {
        const emailTemplate = await renderEmailTemplate({
          loanOfficerName: entry.contact.assignedLO?.fullName,
          prospectName: entry.contact.prospectName,
          templateKey: "RE_ENGAGEMENT_FOLLOW_UP",
        });

        await sendEmail({
          html: emailTemplate.html,
          subject: emailTemplate.subject,
          to: email,
        });

        await prisma.commandCenterEntry.update({
          where: {
            id: entry.id,
          },
          data: {
            followUpEmailSentAt: now,
          },
        });

        summary.scenarioB_sent += 1;
      } catch (error) {
        const message = `Failed CommandCenterEntry ${entry.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.warn(message);
        summary.errors.push(message);
      }
    }
  }

  return NextResponse.json(summary);
}
