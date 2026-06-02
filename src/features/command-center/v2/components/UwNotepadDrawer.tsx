import React, { useState } from 'react';

import {
  ClipboardList,
  Eye,
  Gavel,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/shared/utils/lib-utils';

import { useRiskRoom } from '../RiskRoomContext';
import { rr } from '../risk-room-theme';
import type { UwNotepadEntry } from '../types';

function NotepadSection({
  title,
  icon: Icon,
  kind,
  entries,
  onUpdate,
  onRemove,
  onAdd,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: UwNotepadEntry['kind'];
  entries: UwNotepadEntry[];
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onAdd: (kind: UwNotepadEntry['kind'], text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const submitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(kind, text);
    setDraft('');
  };

  const startEdit = (entry: UwNotepadEntry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (text) onUpdate(editingId, text);
    else onRemove(editingId);
    setEditingId(null);
    setEditText('');
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2 text-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-foreground">
          {entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-[11px] text-foreground">No {kind === 'observation' ? 'observations' : 'decisions'} yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-2"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                {editingId === entry.id ? (
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveEdit();
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditText('');
                      }
                    }}
                    rows={2}
                    className={cn('w-full resize-none rounded-md px-2 py-1.5 text-[12px]', rr.input)}
                  />
                ) : (
                  <p className="text-[12px] leading-relaxed text-foreground">{entry.text}</p>
                )}
                <p className="mt-1 text-[9px] text-foreground">
                  {new Date(entry.updatedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {editingId !== entry.id && (
                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    className="rounded p-1 text-foreground hover:bg-muted hover:text-primary"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    className="rounded p-1 text-foreground hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitDraft();
            }
          }}
          placeholder={`Add ${kind === 'observation' ? 'observation' : 'decision'}…`}
          className={cn('min-w-0 flex-1 rounded-lg px-3 py-2 text-[12px]', rr.input)}
        />
        <button
          type="button"
          onClick={submitDraft}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </section>
  );
}

export function UwNotepadDrawer() {
  const {
    uwNotepad,
    addNotepadEntry,
    updateNotepadEntry,
    removeNotepadEntry,
    notepadOpen,
    setNotepadOpen,
  } = useRiskRoom();

  const observations = uwNotepad.filter((e) => e.kind === 'observation');
  const decisions = uwNotepad.filter((e) => e.kind === 'decision');
  const total = uwNotepad.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setNotepadOpen(true)}
        className={cn(
          'fixed right-0 top-1/2 z-[460] flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-xl border-2 border-r-0',
          'border-amber-300 bg-gradient-to-b from-amber-400 to-amber-500 px-2.5 py-3.5',
          'shadow-[0_0_28px_rgba(251,191,36,0.5)] transition-all',
          'hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_36px_rgba(251,191,36,0.65)]',
          notepadOpen && 'ring-2 ring-amber-200 ring-offset-2 ring-offset-background',
        )}
        aria-label={`Open UW Observations Log${total ? `, ${total} items` : ''}`}
      >
        <ClipboardList className="h-5 w-5 text-amber-950" />
        <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-950 [writing-mode:vertical-rl] rotate-180">
          UW Log
        </span>
        {total > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-950 px-1 text-[10px] font-bold text-amber-100">
            {total}
          </span>
        )}
      </button>

      <Sheet open={notepadOpen} onOpenChange={setNotepadOpen}>
        <SheetContent
          side="right"
          className="flex w-[min(100vw,400px)] flex-col border-border bg-card p-0 text-foreground sm:max-w-md [&>button]:text-foreground [&>button]:hover:text-primary"
        >
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-foreground">UW Observations Log</SheetTitle>
            <SheetDescription className="text-foreground">
              Field observations and underwriting decisions — add, edit, or remove entries as you assess the risk.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <NotepadSection
              title="Observations"
              icon={Eye}
              kind="observation"
              entries={observations}
              onAdd={addNotepadEntry}
              onUpdate={updateNotepadEntry}
              onRemove={removeNotepadEntry}
            />
            <NotepadSection
              title="Decisions"
              icon={Gavel}
              kind="decision"
              entries={decisions}
              onAdd={addNotepadEntry}
              onUpdate={updateNotepadEntry}
              onRemove={removeNotepadEntry}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
