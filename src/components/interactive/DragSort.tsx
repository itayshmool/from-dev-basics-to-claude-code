import { useState } from 'react';
import type { DragSortSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface DragSortProps {
  section: DragSortSection;
  onComplete: () => void;
}

export function DragSort({ section, onComplete }: DragSortProps) {
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [shakeItems, setShakeItems] = useState<Set<string>>(new Set());

  const allPlaced = placements.size === section.items.length;

  function handleItemClick(itemText: string) {
    if (checked && allCorrect) return;

    // If already placed and we're re-selecting, allow re-placement
    if (checked) {
      // After a failed check, allow re-sorting
      setChecked(false);
      setShakeItems(new Set());
    }

    if (selectedItem === itemText) {
      // Deselect
      setSelectedItem(null);
    } else {
      setSelectedItem(itemText);
    }
  }

  function handleCategoryClick(categoryName: string) {
    if (!selectedItem) return;
    if (checked && allCorrect) return;

    setPlacements(prev => {
      const next = new Map(prev);
      next.set(selectedItem, categoryName);
      return next;
    });
    setSelectedItem(null);

    // Reset check state when re-sorting
    if (checked) {
      setChecked(false);
      setShakeItems(new Set());
    }
  }

  function handleCheck() {
    setChecked(true);

    const incorrectItems = new Set<string>();
    let correct = true;

    for (const item of section.items) {
      const placedCategory = placements.get(item.text);
      if (placedCategory !== item.correctCategory) {
        correct = false;
        incorrectItems.add(item.text);
      }
    }

    setAllCorrect(correct);
    setShakeItems(incorrectItems);

    if (correct) {
      setShowCelebration(true);
    }
  }

  function handleRemoveItem(itemText: string) {
    if (checked && allCorrect) return;
    setPlacements(prev => {
      const next = new Map(prev);
      next.delete(itemText);
      return next;
    });
    if (checked) {
      setChecked(false);
      setShakeItems(new Set());
    }
  }

  function getItemStatus(itemText: string): 'correct' | 'incorrect' | 'neutral' {
    if (!checked) return 'neutral';
    const placedCategory = placements.get(itemText);
    const correctCategory = section.items.find(i => i.text === itemText)?.correctCategory;
    return placedCategory === correctCategory ? 'correct' : 'incorrect';
  }

  // Items not yet placed
  const unplacedItems = section.items.filter(item => !placements.has(item.text));

  // Items placed in each category
  function getItemsInCategory(categoryName: string): string[] {
    const items: string[] = [];
    placements.forEach((cat, itemText) => {
      if (cat === categoryName) items.push(itemText);
    });
    return items;
  }

  const cta = allCorrect
    ? { label: 'Continue', onClick: onComplete }
    : allPlaced && !checked
      ? { label: 'Check Answers', onClick: handleCheck }
      : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} />}
      <LessonStep cta={cta}>
        <div className="space-y-5">
          {/* Instruction */}
          <h3 className="text-xl font-bold text-text-primary leading-snug">
            {section.instruction}
          </h3>

          {/* Hint text */}
          <p className="text-[14px] text-text-muted">
            {selectedItem
              ? 'Now tap a category to place the item.'
              : unplacedItems.length > 0
                ? 'Tap an item, then tap a category to place it.'
                : checked && !allCorrect
                  ? 'Some items are in the wrong category. Tap them to move.'
                  : 'All items placed. Check your answers!'}
          </p>

          {/* Category drop zones */}
          <div className="space-y-3">
            {section.categories.map((category) => {
              const itemsHere = getItemsInCategory(category.name);
              const isTarget = selectedItem !== null;

              return (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  disabled={!isTarget}
                  className={`
                    w-full text-left rounded-xl border-2 border-dashed p-4 transition-all
                    ${isTarget
                      ? 'border-purple/40 bg-purple-soft hover:border-purple/60 hover:bg-purple-soft cursor-pointer'
                      : 'border-border bg-bg-card cursor-default'
                    }
                  `}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[15px] font-semibold text-text-primary">
                      {category.name}
                    </span>
                    {category.description && (
                      <span className="text-[13px] text-text-muted">
                        {category.description}
                      </span>
                    )}
                  </div>

                  {/* Placed items */}
                  {itemsHere.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {itemsHere.map((itemText) => {
                        const status = getItemStatus(itemText);
                        const shouldShake = shakeItems.has(itemText);
                        return (
                          <span
                            key={itemText}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(itemText);
                            }}
                            className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium
                              cursor-pointer transition-all active:scale-[0.96]
                              ${status === 'correct'
                                ? 'bg-green-soft border border-green/30 text-green'
                                : status === 'incorrect'
                                  ? 'bg-red-soft border border-red/30 text-red'
                                  : 'bg-bg-elevated border border-border text-text-primary hover:border-border-strong'
                              }
                              ${shouldShake ? 'animate-shake' : ''}
                            `}
                          >
                            {itemText}
                            {status === 'correct' && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {status === 'incorrect' && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {status === 'neutral' && (
                              <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[13px] text-text-muted py-1">
                      No items yet
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Unplaced items */}
          {unplacedItems.length > 0 && (
            <div>
              <p className="text-[13px] text-text-muted mb-2 font-medium uppercase tracking-wider">
                Items
              </p>
              <div className="flex flex-wrap gap-2">
                {unplacedItems.map((item) => (
                  <button
                    key={item.text}
                    onClick={() => handleItemClick(item.text)}
                    className={`
                      px-3.5 py-2 rounded-lg text-[14px] font-medium transition-all active:scale-[0.96]
                      border
                      ${selectedItem === item.text
                        ? 'bg-purple-soft border-purple/40 text-purple ring-1 ring-purple/20'
                        : 'bg-bg-card border-border text-text-primary hover:border-border-strong hover:bg-bg-elevated'
                      }
                    `}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback after check */}
          {checked && !allCorrect && (
            <div className="bg-red-soft rounded-xl px-4 py-3 animate-fade-in-up">
              <p className="text-[14px] text-red font-medium">
                Some items are not in the right category. Tap the incorrect items to remove them and try again.
              </p>
            </div>
          )}

          {checked && allCorrect && (
            <div className="bg-green-soft rounded-xl px-4 py-3 animate-pop-in">
              <p className="text-[14px] text-green font-medium">
                All items sorted correctly!
              </p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
