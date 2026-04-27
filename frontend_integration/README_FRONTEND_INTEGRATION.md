# Frontend Integration for Soch

The frontend does **not** need a backend for prediction.

Python trains the models and exports:

- `artifacts/model_artifacts.json`
- `artifacts/preprocessing_config.json`

The browser then imports those artifacts through:

- `frontend_integration/modelTypes.ts`
- `frontend_integration/modelInference.ts`

## What the frontend gets

- Fixed feature order
- Allowed code ranges
- Default fill values
- Linear regression intercept and coefficients
- Logistic regression intercept and coefficients
- Risk threshold
- Validation cases generated in Python

## Main frontend API

Use these exports from `frontend_integration/modelInference.ts`:

- `predictionFields`
- `defaultPredictionInput`
- `normalizePredictionInput(...)`
- `predictLinearScore(...)`
- `predictLogisticProbability(...)`
- `runFrontendInference(...)`
- `runValidationCases(...)`
- `getLinearRegressionModel()`
- `getLogisticRegressionModel()`

## Typical usage

```ts
import {
  defaultPredictionInput,
  predictionFields,
  runFrontendInference,
  runValidationCases,
} from "../frontend_integration/modelInference";

const result = runFrontendInference(defaultPredictionInput);
console.log(result.addictionScore, result.addictionProbability, result.addictionRiskLabel);

const mismatches = runValidationCases();
console.log("validation mismatches", mismatches);
```

## Validation rule

`runValidationCases()` recomputes every Python-exported validation case inside TypeScript and returns any mismatches. In a healthy build it should return an empty array.

## Important note

All predictions should be presented as **educational estimates based on survey patterns**, not diagnosis.
