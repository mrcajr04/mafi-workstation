"use client";

import { RoleType } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
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
import { updateMarketingProfile } from "@/lib/actions/profile-actions";
import { cn } from "@/lib/utils";

const urlField = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || /^https?:\/\//i.test(value.trim()), {
    message: "URL must start with http:// or https://.",
  });

const marketingProfileSchema = z.object({
  facebookUrl: urlField,
  googleBusinessUrl: urlField,
  instagramUrl: urlField,
  landingPageBio: z.string().optional(),
  landingPageHeadline: z.string().optional(),
  linkedinUrl: urlField,
  profilePhotoUrl: urlField,
  whatsappNumber: z.string().optional(),
  xTwitterUrl: urlField,
});

type MarketingProfileValues = z.infer<typeof marketingProfileSchema>;

type MarketingProfileFormProps = {
  profile: {
    email: string;
    facebookUrl: string | null;
    fullName: string;
    googleBusinessUrl: string | null;
    instagramUrl: string | null;
    landingPageBio: string | null;
    landingPageHeadline: string | null;
    linkedinUrl: string | null;
    nmlsNumber: string | null;
    phone: string | null;
    profilePhotoUrl: string | null;
    role: RoleType;
    whatsappNumber: string | null;
    xTwitterUrl: string | null;
  };
};

export function MarketingProfileForm({ profile }: MarketingProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<MarketingProfileValues>({
    defaultValues: {
      facebookUrl: profile.facebookUrl ?? "",
      googleBusinessUrl: profile.googleBusinessUrl ?? "",
      instagramUrl: profile.instagramUrl ?? "",
      landingPageBio: profile.landingPageBio ?? "",
      landingPageHeadline: profile.landingPageHeadline ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      profilePhotoUrl: profile.profilePhotoUrl ?? "",
      whatsappNumber: profile.whatsappNumber ?? "",
      xTwitterUrl: profile.xTwitterUrl ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(marketingProfileSchema),
  });
  const values = useWatch({ control });
  const socialLinks = useMemo(
    () => [
      { label: "Facebook", value: values.facebookUrl },
      { label: "LinkedIn", value: values.linkedinUrl },
      { label: "Instagram", value: values.instagramUrl },
      { label: "X", value: values.xTwitterUrl },
      { label: "Google", value: values.googleBusinessUrl },
    ],
    [
      values.facebookUrl,
      values.googleBusinessUrl,
      values.instagramUrl,
      values.linkedinUrl,
      values.xTwitterUrl,
    ],
  );

  async function onSubmit(input: MarketingProfileValues) {
    setIsSubmitting(true);

    const result = await updateMarketingProfile(input);

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Marketing profile updated.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <CardTitle className="text-mafi-blue-primary">
              Public Profile
            </CardTitle>
            <CardDescription>
              These account details are shown here for context.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <ReadOnlyInfo label="Name" value={profile.fullName} />
            <ReadOnlyInfo label="Email" value={profile.email} />
            <ReadOnlyInfo label="Phone" value={profile.phone || "Not provided"} />
            {profile.role === RoleType.LICENSED_LO ? (
              <ReadOnlyInfo
                label="NMLS #"
                value={profile.nmlsNumber || "Not provided"}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <CardTitle className="text-mafi-blue-primary">
              Social Links
            </CardTitle>
            <CardDescription>
              Add the channels you want prospects to see.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <UrlInput
              error={errors.facebookUrl?.message}
              id="facebookUrl"
              label="Facebook"
              register={register}
            />
            <UrlInput
              error={errors.linkedinUrl?.message}
              id="linkedinUrl"
              label="LinkedIn"
              register={register}
            />
            <UrlInput
              error={errors.instagramUrl?.message}
              id="instagramUrl"
              label="Instagram"
              register={register}
            />
            <UrlInput
              error={errors.xTwitterUrl?.message}
              id="xTwitterUrl"
              label="X / Twitter"
              register={register}
            />
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp number</Label>
              <Input id="whatsappNumber" {...register("whatsappNumber")} />
            </div>
            <UrlInput
              error={errors.googleBusinessUrl?.message}
              id="googleBusinessUrl"
              label="Google My Business"
              register={register}
            />
          </CardContent>
        </Card>

        <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <CardTitle className="text-mafi-blue-primary">
              Landing Page
            </CardTitle>
            <CardDescription>
              Draft the simple public-facing introduction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <UrlInput
              error={errors.profilePhotoUrl?.message}
              id="profilePhotoUrl"
              label="Profile Photo URL"
              register={register}
            />
            <div className="space-y-2">
              <Label htmlFor="landingPageHeadline">Headline</Label>
              <Input
                id="landingPageHeadline"
                placeholder="Helping families find the right mortgage path"
                {...register("landingPageHeadline")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landingPageBio">Bio</Label>
              <textarea
                className="min-h-36 w-full rounded-md border border-mafi-border bg-white px-3 py-2 text-sm text-mafi-text-dark outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary"
                id="landingPageBio"
                placeholder="Write a short introduction for prospects."
                {...register("landingPageBio")}
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Saving..." : "Save marketing profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden border-mafi-border bg-mafi-bg-white shadow-sm">
          <div className="bg-gradient-hero px-5 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">
              Live Preview
            </p>
            <h2 className="mt-2 text-2xl font-bold">Public profile card</h2>
          </div>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start gap-4">
              {values.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-20 rounded-md border border-mafi-border object-cover"
                  src={values.profilePhotoUrl}
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-md border border-mafi-border bg-mafi-bg-light text-xl font-bold text-mafi-blue-primary">
                  {initials(profile.fullName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold text-mafi-text-dark">
                  {profile.fullName}
                </p>
                <p className="mt-1 text-sm text-mafi-text-mid">
                  {profile.email}
                </p>
                {profile.role === RoleType.LICENSED_LO ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-mafi-text-light">
                    NMLS {profile.nmlsNumber || "Not provided"}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-mafi-blue-primary">
                {values.landingPageHeadline?.trim() ||
                  "Your mortgage resource"}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-mafi-text-mid">
                {values.landingPageBio?.trim() ||
                  "Add a short bio so prospects know how you can help."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {socialLinks
                .filter((link) => link.value?.trim())
                .map((link) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-mafi-border bg-mafi-bg-light px-3 py-1 text-xs font-semibold text-mafi-text-dark"
                    key={link.label}
                  >
                    {link.label}
                    <ExternalLink className="size-3" />
                  </span>
                ))}
              {values.whatsappNumber?.trim() ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-mafi-border bg-mafi-bg-light px-3 py-1 text-xs font-semibold text-mafi-text-dark">
                  WhatsApp
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ReadOnlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mafi-text-light">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-mafi-text-dark">{value}</p>
    </div>
  );
}

function UrlInput({
  error,
  id,
  label,
  register,
}: {
  error?: string;
  id: keyof MarketingProfileValues;
  label: string;
  register: ReturnType<typeof useForm<MarketingProfileValues>>["register"];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-invalid={Boolean(error)}
        className={cn(error && "border-destructive")}
        id={id}
        placeholder="https://..."
        {...register(id)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
