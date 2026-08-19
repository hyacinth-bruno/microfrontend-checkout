'use client';

import { useEffect, useId, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';

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
    <Paper
      variant="outlined"
      sx={{ display: 'inline-flex', alignItems: 'stretch', borderRadius: 'var(--radius-control)' }}
    >
      <IconButton
        size="small"
        disabled={disabled}
        data-testid="stepper-decrement"
        onClick={() => (decrementRemoves ? onRemove() : onChange(quantity - 1))}
        aria-label={decrementRemoves ? `Remove ${itemName} from cart` : `Decrease quantity of ${itemName}`}
        sx={{ borderRadius: 0, width: 36 }}
      >
        {decrementRemoves ? <DeleteOutlineIcon fontSize="small" /> : <RemoveIcon fontSize="small" />}
      </IconButton>

      <label htmlFor={inputId} style={visuallyHidden}>
        Quantity of {itemName}
      </label>
      <InputBase
        id={inputId}
        type="text"
        inputMode="numeric"
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
        slotProps={{ input: { pattern: '[0-9]*', autoComplete: 'off' } }}
        sx={{
          width: 44,
          borderInline: '1px solid',
          borderColor: 'divider',
          '& input': { textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontSize: '0.875rem' },
        }}
      />

      <IconButton
        size="small"
        disabled={disabled || atMax}
        data-testid="stepper-increment"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity of ${itemName}`}
        sx={{ borderRadius: 0, width: 36 }}
      >
        <AddIcon fontSize="small" />
      </IconButton>

      {atMax && (
        <span id={`${inputId}-max`} style={visuallyHidden}>
          Maximum quantity of {maxQuantity} reached
        </span>
      )}
    </Paper>
  );
}
