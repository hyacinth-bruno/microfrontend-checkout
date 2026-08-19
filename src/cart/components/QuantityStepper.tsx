'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface QuantityStepperProps {
  quantity: number;
  maxQuantity: number;
  /** Human label for screen readers, e.g. the product name. */
  itemName: string;
  onChange: (quantity: number) => void;
  /** Called when the stepper is decremented below 1. */
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Accessible −/input/+ control.
 *
 * The text input keeps a *local draft* while the user types so that clearing
 * the field ("" or mid-edit "1" on the way to "12") never nukes the line or
 * fights the caret. The draft is committed on blur / Enter; the buttons commit
 * immediately.
 */
export function QuantityStepper({
  quantity,
  maxQuantity,
  itemName,
  onChange,
  onRemove,
  disabled = false,
}: QuantityStepperProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(String(quantity));
  const isEditing = useRef(false);

  // Keep the input in step with the store (other tab, undo, stock clamp…)
  // but never while the user is mid-edit.
  useEffect(() => {
    if (!isEditing.current) setDraft(String(quantity));
  }, [quantity]);

  const atMax = quantity >= maxQuantity;
  const decrementRemoves = quantity <= 1;

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(quantity)); // garbage in → revert
      return;
    }
    if (parsed < 1) {
      onRemove();
      return;
    }
    onChange(parsed);
    setDraft(String(Math.min(parsed, maxQuantity)));
  };

  return (
    <div className="inline-flex items-stretch rounded-control border border-slate-300 bg-white shadow-resting dark:border-slate-600 dark:bg-slate-800">
      <button
        type="button"
        disabled={disabled}
        data-testid="stepper-decrement"
        onClick={() => (decrementRemoves ? onRemove() : onChange(quantity - 1))}
        aria-label={decrementRemoves ? `Remove ${itemName} from cart` : `Decrease quantity of ${itemName}`}
        className="grid h-9 w-9 place-items-center rounded-l-control text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:z-10 focus-visible:focus-ring-inset disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        {decrementRemoves ? <TrashIcon /> : <MinusIcon />}
      </button>

      <label htmlFor={inputId} className="sr-only">
        Quantity of {itemName}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        disabled={disabled}
        value={draft}
        aria-describedby={atMax ? `${inputId}-max` : undefined}
        onFocus={(event) => {
          isEditing.current = true;
          event.currentTarget.select();
        }}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
        onBlur={(event) => {
          isEditing.current = false;
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(quantity));
            event.currentTarget.blur();
          }
          // Native stepper feel without type="number" spinners.
          if (event.key === 'ArrowUp' && !atMax) {
            event.preventDefault();
            onChange(quantity + 1);
          }
          if (event.key === 'ArrowDown' && quantity > 1) {
            event.preventDefault();
            onChange(quantity - 1);
          }
        }}
        className="h-9 w-11 border-x border-slate-200 text-center text-sm font-medium text-slate-900 tabular-nums focus:focus-ring-inset disabled:opacity-40 dark:border-slate-600 dark:text-white"
      />

      <button
        type="button"
        disabled={disabled || atMax}
        data-testid="stepper-increment"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity of ${itemName}`}
        className="grid h-9 w-9 place-items-center rounded-r-control text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:z-10 focus-visible:focus-ring-inset disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <PlusIcon />
      </button>

      {atMax && (
        <span id={`${inputId}-max`} className="sr-only">
          Maximum quantity of {maxQuantity} reached
        </span>
      )}
    </div>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <rect x="2.5" y="7.25" width="11" height="1.5" rx="0.75" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M7.25 2.5h1.5v4.75H13.5v1.5H8.75V13.5h-1.5V8.75H2.5v-1.5h4.75z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M6.5 1h3a1 1 0 0 1 1 1v1h3v1.5h-1l-.6 8.1A1.5 1.5 0 0 1 10.4 14H5.6a1.5 1.5 0 0 1-1.5-1.4L3.5 4.5h-1V3h3V2a1 1 0 0 1 1-1m0 2h3V2.5h-3zM5 4.5l.59 8h4.82l.59-8z" />
    </svg>
  );
}
