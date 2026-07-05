import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button
        className="border-0 bg-transparent text-base font-semibold text-white shadow-none hover:bg-white/15 hover:text-white"
        size="default"
        type="submit"
        variant="ghost"
      >
        Sign out
      </Button>
    </form>
  );
}
