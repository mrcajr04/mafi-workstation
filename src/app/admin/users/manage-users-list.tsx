"use client";

import { RoleType } from "@prisma/client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resendInvite,
  setUserActiveStatus,
  updateUserProfile,
} from "@/lib/actions/admin-actions";
import { cn } from "@/lib/utils";

type ManagedUser = {
  canResendInvite: boolean;
  email: string;
  fullName: string;
  id: string;
  isActive: boolean;
  isSelf: boolean;
  nmlsNumber: string;
  phone: string;
  role: RoleType;
};

type ManageUsersListProps = {
  users: ManagedUser[];
};

const roles = [
  RoleType.BDR,
  RoleType.LICENSED_LO,
  RoleType.LOAN_PROCESSOR,
  RoleType.COMPLIANCE_OFFICER,
  RoleType.OWNER,
];

const userProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    nmlsNumber: z.string().optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(RoleType, {
      error: "Role is required.",
    }),
  })
  .superRefine((values, context) => {
    if (values.role === RoleType.LICENSED_LO && !values.nmlsNumber?.trim()) {
      context.addIssue({
        code: "custom",
        message: "NMLS number is required for Licensed LO users.",
        path: ["nmlsNumber"],
      });
    }
  });

type UserProfileValues = z.infer<typeof userProfileSchema>;

export function ManageUsersList({ users }: ManageUsersListProps) {
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [displayUsers, setDisplayUsers] = useState(users);
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  function updateDisplayedUser(userId: string, nextUser: Partial<ManagedUser>) {
    setDisplayUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, ...nextUser } : user,
      ),
    );
  }

  async function handleResendInvite(user: ManagedUser) {
    setResendingUserId(user.id);

    const result = await resendInvite(user.id);

    setResendingUserId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Invite resent to ${user.email}`);
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {displayUsers.map((user) => (
          <UserCard
            key={user.id}
            onSelect={() => setSelectedUser(user)}
            onResendInvite={() => handleResendInvite(user)}
            isResendingInvite={resendingUserId === user.id}
            user={user}
          />
        ))}
      </div>

      <Card className="hidden border-mafi-border bg-mafi-bg-white md:block">
        <CardContent className="p-0">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.75fr)_minmax(0,0.65fr)_minmax(0,0.85fr)] border-b border-mafi-border bg-mafi-bg-lighter text-sm font-semibold text-mafi-text-dark">
            <div className="px-4 py-3">Full name</div>
            <div className="px-4 py-3">Email</div>
            <div className="px-4 py-3">Phone</div>
            <div className="px-4 py-3">Role</div>
            <div className="px-4 py-3">Status</div>
            <div className="px-4 py-3">Actions</div>
          </div>
          {displayUsers.map((user) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.75fr)_minmax(0,0.65fr)_minmax(0,0.85fr)] border-b border-mafi-border text-sm transition last:border-b-0 hover:bg-mafi-bg-light"
              key={user.id}
              onClick={() => setSelectedUser(user)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedUser(user);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="truncate px-4 py-3 font-semibold text-mafi-text-dark">
                {user.fullName}
              </div>
              <div className="truncate px-4 py-3 text-mafi-text-mid">
                {user.email}
              </div>
              <div className="truncate px-4 py-3 text-mafi-text-mid">
                {user.phone || "Not provided"}
              </div>
              <div className="truncate px-4 py-3 text-mafi-text-mid">
                {user.role}
              </div>
              <div className="px-4 py-3">
                <StatusBadge isActive={user.isActive} />
              </div>
              <div
                className="px-4 py-2"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {user.canResendInvite ? (
                  <Button
                    className="h-8 px-3 text-xs"
                    disabled={resendingUserId === user.id}
                    onClick={() => handleResendInvite(user)}
                    type="button"
                    variant="outline"
                  >
                    {resendingUserId === user.id ? "Sending..." : "Resend Invite"}
                  </Button>
                ) : (
                  <span className="text-xs text-mafi-text-light">-</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedUser ? (
        <UserEditModal
          key={selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onUpdated={(nextUser) => {
            updateDisplayedUser(selectedUser.id, nextUser);
            setSelectedUser((currentUser) =>
              currentUser ? { ...currentUser, ...nextUser } : currentUser,
            );
          }}
          user={selectedUser}
        />
      ) : null}
    </>
  );
}

function UserCard({
  isResendingInvite,
  onSelect,
  onResendInvite,
  user,
}: {
  isResendingInvite: boolean;
  onSelect: () => void;
  onResendInvite: () => void;
  user: ManagedUser;
}) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-off transition hover:border-mafi-blue-primary hover:bg-mafi-bg-light">
      <button className="block w-full p-4 text-left" onClick={onSelect} type="button">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-mafi-text-dark">
              {user.fullName}
            </p>
            <p className="mt-1 truncate text-xs text-mafi-text-mid">
              Email: {user.email}
            </p>
            <p className="mt-1 truncate text-xs text-mafi-text-mid">
              Phone: {user.phone || "Not provided"}
            </p>
          </div>
          <StatusBadge isActive={user.isActive} />
        </div>
        <p className="mt-3 text-xs text-mafi-text-mid">{user.role}</p>
      </button>
      {user.canResendInvite ? (
        <div className="border-t border-mafi-border px-4 py-3">
          <Button
            className="h-9 w-full text-xs"
            disabled={isResendingInvite}
            onClick={onResendInvite}
            type="button"
            variant="outline"
          >
            {isResendingInvite ? "Sending..." : "Resend Invite"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
        isActive
          ? "border-mafi-status-green bg-mafi-status-green/15 text-mafi-text-dark"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function UserEditModal({
  onClose,
  onUpdated,
  user,
}: {
  onClose: () => void;
  onUpdated: (nextUser: Partial<ManagedUser>) => void;
  user: ManagedUser;
}) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [pendingValues, setPendingValues] = useState<UserProfileValues | null>(
    null,
  );
  const [confirmationType, setConfirmationType] = useState<
    "promote-owner" | "demote-owner" | null
  >(null);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UserProfileValues>({
    defaultValues: {
      fullName: user.fullName,
      nmlsNumber: user.nmlsNumber,
      phone: user.phone,
      role: user.role,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(userProfileSchema),
  });
  const showNmls =
    selectedRole === RoleType.LICENSED_LO || selectedRole === RoleType.OWNER;

  async function saveUserProfile(values: UserProfileValues) {
    setError("");
    setIsSaving(true);

    const result = await updateUserProfile({
      fullName: values.fullName,
      nmlsNumber: showNmls ? values.nmlsNumber : undefined,
      phone: values.phone,
      role: values.role,
      userId: user.id,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    onUpdated({
      fullName: values.fullName,
      nmlsNumber: showNmls ? values.nmlsNumber ?? "" : "",
      phone: values.phone ?? "",
      role: values.role,
    });
    toast.success("User profile updated.");
    onClose();
  }

  function onSubmit(values: UserProfileValues) {
    if (user.role !== RoleType.OWNER && values.role === RoleType.OWNER) {
      setPendingValues(values);
      setConfirmationType("promote-owner");
      return;
    }

    if (user.role === RoleType.OWNER && values.role !== RoleType.OWNER) {
      setPendingValues(values);
      setConfirmationType("demote-owner");
      return;
    }

    void saveUserProfile(values);
  }

  function confirmRoleChange() {
    if (!pendingValues) {
      return;
    }

    setConfirmationType(null);
    void saveUserProfile(pendingValues);
  }

  async function toggleActive() {
    if (user.isSelf && user.isActive) {
      setError("You cannot deactivate your own account.");
      return;
    }

    setError("");
    setIsTogglingActive(true);

    const nextIsActive = !user.isActive;
    const result = await setUserActiveStatus(user.id, nextIsActive);

    setIsTogglingActive(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    onUpdated({
      isActive: nextIsActive,
    });
    toast.success(nextIsActive ? "User reactivated." : "User deactivated.");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-mafi-text-dark/45 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-mafi-border bg-mafi-bg-off shadow-xl">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <button
              className="rounded-md px-2 py-1 text-sm font-semibold text-mafi-text-mid hover:bg-mafi-bg-lighter"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  aria-invalid={Boolean(errors.fullName)}
                  className={cn(errors.fullName && "border-destructive")}
                  id="fullName"
                  {...register("fullName")}
                />
                {errors.fullName ? (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value as RoleType);
                        setSelectedRole(value as RoleType);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger
                        aria-invalid={Boolean(errors.role)}
                        className={cn(errors.role && "border-destructive")}
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="z-[90]">
                        {roles.map((roleOption) => (
                          <SelectItem key={roleOption} value={roleOption}>
                            {roleOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role ? (
                  <p className="text-sm text-destructive">
                    {errors.role.message}
                  </p>
                ) : null}
              </div>
              {showNmls ? (
                <div className="space-y-2">
                  <Label htmlFor="nmlsNumber">
                    NMLS number{" "}
                    {selectedRole === RoleType.LICENSED_LO ? (
                      <span className="text-destructive">*</span>
                    ) : null}
                  </Label>
                  <Input
                    aria-invalid={Boolean(errors.nmlsNumber)}
                    className={cn(errors.nmlsNumber && "border-destructive")}
                    id="nmlsNumber"
                    {...register("nmlsNumber")}
                  />
                  {errors.nmlsNumber ? (
                    <p className="text-sm text-destructive">
                      {errors.nmlsNumber.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-col-reverse gap-3 border-t border-mafi-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                disabled={(user.isSelf && user.isActive) || isTogglingActive}
                onClick={toggleActive}
                type="button"
                variant="outline"
              >
                {isTogglingActive
                  ? "Updating..."
                  : user.isActive
                    ? "Deactivate"
                    : "Reactivate"}
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
            {user.isSelf && user.isActive ? (
              <p className="text-xs text-mafi-text-light">
                You cannot deactivate your own account.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <AlertDialog
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setConfirmationType(null);
            setPendingValues(null);
          }
        }}
        open={Boolean(confirmationType)}
      >
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmationType === "promote-owner"
                ? `Make ${user.fullName} an Owner?`
                : `Remove Owner access from ${user.fullName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationType === "promote-owner"
                ? "They will receive full system control, including user management and compliance-level access."
                : `They will lose full system control and be changed to ${pendingValues?.role ?? "the selected role"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
