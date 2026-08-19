'use client';

import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useCartStore } from '../store';
import { Button } from './Button';

const AUTO_DISMISS_MS = 7000;

/** "Item removed — Undo". Cheap insurance against an accidental tap. */
export function UndoToast() {
  const lastRemoved = useCartStore((state) => state.lastRemoved);
  const undoRemove = useCartStore((state) => state.undoRemove);

  const dismiss = () => useCartStore.setState({ lastRemoved: null });

  return (
    <Snackbar
      open={!!lastRemoved}
      autoHideDuration={AUTO_DISMISS_MS}
      onClose={(_event, reason) => reason !== 'clickaway' && dismiss()}
      // Anchored inside the drawer's own flow, not the viewport corner.
      sx={{ position: 'static', transform: 'none', mx: 2.5, mb: 1.5 }}
      slotProps={{ content: { role: 'status' } }}
      message={
        lastRemoved && (
          <Typography variant="body2" component="span" noWrap>
            Removed <Typography component="span" sx={{ fontWeight: 500 }}>{lastRemoved.line.name}</Typography>
          </Typography>
        )
      }
      action={
        <Button variant="ghost" size="small" onClick={undoRemove} sx={{ color: 'success.light' }}>
          Undo
        </Button>
      }
    />
  );
}
