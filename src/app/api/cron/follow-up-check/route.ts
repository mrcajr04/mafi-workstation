import { CommandCenterTag, DecisionBranch } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  followUpDiscoveryCall,
  followUpNotMovingForward,
} from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
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
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_IN_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_IN_MS);

  const phase4Pipelines = await prisma.phase4Pipeline.findMany({
    where: {
      decisionBranch: DecisionBranch.PENDING,
      followUpEmailSentAt: null,
      updatedAt: {
        lte: fourteenDaysAgo,
      },
    },
    select: {
      contact: {
        select: {
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
      await sendEmail({
        html: followUpDiscoveryCall(pipeline.contact.prospectName),
        subject: "Checking in on your mortgage options",
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

  const commandCenterEntries = await prisma.commandCenterEntry.findMany({
    where: {
      followUpEmailSentAt: null,
      lastContactDate: {
        lte: sixtyDaysAgo,
      },
      tag: CommandCenterTag.RE_ENGAGEMENT,
    },
    select: {
      contact: {
        select: {
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
      await sendEmail({
        html: followUpNotMovingForward(entry.contact.prospectName),
        subject: "Want to revisit your mortgage options?",
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

  return NextResponse.json(summary);
}
