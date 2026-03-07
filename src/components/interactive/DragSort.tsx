import { useState, useRef } from 'react';
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
  const [statusMessage, setStatusMessage] = useState('');
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
      setStatusMessage('');
    } else {
      setSelectedItem(itemText);
      setStatusMessage(`Selected "${itemText}". Now choose a category.`);
    }
  }

  function handleCategoryClick(categoryName: string) {
    // selectedItem is cleared by handleRemoveItem, so this guard
    // also prevents placing when the user tapped a remove X
    if (!selectedItem) return;
    if (checked && allCorrect) return;

    setPlacements(prev => {
      const next = new Map(prev);
      next.set(selectedItem, categoryName);
      return next;
    });
    setStatusMessage(`Placed "${selectedItem}" in "${categoryName}".`);
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
      setStatusMessage('All items sorted correctly!');
    } else {
      setStatusMessage(`${incorrectItems.size} item${incorrectItems.size > 1 ? 's' : ''} in the wrong category. Tap to move.`);
    }
  }

  function handleRemoveItem(itemText: string, e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (checked && allCorrect) return;
    setPlacements(prev => {
      const next = new Map(prev);
      next.delete(itemText);
      return next;
    });
    setStatusMessage(`Removed "${itemText}" from category.`);
    // Clear selection so the category click can't also fire
    setSelectedItem(null);
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

  // Keyboard navigation for unplaced items
  function handleItemKeyDown(e: React.KeyboardEvent, poolIndex: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (poolIndex + 1) % unplacedItems.length;
      itemRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = (poolIndex - 1 + unplacedItems.length) % unplacedItems.length;
      itemRefs.current[next]?.focus();
    } else if (e.key === 'Tab' && !e.shiftKey && selectedItem) {
      e.preventDefault();
      categoryRefs.current[0]?.focus();
    }
  }

  // Keyboard navigation for categories
  function handleCategoryKeyDown(e: React.KeyboardEvent, catIndex: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (catIndex + 1) % section.categories.length;
      categoryRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (catIndex - 1 + section.categories.length) % section.categories.length;
      categoryRefs.current[next]?.focus();
    }
  }

  const cta = allCorrect
    ? { label: 'Continue', onClick: onComplete }
    : allPlaced && !checked
      ? { label: 'Check Answers', onClick: handleCheck }
      : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} message="Nailed it!" />}
      <LessonStep cta={cta}>
        <div className="space-y-5">
          {/* Instruction */}
          <h3 id="dragsort-instruction" className="text-xl font-bold text-text-primary leading-snug">
            {section.instruction}
          </h3>

          {/* Hint text */}
          <p className="text-[14px] text-text-muted" aria-live="polite">
            {selectedItem
              ? 'Now tap a category to place the item.'
              : unplacedItems.length > 0
                ? 'Tap an item, then tap a category to place it.'
                : checked && !allCorrect
                  ? 'Some items are in the wrong category. Tap them to move.'
                  : 'All items placed. Check your answers!'}
          </p>

          {/* Screen reader status */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {statusMessage}
          </div>

          {/* Category drop zones */}
          <div className="space-y-3" role="group" aria-labelledby="dragsort-instruction">
            {section.categories.map((category, catIdx) => {
              const itemsHere = getItemsInCategory(category.name);
              const isTarget = selectedItem !== null;

              return (
                <button
                  key={category.name}
                  ref={(el) => { categoryRefs.current[catIdx] = el; }}
                  onClick={() => handleCategoryClick(category.name)}
                  onKeyDown={(e) => handleCategoryKeyDown(e, catIdx)}
                  disabled={!isTarget}
                  aria-label={`Category: ${category.name}${category.description ? ` — ${category.description}` : ''}. ${itemsHere.length} items.`}
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
                            role="button"
                            tabIndex={0}
                            aria-label={`${itemText}${status === 'correct' ? ' (correct)' : status === 'incorrect' ? ' (incorrect)' : ''}. Press Enter to remove.`}
                            onClick={(e) => handleRemoveItem(itemText, e)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRemoveItem(itemText, e); }}
                            className={`
                              group inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg text-[14px] font-medium
                              cursor-pointer transition-all active:scale-[0.96]
                              ${status === 'correct'
                                ? 'bg-green-soft border border-green/30 text-green'
                                : status === 'incorrect'
                                  ? 'bg-red-soft border border-red/30 text-red'
                                  : 'bg-bg-elevated border border-border text-text-primary hover:border-purple/30 hover:bg-purple-soft'
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
                              <svg className="w-3.5 h-3.5 text-text-muted opacity-60 group-hover:opacity-100 group-hover:text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              <p id="items-pool-label" className="text-[13px] text-text-muted mb-2 font-medium uppercase tracking-wider">
                Items
              </p>
              <p id="dragsort-kb-hint" className="sr-only">Select an item with Enter, then press Tab to move to a category and Enter to place it.</p>
              <div className="flex flex-wrap gap-2" role="listbox" aria-labelledby="items-pool-label" aria-describedby="dragsort-kb-hint">
                {unplacedItems.map((item, poolIdx) => (
                  <button
                    key={item.text}
                    ref={(el) => { itemRefs.current[poolIdx] = el; }}
                    role="option"
                    aria-selected={selectedItem === item.text}
                    onClick={() => handleItemClick(item.text)}
                    onKeyDown={(e) => handleItemKeyDown(e, poolIdx)}
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
