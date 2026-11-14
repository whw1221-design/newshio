import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

export default function StatCard({ label, value, hint, icon, color = '#4f46e5' }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: 'divider',
        height: '100%',
        transition: 'box-shadow .2s ease, transform .2s ease',
        '&:hover': { boxShadow: '0 10px 30px rgba(17, 24, 39, 0.08)', transform: 'translateY(-1px)' },
      }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(color, 0.1),
              color,
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Box>
          <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
            {value}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
