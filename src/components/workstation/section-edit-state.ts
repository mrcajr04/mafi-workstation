"use client";

import { useRef, useState } from "react";

export type SectionEditMutableState<TSnapshot> = {
  isEditing: boolean;
  isSaving: boolean;
  lastSavedSnapshot: TSnapshot;
};

export type SectionEditStateOptions<TSnapshot> = {
  defaultEditing?: boolean;
  initialSnapshot: TSnapshot;
  restoreSnapshot: (snapshot: TSnapshot) => void;
};

export function createSectionEditMutableState<TSnapshot>(
  initialSnapshot: TSnapshot,
  defaultEditing = false,
): SectionEditMutableState<TSnapshot> {
  return {
    isEditing: defaultEditing,
    isSaving: false,
    lastSavedSnapshot: initialSnapshot,
  };
}

export function enterSectionEdit<TSnapshot>(
  state: SectionEditMutableState<TSnapshot>,
) {
  if (state.isSaving) {
    return false;
  }

  state.isEditing = true;
  return true;
}

export function exitSectionEdit<TSnapshot>(
  state: SectionEditMutableState<TSnapshot>,
) {
  state.isEditing = false;
}

export function cancelSectionEdit<TSnapshot>(
  state: SectionEditMutableState<TSnapshot>,
  restoreSnapshot: (snapshot: TSnapshot) => void,
) {
  if (state.isSaving) {
    return false;
  }

  restoreSnapshot(state.lastSavedSnapshot);
  state.isEditing = false;
  return true;
}

export async function saveSectionEdit<TSnapshot>(
  state: SectionEditMutableState<TSnapshot>,
  saveRequest: () => Promise<TSnapshot | null>,
) {
  if (state.isSaving) {
    return false;
  }

  state.isSaving = true;

  try {
    const nextSnapshot = await saveRequest();

    if (!nextSnapshot) {
      return false;
    }

    state.lastSavedSnapshot = nextSnapshot;
    state.isEditing = false;
    return true;
  } finally {
    state.isSaving = false;
  }
}

export function updateSectionSnapshot<TSnapshot>(
  state: SectionEditMutableState<TSnapshot>,
  nextSnapshot: TSnapshot,
) {
  state.lastSavedSnapshot = nextSnapshot;
}

export function useSectionEditState<TSnapshot>({
  defaultEditing = false,
  initialSnapshot,
  restoreSnapshot,
}: SectionEditStateOptions<TSnapshot>) {
  const stateRef = useRef(
    createSectionEditMutableState(initialSnapshot, defaultEditing),
  );
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [isSaving, setIsSaving] = useState(false);

  function syncState() {
    setIsEditing(stateRef.current.isEditing);
    setIsSaving(stateRef.current.isSaving);
  }

  function enterEdit() {
    enterSectionEdit(stateRef.current);
    syncState();
  }

  function exitEdit() {
    exitSectionEdit(stateRef.current);
    syncState();
  }

  function cancel() {
    const didCancel = cancelSectionEdit(stateRef.current, restoreSnapshot);
    syncState();
    return didCancel;
  }

  async function save(saveRequest: () => Promise<TSnapshot | null>) {
    if (stateRef.current.isSaving) {
      return false;
    }

    stateRef.current.isSaving = true;
    syncState();

    try {
      const nextSnapshot = await saveRequest();

      if (!nextSnapshot) {
        return false;
      }

      stateRef.current.lastSavedSnapshot = nextSnapshot;
      stateRef.current.isEditing = false;
      return true;
    } finally {
      stateRef.current.isSaving = false;
      syncState();
    }
  }

  function updateSnapshot(nextSnapshot: TSnapshot) {
    updateSectionSnapshot(stateRef.current, nextSnapshot);
  }

  return {
    cancel,
    enterEdit,
    exitEdit,
    isEditing,
    isSaving,
    save,
    updateSnapshot,
  };
}
