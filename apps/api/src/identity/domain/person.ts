export interface PersonProps {
  personId: string;
  nationalIdentifier?: string;
  fullNameAr?: string;
  fullNameEn?: string;
  birthDate?: string;
  email?: string;
  mobile?: string;
  status: "Active" | "Archived";
}

export class Person {
  readonly personId: string;
  readonly nationalIdentifier?: string;
  readonly fullNameAr?: string;
  readonly fullNameEn?: string;
  readonly birthDate?: string;
  readonly email?: string;
  readonly mobile?: string;
  readonly status: "Active" | "Archived";

  constructor(props: PersonProps) {
    if (!props.personId.trim()) {
      throw new Error("Person.personId is required");
    }

    if (!props.fullNameAr?.trim() && !props.fullNameEn?.trim()) {
      throw new Error(
        "Person requires at least one of fullNameAr or fullNameEn",
      );
    }

    this.personId = props.personId;
    this.nationalIdentifier = props.nationalIdentifier;
    this.fullNameAr = props.fullNameAr?.trim();
    this.fullNameEn = props.fullNameEn?.trim();
    this.birthDate = props.birthDate;
    this.email = props.email;
    this.mobile = props.mobile;
    this.status = props.status;
  }

  toSafeSummary() {
    return {
      personId: this.personId,
      fullNameAr: this.fullNameAr,
      fullNameEn: this.fullNameEn,
      status: this.status,
    };
  }
}
