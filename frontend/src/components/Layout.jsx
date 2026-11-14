import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardRoundedIcon, end: true },
  { to: '/products', label: 'Products', icon: Inventory2RoundedIcon },
  { to: '/users', label: 'Users', icon: PeopleAltRoundedIcon },
  { to: '/orders', label: 'Orders', icon: ReceiptLongRoundedIcon },
];

function Brand({ compact = false, onClick }) {
  return (
    <Stack
      component={NavLink}
      to="/"
      onClick={onClick}
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2.5,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
          boxShadow: '0 8px 18px rgba(79, 70, 229, 0.35)',
        }}
      >
        <StorefrontRoundedIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800} lineHeight={1.15} noWrap>
          ShopDesk
        </Typography>
        {!compact && (
          <Typography variant="caption" color="text.secondary" noWrap>
            Products · Users · Orders
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 64, md: 72 } }}>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Brand />

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: 'none', md: 'flex' }, ml: 3 }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  startIcon={<Icon />}
                  sx={{
                    px: 2,
                    py: 1,
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.12)' },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="Data is stored in Supabase (Postgres)">
            <Chip
              icon={<CloudRoundedIcon />}
              label="Supabase"
              variant="outlined"
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' }, borderColor: 'divider' }}
            />
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280, p: 1.5 } } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1.5 }}>
          <Brand onClick={() => setDrawerOpen(false)} />
          <IconButton aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        <List>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: active ? 'primary.main' : 'text.primary',
                  bgcolor: active ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 4.5 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 2.5 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              ShopDesk Admin · React + Material UI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Express REST API · Supabase Postgres
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
