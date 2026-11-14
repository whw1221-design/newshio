import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { ordersApi } from '../api/orders.js';
import { productsApi } from '../api/products.js';
import { usersApi } from '../api/users.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import OrderFormDialog from '../components/orders/OrderFormDialog.jsx';
import { useFeedback } from '../context/FeedbackContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useFetch } from '../hooks/useFetch.js';
import { avatarColor, formatCurrency, formatDate, initials } from '../utils/format.js';

export default function OrdersPage() {
  const { notify } = useFeedback();

  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [productId, setProductId] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [form, setForm] = useState({ open: false, order: null });
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const usersResource = useFetch(() => usersApi.list(), []);
  const productsResource = useFetch(() => productsApi.list(), []);

  const { data: orders, loading, error, reload } = useFetch(() => {
    // Use the dedicated relationship endpoints when a single filter is active.
    if (userId && productId) {
      return ordersApi.list({ uid: userId, pid: productId, search: debouncedSearch });
    }
    if (userId && !debouncedSearch) return ordersApi.byUser(userId);
    if (productId && !debouncedSearch) return ordersApi.byProduct(productId);
    return ordersApi.list({ uid: userId, pid: productId, search: debouncedSearch });
  }, [userId, productId, debouncedSearch]);

  const users = usersResource.data ?? [];
  const products = productsResource.data ?? [];
  const filtersActive = Boolean(userId || productId || search);

  const clearFilters = () => {
    setSearch('');
    setUserId('');
    setProductId('');
  };

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await ordersApi.remove(target.oid);
      notify('Order deleted.');
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
      key: 'oid',
      label: 'Order',
      width: 100,
      render: (row) => (
        <Typography fontWeight={700} color="primary.main">
          #{row.oid}
        </Typography>
      ),
    },
    {
      key: 'user_name',
      label: 'Customer',
      sortValue: (row) => row.user_name,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: avatarColor(row.uid),
            }}
          >
            {initials(row.user_name)}
          </Avatar>
          <Box>
            <Typography fontWeight={600}>{row.user_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.user_email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'product_name',
      label: 'Product',
      sortValue: (row) => row.product_name,
      render: (row) => (
        <Box>
          <Typography fontWeight={600}>{row.product_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(row.product_price)}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'order_date',
      label: 'Order date',
      width: 150,
      defaultOrder: 'desc',
      sortValue: (row) => new Date(row.order_date).getTime(),
      render: (row) => <Typography color="text.secondary">{formatDate(row.order_date)}</Typography>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 110,
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit order">
            <IconButton
              size="small"
              aria-label={`Edit order ${row.oid}`}
              onClick={() => setForm({ open: true, order: row })}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete order">
            <IconButton
              size="small"
              color="error"
              aria-label={`Delete order ${row.oid}`}
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
        title="Orders"
        subtitle="Every order links one user to one product through foreign keys."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ open: true, order: null })}
          >
            New order
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3, borderColor: 'divider' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search customer or product…"
          />

          <TextField
            select
            label="Customer"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="">All customers</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.uid} value={String(user.uid)}>
                {user.uname}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="">All products</MenuItem>
            {products.map((product) => (
              <MenuItem key={product.pid} value={String(product.pid)}>
                {product.pname}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1} alignItems="center">
            {filtersActive && (
              <Button size="small" color="inherit" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <Chip
              label={`${orders?.length ?? 0} order${orders?.length === 1 ? '' : 's'}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Paper>

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

      {(usersResource.error || productsResource.error) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load the user or product lists, so the order form may be limited.
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={orders ?? []}
        getRowId={(row) => row.oid}
        loading={loading}
        initialSort={{ orderBy: 'order_date', order: 'desc' }}
        minWidth={820}
        emptyTitle={filtersActive ? 'No matching orders' : 'No orders yet'}
        emptyMessage={
          filtersActive
            ? 'No orders match the current filters. Try clearing them or choosing another customer/product.'
            : 'Create an order to connect a customer with a product.'
        }
        emptyAction={
          !filtersActive && (
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() => setForm({ open: true, order: null })}
            >
              Add order
            </Button>
          )
        }
      />

      <OrderFormDialog
        open={form.open}
        order={form.order}
        users={users}
        products={products}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete order?"
        description={
          target
            ? `Order #${target.oid} (${target.user_name} · ${target.product_name}) will be permanently deleted.`
            : ''
        }
        confirmLabel="Delete order"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
