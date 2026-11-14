import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
    secondary: { main: '#0f766e' },
    background: { default: '#f6f7fb', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7280' },
    divider: 'rgba(17, 24, 39, 0.08)',
    success: { main: '#15803d' },
    warning: { main: '#b45309' },
    error: { main: '#dc2626' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(17, 24, 39, 0.06)' },
        head: {
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6b7280',
          backgroundColor: '#fafbff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});

export default theme;
