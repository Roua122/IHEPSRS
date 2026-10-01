import { Alert, Container, Stack, Typography } from '@mui/material';

export function App() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h3">
          IHEPSRS
        </Typography>

        <Typography variant="h5">
          النموذج الأولي لنظام التعليم العالي والدراسات العليا والبحث العلمي
        </Typography>

        <Alert severity="info">
          Foundation scaffold جاهز. الصفحات الوظيفية ستتم إضافتها حسب Tasks المعتمدة.
        </Alert>
      </Stack>
    </Container>
  );
}
