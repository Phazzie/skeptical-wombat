'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Chapter } from '../domain/entities/Project';

// ─── Beat sortable item ────────────────────────────────────────────────────────

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-sm mb-3 group hover:border-[var(--neon-accent)]/30 transition-colors">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white/20 group-hover:text-[var(--neon-accent)]/50 pt-1 flex-shrink-0"
        >
          <GripVertical size={18} />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ─── Chapter sortable card ─────────────────────────────────────────────────────

interface SortableChapterProps {
  chapter: Chapter;
  sensors: ReturnType<typeof useSensors>;
  onTitleChange: (title: string) => void;
  onAddBeat: () => void;
  onDeleteBeat: (beatId: string) => void;
  onUpdateBeat: (beatId: string, content: string) => void;
  onMoveBeat: (activeId: string, overId: string) => void;
}

function SortableChapter({
  chapter,
  sensors,
  onTitleChange,
  onAddBeat,
  onDeleteBeat,
  onUpdateBeat,
  onMoveBeat,
}: SortableChapterProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const handleBeatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onMoveBeat(String(active.id), String(over.id));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-4 bg-white/50 backdrop-blur-md p-6 border-2 border-[var(--ink-black)] shadow-[8px_8px_0_0_rgba(5,5,5,1)] ${
        isDragging ? 'opacity-60 shadow-[0_0_0_0_rgba(5,5,5,1)]' : ''
      }`}
    >
      {/* Chapter header with drag handle */}
      <div className="flex items-center gap-3 border-b-2 border-fuchsia-200 pb-4 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-fuchsia-300 hover:text-fuchsia-600 transition-colors flex-shrink-0"
          title="Drag to reorder chapter"
        >
          <GripVertical size={22} />
        </div>
        <input
          className="font-display text-2xl uppercase tracking-tight bg-transparent focus:outline-none focus:text-fuchsia-600 w-full"
          value={chapter.title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <span className="text-[10px] font-bold bg-fuchsia-100 text-fuchsia-500 px-2 py-1 uppercase whitespace-nowrap flex-shrink-0">
          {chapter.beats.length} Beats
        </span>
      </div>

      {/* Beat list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleBeatDragEnd}
      >
        <SortableContext
          items={chapter.beats.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[80px] flex flex-col gap-1">
            {chapter.beats.map((beat) => (
              <SortableItem key={beat.id} id={beat.id}>
                <div className="flex flex-col gap-2">
                  <textarea
                    className="bg-transparent text-sm leading-relaxed focus:outline-none resize-none w-full h-auto min-h-[60px]"
                    value={beat.content}
                    onChange={(e) => onUpdateBeat(beat.id, e.target.value)}
                  />
                  <button
                    onClick={() => onDeleteBeat(beat.id)}
                    className="self-end text-fuchsia-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </SortableItem>
            ))}
            {chapter.beats.length === 0 && (
              <div className="border-2 border-dashed border-fuchsia-200 p-8 flex flex-col items-center justify-center text-center text-fuchsia-300">
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Empty Chapter
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={onAddBeat}
        className="mt-2 border-2 border-[var(--ink-black)] py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[var(--ink-black)] hover:text-white transition-all shadow-[4px_4px_0_0_rgba(5,5,5,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
      >
        <Plus size={16} /> Append Beat
      </button>
    </div>
  );
}

// ─── Main editor ───────────────────────────────────────────────────────────────

interface StructureEditorProps {
  chapters: Chapter[];
  onUpdate: (chapters: Chapter[]) => void;
}

export function StructureEditor({ chapters, onUpdate }: StructureEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Reorder chapters
  const handleChapterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);
      onUpdate(arrayMove(chapters, oldIndex, newIndex));
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${chapters.length + 1}`,
      beats: [],
    };
    onUpdate([...chapters, newChapter]);
  };

  const addBeat = (chapterId: string) => {
    onUpdate(
      chapters.map((c) =>
        c.id === chapterId
          ? { ...c, beats: [...c.beats, { id: `beat-${Date.now()}`, content: 'Click to edit your story segment...' }] }
          : c
      )
    );
  };

  const updateBeat = (chapterId: string, beatId: string, content: string) => {
    onUpdate(
      chapters.map((c) =>
        c.id === chapterId
          ? { ...c, beats: c.beats.map((b) => (b.id === beatId ? { ...b, content } : b)) }
          : c
      )
    );
  };

  const deleteBeat = (chapterId: string, beatId: string) => {
    onUpdate(
      chapters.map((c) =>
        c.id === chapterId ? { ...c, beats: c.beats.filter((b) => b.id !== beatId) } : c
      )
    );
  };

  const moveBeat = (chapterId: string, activeId: string, overId: string) => {
    onUpdate(
      chapters.map((c) => {
        if (c.id !== chapterId) return c;
        const oldIndex = c.beats.findIndex((b) => b.id === activeId);
        const newIndex = c.beats.findIndex((b) => b.id === overId);
        return { ...c, beats: arrayMove(c.beats, oldIndex, newIndex) };
      })
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-4xl uppercase tracking-tight text-fuchsia-900 border-b-4 border-fuchsia-500 inline-block pb-2">
            The Outline
          </h2>
          <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mt-2">
            Drag <GripVertical size={10} className="inline" /> to reorder chapters or beats
          </p>
        </div>
        <button
          onClick={addChapter}
          className="flex items-center gap-2 bg-[var(--ink-black)] text-[var(--neon-accent)] px-4 py-2 uppercase text-xs font-bold tracking-widest hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Add Chapter
        </button>
      </div>

      {/* Chapter list — single column so drag order is unambiguous */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChapterDragEnd}
      >
        <SortableContext
          items={chapters.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-8">
            {chapters.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                sensors={sensors}
                onTitleChange={(title) =>
                  onUpdate(chapters.map((c) => (c.id === chapter.id ? { ...c, title } : c)))
                }
                onAddBeat={() => addBeat(chapter.id)}
                onDeleteBeat={(beatId) => deleteBeat(chapter.id, beatId)}
                onUpdateBeat={(beatId, content) => updateBeat(chapter.id, beatId, content)}
                onMoveBeat={(activeId, overId) => moveBeat(chapter.id, activeId, overId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {chapters.length === 0 && (
        <div className="border-4 border-dashed border-fuchsia-200 p-16 flex flex-col items-center justify-center text-center">
          <p className="font-display text-2xl uppercase tracking-tight text-fuchsia-300">No Chapters Yet</p>
          <p className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest mt-2">
            Add a chapter or generate structure from the Wombat first
          </p>
        </div>
      )}
    </div>
  );
}
