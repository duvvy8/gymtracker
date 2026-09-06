import { create } from 'zustand';
import { addDays, todayIso } from './date';
import type { IsoDate } from '../types';

/**
 * Interface state only.
 *
 * Stored data is read straight from IndexedDB through Dexie's live queries,
 * so there is one source of truth for it. Mirroring records into this store
 * would create a second one that could fall out of step. What lives here is
 * the state that has no home in the database: which day is on screen, and
 * the transient message shown after an action.
 */

export type NoticeTone = 'info' | 'error';

export interface Notice {
  /** Changes on every notice so the same text shown twice still announces. */
  id: number;
  tone: NoticeTone;
  message: string;
}

interface AppState {
  selectedDate: IsoDate;
  shiftSelectedDate: (days: number) => void;
  goToToday: () => void;

  notice: Notice | null;
  showNotice: (message: string, tone?: NoticeTone) => void;
  dismissNotice: () => void;
}

let noticeCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  selectedDate: todayIso(),

  shiftSelectedDate: (days) =>
    set((state) => ({ selectedDate: addDays(state.selectedDate, days) })),

  goToToday: () => set({ selectedDate: todayIso() }),

  notice: null,

  showNotice: (message, tone = 'info') => {
    noticeCounter += 1;
    set({ notice: { id: noticeCounter, tone, message } });
  },

  dismissNotice: () => set({ notice: null }),
}));
