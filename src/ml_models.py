from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from .preprocessing import MODEL_FEATURE_SPECS, PreparedSurveyData

RANDOM_STATE = 42
MIN_MODEL_ROWS = 20
MIN_CLASS_COUNT = 5
LINEAR_SCORE_RANGE = (0.0, 100.0)


def train_models(prepared: PreparedSurveyData) -> dict[str, Any]:
    model_df = prepared.model_df.copy()
    _validate_training_data(model_df)

    feature_order = [spec.key for spec in MODEL_FEATURE_SPECS]
    frontend_feature_order = [spec.frontend_key for spec in MODEL_FEATURE_SPECS if spec.frontend_key]
    feature_labels = {spec.key: spec.label for spec in MODEL_FEATURE_SPECS}
    feature_to_frontend = {
        spec.key: spec.frontend_key or spec.key for spec in MODEL_FEATURE_SPECS
    }

    x = model_df[feature_order].astype(float)
    y_linear = model_df["addiction_score"].astype(float)
    y_logistic = model_df["risk_binary"].astype(int)

    train_indices, test_indices = train_test_split(
        model_df.index,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y_logistic,
    )

    x_train = x.loc[train_indices]
    x_test = x.loc[test_indices]
    y_linear_train = y_linear.loc[train_indices]
    y_linear_test = y_linear.loc[test_indices]
    y_logistic_train = y_logistic.loc[train_indices]
    y_logistic_test = y_logistic.loc[test_indices]

    linear_eval_model = LinearRegression()
    linear_eval_model.fit(x_train, y_linear_train)
    linear_test_predictions = np.clip(
        linear_eval_model.predict(x_test),
        LINEAR_SCORE_RANGE[0],
        LINEAR_SCORE_RANGE[1],
    )

    logistic_eval_model = LogisticRegression(
        max_iter=2_000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    )
    logistic_eval_model.fit(x_train, y_logistic_train)
    logistic_test_probabilities = logistic_eval_model.predict_proba(x_test)[:, 1]
    logistic_test_predictions = (logistic_test_probabilities >= 0.5).astype(int)

    linear_final_model = LinearRegression()
    linear_final_model.fit(x, y_linear)

    logistic_final_model = LogisticRegression(
        max_iter=2_000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    )
    logistic_final_model.fit(x, y_logistic)

    linear_metrics = {
        "sample_size": int(len(model_df)),
        "train_size": int(len(train_indices)),
        "test_size": int(len(test_indices)),
        "intercept": round(float(linear_final_model.intercept_), 6),
        "r2": round(float(r2_score(y_linear_test, linear_test_predictions)), 6),
        "mae": round(float(mean_absolute_error(y_linear_test, linear_test_predictions)), 6),
        "rmse": round(
            float(np.sqrt(mean_squared_error(y_linear_test, linear_test_predictions))),
            6,
        ),
    }

    logistic_metrics = {
        "sample_size": int(len(model_df)),
        "train_size": int(len(train_indices)),
        "test_size": int(len(test_indices)),
        "accuracy": round(float(accuracy_score(y_logistic_test, logistic_test_predictions)), 6),
        "precision": round(
            float(precision_score(y_logistic_test, logistic_test_predictions, zero_division=0)),
            6,
        ),
        "recall": round(
            float(recall_score(y_logistic_test, logistic_test_predictions, zero_division=0)),
            6,
        ),
        "f1": round(float(f1_score(y_logistic_test, logistic_test_predictions, zero_division=0)), 6),
        "roc_auc": round(float(roc_auc_score(y_logistic_test, logistic_test_probabilities)), 6),
        "confusion_matrix": confusion_matrix(y_logistic_test, logistic_test_predictions).tolist(),
        "intercept": round(float(logistic_final_model.intercept_[0]), 6),
    }

    linear_coefficients = _serialize_coefficients(
        linear_final_model.coef_,
        feature_order,
        feature_to_frontend,
        feature_labels,
    )
    logistic_coefficients = _serialize_coefficients(
        logistic_final_model.coef_[0],
        feature_order,
        feature_to_frontend,
        feature_labels,
    )

    return {
        "feature_order": feature_order,
        "frontend_feature_order": frontend_feature_order,
        "linear": {
            "model_type": "LinearRegression",
            "intercept": linear_metrics["intercept"],
            "coefficients": linear_coefficients["coefficient_map"],
            "coefficient_items": linear_coefficients["coefficient_items"],
            "metrics": linear_metrics,
            "test_predictions": _build_linear_test_predictions(
                model_df.loc[test_indices],
                linear_test_predictions,
            ),
            "score_range": list(LINEAR_SCORE_RANGE),
        },
        "logistic": {
            "model_type": "LogisticRegression",
            "intercept": logistic_metrics["intercept"],
            "coefficients": logistic_coefficients["coefficient_map"],
            "coefficient_items": logistic_coefficients["coefficient_items"],
            "metrics": logistic_metrics,
            "class_labels": {"0": "Lower addiction risk", "1": "Elevated addiction risk"},
            "probability_threshold": 0.5,
            "test_predictions": _build_logistic_test_predictions(
                model_df.loc[test_indices],
                logistic_test_probabilities,
                logistic_test_predictions,
            ),
        },
        "split": {
            "random_state": RANDOM_STATE,
            "train_response_ids": model_df.loc[train_indices, "response_id"].tolist(),
            "test_response_ids": model_df.loc[test_indices, "response_id"].tolist(),
        },
    }


def predict_linear_score(model_payload: dict[str, Any], feature_vector: dict[str, float]) -> float:
    value = float(model_payload["intercept"])
    for key, coefficient in model_payload["coefficients"].items():
        value += float(feature_vector[key]) * float(coefficient)
    return round(float(np.clip(value, LINEAR_SCORE_RANGE[0], LINEAR_SCORE_RANGE[1])), 6)


def predict_logistic_probability(model_payload: dict[str, Any], feature_vector: dict[str, float]) -> float:
    linear_sum = float(model_payload["intercept"])
    for key, coefficient in model_payload["coefficients"].items():
        linear_sum += float(feature_vector[key]) * float(coefficient)
    return round(float(1.0 / (1.0 + np.exp(-linear_sum))), 6)


def build_feature_contributions(
    coefficients: dict[str, float],
    feature_vector: dict[str, float],
) -> list[dict[str, float | str]]:
    contributions = []
    for key, coefficient in coefficients.items():
        contribution = float(feature_vector[key]) * float(coefficient)
        contributions.append(
            {
                "feature": key,
                "coefficient": round(float(coefficient), 6),
                "value": round(float(feature_vector[key]), 6),
                "contribution": round(contribution, 6),
            }
        )
    return sorted(contributions, key=lambda item: abs(float(item["contribution"])), reverse=True)


def _validate_training_data(model_df: pd.DataFrame) -> None:
    row_count = len(model_df)
    if row_count < MIN_MODEL_ROWS:
        raise ValueError(
            f"Model training requires at least {MIN_MODEL_ROWS} usable rows, but only {row_count} remain after cleaning."
        )

    if model_df["addiction_score"].isna().any():
        raise ValueError("NaN addiction scores remain in the training data.")

    if model_df[[spec.key for spec in MODEL_FEATURE_SPECS]].isna().any().any():
        raise ValueError("NaN feature values remain in the model frame after imputation.")

    class_counts = model_df["risk_binary"].value_counts().to_dict()
    if len(class_counts) < 2:
        raise ValueError("Logistic regression requires at least two addiction-risk classes.")

    smallest_class = min(class_counts.values())
    if smallest_class < MIN_CLASS_COUNT:
        raise ValueError(
            "Logistic regression needs more balanced survey data. "
            f"The smallest class contains only {smallest_class} rows."
        )


def _serialize_coefficients(
    raw_coefficients: np.ndarray,
    feature_order: list[str],
    feature_to_frontend: dict[str, str],
    feature_labels: dict[str, str],
) -> dict[str, Any]:
    coefficient_map = {
        feature_to_frontend[key]: round(float(value), 6)
        for key, value in zip(feature_order, raw_coefficients, strict=True)
    }
    coefficient_items = [
        {
            "key": feature_to_frontend[key],
            "python_key": key,
            "label": feature_labels[key],
            "value": round(float(value), 6),
        }
        for key, value in zip(feature_order, raw_coefficients, strict=True)
    ]
    return {
        "coefficient_map": coefficient_map,
        "coefficient_items": coefficient_items,
    }


def _build_linear_test_predictions(
    test_frame: pd.DataFrame,
    predictions: np.ndarray,
) -> list[dict[str, Any]]:
    rows = []
    for (_, row), prediction in zip(test_frame.iterrows(), predictions, strict=True):
        rows.append(
            {
                "response_id": row["response_id"],
                "actual_score": round(float(row["addiction_score"]), 6),
                "predicted_score": round(float(prediction), 6),
            }
        )
    return rows


def _build_logistic_test_predictions(
    test_frame: pd.DataFrame,
    probabilities: np.ndarray,
    predictions: np.ndarray,
) -> list[dict[str, Any]]:
    rows = []
    for (_, row), probability, prediction in zip(
        test_frame.iterrows(),
        probabilities,
        predictions,
        strict=True,
    ):
        rows.append(
            {
                "response_id": row["response_id"],
                "actual_class": int(row["risk_binary"]),
                "predicted_probability": round(float(probability), 6),
                "predicted_class": int(prediction),
            }
        )
    return rows
