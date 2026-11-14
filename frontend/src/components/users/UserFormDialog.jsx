import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { usersApi } from '../../api/users.js';
import { useFeedback } from '../../context/FeedbackContext.jsx';

const EMPTY = { uname: '', email: '', password: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormDialog({ open, user, onClose, onSaved }) {
  const { notify } = useFeedback();
  const isEdit = Boolean(user);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      user ? { uname: user.uname, email: user.email, password: '' } : EMPTY,
    );
    setErrors({});
    setFormError('');
    setSaving(false);
    setShowPassword(false);
  }, [open, user]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};

    if (values.uname.trim().length < 2) {
      next.uname = 'Name must be at least 2 characters.';
    }
    if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!isEdit && values.password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    if (isEdit && values.password.length > 0 && values.password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !validate()) return;

    setSaving(true);
    setFormError('');

    const payload = {
      uname: values.uname.trim(),
      email: values.email.trim().toLowerCase(),
    };
    if (values.password.length > 0) {
      payload.password = values.password;
    }

    try {
      if (isEdit) {
        await usersApi.update(user.uid, payload);
        notify('User updated.');
      } else {
        await usersApi.create(payload);
        notify('User created.');
      }
      onSaved?.();
      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Full name"
              value={values.uname}
              onChange={setField('uname')}
              error={Boolean(errors.uname)}
              helperText={errors.uname}
              autoFocus
              required
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={values.email}
              onChange={setField('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
              fullWidth
            />

            <TextField
              label={isEdit ? 'New password' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={setField('password')}
              error={Boolean(errors.password)}
              helperText={
                errors.password ??
                (isEdit
                  ? 'Leave blank to keep the current password. Stored as a bcrypt hash.'
                  : 'At least 6 characters. Stored as a bcrypt hash.')
              }
              required={!isEdit}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
