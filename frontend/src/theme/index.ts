import { createTheme } from '@mui/material/styles'

const cyan = '#01D1D1'
const teal = '#2A9D8F'
const orange = '#F4A261'
const red = '#E76F51'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: cyan },
    secondary: { main: teal },
    error: { main: red },
    warning: { main: orange },
    background: {
      default: '#0B0F14',
      paper: 'rgba(20,24,31,0.4)'
    },
    text: {
      primary: '#E6F4F1',
      secondary: 'rgba(230,244,241,0.75)'
    }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    h1: { fontFamily: 'Montserrat, Inter, sans-serif', letterSpacing: '-0.02em' },
    h2: { fontFamily: 'Montserrat, Inter, sans-serif', letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          border: '1px solid rgba(1,209,209,0.25)',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(20,24,31,0.5)',
          borderBottom: '1px solid rgba(1,209,209,0.25)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': { transform: 'translateY(-1px)' }
        },
        containedPrimary: {
          background: `linear-gradient(90deg, ${cyan}, ${teal})`,
          boxShadow: '0 0 16px rgba(1,209,209,.25)',
          '&:hover': { boxShadow: '0 0 24px rgba(1,209,209,.35)' }
        }
      }
    },
    MuiDrawer: { styleOverrides: { paper: { backdropFilter: 'blur(20px)', backgroundColor: 'rgba(20,24,31,0.5)' } } }
  }
})
