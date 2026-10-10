import { createTheme } from "@mui/material";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "system-ui, Arial, sans-serif",
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: "3px solid currentColor",
            outlineOffset: 3,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "3px solid currentColor",
            outlineOffset: 3,
          },
        },
      },
    },
  },
});
