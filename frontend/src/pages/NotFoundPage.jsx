import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

export default function NotFoundPage() {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 10, textAlign: 'center' }}>
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(79, 70, 229, 0.08)',
          color: 'primary.main',
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        404
      </Box>
      <Typography variant="h4">Page not found</Typography>
      <Typography color="text.secondary" maxWidth={420}>
        The page you are looking for does not exist. Use the navigation above to
        get back to the dashboard.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" startIcon={<HomeRoundedIcon />}>
        Back to dashboard
      </Button>
    </Stack>
  );
}
