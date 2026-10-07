export const ROLE_CATALOGUE = [
  {
    code: "CGA",
    name: "Central Governance Admin",
    scope: "Cross-Institution",
    description:
      "إدارة السياسات المركزية والمرجعيات والتفويضات عالية الحساسية.",
  },
  {
    code: "IRS",
    name: "Institution Registry Steward",
    scope: "Cross/Institution",
    description: "إدارة Institution/OrgUnit/Program وMapping والمرجعيات.",
  },
  {
    code: "UA",
    name: "University Admin",
    scope: "Institution",
    description: "إدارة المستخدمين والنطاق المؤسسي والبيانات المخولة.",
  },
  {
    code: "PGA",
    name: "Postgraduate Authority",
    scope: "Institution/Program",
    description:
      "الجهة المخولة بمراجعة واعتماد إجراءات الدراسات العليا داخل المؤسسة.",
  },
  {
    code: "PGO",
    name: "Postgraduate Officer/Reviewer",
    scope: "Institution/Program",
    description: "تشغيل ومراجعة الطلبات والقيود والرسائل.",
  },
  {
    code: "RA",
    name: "Research Authority",
    scope: "Institution",
    description: "الجهة المخولة باعتماد المقترحات والمشاريع البحثية.",
  },
  {
    code: "RO",
    name: "Research Officer/Reviewer",
    scope: "Institution",
    description: "التشغيل والمراجعة البحثية.",
  },
  {
    code: "DS",
    name: "Data Steward",
    scope: "Scoped",
    description: "حل تعارضات البيانات ومطابقة الأشخاص والـMappings.",
  },
  {
    code: "IO",
    name: "Integration Operator",
    scope: "Scoped System",
    description:
      "تشغيل التكامل ومعالجة Quarantine دون صلاحية تغيير حقائق المجال.",
  },
  {
    code: "SA",
    name: "Security Admin",
    scope: "Scoped/Central",
    description: "الأدوار، التفويض، مراجعة سجلات الأمان، Incident actions.",
  },
  {
    code: "RC",
    name: "Records Admin",
    scope: "Scoped",
    description: "الأرشفة والاحتفاظ والاسترجاع المصرح.",
  },
] as const;

export type RoleCode = (typeof ROLE_CATALOGUE)[number]["code"];
export type RoleDefinition = (typeof ROLE_CATALOGUE)[number];

export const UNCODED_ROLE_CATALOGUE_ROWS = [
  {
    label: "Student/Applicant",
    scope: "Self",
    description: "بياناته وطلباته فقط.",
  },
  {
    label: "Researcher/Supervisor",
    scope: "Self/Assigned",
    description: "ملف الباحث والمهام/الرسائل المسندة.",
  },
  {
    label: "Committee Member/External Examiner",
    scope: "Assigned Case",
    description: "وصول مؤقت لسجل/جلسة محددة وفق التفويض.",
  },
] as const;

export function isKnownRoleCode(roleCode: string): roleCode is RoleCode {
  return ROLE_CATALOGUE.some((role) => role.code === roleCode);
}

export function assertKnownRoleCode(
  roleCode: string,
): asserts roleCode is RoleCode {
  if (!isKnownRoleCode(roleCode)) {
    throw new Error(`Unknown roleCode: ${roleCode}`);
  }
}

export function getRoleDefinition(
  roleCode: string,
): RoleDefinition | undefined {
  return ROLE_CATALOGUE.find((role) => role.code === roleCode);
}
