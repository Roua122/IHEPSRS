import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Route, Routes } from "react-router-dom";

import { LoginPage } from "./pages/LoginPage";
import { RolesPage } from "./pages/RolesPage";
import { UsersPage } from "./pages/UsersPage";

function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h3">
          IHEPSRS
        </Typography>

        <Typography variant="h5">
          النموذج الأولي لنظام التعليم العالي والدراسات العليا والبحث العلمي
        </Typography>

        <Typography color="text.secondary">
          تم إغلاق Foundation، وبدأت مرحلة الهوية وإدارة الوصول.
        </Typography>

        <Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} to="/login" variant="contained">
              تسجيل الدخول
            </Button>
            <Button component={Link} to="/settings/users" variant="outlined">
              عرض نموذج حساب المستخدم
            </Button>
            <Button component={Link} to="/settings/roles" variant="outlined">
              عرض كتالوج الأدوار
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

export function App() {
  return (
    <>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "fixed",
          top: 8,
          insetInlineStart: 8,
          zIndex: 2000,
          px: 2,
          py: 1,
          bgcolor: "background.paper",
          color: "text.primary",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          transform: "translateY(-200%)",
          "&:focus": { transform: "translateY(0)" },
        }}
      >
        الانتقال إلى المحتوى الرئيسي
      </Box>

      <AppBar position="static" color="default" elevation={1}>
        <Toolbar component="nav" aria-label="التنقل الرئيسي">
          <Typography sx={{ flexGrow: 1, fontWeight: 700 }}>IHEPSRS</Typography>

          <Button component={Link} to="/" color="inherit">
            الرئيسية
          </Button>
          <Button component={Link} to="/login" color="inherit">
            الدخول
          </Button>
          <Button component={Link} to="/settings/users" color="inherit">
            الحسابات
          </Button>
          <Button component={Link} to="/settings/roles" color="inherit">
            الأدوار
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/settings/users" element={<UsersPage />} />
          <Route path="/settings/roles" element={<RolesPage />} />
        </Routes>
      </Box>
    </>
  );
}
