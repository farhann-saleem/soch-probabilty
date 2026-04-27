from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .data_loader import load_raw_dataset
from .ml_models import (
    build_feature_contributions,
    predict_linear_score,
    predict_logistic_probability,
    train_models,
)
from .preprocessing import (
    MODEL_FEATURE_SPECS,
    PreparedSurveyData,
    prepare_survey_dataset,
    preprocess_prediction_input,
    row_to_frontend_input,
    serialize_preprocessing_config,
)

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"
MODEL_ARTIFACT_PATH = ARTIFACTS_DIR / "model_artifacts.json"
PREPROCESSING_ARTIFACT_PATH = ARTIFACTS_DIR / "preprocessing_config.json"
CLEANED_DATASET_PATH = ARTIFACTS_DIR / "cleaned_dataset.csv"


def create_artifacts(source: str | Path | None = None) -> dict[str, Any]:
    load_result = load_raw_dataset(source)
    prepared = prepare_survey_dataset(load_result)
    model_results = train_models(prepared)
    preprocessing_config = serialize_preprocessing_config(prepared)
    validation_cases = _build_validation_cases(prepared, model_results)

    model_artifacts = {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "source": load_result.source,
            "source_type": load_result.source_type,
            "raw_row_count": prepared.metadata["raw_row_count"],
            "clean_row_count": prepared.metadata["clean_row_count"],
            "malformed_row_count": prepared.metadata["malformed_row_count"],
            "model_row_count": prepared.metadata["model_row_count"],
            "dropped_response_ids": prepared.metadata["dropped_response_ids"],
        },
        "feature_order": model_results["frontend_feature_order"],
        "python_feature_order": model_results["feature_order"],
        "targets": {
            "addiction_score": {
                "type": "continuous",
                "range": [0, 100],
                "description": (
                    "A weighted, interpretable educational score derived from high-signal survey "
                    "behaviors such as usage duration, checking frequency, study distraction, "
                    "sleep impact, and compulsion-related items."
                ),
            },
            "addiction_risk": {
                "type": "binary",
                "primary_threshold": 60.0,
                "support_window_start": 55.0,
                "supportive_self_report_labels": ["Yes", "Maybe"],
                "labels": {"0": "Lower addiction risk", "1": "Elevated addiction risk"},
                "description": (
                    "The binary label is derived primarily from the addiction score threshold and "
                    "is only supported by self-reported addiction when the score falls in the borderline band."
                ),
            },
        },
        "models": {
            "linear_regression": model_results["linear"],
            "logistic_regression": model_results["logistic"],
        },
        "validation_cases": validation_cases,
        "notes": [
            "The exported artifacts are intended for browser inference without a Python runtime.",
            "All frontend predictions should be treated as educational estimates, not diagnosis.",
            "Rows with too few answered survey fields are excluded before model training.",
        ],
    }

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    prepared.cleaned_df.to_csv(CLEANED_DATASET_PATH, index=False)
    MODEL_ARTIFACT_PATH.write_text(
        json.dumps(_json_ready(model_artifacts), indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    PREPROCESSING_ARTIFACT_PATH.write_text(
        json.dumps(_json_ready(preprocessing_config), indent=2, ensure_ascii=True),
        encoding="utf-8",
    )

    return {
        "model_artifacts": model_artifacts,
        "preprocessing_config": preprocessing_config,
        "prepared_data": prepared,
        "model_results": model_results,
    }


def main() -> None:
    results = create_artifacts()
    prepared: PreparedSurveyData = results["prepared_data"]
    print(
        json.dumps(
            {
                "raw_rows": prepared.metadata["raw_row_count"],
                "clean_rows": prepared.metadata["clean_row_count"],
                "model_rows": prepared.metadata["model_row_count"],
                "model_artifact": str(MODEL_ARTIFACT_PATH),
                "preprocessing_artifact": str(PREPROCESSING_ARTIFACT_PATH),
                "cleaned_dataset": str(CLEANED_DATASET_PATH),
            },
            indent=2,
        )
    )


def _build_validation_cases(
    prepared: PreparedSurveyData,
    model_results: dict[str, Any],
) -> list[dict[str, Any]]:
    defaults = {
        spec.frontend_key: prepared.feature_defaults[spec.key]
        for spec in MODEL_FEATURE_SPECS
        if spec.frontend_key
    }
    profiles = [
        {"case_id": "dataset_default", "label": "Dataset default", "input": defaults},
        {
            "case_id": "balanced_student",
            "label": "Balanced student",
            "input": {
                "dailyHours": 2,
                "checkingFrequency": 2,
                "beforeSleep": 1,
                "anxiousWithoutPhone": 1,
                "studyDistraction": 2,
                "wasteTime": 1,
                "socialMediaIntensity": 3,
                "reductionIntent": 4,
            },
        },
        {
            "case_id": "heavy_scroll",
            "label": "Heavy scroll",
            "input": {
                "dailyHours": 4,
                "checkingFrequency": 4,
                "beforeSleep": 3,
                "anxiousWithoutPhone": 2,
                "studyDistraction": 4,
                "wasteTime": 2,
                "socialMediaIntensity": 5,
                "reductionIntent": 5,
            },
        },
        {
            "case_id": "study_mode",
            "label": "Study mode",
            "input": {
                "dailyHours": 1,
                "checkingFrequency": 1,
                "beforeSleep": 1,
                "anxiousWithoutPhone": 0,
                "studyDistraction": 1,
                "wasteTime": 0,
                "socialMediaIntensity": 2,
                "reductionIntent": 4,
            },
        },
        {
            "case_id": "night_habit",
            "label": "Night habit",
            "input": {
                "dailyHours": 3,
                "checkingFrequency": 3,
                "beforeSleep": 3,
                "anxiousWithoutPhone": 1,
                "studyDistraction": 3,
                "wasteTime": 2,
                "socialMediaIntensity": 4,
                "reductionIntent": 4,
            },
        },
    ]

    validation_cases = []
    for profile in profiles:
        preprocessed = preprocess_prediction_input(profile["input"], prepared.feature_defaults)
        frontend_vector = {
            spec.frontend_key: preprocessed["processed"][spec.frontend_key]
            for spec in MODEL_FEATURE_SPECS
            if spec.frontend_key
        }
        linear_model = model_results["linear"]
        logistic_model = model_results["logistic"]
        score = predict_linear_score(linear_model, frontend_vector)
        probability = predict_logistic_probability(logistic_model, frontend_vector)
        risk_class = int(probability >= logistic_model["probability_threshold"])
        top_contributors = build_feature_contributions(
            logistic_model["coefficients"],
            frontend_vector,
        )

        validation_cases.append(
            {
                "case_id": profile["case_id"],
                "label": profile["label"],
                "input": frontend_vector,
                "warnings": preprocessed["warnings"],
                "expected": {
                    "addiction_score": score,
                    "addiction_probability": probability,
                    "risk_class": risk_class,
                    "risk_label": logistic_model["class_labels"][str(risk_class)],
                    "top_positive_contributors": [
                        item
                        for item in top_contributors
                        if float(item["contribution"]) > 0
                    ][:3],
                    "top_negative_contributors": [
                        item
                        for item in top_contributors
                        if float(item["contribution"]) < 0
                    ][:3],
                },
            }
        )

    actual_sample_rows = prepared.model_df.head(3).copy()
    for _, row in actual_sample_rows.iterrows():
        frontend_input = row_to_frontend_input(row, prepared.feature_defaults)
        linear_model = model_results["linear"]
        logistic_model = model_results["logistic"]
        score = predict_linear_score(linear_model, frontend_input)
        probability = predict_logistic_probability(logistic_model, frontend_input)
        validation_cases.append(
            {
                "case_id": f"dataset_row_{row['response_id'].lower()}",
                "label": f"Dataset sample {row['response_id']}",
                "input": frontend_input,
                "expected": {
                    "addiction_score": score,
                    "addiction_probability": probability,
                    "risk_class": int(probability >= logistic_model["probability_threshold"]),
                    "risk_label": logistic_model["class_labels"][
                        str(int(probability >= logistic_model["probability_threshold"]))
                    ],
                },
            }
        )

    return validation_cases


def _json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_ready(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [_json_ready(item) for item in value]
    if isinstance(value, tuple):
        return [_json_ready(item) for item in value]
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat() if pd.notna(value) else None
    if value is pd.NA or pd.isna(value):
        return None
    return value


if __name__ == "__main__":
    main()
