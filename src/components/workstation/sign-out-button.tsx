import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button
        className="border-0 bg-transparent px-2 text-sm font-semibold text-white shadow-none hover:bg-white/15 hover:text-white sm:px-4 sm:text-base"
        size="default"
        type="submit"
        variant="ghost"
      >
        Sign out
      </Button>
    </form>
  );
}
