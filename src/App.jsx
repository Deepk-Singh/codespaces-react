import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  Archive,
  Bell,
  Check,
  CheckSquare,
  CircleHelp,
  Clock3,
  Lightbulb,
  ListChecks,
  Menu,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import {
  addEntry,
  archiveEntry,
  deleteEntry,
  hydrateEntries,
  removeReminder,
  restoreEntry,
  setEntryColor,
  setEntryReminder,
  setSearch,
  setView,
  toggleChecklistItem,
  toggleEntryCompleted,
  togglePin,
  trashEntry,
  updateEntry,
} from './store';

const colors = [
  { name: 'Paper', value: 'paper' },
  { name: 'Rose', value: 'rose' },
  { name: 'Peach', value: 'peach' },
  { name: 'Sage', value: 'sage' },
  { name: 'Sky', value: 'sky' },
  { name: 'Lilac', value: 'lilac' },
];

const navItems = [
  { id: 'notes', label: 'Notes', icon: Lightbulb },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
];

function formatReminder(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function App() {
  const dispatch = useDispatch();
  const { entries, view, search, syncStatus } = useSelector((state) => state.workspace);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeType, setComposeType] = useState('note');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeReminder, setComposeReminder] = useState('');
  const [composeChecklist, setComposeChecklist] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch('/api/entries')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          if (data.entries?.length) dispatch(hydrateEntries(data.entries));
          dispatch({ type: 'workspace/setSyncStatus', payload: 'connected' });
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((entry) => view === 'trash'
        ? entry.trashed
        : view === 'archive'
          ? entry.archived && !entry.trashed
          : !entry.trashed && !entry.archived)
      .filter((entry) => {
        if (view === 'tasks') return entry.type === 'task' && !entry.completed;
        if (view === 'reminders') return Boolean(entry.reminderAt);
        return true;
      })
      .filter((entry) => {
        if (!query) return true;
        return `${entry.title} ${entry.content} ${entry.items?.map((item) => item.text).join(' ') || ''}`
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [entries, search, view]);

  const heading = navItems.find((item) => item.id === view)?.label || 'Notes';
  const reminderCount = entries.filter((entry) => !entry.trashed && entry.reminderAt).length;
  const taskCount = entries.filter((entry) => !entry.trashed && entry.type === 'task' && !entry.completed).length;

  function resetComposer() {
    setComposeTitle('');
    setComposeBody('');
    setComposeReminder('');
    setComposeChecklist(false);
    setComposerOpen(false);
  }

  function saveEntry(event) {
    event.preventDefault();
    const title = composeTitle.trim();
    const content = composeBody.trim();
    if (!title && !content) return;
    const isTask = composeType === 'task';
    const items = composeChecklist && content
      ? content.split('\n').map((text) => text.trim()).filter(Boolean).map((text) => ({ id: crypto.randomUUID(), text, done: false }))
      : [];
    dispatch(addEntry({
      type: isTask ? 'task' : 'note',
      title: title || (isTask ? 'Untitled task' : 'Untitled note'),
      content: items.length ? '' : content,
      items,
      reminderAt: composeReminder ? new Date(composeReminder).toISOString() : '',
    }));
    resetComposer();
  }

  function changeView(nextView) {
    dispatch(setView(nextView));
    setMobileNavOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          <Menu size={20} />
        </button>
        <a className="brand" href="#notes" onClick={() => changeView('notes')} aria-label="Daymark home">
          <span className="brand-mark"><Lightbulb size={20} strokeWidth={2.2} /></span>
          <span>daymark</span>
        </a>
        <label className="search-box">
          <Search size={19} />
          <input value={search} onChange={(event) => dispatch(setSearch(event.target.value))} placeholder="Search your notes" aria-label="Search your notes" />
          {search && <button className="icon-button search-clear" onClick={() => dispatch(setSearch(''))} aria-label="Clear search"><X size={16} /></button>}
          <kbd>⌘ K</kbd>
        </label>
        <div className="top-actions">
          <span className={`sync-indicator ${syncStatus}`}><i />{syncStatus === 'connected' ? 'Synced' : syncStatus === 'saving' ? 'Saving' : 'On this device'}</span>
          <button className="icon-button" aria-label="Settings"><Settings2 size={19} /></button>
          <button className="avatar" aria-label="Account">A</button>
        </div>
      </header>

      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <button className="create-button" onClick={() => { setComposerOpen(true); setComposeType('note'); }}><Plus size={19} /> Create new</button>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => changeView(id)}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {id === 'reminders' && reminderCount > 0 && <span className="nav-count">{reminderCount}</span>}
              {id === 'tasks' && taskCount > 0 && <span className="nav-count">{taskCount}</span>}
            </button>
          ))}
          <div className="nav-divider" />
          <button className={`nav-item ${view === 'archive' ? 'active' : ''}`} onClick={() => changeView('archive')}><Archive size={19} /><span>Archive</span></button>
          <button className={`nav-item ${view === 'trash' ? 'active' : ''}`} onClick={() => changeView('trash')}><Trash2 size={19} /><span>Trash</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-note"><span className="storage-icon"><ListChecks size={17} /></span><div><strong>Your space, your pace</strong><small>Notes stay in sync as you go.</small></div></div>
          <button className="help-link"><CircleHelp size={17} /> Help & feedback</button>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <div className="page-heading">
          <div><p className="eyebrow">YOUR PERSONAL SPACE</p><h1>{search ? 'Search results' : heading}<span className="heading-period">.</span></h1></div>
          <button className="view-toggle" aria-label="Sort notes"><MoreHorizontal size={21} /></button>
        </div>

        {composerOpen ? (
          <form className="composer" onSubmit={saveEntry}>
            <div className="composer-head">
              <input autoFocus className="composer-title" placeholder={composeType === 'task' ? 'Task name' : 'Title'} value={composeTitle} onChange={(event) => setComposeTitle(event.target.value)} aria-label="Title" />
              <button type="button" className="icon-button" aria-label="Close composer" onClick={resetComposer}><X size={19} /></button>
            </div>
            {composeType === 'task' ? (
              <textarea className="composer-body" placeholder="Add a few details..." value={composeBody} onChange={(event) => setComposeBody(event.target.value)} aria-label="Task details" />
            ) : (
              <textarea className="composer-body" placeholder="Take a note..." value={composeBody} onChange={(event) => setComposeBody(event.target.value)} aria-label="Note content" />
            )}
            <div className="composer-options">
              <button type="button" className={`option-button ${composeType === 'task' ? 'selected' : ''}`} onClick={() => setComposeType(composeType === 'task' ? 'note' : 'task')}><CheckSquare size={16} /> Task</button>
              <button type="button" className={`option-button ${composeChecklist ? 'selected' : ''}`} onClick={() => setComposeChecklist(!composeChecklist)}><ListChecks size={16} /> Checklist</button>
              <label className="reminder-input"><Clock3 size={16} /><span>Remind me</span><input type="datetime-local" value={composeReminder} onChange={(event) => setComposeReminder(event.target.value)} aria-label="Reminder date and time" /></label>
              <div className="composer-spacer" />
              <button type="submit" className="save-button">Save</button>
            </div>
          </form>
        ) : (
          <div className="quick-create" role="button" tabIndex={0} onClick={() => { setComposerOpen(true); setComposeType('note'); }} onKeyDown={(event) => { if (event.key === 'Enter') { setComposerOpen(true); setComposeType('note'); } }}>
            <span>Take a note...</span><span className="quick-create-actions"><button type="button" aria-label="New task" onClick={(event) => { event.stopPropagation(); setComposerOpen(true); setComposeType('task'); }}><CheckSquare size={18} /></button><button type="button" aria-label="New reminder" onClick={(event) => { event.stopPropagation(); setComposerOpen(true); setComposeType('note'); }}><Bell size={18} /></button></span>
          </div>
        )}

        {visibleEntries.length > 0 ? (
          <>
            {visibleEntries.some((entry) => entry.pinned) && <p className="section-label">PINNED</p>}
            <div className="notes-grid">
              {visibleEntries.map((entry) => (
                <NoteCard key={entry.id} entry={entry} onUpdate={(changes) => dispatch(updateEntry({ id: entry.id, changes }))} onPin={() => dispatch(togglePin(entry.id))} onComplete={() => dispatch(toggleEntryCompleted(entry.id))} onArchive={() => dispatch(archiveEntry(entry.id))} onTrash={() => dispatch(trashEntry(entry.id))} onDelete={() => dispatch(deleteEntry(entry.id))} onRestore={() => dispatch(restoreEntry(entry.id))} onColor={(color) => dispatch(setEntryColor({ id: entry.id, color }))} onReminder={(value) => dispatch(setEntryReminder({ id: entry.id, reminderAt: value }))} onRemoveReminder={() => dispatch(removeReminder(entry.id))} onToggleItem={(itemId) => dispatch(toggleChecklistItem({ id: entry.id, itemId }))} isTrash={view === 'trash'} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration"><Lightbulb size={31} strokeWidth={1.5} /></div>
            <h2>{search ? 'No notes found' : emptyTitle(view)}</h2>
            <p>{search ? 'Try another search, or make a fresh note.' : emptyDescription(view)}</p>
            {!search && view === 'notes' && <button className="text-action" onClick={() => setComposerOpen(true)}>Make your first note <span>↗</span></button>}
          </div>
        )}

        <footer className="app-footer"><span>© {new Date().getFullYear()} Daymark</span><span className="footer-separator" /><span>Made with React · Redux · MongoDB</span></footer>
      </main>
    </div>
  );
}

function emptyTitle(view) {
  if (view === 'tasks') return 'All caught up';
  if (view === 'reminders') return 'Nothing on the calendar';
  if (view === 'archive') return 'Your archive is quiet';
  if (view === 'trash') return 'Trash is empty';
  return 'A little room to think';
}

function emptyDescription(view) {
  if (view === 'tasks') return 'Tasks you add will find a home here.';
  if (view === 'reminders') return 'Add a date and time to any note or task.';
  if (view === 'archive') return 'Archived notes will be tucked away here.';
  if (view === 'trash') return 'Deleted notes will stay here until you clear them.';
  return 'Capture an idea, a list, or anything you want to remember.';
}

function NoteCard({ entry, onUpdate, onPin, onComplete, onArchive, onTrash, onDelete, onRestore, onColor, onReminder, onRemoveReminder, onToggleItem, isTrash }) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(entry.title);
  const [draftContent, setDraftContent] = useState(entry.content);
  const completedItems = entry.items?.filter((item) => item.done).length || 0;

  function saveEdit() {
    onUpdate({ title: draftTitle.trim() || entry.title, content: draftContent.trim() });
    setEditing(false);
  }

  return (
    <article className={`note-card color-${entry.color || 'paper'} ${entry.completed ? 'is-completed' : ''}`}>
      <div className="card-topline">
        {entry.type === 'task' && <button className={`task-tag ${entry.completed ? 'task-tag-done' : ''}`} onClick={onComplete} aria-label={entry.completed ? 'Mark task active' : 'Mark task complete'}><span className="task-check">{entry.completed && <Check size={10} />}</span> TASK</button>}
        {entry.pinned && <span className="pinned-label"><Pin size={12} fill="currentColor" /> PINNED</span>}
        <button className={`pin-button ${entry.pinned ? 'is-pinned' : ''}`} onClick={onPin} aria-label={entry.pinned ? 'Unpin note' : 'Pin note'}><Pin size={17} /></button>
      </div>
      {editing ? (
        <div className="edit-fields">
          <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} aria-label="Edit title" />
          <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} aria-label="Edit content" />
        </div>
      ) : (
        <div className="card-copy" onDoubleClick={() => setEditing(true)}>
          {entry.title && <h2>{entry.title}</h2>}
          {entry.content && <p>{entry.content}</p>}
        </div>
      )}
      {entry.items?.length > 0 && (
        <div className="checklist">
          {entry.items.map((item) => (
            <button className={`checklist-row ${item.done ? 'checked' : ''}`} key={item.id} onClick={() => onToggleItem(item.id)}>
              <span className="checkbox-mark">{item.done && <Check size={12} />}</span><span>{item.text}</span>
            </button>
          ))}
          <span className="checklist-progress">{completedItems} of {entry.items.length} done</span>
        </div>
      )}
      {entry.reminderAt && <div className="reminder-chip"><Clock3 size={14} /><span>{formatReminder(entry.reminderAt)}</span><button aria-label="Remove reminder" title="Remove reminder" onClick={onRemoveReminder}><X size={13} /></button></div>}
      <div className="card-actions">
        <div className="color-picker" role="group" aria-label="Note color">
          {colors.map((color) => <button key={color.value} className={`color-dot dot-${color.value} ${entry.color === color.value ? 'current' : ''}`} onClick={() => onColor(color.value)} aria-label={`Set ${color.name} color`} title={color.name} />)}
        </div>
        <div className="card-action-right">
          {editing ? <button className="card-action-button done-edit" onClick={saveEdit} aria-label="Save edits"><Check size={16} /></button> : <button className="card-action-button" onClick={() => setEditing(true)} aria-label="Edit note"><span className="edit-pencil">✎</span></button>}
          {!entry.reminderAt && <label className="card-action-button reminder-picker" title="Add reminder"><Clock3 size={16} /><input type="datetime-local" aria-label="Add reminder date and time" onChange={(event) => event.target.value && onReminder(new Date(event.target.value).toISOString())} /></label>}
          {isTrash ? <button className="card-action-button" onClick={onRestore} aria-label="Restore note"><Archive size={16} /></button> : <button className="card-action-button" onClick={onArchive} aria-label="Archive note"><Archive size={16} /></button>}
          <div className="more-wrap">
            <button className="card-action-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="More actions"><MoreHorizontal size={18} /></button>
            {menuOpen && <div className="card-menu">{isTrash ? <button onClick={onDelete}>Delete forever</button> : <button onClick={onTrash}>Move to trash</button>}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default App;