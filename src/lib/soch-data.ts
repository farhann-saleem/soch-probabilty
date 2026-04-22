import Papa from "papaparse";

export const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5IeFvPCjoZrE8jAU1a8aURcmCQf5gSgozCKV-FJqYXMx-RfwAxI7EvGru1KmFKPFeWn7TVecgqaDK/pub?output=csv";

const columns = {
  timestamp: "Timestamp",
  ageGroup: "What is your age group?  ",
  gender: "What is your gender?  ",
  educationLevel: "What is your education level?",
  dailyHours: "How many hours do you use your mobile phone daily?  ",
  mainPurpose: "What is your main purpose for using a mobile phone?  ",
  checkingFrequency: "How often do you check your phone in a day?  ",
  wakeCheck: "Do you check your phone immediately after waking up?  ",
  beforeSleep: "How often do you use your phone before sleeping?  ",
  anxiousWithoutPhone: "Do you feel anxious without your phone?  ",
  studyDistraction:
    "How often do you feel distracted by your phone while studying?  ",
  classUsage: "Do you use your phone during class/lecture?  ",
  selfReportedAddiction: "Do you think you are addicted to your phone?  ",
  sleepAffected: "Has phone usage affected your sleep?  ",
  academicPerformance:
    "Has mobile phone usage affected your academic performance?  ",
  reductionAttempts: "How often do you try to reduce your phone usage?  ",
  favoriteApp: "Which app do you use the most?  ",
  wasteTime: "Do you feel you waste time on your phone?  ",
  duringMeals: "How often do you use your phone while eating?  ",
  batteryLow: "I feel uncomfortable when my phone battery is low.  ",
  onlineCommunication:
    "I prefer online communication over face-to-face interaction.  ",
  socialMediaIntensity: "I spend a lot of time on social media.  ",
  productiveUse:
    "I use my phone for productive purposes such as study or work.",
  reductionIntent: "I would like to reduce my mobile phone usage.",
  problems:
    "What problems do you face due to excessive use of mobile phones?",
} as const;

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

export interface DistributionDatum {
  label: string;
  count: number;
  percentage: number;
}

export interface HistogramDatum {
  label: string;
  count: number;
}

export interface ModelCoefficient {
  label: string;
  value: number;
}

export interface LinearRegressionModel {
  intercept: number;
  coefficients: ModelCoefficient[];
  r2: number;
  sampleSize: number;
}

export interface LogisticRegressionModel {
  bias: number;
  weights: ModelCoefficient[];
  means: number[];
  deviations: number[];
  accuracy: number;
  sampleSize: number;
}

export interface SurveyRecord {
  id: string;
  timestamp: Date | null;
  timestampLabel: string;
  ageGroup: string | null;
  gender: string | null;
  educationLevel: string | null;
  dailyHours: string | null;
  mainPurpose: string | null;
  checkingFrequency: string | null;
  wakeCheck: string | null;
  beforeSleep: string | null;
  anxiousWithoutPhone: string | null;
  studyDistraction: string | null;
  classUsage: string | null;
  selfReportedAddiction: string | null;
  sleepAffected: string | null;
  academicPerformance: string | null;
  reductionAttempts: string | null;
  favoriteApp: string | null;
  wasteTime: string | null;
  duringMeals: string | null;
  batteryLow: string | null;
  onlineCommunication: string | null;
  socialMediaIntensity: string | null;
  productiveUse: string | null;
  reductionIntent: string | null;
  problems: string | null;
  valid: boolean;
  addictionScore: number;
  addictionBand: string;
  riskBinary: number;
  modelFeatures: PredictionInput | null;
}

export interface SurveySnapshot {
  meta: {
    totalResponses: number;
    cleanResponses: number;
    invalidResponses: number;
    lastUpdated: string;
    lastUpdatedLabel: string;
  };
  rows: SurveyRecord[];
  liveSummary: {
    mostCommonUsage: string;
    mostCommonPurpose: string;
    dominantApp: string;
    reductionIntentRate: number;
  };
  distributions: {
    usageHours: DistributionDatum[];
    educationLevels: DistributionDatum[];
    mainPurposes: DistributionDatum[];
    favoriteApps: DistributionDatum[];
    addictionBands: DistributionDatum[];
    scoreHistogram: HistogramDatum[];
  };
  latestResponses: Array<{
    id: string;
    timestampLabel: string;
    profile: string;
    mainPurpose: string;
    usageHours: string;
    problem: string | null;
  }>;
  descriptiveStats: {
    mean: number;
    median: number;
    mode: number;
    variance: number;
    standardDeviation: number;
    rangeStart: number;
    rangeEnd: number;
  };
  probabilities: {
    heavyUse: number;
    sleepAffected: number;
    studyDistraction: number;
    sleepAffectedGivenHeavyUse: number;
  };
  insights: string[];
  recommendationBullets: string[];
  problems: string[];
  regression: {
    linear: LinearRegressionModel;
    logistic: LogisticRegressionModel;
  };
  defaultPredictionInput: PredictionInput;
}

const likertOptions: SelectOption[] = [
  { code: 1, label: "Strongly Disagree" },
  { code: 2, label: "Disagree" },
  { code: 3, label: "Neutral" },
  { code: 4, label: "Agree" },
  { code: 5, label: "Strongly Agree" },
];

const yesNoMaybeMap = new Map([
  ["No", 0],
  ["Sometimes", 1],
  ["Maybe", 1],
  ["Yes", 2],
]);

const yesNoMap = new Map([
  ["No", 0],
  ["Sometimes", 1],
  ["Yes", 2],
]);

const dailyHoursOptions: SelectOption[] = [
  { code: 1, label: "Less than 2 hours" },
  { code: 2, label: "2-4 hours" },
  { code: 3, label: "4-6 hours" },
  { code: 4, label: "More than 6 hours" },
];

const checkingFrequencyOptions: SelectOption[] = [
  { code: 1, label: "Less than 10 times" },
  { code: 2, label: "10-30 times" },
  { code: 3, label: "30-60 times" },
  { code: 4, label: "More than 60 times" },
];

const beforeSleepOptions: SelectOption[] = [
  { code: 1, label: "Sometimes" },
  { code: 2, label: "Often" },
  { code: 3, label: "Every day" },
];

const studyFrequencyOptions: SelectOption[] = [
  { code: 1, label: "Never" },
  { code: 2, label: "Sometimes" },
  { code: 3, label: "Often" },
  { code: 4, label: "Always" },
];

export const predictionFields: PredictionFieldDefinition[] = [
  {
    key: "dailyHours",
    label: "Daily phone usage",
    helper: "How much screen time the student logs in a typical day.",
    options: dailyHoursOptions,
  },
  {
    key: "checkingFrequency",
    label: "Checking frequency",
    helper: "How often the phone is checked during the day.",
    options: checkingFrequencyOptions,
  },
  {
    key: "beforeSleep",
    label: "Before-sleep use",
    helper: "How routinely the phone shows up in the nightly routine.",
    options: beforeSleepOptions,
  },
  {
    key: "anxiousWithoutPhone",
    label: "Anxiety without phone",
    helper: "A proxy for emotional dependence on device access.",
    options: [
      { code: 0, label: "No" },
      { code: 1, label: "Sometimes" },
      { code: 2, label: "Yes" },
    ],
  },
  {
    key: "studyDistraction",
    label: "Study distraction",
    helper: "How much attention is lost to the phone during study time.",
    options: studyFrequencyOptions,
  },
  {
    key: "wasteTime",
    label: "Feels like wasted time",
    helper: "Whether the student believes their usage is wasting time.",
    options: [
      { code: 0, label: "No" },
      { code: 1, label: "Sometimes" },
      { code: 2, label: "Yes" },
    ],
  },
  {
    key: "socialMediaIntensity",
    label: "Social media intensity",
    helper: "Agreement with the idea that a lot of time is spent on social media.",
    options: likertOptions,
  },
  {
    key: "reductionIntent",
    label: "Wants to reduce use",
    helper: "How strongly the student wants to cut back usage.",
    options: likertOptions,
  },
];

const featureLabels = [
  "Daily phone usage",
  "Checking frequency",
  "Before-sleep use",
  "Anxiety without phone",
  "Study distraction",
  "Feels like wasted time",
  "Social media intensity",
  "Reduction intent",
];

type RawRow = Record<string, string>;

export async function fetchSurveySnapshot(): Promise<SurveySnapshot> {
  const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load the published survey feed (${response.status}).`);
  }

  const csv = await response.text();
  const parsed = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data.map(mapRow);
  const validRows = rows.filter((row) => row.valid);
  const completeModelRows = validRows.filter(
    (row): row is SurveyRecord & { modelFeatures: PredictionInput } => row.modelFeatures !== null,
  );

  const scoreValues = validRows.map((row) => row.addictionScore);
  const latestRows = [...validRows].sort(sortByTimestampDescending);
  const linear = trainLinearRegression(
    completeModelRows.map((row) => row.modelFeatures),
    completeModelRows.map((row) => row.addictionScore),
  );
  const logistic = trainLogisticRegression(
    completeModelRows.map((row) => row.modelFeatures),
    completeModelRows.map((row) => row.riskBinary),
  );
  const heavyUsers = validRows.filter((row) => codeForOption(dailyHoursOptions, row.dailyHours) === 4);
  const reductionIntentPositive = validRows.filter(
    (row) => {
      const reductionIntent = normalizeLikert(row.reductionIntent);
      return reductionIntent !== null && reductionIntent >= 4;
    },
  ).length;
  const lastUpdated = latestRows[0]?.timestamp ?? null;

  return {
    meta: {
      totalResponses: rows.length,
      cleanResponses: validRows.length,
      invalidResponses: rows.length - validRows.length,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : "",
      lastUpdatedLabel: lastUpdated ? formatTimestamp(lastUpdated) : "No valid timestamp",
    },
    rows: validRows,
    liveSummary: {
      mostCommonUsage: mostCommonLabel(validRows.map((row) => row.dailyHours), "No data"),
      mostCommonPurpose: mostCommonLabel(validRows.map((row) => row.mainPurpose), "No data"),
      dominantApp: mostCommonLabel(validRows.map((row) => row.favoriteApp), "No data"),
      reductionIntentRate:
        validRows.length === 0 ? 0 : reductionIntentPositive / validRows.length,
    },
    distributions: {
      usageHours: buildDistribution(validRows.map((row) => row.dailyHours), dailyHoursOptions),
      educationLevels: buildDistribution(validRows.map((row) => row.educationLevel), []),
      mainPurposes: buildDistribution(validRows.map((row) => row.mainPurpose), []),
      favoriteApps: buildDistribution(validRows.map((row) => row.favoriteApp), []),
      addictionBands: buildDistribution(validRows.map((row) => row.addictionBand), [
        { code: 1, label: "Steady use" },
        { code: 2, label: "Elevated use" },
        { code: 3, label: "High-use risk" },
      ]),
      scoreHistogram: buildHistogram(scoreValues, 7),
    },
    latestResponses: latestRows.slice(0, 4).map((row) => ({
      id: row.id,
      timestampLabel: row.timestampLabel,
      profile: [row.ageGroup, row.educationLevel, row.gender]
        .filter(Boolean)
        .join(" / "),
      mainPurpose: row.mainPurpose ?? "No purpose recorded",
      usageHours: row.dailyHours ?? "No duration recorded",
      problem: normalizeProblem(row.problems),
    })),
    descriptiveStats: {
      mean: mean(scoreValues),
      median: median(scoreValues),
      mode: mode(scoreValues),
      variance: variance(scoreValues),
      standardDeviation: standardDeviation(scoreValues),
      rangeStart: scoreValues.length ? Math.min(...scoreValues) : 0,
      rangeEnd: scoreValues.length ? Math.max(...scoreValues) : 0,
    },
    probabilities: {
      heavyUse: safeRatio(heavyUsers.length, validRows.length),
      sleepAffected: safeRatio(
        validRows.filter((row) => yesNoMap.get(row.sleepAffected ?? "") === 2).length,
        validRows.length,
      ),
      studyDistraction: safeRatio(
        validRows.filter((row) => {
          const value = codeForOption(studyFrequencyOptions, row.studyDistraction);
          return value !== null && value >= 3;
        }).length,
        validRows.length,
      ),
      sleepAffectedGivenHeavyUse: safeRatio(
        heavyUsers.filter((row) => yesNoMap.get(row.sleepAffected ?? "") === 2).length,
        heavyUsers.length,
      ),
    },
    insights: buildInsights(validRows),
    recommendationBullets: [
      "Treat the score as an educational signal, not a diagnosis or a label for a person.",
      "Use the CLT and probability sections to explain why small samples can mislead.",
      "Present the strongest relationships with formulas and plain-English interpretation side by side.",
    ],
    problems: validRows
      .map((row) => normalizeProblem(row.problems))
      .filter((problem): problem is string => Boolean(problem))
      .slice(0, 6),
    regression: {
      linear,
      logistic,
    },
    defaultPredictionInput: buildDefaultPredictionInput(validRows),
  };
}

export function simulateSampleMeans(
  values: number[],
  sampleSize: number,
  simulationCount: number,
): number[] {
  if (values.length === 0 || sampleSize <= 0 || simulationCount <= 0) {
    return [];
  }

  const meansFromSamples: number[] = [];

  for (let run = 0; run < simulationCount; run += 1) {
    let sum = 0;

    for (let index = 0; index < sampleSize; index += 1) {
      const sample = values[Math.floor(Math.random() * values.length)];
      sum += sample;
    }

    meansFromSamples.push(Number((sum / sampleSize).toFixed(2)));
  }

  return meansFromSamples;
}

export function predictLinearScore(
  model: LinearRegressionModel,
  input: PredictionInput,
): number {
  const values = modelInputToArray(input);
  const score = values.reduce((sum, value, index) => {
    const coefficient = model.coefficients[index]?.value ?? 0;
    return sum + value * coefficient;
  }, model.intercept);

  return clamp(score, 0, 100);
}

export function predictLogisticProbability(
  model: LogisticRegressionModel,
  input: PredictionInput,
): number {
  const values = modelInputToArray(input).map((value, index) => {
    const deviation = model.deviations[index] === 0 ? 1 : model.deviations[index];
    return (value - model.means[index]) / deviation;
  });
  const score = values.reduce((sum, value, index) => {
    const coefficient = model.weights[index]?.value ?? 0;
    return sum + value * coefficient;
  }, model.bias);

  return sigmoid(score);
}

function mapRow(rawRow: RawRow, index: number): SurveyRecord {
  const timestamp = parseTimestamp(trimValue(rawRow[columns.timestamp]));
  const ageGroup = trimValue(rawRow[columns.ageGroup]);
  const gender = trimValue(rawRow[columns.gender]);
  const educationLevel = trimValue(rawRow[columns.educationLevel]);
  const dailyHours = normalizeDashValue(trimValue(rawRow[columns.dailyHours]));
  const mainPurpose = trimValue(rawRow[columns.mainPurpose]);
  const checkingFrequency = normalizeDashValue(trimValue(rawRow[columns.checkingFrequency]));
  const wakeCheck = trimValue(rawRow[columns.wakeCheck]);
  const beforeSleep = trimValue(rawRow[columns.beforeSleep]);
  const anxiousWithoutPhone = trimValue(rawRow[columns.anxiousWithoutPhone]);
  const studyDistraction = trimValue(rawRow[columns.studyDistraction]);
  const classUsage = trimValue(rawRow[columns.classUsage]);
  const selfReportedAddiction = trimValue(rawRow[columns.selfReportedAddiction]);
  const sleepAffected = trimValue(rawRow[columns.sleepAffected]);
  const academicPerformance = trimValue(rawRow[columns.academicPerformance]);
  const reductionAttempts = trimValue(rawRow[columns.reductionAttempts]);
  const favoriteApp = trimValue(rawRow[columns.favoriteApp]);
  const wasteTime = trimValue(rawRow[columns.wasteTime]);
  const duringMeals = trimValue(rawRow[columns.duringMeals]);
  const batteryLow = normalizeLikertText(trimValue(rawRow[columns.batteryLow]));
  const onlineCommunication = normalizeLikertText(
    trimValue(rawRow[columns.onlineCommunication]),
  );
  const socialMediaIntensity = normalizeSocialMediaLikert(
    trimValue(rawRow[columns.socialMediaIntensity]),
  );
  const productiveUse = normalizeProductiveUse(trimValue(rawRow[columns.productiveUse]));
  const reductionIntent = normalizeReductionIntent(trimValue(rawRow[columns.reductionIntent]));
  const problems = trimValue(rawRow[columns.problems]);
  const completeness = [
    ageGroup,
    gender,
    educationLevel,
    dailyHours,
    mainPurpose,
    checkingFrequency,
    wakeCheck,
    beforeSleep,
    anxiousWithoutPhone,
    studyDistraction,
    classUsage,
    selfReportedAddiction,
    sleepAffected,
    academicPerformance,
    reductionAttempts,
    favoriteApp,
    wasteTime,
    duringMeals,
    batteryLow,
    onlineCommunication,
    socialMediaIntensity,
    productiveUse,
    reductionIntent,
  ].filter(Boolean).length;
  const modelFeatures = buildModelFeatures({
    dailyHours,
    checkingFrequency,
    beforeSleep,
    anxiousWithoutPhone,
    studyDistraction,
    wasteTime,
    socialMediaIntensity,
    reductionIntent,
  });
  const addictionScore = computeAddictionScore({
    dailyHours,
    checkingFrequency,
    beforeSleep,
    anxiousWithoutPhone,
    studyDistraction,
    classUsage,
    sleepAffected,
    wasteTime,
    batteryLow,
    socialMediaIntensity,
    reductionIntent,
  });
  const valid =
    completeness >= 12 &&
    dailyHours !== null &&
    checkingFrequency !== null &&
    beforeSleep !== null &&
    studyDistraction !== null;
  const addictionBand =
    addictionScore >= 67 ? "High-use risk" : addictionScore >= 45 ? "Elevated use" : "Steady use";

  return {
    id: `${timestamp?.toISOString() ?? "row"}-${index}`,
    timestamp,
    timestampLabel: timestamp ? formatTimestamp(timestamp) : "Unknown time",
    ageGroup,
    gender,
    educationLevel,
    dailyHours,
    mainPurpose,
    checkingFrequency,
    wakeCheck,
    beforeSleep,
    anxiousWithoutPhone,
    studyDistraction,
    classUsage,
    selfReportedAddiction,
    sleepAffected,
    academicPerformance,
    reductionAttempts,
    favoriteApp,
    wasteTime,
    duringMeals,
    batteryLow,
    onlineCommunication,
    socialMediaIntensity,
    productiveUse,
    reductionIntent,
    problems,
    valid,
    addictionScore,
    addictionBand,
    riskBinary: addictionScore >= 60 || selfReportedAddiction === "Yes" ? 1 : 0,
    modelFeatures,
  };
}

function buildInsights(rows: SurveyRecord[]): string[] {
  const heavyUseRate = safeRatio(
    rows.filter((row) => codeForOption(dailyHoursOptions, row.dailyHours) === 4).length,
    rows.length,
  );
  const sleepImpactForHeavyUse = safeRatio(
    rows.filter(
      (row) =>
        codeForOption(dailyHoursOptions, row.dailyHours) === 4 &&
        yesNoMap.get(row.sleepAffected ?? "") === 2,
    ).length,
    rows.filter((row) => codeForOption(dailyHoursOptions, row.dailyHours) === 4).length,
  );
  const selfPerceivedAddiction = safeRatio(
    rows.filter((row) => row.selfReportedAddiction === "Yes").length,
    rows.length,
  );
  const topApp = mostCommonLabel(rows.map((row) => row.favoriteApp), "No dominant app");

  return [
    `${formatPercentage(heavyUseRate)} of valid respondents report using their phone for more than 6 hours a day.`,
    `${formatPercentage(sleepImpactForHeavyUse)} of heavy users also say their sleep is affected, which gives the probability lab a concrete conditional event.`,
    `${formatPercentage(selfPerceivedAddiction)} openly describe themselves as addicted, so the regression section can compare self-perception against the coded score.`,
    `${topApp} is the dominant app category in this sample, which helps frame the behavioural story on the landing page.`,
  ];
}

function buildDefaultPredictionInput(rows: SurveyRecord[]): PredictionInput {
  const features = rows
    .map((row) => row.modelFeatures)
    .filter((feature): feature is PredictionInput => feature !== null);

  if (features.length === 0) {
    return {
      dailyHours: 2,
      checkingFrequency: 2,
      beforeSleep: 2,
      anxiousWithoutPhone: 1,
      studyDistraction: 2,
      wasteTime: 1,
      socialMediaIntensity: 3,
      reductionIntent: 3,
    };
  }

  return {
    dailyHours: roundedMean(features.map((feature) => feature.dailyHours)),
    checkingFrequency: roundedMean(features.map((feature) => feature.checkingFrequency)),
    beforeSleep: roundedMean(features.map((feature) => feature.beforeSleep)),
    anxiousWithoutPhone: roundedMean(features.map((feature) => feature.anxiousWithoutPhone)),
    studyDistraction: roundedMean(features.map((feature) => feature.studyDistraction)),
    wasteTime: roundedMean(features.map((feature) => feature.wasteTime)),
    socialMediaIntensity: roundedMean(features.map((feature) => feature.socialMediaIntensity)),
    reductionIntent: roundedMean(features.map((feature) => feature.reductionIntent)),
  };
}

function buildModelFeatures(values: {
  dailyHours: string | null;
  checkingFrequency: string | null;
  beforeSleep: string | null;
  anxiousWithoutPhone: string | null;
  studyDistraction: string | null;
  wasteTime: string | null;
  socialMediaIntensity: string | null;
  reductionIntent: string | null;
}): PredictionInput | null {
  const dailyHours = codeForOption(dailyHoursOptions, values.dailyHours);
  const checkingFrequency = codeForOption(checkingFrequencyOptions, values.checkingFrequency);
  const beforeSleep = codeForOption(beforeSleepOptions, values.beforeSleep);
  const anxiousWithoutPhone = values.anxiousWithoutPhone
    ? yesNoMap.get(values.anxiousWithoutPhone) ?? null
    : null;
  const studyDistraction = codeForOption(studyFrequencyOptions, values.studyDistraction);
  const wasteTime = values.wasteTime ? yesNoMap.get(values.wasteTime) ?? null : null;
  const socialMediaIntensity = normalizeLikert(values.socialMediaIntensity);
  const reductionIntent = normalizeLikert(values.reductionIntent);

  if (
    dailyHours === null ||
    checkingFrequency === null ||
    beforeSleep === null ||
    anxiousWithoutPhone === null ||
    studyDistraction === null ||
    wasteTime === null ||
    socialMediaIntensity === null ||
    reductionIntent === null
  ) {
    return null;
  }

  return {
    dailyHours,
    checkingFrequency,
    beforeSleep,
    anxiousWithoutPhone,
    studyDistraction,
    wasteTime,
    socialMediaIntensity,
    reductionIntent,
  };
}

function computeAddictionScore(values: {
  dailyHours: string | null;
  checkingFrequency: string | null;
  beforeSleep: string | null;
  anxiousWithoutPhone: string | null;
  studyDistraction: string | null;
  classUsage: string | null;
  sleepAffected: string | null;
  wasteTime: string | null;
  batteryLow: string | null;
  socialMediaIntensity: string | null;
  reductionIntent: string | null;
}): number {
  const dimensions = [
    normalizedDimension(codeForOption(dailyHoursOptions, values.dailyHours), 4, 14),
    normalizedDimension(
      codeForOption(checkingFrequencyOptions, values.checkingFrequency),
      4,
      14,
    ),
    normalizedDimension(codeForOption(beforeSleepOptions, values.beforeSleep), 3, 12),
    normalizedDimension(yesNoMap.get(values.anxiousWithoutPhone ?? "") ?? null, 2, 10),
    normalizedDimension(codeForOption(studyFrequencyOptions, values.studyDistraction), 4, 12),
    normalizedDimension(codeForOption(studyFrequencyOptions, values.classUsage), 4, 8),
    normalizedDimension(yesNoMap.get(values.sleepAffected ?? "") ?? null, 2, 10),
    normalizedDimension(yesNoMap.get(values.wasteTime ?? "") ?? null, 2, 10),
    normalizedDimension(normalizeLikert(values.batteryLow), 5, 5),
    normalizedDimension(normalizeLikert(values.socialMediaIntensity), 5, 10),
    normalizedDimension(normalizeLikert(values.reductionIntent), 5, 5),
  ];
  const available = dimensions.filter((dimension): dimension is number => dimension !== null);

  if (available.length === 0) {
    return 0;
  }

  return Number((available.reduce((sum, value) => sum + value, 0) / available.length).toFixed(1));
}

function normalizedDimension(value: number | null, max: number, weight: number): number | null {
  if (value === null) {
    return null;
  }

  return (value / max) * weight * 6.8;
}

function trainLinearRegression(
  inputs: PredictionInput[],
  targets: number[],
): LinearRegressionModel {
  if (inputs.length === 0) {
    return {
      intercept: 0,
      coefficients: featureLabels.map((label) => ({ label, value: 0 })),
      r2: 0,
      sampleSize: 0,
    };
  }

  const matrix = inputs.map((input) => [1, ...modelInputToArray(input)]);
  const transposeMatrix = transpose(matrix);
  const regularized = multiplyMatrices(transposeMatrix, matrix).map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      rowIndex === columnIndex && rowIndex !== 0 ? value + 0.2 : value,
    ),
  );
  const weights = multiplyMatrixVector(
    multiplyMatrices(invertMatrix(regularized), transposeMatrix),
    targets,
  );
  const predictions = matrix.map((row) => dot(row, weights));
  const meanTarget = mean(targets);
  const totalVariance = targets.reduce(
    (sum, target) => sum + (target - meanTarget) ** 2,
    0,
  );
  const residualVariance = targets.reduce(
    (sum, target, index) => sum + (target - predictions[index]) ** 2,
    0,
  );

  return {
    intercept: Number(weights[0].toFixed(3)),
    coefficients: featureLabels.map((label, index) => ({
      label,
      value: Number(weights[index + 1].toFixed(3)),
    })),
    r2: totalVariance === 0 ? 0 : Number((1 - residualVariance / totalVariance).toFixed(3)),
    sampleSize: inputs.length,
  };
}

function trainLogisticRegression(
  inputs: PredictionInput[],
  targets: number[],
): LogisticRegressionModel {
  if (inputs.length === 0) {
    return {
      bias: 0,
      weights: featureLabels.map((label) => ({ label, value: 0 })),
      means: new Array(featureLabels.length).fill(0),
      deviations: new Array(featureLabels.length).fill(1),
      accuracy: 0,
      sampleSize: 0,
    };
  }

  const values = inputs.map(modelInputToArray);
  const means = values[0].map((_, index) => mean(values.map((row) => row[index])));
  const deviations = values[0].map((_, index) => {
    const deviation = standardDeviation(values.map((row) => row[index]));
    return deviation === 0 ? 1 : deviation;
  });
  const standardized = values.map((row) =>
    row.map((value, index) => (value - means[index]) / deviations[index]),
  );
  const weights = new Array(featureLabels.length).fill(0);
  let bias = 0;
  const learningRate = 0.08;
  const iterations = 1500;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let biasGradient = 0;
    const gradients = new Array(featureLabels.length).fill(0);

    standardized.forEach((row, rowIndex) => {
      const prediction = sigmoid(
        row.reduce((sum, value, valueIndex) => sum + value * weights[valueIndex], bias),
      );
      const error = prediction - targets[rowIndex];
      biasGradient += error;

      row.forEach((value, valueIndex) => {
        gradients[valueIndex] += error * value;
      });
    });

    bias -= (learningRate * biasGradient) / standardized.length;
    weights.forEach((weight, index) => {
      weights[index] =
        weight - (learningRate * gradients[index]) / standardized.length - weight * 0.0006;
    });
  }

  const accuracy = standardized.reduce((count, row, rowIndex) => {
    const probability = sigmoid(
      row.reduce((sum, value, valueIndex) => sum + value * weights[valueIndex], bias),
    );
    return count + ((probability >= 0.5 ? 1 : 0) === targets[rowIndex] ? 1 : 0);
  }, 0);

  return {
    bias: Number(bias.toFixed(3)),
    weights: featureLabels.map((label, index) => ({
      label,
      value: Number(weights[index].toFixed(3)),
    })),
    means,
    deviations,
    accuracy: Number((accuracy / standardized.length).toFixed(3)),
    sampleSize: inputs.length,
  };
}

function buildDistribution(
  values: Array<string | null>,
  orderedOptions: SelectOption[],
): DistributionDatum[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  const total = values.filter(Boolean).length;
  const order = new Map<string, number>(
    orderedOptions.map((option, index) => [option.label, index]),
  );

  return [...counts.entries()]
    .sort(([labelA, countA], [labelB, countB]) => {
      const orderA = order.get(labelA);
      const orderB = order.get(labelB);

      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }

      if (orderA !== undefined) {
        return -1;
      }

      if (orderB !== undefined) {
        return 1;
      }

      return countB - countA || labelA.localeCompare(labelB);
    })
    .map(([label, count]) => ({
      label,
      count,
      percentage: safeRatio(count, total),
    }));
}

export function buildHistogram(values: number[], bucketCount: number): HistogramDatum[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ label: `${min}`, count: values.length }];
  }

  const width = (max - min) / bucketCount;
  const bins = new Array(bucketCount).fill(0);

  values.forEach((value) => {
    const bucketIndex =
      value === max ? bucketCount - 1 : Math.min(bucketCount - 1, Math.floor((value - min) / width));
    bins[bucketIndex] += 1;
  });

  return bins.map((count, index) => {
    const rangeStart = min + width * index;
    const rangeEnd = rangeStart + width;

    return {
      label: `${Math.round(rangeStart)}-${Math.round(rangeEnd)}`,
      count,
    };
  });
}

function codeForOption(options: SelectOption[], value: string | null): number | null {
  if (!value) {
    return null;
  }

  const option = options.find((candidate) => candidate.label === value);
  return option ? option.code : null;
}

function normalizeLikert(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const option = likertOptions.find((candidate) => candidate.label === value);
  return option ? option.code : null;
}

function normalizeLikertText(value: string | null): string | null {
  if (value === "No") {
    return "Disagree";
  }

  if (value === "Yes") {
    return "Agree";
  }

  return value;
}

function normalizeSocialMediaLikert(value: string | null): string | null {
  if (value === "More than 5 hours") {
    return "Strongly Agree";
  }

  return normalizeLikertText(value);
}

function normalizeProductiveUse(value: string | null): string | null {
  if (value === "Sometimes") {
    return "Neutral";
  }

  return normalizeLikertText(value);
}

function normalizeReductionIntent(value: string | null): string | null {
  if (value === "Yes") {
    return "Agree";
  }

  return normalizeLikertText(value);
}

function normalizeProblem(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/\s+/g, " ").trim();

  if (cleaned.length < 4 || cleaned === ".") {
    return null;
  }

  return cleaned;
}

function normalizeDashValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/–/g, "-");
}

function trimValue(value: string | undefined): string | null {
  const trimmed = value?.replace(/\u00a0/g, " ").trim();
  return trimmed ? trimmed : null;
}

function parseTimestamp(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(?<day>\d{2})\/(?<month>\d{2})\/(?<year>\d{4}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})$/,
  );

  if (!match?.groups) {
    return null;
  }

  const parsed = new Date(
    Number(match.groups.year),
    Number(match.groups.month) - 1,
    Number(match.groups.day),
    Number(match.groups.hour),
    Number(match.groups.minute),
    Number(match.groups.second),
  );

  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function mostCommonLabel(values: Array<string | null>, fallback: string): string {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  const top = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return top?.[0] ?? fallback;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Number((((sorted[midpoint - 1] + sorted[midpoint]) / 2)).toFixed(1));
  }

  return Number(sorted[midpoint].toFixed(1));
}

function mode(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const counts = new Map<number, number>();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function variance(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const average = mean(values);
  return Number(
    (
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
    ).toFixed(2),
  );
}

function standardDeviation(values: number[]): number {
  return Number(Math.sqrt(variance(values)).toFixed(2));
}

function safeRatio(value: number, total: number): number {
  if (!total) {
    return 0;
  }

  return value / total;
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function roundedMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(0, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
}

function modelInputToArray(input: PredictionInput): number[] {
  return [
    input.dailyHours,
    input.checkingFrequency,
    input.beforeSleep,
    input.anxiousWithoutPhone,
    input.studyDistraction,
    input.wasteTime,
    input.socialMediaIntensity,
    input.reductionIntent,
  ];
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
}

function multiplyMatrices(left: number[][], right: number[][]): number[][] {
  return left.map((row) =>
    right[0].map((_, columnIndex) =>
      row.reduce((sum, value, rowIndex) => sum + value * right[rowIndex][columnIndex], 0),
    ),
  );
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dot(row, vector));
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function invertMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const working = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => (rowIndex === columnIndex ? value : value)).concat(
      new Array(size).fill(0).map((_, identityIndex) => (identityIndex === rowIndex ? 1 : 0)),
    ),
  );

  for (let column = 0; column < size; column += 1) {
    let pivot = working[column][column];

    if (pivot === 0) {
      const swapIndex = working.findIndex((row, rowIndex) => rowIndex > column && row[column] !== 0);

      if (swapIndex === -1) {
        throw new Error("Matrix is not invertible.");
      }

      [working[column], working[swapIndex]] = [working[swapIndex], working[column]];
      pivot = working[column][column];
    }

    for (let index = 0; index < size * 2; index += 1) {
      working[column][index] /= pivot;
    }

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === column) {
        continue;
      }

      const factor = working[rowIndex][column];

      for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
        working[rowIndex][columnIndex] -= factor * working[column][columnIndex];
      }
    }
  }

  return working.map((row) => row.slice(size));
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value.toFixed(1))));
}

function sortByTimestampDescending(left: SurveyRecord, right: SurveyRecord): number {
  const leftTime = left.timestamp?.valueOf() ?? 0;
  const rightTime = right.timestamp?.valueOf() ?? 0;
  return rightTime - leftTime;
}
