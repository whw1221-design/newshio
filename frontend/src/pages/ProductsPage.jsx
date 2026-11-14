import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { productsApi } from '../api/products.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import ProductFormDialog from '../components/products/ProductFormDialog.jsx';
import { useFeedback } from '../context/FeedbackContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatCurrency, stockStatus } from '../utils/format.js';

export default function ProductsPage() {
  const { notify } = useFeedback();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [form, setForm] = useState({ open: false, product: null });
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: products, loading, error, reload } = useFetch(
    () => productsApi.list({ search: debouncedSearch }),
    [debouncedSearch],
  );

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await productsApi.remove(target.pid);
      notify('Product deleted.');
      setTarget(null);
      reload();
    } catch (deleteError) {
      notify(deleteError.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'pname',
      label: 'Product',
      sortValue: (row) => row.pname,
      render: (row) => (
        <Box sx={{ maxWidth: 420 }}>
          <Typography fontWeight={600} noWrap>
            {row.pname}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {row.description || 'No description'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      width: 120,
      defaultOrder: 'desc',
      render: (row) => <Typography fontWeight={600}>{formatCurrency(row.price)}</Typography>,
    },
    {
      key: 'qty',
      label: 'Stock',
      align: 'center',
      width: 150,
      render: (row) => {
        const status = stockStatus(row.qty);
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            variant="outlined"
            sx={{ minWidth: 108 }}
          />
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 110,
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit product">
            <IconButton
              size="small"
              aria-label={`Edit ${row.pname}`}
              onClick={() => setForm({ open: true, product: row })}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete product">
            <IconButton
              size="small"
              color="error"
              aria-label={`Delete ${row.pname}`}
              onClick={() => setTarget(row)}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage the catalogue, pricing and available stock."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ open: true, product: null })}
          >
            New product
          </Button>
        }
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or description…"
        />
        {!loading && !error && (
          <Typography variant="body2" color="text.secondary">
            {products?.length ?? 0} product{products?.length === 1 ? '' : 's'}
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={products ?? []}
        getRowId={(row) => row.pid}
        loading={loading}
        initialSort={{ orderBy: 'pname', order: 'asc' }}
        emptyTitle={debouncedSearch ? 'No matching products' : 'No products yet'}
        emptyMessage={
          debouncedSearch
            ? `Nothing matched “${debouncedSearch}”. Try a different search term.`
            : 'Add your first product to start building the catalogue.'
        }
        emptyAction={
          !debouncedSearch && (
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() => setForm({ open: true, product: null })}
            >
              Add product
            </Button>
          )
        }
      />

      <ProductFormDialog
        open={form.open}
        product={form.product}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete product?"
        description={
          target
            ? `“${target.pname}” will be permanently removed. Products that are referenced by orders cannot be deleted until those orders are removed.`
            : ''
        }
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
