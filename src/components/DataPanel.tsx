import { useEffect, useRef, useState } from 'react';
import { clearAllData, exportAll, replaceAllData } from '../db/queries';
import {
  backupFileName,
  downloadTextFile,
  MAX_FILE_BYTES,
  parseBackup,
  serializeBackup,
} from '../lib/backup';
import { IconDownload, IconUpload } from './icons';
import { Button, Callout } from './ui';
import type { BackupFile } from '../types';

type Pending = { backup: BackupFile; fileName: string } | null;

/**
 * Export, import and delete.
 *
 * Import and clear are both destructive and both ask twice. The second step
 * states exactly what will happen in counts, because "are you sure" without
 * numbers is not informed consent.
 */
export function DataPanel({
  counts,
  onNotice,
}: {
  counts: { foods: number; foodLogs: number; bodyWeights: number; workoutPlans: number };
  onNotice: (message: string, tone?: 'info' | 'error') => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState<Pending>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Both confirmations replace the button that opened them, so without this
  // focus would fall to <body> and the next Tab would restart from the top of
  // the page. Focus lands on Cancel rather than the destructive button: it is
  // the safe default if someone confirms by reflex.
  const cancelClearRef = useRef<HTMLButtonElement>(null);
  const cancelImportRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmingClear) cancelClearRef.current?.focus();
  }, [confirmingClear]);
  useEffect(() => {
    if (pending) cancelImportRef.current?.focus();
  }, [pending]);

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    try {
      const backup = await exportAll();
      downloadTextFile(backupFileName(), serializeBackup(backup));
      onNotice('Backup downloaded.');
    } catch {
      onNotice('The backup could not be created. Try downloading it again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file twice still fires a change.
    event.target.value = '';
    if (!file) return;
    if (busy) return;

    setImportError(undefined);
    setPending(null);
    if (file.size > MAX_FILE_BYTES) {
      setImportError(
        'That backup is too large. Choose a JSON backup smaller than 20 MB. Nothing was changed.',
      );
      return;
    }
    setBusy(true);

    try {
      const text = await file.text();
      const result = parseBackup(text);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setPending({ backup: result.value, fileName: file.name });
    } catch {
      setImportError('That file could not be read. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await replaceAllData(pending.backup);
      onNotice('Backup restored.');
      setPending(null);
    } catch {
      // replaceAllData runs in one transaction, so a failure here has
      // rolled back and the existing data is untouched.
      setImportError('The import failed and was rolled back. Your existing data is unchanged.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmClear() {
    if (busy) return;
    setBusy(true);
    try {
      await clearAllData();
      setConfirmingClear(false);
      onNotice('Everything was deleted.');
    } catch {
      onNotice('The data could not be cleared.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 p-4 sm:p-5">
      <section>
        <h3 className="text-base font-semibold">Export</h3>
        <p className="mt-1 max-w-(--container-measure) text-sm text-ink-2">
          Writes every food, entry, weight reading, target and workout program to a JSON file on
          this device. Nothing is uploaded. Keep a copy somewhere else, because clearing your
          browser data deletes everything this app has stored.
        </p>
        <div className="mt-3">
          <Button onClick={() => void handleExport()} disabled={busy}>
            <IconDownload />
            Download a backup
          </Button>
        </div>
        <p className="mt-2 numeric text-xs text-ink-3">
          {counts.foods} foods · {counts.foodLogs} entries · {counts.bodyWeights} weight readings ·{' '}
          {counts.workoutPlans} programs
        </p>
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="text-base font-semibold">Import</h3>
        <p className="mt-1 max-w-(--container-measure) text-sm text-ink-2">
          Restores a file written by Export. The file is checked in full before anything is written,
          and importing replaces everything currently stored rather than merging with it.
        </p>

        <div className="mt-3">
          {/*
            The real control is the button below. This input is only the file
            picker it delegates to, so it is taken out of the tab order rather
            than left as a clipped, unnamed stop for keyboard users.
          */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => void handleFileChosen(event)}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={busy}>
            <IconUpload />
            Choose a backup file
          </Button>
        </div>

        {importError ? (
          <div className="mt-3">
            <Callout tone="error">{importError}</Callout>
          </div>
        ) : null}

        {pending ? (
          <div className="mt-3 rounded-md border border-line-strong bg-sunken px-4 py-3">
            <p className="text-sm font-semibold text-ink">Replace everything with this file?</p>
            <p className="mt-1 numeric text-sm text-ink-2">
              {pending.fileName} holds {pending.backup.foods.length} foods,{' '}
              {pending.backup.foodLogs.length} entries and {pending.backup.bodyWeightLogs.length}{' '}
              weight readings and {pending.backup.workoutPlans.length} programs.
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Your current {counts.foods} foods, {counts.foodLogs} entries and {counts.bodyWeights}{' '}
              weight readings and {counts.workoutPlans} programs will be deleted.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button ref={cancelImportRef} onClick={() => setPending(null)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void confirmImport()} disabled={busy}>
                Replace everything
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="text-base font-semibold">Delete everything</h3>
        <p className="mt-1 max-w-(--container-measure) text-sm text-ink-2">
          Removes every food, entry, weight reading, target and workout program from this browser.
          There is no undo and the app keeps no automatic backup. Exported backup files are not
          deleted.
        </p>

        {!confirmingClear ? (
          <div className="mt-3">
            <Button onClick={() => setConfirmingClear(true)} disabled={busy}>
              Delete everything
            </Button>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-danger bg-danger-weak px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              Delete {counts.foods} foods, {counts.foodLogs} entries, {counts.bodyWeights} weight
              readings and {counts.workoutPlans} programs?
            </p>
            <p className="mt-1 text-sm text-ink-2">
              This cannot be undone. Download a backup first if you might want any of it back.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                ref={cancelClearRef}
                onClick={() => setConfirmingClear(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleExport()} disabled={busy}>
                <IconDownload />
                Download a backup first
              </Button>
              <Button variant="danger" onClick={() => void confirmClear()} disabled={busy}>
                Yes, delete everything
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
