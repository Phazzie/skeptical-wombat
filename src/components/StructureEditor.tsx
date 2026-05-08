'use client';

import React, { useState } from 'react';
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
import { MoreVertical, GripVertical, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Chapter, Beat } from '../domain/entities/Project';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-sm mb-3 group hover:border-[var(--neon-accent)]/30 transition-colors">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/20 group-hover:text-[var(--neon-accent)]/50 pt-1">
          <GripVertical size={18} />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

interface StructureEditorProps {
  chapters: Chapter[];
  onUpdate: (chapters: Chapter[]) => void;
}

export function StructureEditor({ chapters, onUpdate }: StructureEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, chapterId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const chapterIndex = chapters.findIndex(c => c.id === chapterId);
      const updatedChapters = [...chapters];
      const beats = updatedChapters[chapterIndex].beats;

      const oldIndex = beats.findIndex((b) => b.id === active.id);
      const newIndex = beats.findIndex((b) => b.id === over.id);

      updatedChapters[chapterIndex].beats = arrayMove(beats, oldIndex, newIndex);
      onUpdate(updatedChapters);
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${chapters.length + 1}`,
      beats: []
    };
    onUpdate([...chapters, newChapter]);
  };

  const addBeat = (chapterId: string) => {
    const updatedChapters = chapters.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          beats: [...c.beats, { id: `beat-${Date.now()}`, content: 'Click to edit your story segment...' }]
        };
      }
      return c;
    });
    onUpdate(updatedChapters);
  };

  const updateBeat = (chapterId: string, beatId: string, content: string) => {
    const updatedChapters = chapters.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          beats: c.beats.map(b => b.id === beatId ? { ...b, content } : b)
        };
      }
      return c;
    });
    onUpdate(updatedChapters);
  };

  const deleteBeat = (chapterId: string, beatId: string) => {
    const updatedChapters = chapters.map(c => {
      if (c.id === chapterId) {
        return {
          ...c,
          beats: c.beats.filter(b => b.id !== beatId)
        };
      }
      return c;
    });
    onUpdate(updatedChapters);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl uppercase tracking-tight text-fuchsia-900 border-b-4 border-fuchsia-500 inline-block pb-2">The Outline</h2>
        <button 
          onClick={addChapter}
          className="flex items-center gap-2 bg-[var(--ink-black)] text-[var(--neon-accent)] px-4 py-2 uppercase text-xs font-bold tracking-widest hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Add Chapter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex flex-col gap-4 bg-white/50 backdrop-blur-md p-6 border-2 border-[var(--ink-black)] shadow-[8px_8px_0_0_rgba(5,5,5,1)]">
            <div className="flex items-center justify-between border-b-2 border-fuchsia-200 pb-4 mb-2">
              <input 
                className="font-display text-2xl uppercase tracking-tight bg-transparent focus:outline-none focus:text-fuchsia-600 w-full"
                value={chapter.title}
                onChange={(e) => {
                  const updated = chapters.map(c => c.id === chapter.id ? { ...c, title: e.target.value } : c);
                  onUpdate(updated);
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-fuchsia-100 text-fuchsia-500 px-2 py-1 uppercase">{chapter.beats.length} Beats</span>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, chapter.id)}
            >
              <SortableContext
                items={chapter.beats.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-[100px] flex flex-col gap-1">
                  {chapter.beats.map((beat) => (
                    <SortableItem key={beat.id} id={beat.id}>
                      <div className="flex flex-col gap-2">
                        <textarea 
                          className="bg-transparent text-sm leading-relaxed focus:outline-none resize-none w-full h-auto min-h-[60px]"
                          value={beat.content}
                          onChange={(e) => updateBeat(chapter.id, beat.id, e.target.value)}
                        />
                        <button 
                          onClick={() => deleteBeat(chapter.id, beat.id)}
                          className="self-end text-fuchsia-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </SortableItem>
                  ))}
                  {chapter.beats.length === 0 && (
                    <div className="border-2 border-dashed border-fuchsia-200 p-8 flex flex-col items-center justify-center text-center text-fuchsia-300">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-50">Empty Chapter</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            <button 
              onClick={() => addBeat(chapter.id)}
              className="mt-2 border-2 border-[var(--ink-black)] py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[var(--ink-black)] hover:text-white transition-all shadow-[4px_4px_0_0_rgba(5,5,5,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Plus size={16} /> Append Beat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
