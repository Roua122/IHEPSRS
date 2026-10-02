import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "ihepsrs.prototype.session-token";

type LoginResult = {
  accessToken: string;
  tokenType: "Bearer";
  session: {
    sessionId: string;
    profile: "SENSITIVE" | "REGULAR";
    expiresAt: string;
    principal: {
      userId: string;
      roleAssignments: Array<{ roleCode: string }>;
    };
  };
};

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [result, setResult] = useState<LoginResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, mfaCode }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? "فشل تسجيل الدخول");
      }

      const loginResult = body as LoginResult;
      sessionStorage.setItem(TOKEN_KEY, loginResult.accessToken);
      setResult(loginResult);
      setPassword("");
      setMfaCode("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setResult(null);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack component="form" spacing={3} onSubmit={login}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            تسجيل الدخول
          </Typography>

          <Typography color="text.secondary">
            IAM-005 — مصادقة النموذج الأولي. المصادقة المحلية تعمل فقط كـ
            fallback عندما لا يتوفر SSO موثوق، وتتطلب MFA.
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {result ? (
            <Alert severity="success">
              تم تسجيل الدخول. المستخدم: {result.session.principal.userId} —
              الدور:{" "}
              {result.session.principal.roleAssignments
                .map((assignment) => assignment.roleCode)
                .join(", ")}
            </Alert>
          ) : null}

          <TextField
            label="اسم المستخدم"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <TextField
            label="رمز MFA (6 أرقام)"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            slotProps={{
              htmlInput: { inputMode: "numeric", maxLength: 6 },
            }}
            required
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
            </Button>
            {result ? (
              <Button type="button" variant="outlined" onClick={logout}>
                تسجيل الخروج
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
