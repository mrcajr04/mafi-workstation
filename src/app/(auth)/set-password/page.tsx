"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completePasswordSetup,
  getPasswordSetupStatus,
} from "@/lib/actions/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm password is required."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SetPasswordValues = z.infer<typeof setPasswordSchema>;

function getHashTokens() {
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(setPasswordSchema),
  });

  useEffect(() => {
    async function prepareSession() {
      const code = searchParams.get("code");
      const supabase = createClient();
      const hashTokens = getHashTokens();

      if (hashTokens) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashTokens.accessToken,
          refresh_token: hashTokens.refreshToken,
        });

        if (sessionError) {
          setError("This invite link is invalid or expired.");
          setIsReady(true);
          return;
        }

        window.history.replaceState(null, "", "/set-password");
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          code,
        );

        if (exchangeError) {
          setError("This invite link is invalid or expired.");
          setIsReady(true);
          return;
        }

        router.replace("/set-password");
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setError("This invite session is invalid or expired.");
        setIsReady(true);
        return;
      }

      const status = await getPasswordSetupStatus();

      if (!status.success) {
        setError("This invite session is invalid or expired.");
        setIsReady(true);
        return;
      }

      if (!status.passwordSetupRequired) {
        router.replace("/opportunities");
        router.refresh();
        return;
      }

      setIsReady(true);
    }

    void prepareSession();
  }, [router, searchParams]);

  async function onSubmit(values: SetPasswordValues) {
    setError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    const result = await completePasswordSetup();

    setIsSubmitting(false);

    if (!result.success) {
      setError("Password saved, but account setup could not be completed.");
      return;
    }

    router.replace("/opportunities");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md border-mafi-border bg-mafi-bg-off">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Create the password you will use to sign in next time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                className={cn(errors.password && "border-destructive")}
                disabled={!isReady}
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={cn(errors.confirmPassword && "border-destructive")}
                disabled={!isReady}
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              className="w-full"
              disabled={!isReady || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Save password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
