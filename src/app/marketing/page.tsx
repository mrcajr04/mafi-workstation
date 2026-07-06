import { RoleType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingProfileForm } from "@/app/marketing/marketing-profile-form";
import { requireRole } from "@/lib/rbac";

export default async function MarketingPage() {
  const access = await requireRole([RoleType.BDR, RoleType.LICENSED_LO]);

  if (!access.success) {
    return (
      <main className="mx-auto max-w-5xl">
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            Not authorized. Marketing is available only to BDR and Licensed LO
            roles.
          </CardContent>
        </Card>
      </main>
    );
  }

  const profile = access.data;

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Personal Toolkit
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Marketing
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Manage your social links and landing page copy from one simple
          officer-level profile panel.
        </p>
      </div>

      <MarketingProfileForm
        profile={{
          email: profile.email,
          facebookUrl: profile.facebookUrl,
          fullName: profile.fullName,
          googleBusinessUrl: profile.googleBusinessUrl,
          instagramUrl: profile.instagramUrl,
          landingPageBio: profile.landingPageBio,
          landingPageHeadline: profile.landingPageHeadline,
          linkedinUrl: profile.linkedinUrl,
          nmlsNumber: profile.nmlsNumber,
          phone: profile.phone,
          profilePhotoUrl: profile.profilePhotoUrl,
          role: profile.role,
          whatsappNumber: profile.whatsappNumber,
          xTwitterUrl: profile.xTwitterUrl,
        }}
      />
    </main>
  );
}
