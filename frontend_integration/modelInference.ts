import modelArtifactsData from "../artifacts/model_artifacts.json" with { type: "json" };
import preprocessingConfigData from "../artifacts/preprocessing_config.json" with { type: "json" };
import type {
  CoefficientItem,
  FeatureContribution,
  FrontendInferenceResult,
  LinearRegressionModel,
  LogisticRegressionModel,
  ModelArtifacts,
  PredictionFieldDefinition,
  PredictionInput,
  PreprocessingConfig,
  ValidationMismatch,
} from "./modelTypes.js";

export const modelArtifacts = modelArtifactsData as unknown as ModelArtifacts;
export const preprocessingConfig =
  preprocessingConfigData as unknown as PreprocessingConfig;

const educationalNote =
  "This is an educational estimate based on survey patterns, not a diagnosis.";

function normalizeChoice(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export const defaultPredictionInput: PredictionInput = {
  dailyHours: preprocessingConfig.default_fill_values.dailyHours,
  checkingFrequency: preprocessingConfig.default_fill_values.checkingFrequency,
  beforeSleep: preprocessingConfig.default_fill_values.beforeSleep,
  anxiousWithoutPhone: preprocessingConfig.default_fill_values.anxiousWithoutPhone,
  studyDistraction: preprocessingConfig.default_fill_values.studyDistraction,
  wasteTime: preprocessingConfig.default_fill_values.wasteTime,
  socialMediaIntensity: preprocessingConfig.default_fill_values.socialMediaIntensity,
  reductionIntent: preprocessingConfig.default_fill_values.reductionIntent,
};

export const predictionFields: PredictionFieldDefinition[] = preprocessingConfig.feature_order.map(
  (featureKey: keyof PredictionInput) => ({
    key: featureKey,
    label: preprocessingConfig.features[featureKey].label,
    helper: preprocessingConfig.features[featureKey].description,
    options: preprocessingConfig.features[featureKey].options,
  }),
);

export function normalizePredictionInput(
  input: Partial<PredictionInput> | Record<string, unknown>,
): { normalizedInput: PredictionInput; warnings: string[] } {
  const warnings: string[] = [];
  const normalizedInput = {} as PredictionInput;

  for (const key of preprocessingConfig.feature_order) {
    const featureConfig = preprocessingConfig.features[key];
    const rawValue = input[key];
    let value = featureConfig.default_code;

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      warnings.push(
        `${featureConfig.label}: missing input replaced with default code ${featureConfig.default_code}.`,
      );
      normalizedInput[key] = featureConfig.default_code;
      continue;
    }

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      value = Math.round(rawValue);
    } else if (typeof rawValue === "string") {
      const normalizedLabel = normalizeChoice(rawValue);
      if (/^-?\d+$/.test(normalizedLabel)) {
        value = Math.round(Number(normalizedLabel));
      } else {
        const mappedValue = featureConfig.aliases[normalizedLabel];
        if (mappedValue !== undefined) {
          value = mappedValue;
        } else {
          warnings.push(
            `${featureConfig.label}: unrecognized label "${rawValue}" replaced with default code ${featureConfig.default_code}.`,
          );
          normalizedInput[key] = featureConfig.default_code;
          continue;
        }
      }
    } else {
      warnings.push(
        `${featureConfig.label}: unsupported input type replaced with default code ${featureConfig.default_code}.`,
      );
      normalizedInput[key] = featureConfig.default_code;
      continue;
    }

    if (value < featureConfig.minimum_code || value > featureConfig.maximum_code) {
      warnings.push(
        `${featureConfig.label}: code ${value} is outside the allowed range and was replaced with default code ${featureConfig.default_code}.`,
      );
      normalizedInput[key] = featureConfig.default_code;
      continue;
    }

    normalizedInput[key] = value;
  }

  return { normalizedInput, warnings };
}

export function getLinearRegressionModel(): LinearRegressionModel {
  const payload = modelArtifacts.models.linear_regression;
  return {
    intercept: payload.intercept,
    coefficients: payload.coefficient_items.map((item: CoefficientItem) => ({
      label: item.label,
      value: item.value,
    })),
    r2: Number(payload.metrics.r2),
    mae: Number(payload.metrics.mae),
    rmse: Number(payload.metrics.rmse),
    sampleSize: Number(payload.metrics.sample_size),
  };
}

export function getLogisticRegressionModel(): LogisticRegressionModel {
  const payload = modelArtifacts.models.logistic_regression;
  return {
    bias: payload.intercept,
    weights: payload.coefficient_items.map((item: CoefficientItem) => ({
      label: item.label,
      value: item.value,
    })),
    accuracy: Number(payload.metrics.accuracy),
    precision: Number(payload.metrics.precision),
    recall: Number(payload.metrics.recall),
    f1: Number(payload.metrics.f1),
    rocAuc: Number(payload.metrics.roc_auc),
    threshold: payload.probability_threshold,
    sampleSize: Number(payload.metrics.sample_size),
  };
}

export function predictLinearScore(input: Partial<PredictionInput> | PredictionInput): number {
  const { normalizedInput } = normalizePredictionInput(input);
  const payload = modelArtifacts.models.linear_regression;
  let score = payload.intercept;

  for (const key of modelArtifacts.feature_order) {
    score += normalizedInput[key] * payload.coefficients[key];
  }

  const [minimumScore, maximumScore] = modelArtifacts.targets.addiction_score.range;
  return roundTo(Math.min(maximumScore, Math.max(minimumScore, score)), 6);
}

export function predictLogisticProbability(
  input: Partial<PredictionInput> | PredictionInput,
): number {
  const { normalizedInput } = normalizePredictionInput(input);
  const payload = modelArtifacts.models.logistic_regression;
  let linearValue = payload.intercept;

  for (const key of modelArtifacts.feature_order) {
    linearValue += normalizedInput[key] * payload.coefficients[key];
  }

  return roundTo(1 / (1 + Math.exp(-linearValue)), 6);
}

export function runFrontendInference(
  input: Partial<PredictionInput> | PredictionInput,
): FrontendInferenceResult {
  const { normalizedInput, warnings } = normalizePredictionInput(input);
  const addictionScore = predictLinearScore(normalizedInput);
  const addictionProbability = predictLogisticProbability(normalizedInput);
  const addictionRiskClass =
    addictionProbability >= modelArtifacts.models.logistic_regression.probability_threshold ? 1 : 0;
  const addictionRiskLabel =
    modelArtifacts.models.logistic_regression.class_labels[
      addictionRiskClass.toString() as "0" | "1"
    ];
  const contributions = calculateFeatureContributions(normalizedInput);
  const protectiveSignals = calculateProtectiveSignals(normalizedInput);
  const classLabel = addictionRiskClass === 1 ? "Addicted" : "Not Addicted";
  const probabilityBand = buildProbabilityBand(addictionProbability, addictionScore);

  return {
    normalizedInput,
    warnings,
    addictionScore,
    addictionProbability,
    addictionRiskClass,
    addictionRiskLabel,
    classLabel,
    probabilityBand,
    interpretation: buildInterpretation(addictionScore, addictionProbability, classLabel),
    topPositiveContributors: contributions.filter((item) => item.contribution > 0).slice(0, 3),
    topProtectiveSignals: protectiveSignals.slice(0, 3),
    topNegativeContributors: contributions.filter((item) => item.contribution < 0).slice(0, 3),
    note: educationalNote,
  };
}

export function runValidationCases(tolerance = 0.0001): ValidationMismatch[] {
  const mismatches: ValidationMismatch[] = [];

  for (const validationCase of modelArtifacts.validation_cases) {
    const inference = runFrontendInference(validationCase.input);

    if (Math.abs(inference.addictionScore - validationCase.expected.addiction_score) > tolerance) {
      mismatches.push({
        caseId: validationCase.case_id,
        field: "addiction_score",
        expected: validationCase.expected.addiction_score,
        actual: inference.addictionScore,
      });
    }

    if (
      Math.abs(inference.addictionProbability - validationCase.expected.addiction_probability) >
      tolerance
    ) {
      mismatches.push({
        caseId: validationCase.case_id,
        field: "addiction_probability",
        expected: validationCase.expected.addiction_probability,
        actual: inference.addictionProbability,
      });
    }

    if (inference.addictionRiskClass !== validationCase.expected.risk_class) {
      mismatches.push({
        caseId: validationCase.case_id,
        field: "risk_class",
        expected: validationCase.expected.risk_class,
        actual: inference.addictionRiskClass,
      });
    }
  }

  return mismatches;
}

export function calculateFeatureContributions(
  normalizedInput: PredictionInput,
): FeatureContribution[] {
  const coefficientItems = modelArtifacts.models.logistic_regression.coefficient_items;
  return coefficientItems
    .map((item: CoefficientItem) => {
      const feature = item.key;
      return {
        feature,
        label: item.label,
        coefficient: item.value,
        value: normalizedInput[feature],
        contribution: roundTo(item.value * normalizedInput[feature], 6),
      };
    })
    .sort(
      (left: FeatureContribution, right: FeatureContribution) =>
        Math.abs(right.contribution) - Math.abs(left.contribution),
    );
}

export function calculateProtectiveSignals(
  normalizedInput: PredictionInput,
): FeatureContribution[] {
  const coefficientItems = modelArtifacts.models.logistic_regression.coefficient_items;

  return coefficientItems
    .map((item: CoefficientItem) => {
      const feature = item.key;
      const featureConfig = preprocessingConfig.features[feature];
      const remainingHeadroom = Math.max(0, featureConfig.maximum_code - normalizedInput[feature]);

      return {
        feature,
        label: item.label,
        coefficient: item.value,
        value: normalizedInput[feature],
        contribution: roundTo(item.value * remainingHeadroom, 6),
      };
    })
    .filter((item: FeatureContribution) => item.contribution > 0)
    .sort(
      (left: FeatureContribution, right: FeatureContribution) =>
        Math.abs(right.contribution) - Math.abs(left.contribution),
    );
}

function buildProbabilityBand(probability: number, score: number): string {
  if (probability >= 0.75 || score >= 75) {
    return "Strong higher-risk pattern";
  }

  if (probability >= 0.5 || score >= 60) {
    return "Elevated pattern match";
  }

  if (probability >= 0.35 || score >= 45) {
    return "Mixed pattern";
  }

  return "Lower-risk pattern";
}

function buildInterpretation(
  score: number,
  probability: number,
  classLabel: "Addicted" | "Not Addicted",
): string {
  if (classLabel === "Addicted" && probability >= 0.75) {
    return (
      "This profile strongly matches the higher-risk usage patterns found in the survey, " +
      "with several behaviors pushing both the score and the probability upward."
    );
  }

  if (classLabel === "Addicted") {
    return (
      "This profile leans toward elevated addiction risk in the survey sample, although the " +
      "estimate should still be read as a classroom model output rather than a diagnosis."
    );
  }

  if (probability >= 0.35 || score >= 45) {
    return (
      "This profile sits near the middle of the sample: some behaviors suggest pressure toward " +
      "higher use, but the overall pattern remains below the model's risk cutoff."
    );
  }

  return (
    "This profile is closer to the lower-risk side of the survey sample, with the current " +
    "behavior pattern keeping the estimated risk below the model threshold."
  );
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
