"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { testPhase3Write } from "@/lib/actions/rbac-demo-actions";

export function Phase3RbacTest() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await testPhase3Write();

      if (!result.success) {
        setMessage(
          result.error === "FORBIDDEN"
            ? "You don't have permission to write Phase 3 data."
            : "You need to log in before testing Phase 3 access.",
        );
        return;
      }

      setMessage(result.data);
    });
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <Button disabled={isPending} onClick={handleClick} type="button">
        {isPending ? "Testing access..." : "Test Phase 3 write access"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
