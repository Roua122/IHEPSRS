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
            <Button component={Link} to="/settings/users" variant="contained">
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
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }} fontWeight={700}>
            IHEPSRS
          </Typography>

          <Button component={Link} to="/" color="inherit">
            الرئيسية
          </Button>
          <Button component={Link} to="/settings/users" color="inherit">
            الحسابات
          </Button>
          <Button component={Link} to="/settings/roles" color="inherit">
            الأدوار
          </Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings/users" element={<UsersPage />} />
        <Route path="/settings/roles" element={<RolesPage />} />
      </Routes>
    </>
  );
}
