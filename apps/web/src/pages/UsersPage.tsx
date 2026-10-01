import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface AccountModelResponse {
  taskId: string;
  sourceIds: string[];
  userAccount: {
    fields: string[];
    statuses: string[];
    transitions: Record<string, string[]>;
  };
  person: {
    fields: string[];
    sensitiveFields: string[];
    identityRoot: boolean;
  };
  boundaries: {
    publishesSensitiveWriteEndpoints: boolean;
    roleCatalogueTask: string;
    scopeAuthorizationTask: string;
    delegationTask: string;
    authenticationSessionTask: string;
  };
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

const statusLabel: Record<string, string> = {
  Invited: "مدعو",
  Active: "نشط",
  Locked: "مقفل مؤقتًا",
  Disabled: "معطل",
  Archived: "مؤرشف",
};

export function UsersPage() {
  const [model, setModel] = useState<AccountModelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/identity/account-model`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setModel((await response.json()) as AccountModelResponse);
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error ? caught.message : "تعذر تحميل نموذج الحساب",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={700}>
            نموذج حساب المستخدم
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            TASK-IAM-001 — معاينة آمنة للنموذج ودورة الحالة فقط.
          </Typography>
        </Box>

        <Alert severity="info">
          لا تعرض هذه الصفحة بيانات مستخدمين حقيقية ولا تنشر عمليات إنشاء أو
          تعديل حساسة. الصلاحيات الفعلية والمصادقة تكتمل في IAM-003 و IAM-005.
        </Alert>

        {error ? (
          <Alert severity="error">تعذر الاتصال بالـAPI: {error}</Alert>
        ) : null}

        {!model && !error ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={24} />
            <Typography>جارٍ تحميل النموذج...</Typography>
          </Stack>
        ) : null}

        {model ? (
          <>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">حالات الحساب المعتمدة</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {model.userAccount.statuses.map((status) => (
                    <Chip
                      key={status}
                      label={`${statusLabel[status] ?? status} (${status})`}
                    />
                  ))}
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                انتقالات الحالة
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الحالة الحالية</TableCell>
                    <TableCell>الانتقالات المسموحة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(model.userAccount.transitions).map(
                    ([from, targets]) => (
                      <TableRow key={from}>
                        <TableCell>{from}</TableCell>
                        <TableCell>
                          {targets.length > 0
                            ? targets.join("، ")
                            : "لا توجد انتقالات"}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Person هو جذر الهوية</Typography>
                <Typography color="text.secondary">
                  UserAccount يرتبط بـ Person عبر personId. الحقول الحساسة لا
                  تعرض في هذه المعاينة.
                </Typography>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  {model.person.fields
                    .filter(
                      (field) => !model.person.sensitiveFields.includes(field),
                    )
                    .map((field) => (
                      <Chip key={field} label={field} variant="outlined" />
                    ))}
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                حدود المهمة
              </Typography>
              <Typography>
                Roles: {model.boundaries.roleCatalogueTask}
              </Typography>
              <Typography>
                Authorization: {model.boundaries.scopeAuthorizationTask}
              </Typography>
              <Typography>
                Delegation: {model.boundaries.delegationTask}
              </Typography>
              <Typography>
                Authentication / Sessions:{" "}
                {model.boundaries.authenticationSessionTask}
              </Typography>
            </Paper>
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
