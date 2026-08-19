'use client';

import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

type ButtonVariant = 'primary' | 'success' | 'outline' | 'ghost';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: ButtonVariant;
}

const VARIANT_MAP: Record<ButtonVariant, Pick<MuiButtonProps, 'variant' | 'color'>> = {
  primary: { variant: 'contained', color: 'primary' },
  success: { variant: 'contained', color: 'success' },
  outline: { variant: 'outlined', color: 'inherit' },
  ghost: { variant: 'text', color: 'inherit' },
};

/**
 * Shared button primitive for the cart's four recurring styles, mapped onto
 * MUI's `variant`/`color` so every button in the cart draws from one theme.
 */
export function Button({ variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <MuiButton type={type} {...VARIANT_MAP[variant]} {...props} />;
}
