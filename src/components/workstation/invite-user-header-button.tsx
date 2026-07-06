import { Send } from "lucide-react";
import Link from "next/link";

export function InviteUserHeaderButton() {
  return (
    <Link
      aria-label="Invite User"
      className="inline-flex size-10 items-center justify-center rounded-md text-white transition hover:bg-white/15 hover:text-white sm:size-11"
      href="/admin/invite-user"
      title="Invite User"
    >
      <Send className="size-5" />
    </Link>
  );
}
