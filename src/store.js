import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialEntries = [
  {
    id: 'welcome-note',
    type: 'note',
    title: 'A place for the little things',
    content: 'A thought worth keeping, a list for later, a detail you do not want to lose. It all belongs here.',
    color: 'sage',
    pinned: true,
    archived: false,
    trashed: false,
    completed: false,
    reminderAt: '',
    items: [],
    createdAt: Date.now() - 3_600_000,
    updatedAt: Date.now() - 3_600_000,
  },
  {
    id: 'market-list',
    type: 'note',
    title: 'Saturday market',
    content: '',
    color: 'peach',
    pinned: false,
    archived: false,
    trashed: false,
    completed: false,
    reminderAt: '',
    items: [
      { id: 'market-1', text: 'Peaches, while they last', done: true },
      { id: 'market-2', text: 'Fresh basil', done: false },
      { id: 'market-3', text: 'A loaf for the week', done: false },
    ],
    createdAt: Date.now() - 7_200_000,
    updatedAt: Date.now() - 7_200_000,
  },
  {
    id: 'follow-up-task',
    type: 'task',
    title: 'Send the studio follow-up',
    content: 'Share the notes from Tuesday and ask about next steps.',
    color: 'sky',
    pinned: false,
    archived: false,
    trashed: false,
    completed: false,
    reminderAt: '',
    items: [],
    createdAt: Date.now() - 10_800_000,
    updatedAt: Date.now() - 10_800_000,
  },
];

function loadEntries() {
  try {
    const storedEntries = JSON.parse(localStorage.getItem('daymark.entries') || 'null');
    return Array.isArray(storedEntries) ? storedEntries : initialEntries;
  } catch {
    return initialEntries;
  }
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    entries: loadEntries(),
    view: 'notes',
    search: '',
    syncStatus: 'local',
  },
  reducers: {
    addEntry: {
      reducer(state, action) {
        state.entries.unshift(action.payload);
      },
      prepare(entry) {
        const now = Date.now();
        return {
          payload: {
            id: globalThis.crypto?.randomUUID?.() || `entry-${now}-${Math.random().toString(36).slice(2, 8)}`,
            color: 'paper',
            pinned: false,
            archived: false,
            trashed: false,
            completed: false,
            reminderAt: '',
            items: [],
            createdAt: now,
            updatedAt: now,
            ...entry,
          },
          meta: { persist: true },
        };
      },
    },
    updateEntry: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload.id);
        if (entry) Object.assign(entry, action.payload.changes, { updatedAt: Date.now() });
      },
      prepare(payload) {
        return { payload, meta: { persist: true } };
      },
    },
    togglePin: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.pinned = !entry.pinned;
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    toggleEntryCompleted: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.completed = !entry.completed;
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    archiveEntry: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.archived = !entry.archived;
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    trashEntry: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.trashed = true;
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    restoreEntry: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.trashed = false;
          entry.archived = false;
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    deleteEntry: {
      reducer(state, action) {
        state.entries = state.entries.filter((item) => item.id !== action.payload);
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    setEntryColor: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload.id);
        if (entry) {
          entry.color = action.payload.color;
          entry.updatedAt = Date.now();
        }
      },
      prepare(payload) {
        return { payload, meta: { persist: true } };
      },
    },
    setEntryReminder: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload.id);
        if (entry) {
          entry.reminderAt = action.payload.reminderAt;
          entry.updatedAt = Date.now();
        }
      },
      prepare(payload) {
        return { payload, meta: { persist: true } };
      },
    },
    removeReminder: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload);
        if (entry) {
          entry.reminderAt = '';
          entry.updatedAt = Date.now();
        }
      },
      prepare(id) {
        return { payload: id, meta: { persist: true } };
      },
    },
    toggleChecklistItem: {
      reducer(state, action) {
        const entry = state.entries.find((item) => item.id === action.payload.id);
        const checklistItem = entry?.items.find((item) => item.id === action.payload.itemId);
        if (checklistItem) {
          checklistItem.done = !checklistItem.done;
          entry.updatedAt = Date.now();
        }
      },
      prepare(payload) {
        return { payload, meta: { persist: true } };
      },
    },
    setView(state, action) {
      state.view = action.payload;
    },
    setSearch(state, action) {
      state.search = action.payload;
    },
    hydrateEntries: {
      reducer(state, action) {
        state.entries = action.payload;
      },
      prepare(entries) {
        return { payload: entries, meta: { persistLocal: true } };
      },
    },
    setSyncStatus(state, action) {
      state.syncStatus = action.payload;
    },
  },
});

let syncTimer;
const persistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (action.meta?.persist || action.meta?.persistLocal) {
    const entries = store.getState().workspace.entries;
    try {
      localStorage.setItem('daymark.entries', JSON.stringify(entries));
    } catch {
      store.dispatch(workspaceSlice.actions.setSyncStatus('local'));
    }
    if (!action.meta.persist) return result;
    store.dispatch(workspaceSlice.actions.setSyncStatus('saving'));
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      fetch('/api/entries/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('API unavailable');
          store.dispatch(workspaceSlice.actions.setSyncStatus('connected'));
        })
        .catch(() => store.dispatch(workspaceSlice.actions.setSyncStatus('local')));
    }, 350);
  }
  return result;
};

export const {
  addEntry,
  archiveEntry,
  deleteEntry,
  hydrateEntries,
  removeReminder,
  restoreEntry,
  setEntryColor,
  setEntryReminder,
  setSearch,
  setSyncStatus,
  setView,
  toggleChecklistItem,
  toggleEntryCompleted,
  togglePin,
  trashEntry,
  updateEntry,
} = workspaceSlice.actions;

export const store = configureStore({
  reducer: { workspace: workspaceSlice.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistenceMiddleware),
});
