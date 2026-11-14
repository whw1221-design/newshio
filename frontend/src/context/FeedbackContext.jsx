import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const FeedbackContext = createContext(null);

/** Global toast notifications for success / error messages. */
export function FeedbackProvider({ children }) {
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const notify = useCallback((message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnack((current) => ({ ...current, open: false }));
  };

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={4500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used inside a FeedbackProvider.');
  }
  return context;
}
