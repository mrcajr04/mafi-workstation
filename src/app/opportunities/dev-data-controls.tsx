"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteAllDevContacts,
  seedDevContacts,
} from "@/lib/actions/contact-actions";

export function DevDataControls() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deleteAll() {
    startTransition(async () => {
      const result = await deleteAllDevContacts();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Deleted ${result.count} contacts.`);
      router.refresh();
    });
  }

  function seedData() {
    const answer = window.prompt("How many contacts do you want to seed?", "10");
    const count = Number(answer);

    if (!answer) {
      return;
    }

    if (!Number.isFinite(count) || count < 1) {
      toast.error("Enter a valid number of contacts.");
      return;
    }

    startTransition(async () => {
      const result = await seedDevContacts(count);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Seeded ${result.count} contacts.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button
        disabled={isPending}
        onClick={deleteAll}
        type="button"
        variant="destructive"
      >
        Delete All
      </Button>
      <Button disabled={isPending} onClick={seedData} type="button">
        Seed Data
      </Button>
    </div>
  );
}
