const fs = require("node:fs");
const path = require("node:path");

function read(relative) {
  return fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
}

function assert(condition, testId, message) {
  if (!condition) throw new Error(`${testId}: ${message}`);
  console.log(`PASS ${testId}: ${message}`);
}

function main() {
  console.log("=== Verification: HRD-002 Accessibility ===");
  const html = read("index.html");
  const app = read("src/App.tsx");
  const login = read("src/pages/LoginPage.tsx");
  const users = read("src/pages/UsersPage.tsx");
  const roles = read("src/pages/RolesPage.tsx");
  const theme = read("src/theme.ts");

  assert(
    /<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html),
    "TC-NFR-019",
    "Arabic document language and RTL direction are declared at the document root",
  );
  assert(
    app.includes('href="#main-content"') &&
      app.includes('component="main"') &&
      app.includes('id="main-content"'),
    "TC-NFR-035",
    "Keyboard users have a skip link and semantic main landmark",
  );
  assert(
    theme.includes("Mui-focusVisible") && theme.includes("outline"),
    "TC-NFR-019",
    "Interactive MUI controls receive an explicit visible keyboard focus indicator",
  );
  assert(
    login.includes('role="alert"') &&
      login.includes('aria-live="assertive"') &&
      login.includes('role="status"') &&
      login.includes("feedbackRef.current?.focus()"),
    "TC-NFR-035",
    "Login validation/success feedback is announced and receives focus management",
  );
  assert(
    (users.match(/aria-label=/g) ?? []).length >= 1 &&
      (roles.match(/aria-label=/g) ?? []).length >= 2,
    "TC-NFR-035",
    "Core data tables expose accessible names for screen-reader users",
  );
  assert(
    login.includes('label="اسم المستخدم"') &&
      login.includes('label="كلمة المرور"') &&
      login.includes('label="رمز MFA (6 أرقام)"'),
    "TC-NFR-019",
    "Core login inputs retain explicit programmatic labels",
  );
  assert(
    !/outline:\s*["']?none/.test(theme) && !/outline:\s*0/.test(theme),
    "TC-NFR-035",
    "Global theme does not suppress visible focus outlines",
  );

  console.log("\nHRD-002 accessibility verification passed.");
}

main();
