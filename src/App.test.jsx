import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import { hydrateEntries, setSearch, setView, store } from './store';

function renderApp() {
  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ entries: [] }),
  }));
  store.dispatch(setSearch(''));
  store.dispatch(setView('notes'));
  store.dispatch(hydrateEntries([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('creates a task, removes its reminder independently, and persists the task', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Create new' }));
  fireEvent.click(screen.getByRole('button', { name: 'Task' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'Call the printer' } });
  fireEvent.change(screen.getByLabelText('Reminder date and time'), { target: { value: '2027-01-05T13:45' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByText('Call the printer')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Remove reminder' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Remove reminder' }));

  expect(screen.getByText('Call the printer')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Remove reminder' })).toBeNull();
  expect(JSON.parse(localStorage.getItem('daymark.entries'))[0]).toMatchObject({
    title: 'Call the printer',
    type: 'task',
    reminderAt: '',
  });
});

test('shows only active tasks in the Tasks view', () => {
  store.dispatch(hydrateEntries([
    { id: 'todo-1', title: 'Open the studio', content: '', type: 'task', completed: false, items: [] },
    { id: 'todo-2', title: 'Archive the receipts', content: '', type: 'task', completed: true, items: [] },
    { id: 'note-1', title: 'Reading list', content: '', type: 'note', completed: false, items: [] },
  ]));
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /^Tasks/ }));

  expect(screen.getByText('Open the studio')).toBeTruthy();
  expect(screen.queryByText('Archive the receipts')).toBeNull();
  expect(screen.queryByText('Reading list')).toBeNull();
});