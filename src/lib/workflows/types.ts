export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldCondition {
  field: string;
  equals?: string | boolean;
  in?: string[];
  truthy?: boolean;
}

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "date"
  | "radio"
  | "property-picker"
  | "client-picker"
  | "file-upload";

export interface WorkflowField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  optionsSource?: "mediaOutlets" | "serviceLines" | "assetTypes"; // resolved server-side into `options`
  assetTypeTag?: string; // for file-upload fields
  showIf?: FieldCondition;
  colSpan?: 1 | 2;
}

export interface WorkflowStep {
  key: string;
  title: string;
  description?: string;
  fields: WorkflowField[];
}

export interface RequiredFieldRef {
  key: string;
  label: string;
}

export interface WorkflowDefinition {
  typeKey: string;
  steps: WorkflowStep[];
  requiredFields: RequiredFieldRef[];
  summaryFields: string[]; // fields to surface prominently on the request detail Overview tab
}
