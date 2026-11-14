import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { ordersApi } from '../api/orders.js';
import { productsApi } from '../api/products.js';
import { usersApi } from '../api/users.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import { useFetch } from '../hooks/useFetch.js';
import {
  avatarColor,
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
  stockStatus,
} from '../utils/format.js';

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [products, users, orders] = await Promise.all([
      productsApi.list(),
      usersApi.list(),
      ordersApi.list(),
    ]);
    return { products, users, orders };
  }, []);

  const products = data?.products ?? [];
  const users = data?.users ?? [];
  const orders = data?.orders ?? [];

  const totalStock = products.reduce((sum, product) => sum + product.qty, 0);
  const lowStock = products
    .filter((product) => product.qty <= 5)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 5);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
    .slice(0, 5);
  const last30Days = orders.filter(
    (order) => Date.now() - new Date(order.order_date).getTime() <= 30 * 24 * 60 * 60 * 1000,
  ).length;

  const stats = [
    {
      label: 'Products',
      value: formatNumber(products.length),
      hint: `${formatNumber(totalStock)} units in stock`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      color: '#4f46e5',
    },
    {
      label: 'Users',
      value: formatNumber(users.length),
      hint: 'Registered customer accounts',
      icon: <PeopleAltRoundedIcon fontSize="small" />,
      color: '#0f766e',
    },
    {
      label: 'Orders',
      value: formatNumber(orders.length),
      hint: `${formatNumber(last30Days)} in the last 30 days`,
      icon: <ReceiptLongRoundedIcon fontSize="small" />,
      color: '#b45309',
    },
    {
      label: 'Low stock',
      value: formatNumber(products.filter((product) => product.qty <= 5).length),
      hint: 'Products with 5 units or fewer',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      color: '#dc2626',
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A live snapshot of the catalogue, customers and orders."
        actions={
          <Button
            component={RouterLink}
            to="/orders"
            variant="outlined"
            endIcon={<ArrowForwardRoundedIcon />}
          >
            View orders
          </Button>
        }
      />

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

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          mb: 3,
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={132} sx={{ borderRadius: 3 }} />
            ))
          : stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
        }}
      >
        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Box>
              <Typography fontWeight={700}>Recent orders</Typography>
              <Typography variant="caption" color="text.secondary">
                Latest purchases across all customers
              </Typography>
            </Box>
            <Button size="small" component={RouterLink} to="/orders" endIcon={<ArrowForwardRoundedIcon />}>
              All orders
            </Button>
          </Stack>

          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Box key={index} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Skeleton variant="text" height={40} />
                </Box>
              ))}

            {!loading && recentOrders.length === 0 && (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">No orders yet. Add one from the Orders page.</Alert>
              </Box>
            )}

            {!loading &&
              recentOrders.map((order) => (
                <Stack
                  key={order.oid}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                >
                  <Avatar
                    sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: avatarColor(order.uid) }}
                  >
                    {initials(order.user_name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {order.user_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {order.product_name} · {formatCurrency(order.product_price)}
                    </Typography>
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.25}>
                    <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                      {formatDate(order.order_date)}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      #{order.oid}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
          <Stack sx={{ px: 2.5, py: 2 }}>
            <Typography fontWeight={700}>Stock watchlist</Typography>
            <Typography variant="caption" color="text.secondary">
              Products that need restocking (5 units or fewer)
            </Typography>
          </Stack>

          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Box key={index} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Skeleton variant="text" height={32} />
                </Box>
              ))}

            {!loading && lowStock.length === 0 && (
              <Box sx={{ p: 3 }}>
                <Alert severity="success">Every product is well stocked.</Alert>
              </Box>
            )}

            {!loading &&
              lowStock.map((product) => {
                const status = stockStatus(product.qty);
                return (
                  <Stack
                    key={product.pid}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                  >
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {product.pname}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(product.price)}
                      </Typography>
                    </Box>
                    <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                  </Stack>
                );
              })}
          </Box>

          <Box sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button size="small" component={RouterLink} to="/products" endIcon={<ArrowForwardRoundedIcon />}>
              Manage products
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
