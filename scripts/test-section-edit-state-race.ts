import {
  cancelSectionEdit,
  createSectionEditMutableState,
  enterSectionEdit,
  saveSectionEdit,
} from "../src/components/workstation/section-edit-state";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function verifySection<TSnapshot>({
  addedSnapshot,
  initialSnapshot,
  name,
  removedDraftLabel,
}: {
  addedSnapshot: TSnapshot;
  initialSnapshot: TSnapshot;
  name: string;
  removedDraftLabel: string;
}) {
  let restoredSnapshot: TSnapshot | null = null;
  const state = createSectionEditMutableState(initialSnapshot, true);
  const deferred = createDeferred<TSnapshot | null>();
  const savePromise = saveSectionEdit(state, () => deferred.promise);

  assert(state.isSaving, `${name}: Save did not enter in-flight state.`);
  assert(
    cancelSectionEdit(state, (snapshot) => {
      restoredSnapshot = snapshot;
    }) === false,
    `${name}: Cancel was not blocked during in-flight save.`,
  );
  assert(
    enterSectionEdit(state) === false,
    `${name}: Re-enter edit was not blocked during in-flight save.`,
  );
  assert(
    restoredSnapshot === null,
    `${name}: Cancel restored stale data while save was in-flight.`,
  );

  deferred.resolve(addedSnapshot);
  assert(
    (await savePromise) === true,
    `${name}: In-flight save did not resolve successfully.`,
  );
  assert(!state.isSaving, `${name}: Save lock did not release after save.`);
  assert(!state.isEditing, `${name}: Section did not exit edit after save.`);
  assert(
    sameJson(state.lastSavedSnapshot, addedSnapshot),
    `${name}: Last-saved snapshot was not updated after save.`,
  );

  assert(enterSectionEdit(state), `${name}: Could not reopen edit after save.`);
  assert(
    cancelSectionEdit(state, (snapshot) => {
      restoredSnapshot = snapshot;
    }),
    `${name}: Cancel with no changes did not exit cleanly.`,
  );
  assert(
    sameJson(restoredSnapshot, addedSnapshot),
    `${name}: Cancel after save did not restore the newly saved snapshot.`,
  );

  restoredSnapshot = null;
  assert(enterSectionEdit(state), `${name}: Could not reopen edit for removal test.`);
  assert(
    cancelSectionEdit(state, (snapshot) => {
      restoredSnapshot = snapshot;
    }),
    `${name}: Cancel before saving a removal did not exit cleanly.`,
  );
  assert(
    sameJson(restoredSnapshot, addedSnapshot),
    `${name}: ${removedDraftLabel} was not restored after cancel.`,
  );

  console.log(`${name}: PASS`);
}

async function main() {
  await verifySection({
    addedSnapshot: {
      prospectEmail: "updated@example.com",
      prospectName: "Updated Prospect",
      prospectPhone: "(312) 555-0199",
    },
    initialSnapshot: {
      prospectEmail: "old@example.com",
      prospectName: "Original Prospect",
      prospectPhone: "(312) 555-0100",
    },
    name: "Contact Info",
    removedDraftLabel: "Contact draft",
  });

  await verifySection({
    addedSnapshot: {
      coBorrowers: [
        {
          email: "co@example.com",
          name: "Saved Co-borrower",
          phone: "(312) 555-0111",
        },
      ],
    },
    initialSnapshot: {
      coBorrowers: [],
    },
    name: "Co-borrowers",
    removedDraftLabel: "Saved co-borrower",
  });

  await verifySection({
    addedSnapshot: {
      assets: [
        {
          amount: "$25,000",
          type: "CHECKING",
        },
      ],
      borrowerType: "PRIMARY",
      ficoScore: "740",
      ficoSource: "KNOWN_BANK",
      loanPurpose: "PURCHASE",
      vesting: "TRUST",
    },
    initialSnapshot: {
      assets: [],
      borrowerType: "",
      ficoScore: "",
      ficoSource: "UNKNOWN",
      loanPurpose: "",
      vesting: "",
    },
    name: "Financial Snapshot",
    removedDraftLabel: "Saved asset",
  });

  await verifySection({
    addedSnapshot: {
      additionalHoaFees: "$100",
      hoaManagementInfo: "Managed",
      hoaName: "HOA",
      insuranceType: "HAZARD_HO3",
      propertyAddress: "123 Main St, Chicago, IL 60601",
      propertyTaxesLastYear: "$4,000",
      propertyTaxesPresentYear: "$4,500",
      propertyType: "SFR",
    },
    initialSnapshot: {
      additionalHoaFees: "",
      hoaManagementInfo: "",
      hoaName: "",
      insuranceType: "",
      propertyAddress: "100 Old St, Chicago, IL 60601",
      propertyTaxesLastYear: "",
      propertyTaxesPresentYear: "",
      propertyType: "SFR",
    },
    name: "Property Details",
    removedDraftLabel: "Property details draft",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
