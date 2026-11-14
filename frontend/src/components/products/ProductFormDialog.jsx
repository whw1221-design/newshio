import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { productsApi } from '../../api/products.js';
import { useFeedback } from '../../context/FeedbackContext.jsx';

const EMPTY = { pname: '', description: '', price: '', qty: '' };

export default function ProductFormDialog({ open, product, onClose, onSaved }) {
  const { notify } = useFeedback();
  const isEdit = Boolean(product);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      product
        ? {
            pname: product.pname,
            description: product.description ?? '',
            price: String(product.price),
            qty: String(product.qty),
          }
        : EMPTY,
    );
    setErrors({});
    setFormError('');
    setSaving(false);
  }, [open, product]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};

    if (values.pname.trim().length < 2) {
      next.pname = 'Product name must be at least 2 characters.';
    }

    const price = Number(values.price);
    if (values.price === '' || Number.isNaN(price)) {
      next.price = 'Enter a valid price.';
    } else if (price < 0) {
      next.price = 'Price cannot be negative.';
    }

    const qty = Number(values.qty);
    if (values.qty === '' || Number.isNaN(qty)) {
      next.qty = 'Enter a valid quantity.';
    } else if (!Number.isInteger(qty) || qty < 0) {
      next.qty = 'Quantity must be a whole number of 0 or more.';
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
      pname: values.pname.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      qty: Number(values.qty),
    };

    try {
      if (isEdit) {
        await productsApi.update(product.pid, payload);
        notify('Product updated.');
      } else {
        await productsApi.create(payload);
        notify('Product created.');
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
        <DialogTitle>{isEdit ? 'Edit product' : 'New product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Product name"
              value={values.pname}
              onChange={setField('pname')}
              error={Boolean(errors.pname)}
              helperText={errors.pname}
              autoFocus
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={values.description}
              onChange={setField('description')}
              multiline
              minRows={3}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <TextField
                label="Price"
                type="number"
                value={values.price}
                onChange={setField('price')}
                error={Boolean(errors.price)}
                helperText={errors.price}
                required
                fullWidth
                slotProps={{
                  htmlInput: { min: 0, step: '0.01' },
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={values.qty}
                onChange={setField('qty')}
                error={Boolean(errors.qty)}
                helperText={errors.qty}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: '1' } }}
              />
            </Stack>
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
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
