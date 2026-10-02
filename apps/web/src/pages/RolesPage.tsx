import { useEffect, useState } from "react";
import {
  Alert,
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

interface CodedRole {
  code: string;
  name: string;
  scope: string;
  description: string;
}

interface UncodedRoleRow {
  label: string;
  scope: string;
  description: string;
}

interface RoleCatalogueResponse {
  taskId: string;
  sourceSections: string[];
  sourceIds: string[];
  codedRoles: CodedRole[];
  sourceGap: {
    uncodedRows: UncodedRoleRow[];
    roleCodesFabricated: boolean;
    note: string;
  };
  boundaries: {
    publishesRoleAssignmentWrites: boolean;
    permissionDecisionEngineImplemented: boolean;
    scopeAuthorizationTask: string;
    delegationTask: string;
    authenticationSessionTask: string;
  };
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export function RolesPage() {
  const [model, setModel] = useState<RoleCatalogueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/identity/role-catalogue`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setModel((await response.json()) as RoleCatalogueResponse);
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "تعذر تحميل كتالوج الأدوار",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <div>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            كتالوج الأدوار
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            TASK-IAM-002 — الأدوار ذات الرموز الصريحة في Analysis Baseline،
            Section 4.3.
          </Typography>
        </div>

        <Alert severity="info">
          هذه الصفحة معاينة مرجعية فقط. إسناد الأدوار والـscope-aware
          authorization والتفويض والمصادقة تكتمل في IAM-003 وIAM-004 وIAM-005.
        </Alert>

        {error ? (
          <Alert severity="error">تعذر الاتصال بالـAPI: {error}</Alert>
        ) : null}

        {!model && !error ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography>جارٍ تحميل كتالوج الأدوار...</Typography>
          </Stack>
        ) : null}

        {model ? (
          <>
            {model.codedRoles.length === 0 ? (
              <Alert severity="warning">
                لا توجد أدوار ذات roleCode معتمد.
              </Alert>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>الرمز</TableCell>
                      <TableCell>الدور/الجهة</TableCell>
                      <TableCell>النطاق</TableCell>
                      <TableCell>الوصف</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {model.codedRoles.map((role) => (
                      <TableRow key={role.code}>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {role.code}
                        </TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.scope}</TableCell>
                        <TableCell>{role.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            <Alert severity="warning">
              يحتوي Section 4.3 على {model.sourceGap.uncodedRows.length} صفوف
              أدوار/ Actors بلا roleCode صريح. لم يتم اختراع رموز لها في
              IAM-002.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, overflowX: "auto" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                صفوف المصدر التي تحتاج roleCode معتمد
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الدور/Actor</TableCell>
                    <TableCell>النطاق</TableCell>
                    <TableCell>الوصف</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {model.sourceGap.uncodedRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>{row.scope}</TableCell>
                      <TableCell>{row.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                حدود IAM-002
              </Typography>
              <Typography>
                Role assignment writes:{" "}
                {String(model.boundaries.publishesRoleAssignmentWrites)}
              </Typography>
              <Typography>
                Permission decision engine:{" "}
                {String(model.boundaries.permissionDecisionEngineImplemented)}
              </Typography>
              <Typography>
                Scope authorization: {model.boundaries.scopeAuthorizationTask}
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
