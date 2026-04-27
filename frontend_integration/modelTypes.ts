export interface SelectOption {
  code: number;
  label: string;
}

export interface PredictionInput {
  dailyHours: number;
  checkingFrequency: number;
  beforeSleep: number;
  anxiousWithoutPhone: number;
  studyDistraction: number;
  wasteTime: number;
  socialMediaIntensity: number;
  reductionIntent: number;
}

export interface PredictionFieldDefinition {
  key: keyof PredictionInput;
  label: string;
  helper: string;
  options: SelectOption[];
}

export interface CoefficientItem {
  key: keyof PredictionInput;
  python_key: string;
  label: string;
  value: number;
}

export interface LinearRegressionModel {
  intercept: number;
  coefficients: Array<{ label: string; value: number }>;
  r2: number;
  mae: number;
  rmse: number;
  sampleSize: number;
}

export interface LogisticRegressionModel {
  bias: number;
  weights: Array<{ label: string; value: number }>;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  threshold: number;
  sampleSize: number;
}

export interface PreprocessingFeatureConfig {
  python_key: string;
  label: string;
  source_column: string;
  description: string;
  allowed_codes: number[];
  default_code: number;
  minimum_code: number;
  maximum_code: number;
  options: SelectOption[];
  label_to_code: Record<string, number>;
  aliases: Record<string, number>;
}

export interface ScoreComponentConfig {
  feature_key: string;
  frontend_key: keyof PredictionInput | null;
  label: string;
  weight: number;
  minimum_code: number;
  maximum_code: number;
  rationale: string;
}

export interface PreprocessingConfig {
  version: string;
  feature_order: Array<keyof PredictionInput>;
  python_feature_order: string[];
  default_fill_values: Record<keyof PredictionInput, number>;
  required_columns: string[];
  optional_score_columns: string[];
  row_rules: {
    min_non_empty_responses: number;
    max_missing_model_features: number;
    min_score_weight_coverage: number;
  };
  features: Record<keyof PredictionInput, PreprocessingFeatureConfig>;
  column_aliases: Record<string, string[]>;
  score_definition: {
    score_name: string;
    range: [number, number];
    components: ScoreComponentConfig[];
  };
  risk_definition: {
    primary_score_threshold: number;
    support_window_start: number;
    supportive_self_report_labels: string[];
    label_mapping: Record<"0" | "1", string>;
  };
}

export interface RegressionModelPayload {
  model_type: string;
  intercept: number;
  coefficients: Record<keyof PredictionInput, number>;
  coefficient_items: CoefficientItem[];
  metrics: Record<string, number | number[][]>;
  test_predictions: Array<Record<string, number | string>>;
}

export interface ValidationCase {
  case_id: string;
  label: string;
  input: PredictionInput;
  warnings?: string[];
  expected: {
    addiction_score: number;
    addiction_probability: number;
    risk_class: number;
    risk_label: string;
    top_positive_contributors?: Array<Record<string, number | string>>;
    top_negative_contributors?: Array<Record<string, number | string>>;
  };
}

export interface ModelArtifacts {
  version: string;
  generated_at: string;
  dataset: {
    source: string;
    source_type: string;
    raw_row_count: number;
    clean_row_count: number;
    malformed_row_count: number;
    model_row_count: number;
    dropped_response_ids: string[];
  };
  feature_order: Array<keyof PredictionInput>;
  python_feature_order: string[];
  targets: {
    addiction_score: {
      type: string;
      range: [number, number];
      description: string;
    };
    addiction_risk: {
      type: string;
      primary_threshold: number;
      support_window_start: number;
      supportive_self_report_labels: string[];
      labels: Record<"0" | "1", string>;
      description: string;
    };
  };
  models: {
    linear_regression: RegressionModelPayload;
    logistic_regression: RegressionModelPayload & {
      class_labels: Record<"0" | "1", string>;
      probability_threshold: number;
    };
  };
  validation_cases: ValidationCase[];
  notes: string[];
}

export interface FeatureContribution {
  feature: keyof PredictionInput;
  label: string;
  coefficient: number;
  value: number;
  contribution: number;
}

export interface FrontendInferenceResult {
  normalizedInput: PredictionInput;
  warnings: string[];
  addictionScore: number;
  addictionProbability: number;
  addictionRiskClass: number;
  addictionRiskLabel: string;
  classLabel: "Addicted" | "Not Addicted";
  probabilityBand: string;
  interpretation: string;
  topPositiveContributors: FeatureContribution[];
  topProtectiveSignals: FeatureContribution[];
  topNegativeContributors: FeatureContribution[];
  note: string;
}

export interface ValidationMismatch {
  caseId: string;
  field: string;
  expected: number;
  actual: number;
}
