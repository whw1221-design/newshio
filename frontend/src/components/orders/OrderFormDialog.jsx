import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ordersApi } from '../../api/orders.js';
import { useFeedback } from '../../context/FeedbackContext.jsx';
import { formatCurrency, toDateInputValue, todayInputValue } from '../../utils/format.js';

export default function OrderFormDialog({ open, order, users = [], products = [], onClose, onSaved }) {
  const { notify } = useFeedback();
  const isEdit = Boolean(order);
  const disabled = users.length === 0 || products.length === 0;

  const [values, setValues] = useState({ uid: '', pid: '', order_date: todayInputValue() });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      order
        ? {
            uid: String(order.uid),
            pid: String(order.pid),
            order_date: toDateInputValue(order.order_date),
          }
        : { uid: '', pid: '', order_date: todayInputValue() },
    );
    setErrors({});
    setFormError('');
    setSaving(false);
  }, [open, order]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.uid) next.uid = 'Choose a customer.';
    if (!values.pid) next.pid = 'Choose a product.';
    if (!values.order_date) next.order_date = 'Choose an order date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || disabled || !validate()) return;

    setSaving(true);
    setFormError('');

    const payload = {
      uid: Number(values.uid),
      pid: Number(values.pid),
      order_date: values.order_date,
    };

    try {
      if (isEdit) {
        await ordersApi.update(order.oid, payload);
        notify('Order updated.');
      } else {
        await ordersApi.create(payload);
        notify('Order created.');
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
        <DialogTitle>{isEdit ? 'Edit order' : 'New order'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {disabled && (
              <Alert severity="warning">
                Orders link a user and a product. Create at least one user and one
                product before adding an order.
              </Alert>
            )}

            <TextField
              select
              label="Customer"
              value={values.uid}
              onChange={setField('uid')}
              error={Boolean(errors.uid)}
              helperText={errors.uid}
              required
              fullWidth
            >
              <MenuItem value="" disabled>
                Select a customer…
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.uid} value={String(user.uid)}>
                  {user.uname} ({user.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Product"
              value={values.pid}
              onChange={setField('pid')}
              error={Boolean(errors.pid)}
              helperText={errors.pid}
              required
              fullWidth
            >
              <MenuItem value="" disabled>
                Select a product…
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product.pid} value={String(product.pid)}>
                  {product.pname} · {formatCurrency(product.price)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Order date"
              type="date"
              value={values.order_date}
              onChange={setField('order_date')}
              error={Boolean(errors.order_date)}
              helperText={errors.order_date}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
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
            disabled={saving || disabled}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isEdit ? 'Save changes' : 'Create order'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
