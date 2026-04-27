from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
NOTEBOOKS_DIR = PROJECT_ROOT / "notebooks"


def markdown_cell(source: str) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source.strip("\n").splitlines(keepends=True),
    }


def code_cell(source: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.strip("\n").splitlines(keepends=True),
    }


def notebook(cells: list[dict]) -> dict:
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {
                "name": "python",
                "version": "3.12",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


SETUP_CODE = """
from pathlib import Path
import os
import sys

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from IPython.display import display

PROJECT_ROOT = Path.cwd()
if PROJECT_ROOT.name == "notebooks":
    PROJECT_ROOT = PROJECT_ROOT.parent
os.chdir(PROJECT_ROOT)

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data_loader import load_raw_dataset
from src.export_artifacts import create_artifacts
from src.ml_models import train_models
from src.preprocessing import (
    ADDICTION_SCORE_COMPONENTS,
    MODEL_FEATURE_SPECS,
    prepare_survey_dataset,
    serialize_preprocessing_config,
)
from src.stats_analysis import (
    build_frequency_table,
    clt_simulation,
    descriptive_statistics,
    histogram_frame,
    probability_summary,
    random_variable_summary,
)

sns.set_theme(style="whitegrid", palette="crest")
load_result = load_raw_dataset()
prepared = prepare_survey_dataset(load_result)
cleaned_df = prepared.cleaned_df.copy()
model_df = prepared.model_df.copy()
model_results = train_models(prepared)
preprocessing_config = serialize_preprocessing_config(prepared)
"""


NOTEBOOK_01_CELLS = [
    markdown_cell(
        """
# Soch Probability & Statistics Analysis

This notebook documents the Probability & Statistics part of the **Soch** semester project using the real student mobile-phone survey dataset.

Each major section follows the same academic structure:

- **Concept**
- **Formula**
- **Python code**
- **Output / chart**
- **Interpretation**
"""
    ),
    code_cell(SETUP_CODE),
    markdown_cell(
        """
## 1. Project Introduction

**Concept**  
The project studies student mobile-phone behavior and turns the responses into a dataset that can be used for descriptive statistics, probability, sampling, and regression-based educational prediction.

**Formula**  
Statistics in this notebook are based on standard population measures:

\\[
\\mu = \\frac{\\sum x_i}{n}
\\qquad
\\sigma^2 = \\frac{\\sum (x_i - \\mu)^2}{n}
\\]

**Python code / Output / Interpretation**  
The next cells load the dataset, clean it, and summarize the usable sample.
"""
    ),
    markdown_cell(
        """
## 2. Dataset Overview

**Concept**  
Before calculating statistics, we inspect where the dataset came from, how many rows it contains, and how many rows remain after cleaning.

**Formula**  
Sample size:

\\[
n = \\text{number of valid survey responses}
\\]
"""
    ),
    code_cell(
        """
overview = pd.Series(
    {
        "Dataset source": load_result.source,
        "Source type": load_result.source_type,
        "Raw rows": prepared.metadata["raw_row_count"],
        "Clean rows": prepared.metadata["clean_row_count"],
        "Model rows": prepared.metadata["model_row_count"],
        "Malformed rows removed": prepared.metadata["malformed_row_count"],
    }
)
display(overview.to_frame(name="value"))
cleaned_df.head()
"""
    ),
    markdown_cell(
        """
## 3. Data Cleaning and Preparation

**Concept**  
Cleaning removes empty rows, normalizes labels, and safely encodes survey answers into consistent categories.

**Formula**  
The rule used for malformed-row exclusion is:

\\[
\\text{answered fields} < 6 \\Rightarrow \\text{exclude row}
\\]

Missing model features are handled with median-code defaults only if the row is otherwise usable.
"""
    ),
    code_cell(
        """
cleaning_summary = cleaned_df[[
    "response_id",
    "answered_count",
    "is_malformed",
    "row_notes",
]].copy()
display(cleaning_summary.head(10))

display(
    cleaned_df.loc[cleaned_df["is_malformed"], [
        "response_id",
        "timestamp_raw",
        "answered_count",
        "row_notes",
    ]]
)
"""
    ),
    markdown_cell(
        """
## 4. Descriptive Statistics

**Concept**  
Descriptive statistics summarize the center and spread of the derived Addiction Score.

**Formula**

\\[
\\bar{x} = \\frac{\\sum x_i}{n}, \\quad
\\text{Median} = \\text{middle ordered value}, \\quad
\\sigma = \\sqrt{\\sigma^2}
\\]
"""
    ),
    code_cell(
        """
score_stats = descriptive_statistics(cleaned_df.loc[~cleaned_df["is_malformed"], "addiction_score"])
display(pd.Series(score_stats).to_frame(name="value"))
"""
    ),
    markdown_cell(
        """
## 5. Visualizations

**Concept**  
Charts make the response distribution easier to understand than raw tables alone.

**Formula**  
For a category:

\\[
P(X = x) = \\frac{f_x}{n}
\\]
"""
    ),
    code_cell(
        """
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

usage_order = ["Less than 2 hours", "2-4 hours", "4-6 hours", "More than 6 hours"]
cleaned_df["daily_hours"].value_counts().reindex(usage_order).plot(
    kind="bar", ax=axes[0], color="#1f7a8c"
)
axes[0].set_title("Daily phone usage distribution")
axes[0].set_xlabel("Usage band")
axes[0].set_ylabel("Responses")

cleaned_df["main_purpose"].value_counts().plot(kind="bar", ax=axes[1], color="#bfdbf7")
axes[1].set_title("Main phone-use purpose")
axes[1].set_xlabel("Purpose")
axes[1].set_ylabel("Responses")

cleaned_df["addiction_score"].dropna().plot(kind="hist", bins=10, ax=axes[2], color="#e07a5f")
axes[2].set_title("Derived Addiction Score histogram")
axes[2].set_xlabel("Addiction Score")
axes[2].set_ylabel("Frequency")

plt.tight_layout()
plt.show()
"""
    ),
    markdown_cell(
        """
## 6. Probability Concepts from Real Survey Data

**Concept**  
Probability is interpreted as relative frequency in the survey sample.

**Formula**

\\[
P(A) = \\frac{n(A)}{n}
\\qquad
P(B \\mid A) = \\frac{n(A \\cap B)}{n(A)}
\\]
"""
    ),
    code_cell(
        """
probabilities = probability_summary(cleaned_df)
display(pd.Series(probabilities).to_frame(name="probability"))
"""
    ),
    markdown_cell(
        """
## 7. Random Variable Coding

**Concept**  
We convert survey responses into numeric random variables so that expected value and variance can be computed.

**Formula**  
For coded daily usage hours:

\\[
X \\in \\{1,2,3,4\\}
\\]
"""
    ),
    code_cell(
        """
daily_hours_distribution = build_frequency_table(cleaned_df["daily_hours_code"])
display(daily_hours_distribution)
"""
    ),
    markdown_cell(
        """
## 8. Expected Value and Variance

**Concept**  
Expected value is the weighted average of a discrete random variable. Variance measures spread around that expected value.

**Formula**

\\[
E(X) = \\sum xP(X=x)
\\qquad
Var(X) = \\sum (x - E(X))^2 P(X=x)
\\]
"""
    ),
    code_cell(
        """
daily_hours_random_variable = random_variable_summary(cleaned_df["daily_hours_code"])
display(daily_hours_random_variable["distribution"])
display(
    pd.Series(
        {
            "Expected value": daily_hours_random_variable["expected_value"],
            "Variance": daily_hours_random_variable["variance"],
        }
    ).to_frame(name="value")
)
"""
    ),
    markdown_cell(
        """
## 9. Sampling Concepts

**Concept**  
A sample is a subset drawn from the observed survey data. Sampling shows why small groups can differ from the overall dataset mean.

**Formula**

\\[
\\bar{X}_{sample} = \\frac{\\sum x_i}{n_{sample}}
\\]
"""
    ),
    code_cell(
        """
sample = cleaned_df["addiction_score"].dropna().sample(n=8, random_state=42)
display(sample.to_frame(name="sample_score"))
print("Sample mean:", round(sample.mean(), 4))
print("Population mean:", round(cleaned_df["addiction_score"].dropna().mean(), 4))
"""
    ),
    markdown_cell(
        """
## 10. Central Limit Theorem Simulation

**Concept**  
The Central Limit Theorem states that the distribution of sample means becomes more normal as repeated samples are drawn.

**Formula**

\\[
\\bar{X} \\approx N\\left(\\mu, \\frac{\\sigma^2}{n}\\right)
\\]
"""
    ),
    code_cell(
        """
sample_means = clt_simulation(cleaned_df["addiction_score"], sample_size=8, simulations=500, random_state=42)
histogram = histogram_frame(sample_means, bins=12)
display(histogram.head())

plt.figure(figsize=(8, 5))
plt.hist(sample_means, bins=12, color="#3d405b", edgecolor="white")
plt.title("CLT simulation: sample means of Addiction Score")
plt.xlabel("Sample mean")
plt.ylabel("Frequency")
plt.show()
"""
    ),
    markdown_cell(
        """
## 11. Linear Regression as Advanced Extension

**Concept**  
Linear regression predicts the continuous Addiction Score from selected phone-behavior features.

**Formula**

\\[
\\hat{y} = \\beta_0 + \\beta_1x_1 + \\beta_2x_2 + \\cdots + \\beta_nx_n
\\]
"""
    ),
    code_cell(
        """
linear_metrics = pd.Series(model_results["linear"]["metrics"])
linear_coefficients = pd.DataFrame(model_results["linear"]["coefficient_items"])
display(linear_metrics.to_frame(name="value"))
display(linear_coefficients)
"""
    ),
    markdown_cell(
        """
## 12. Logistic Regression as Advanced Extension

**Concept**  
Logistic regression predicts the probability that a student's pattern falls into the elevated addiction-risk class.

**Formula**

\\[
P(Y=1) = \\frac{1}{1 + e^{-z}}
\\qquad
z = \\beta_0 + \\beta_1x_1 + \\cdots + \\beta_nx_n
\\]
"""
    ),
    code_cell(
        """
logistic_metrics = pd.Series(model_results["logistic"]["metrics"])
logistic_coefficients = pd.DataFrame(model_results["logistic"]["coefficient_items"])
display(logistic_metrics.to_frame(name="value"))
display(logistic_coefficients)

confusion = pd.DataFrame(
    model_results["logistic"]["metrics"]["confusion_matrix"],
    index=["Actual 0", "Actual 1"],
    columns=["Predicted 0", "Predicted 1"],
)
display(confusion)

plt.figure(figsize=(5, 4))
sns.heatmap(confusion, annot=True, fmt="d", cmap="Blues")
plt.title("Logistic regression confusion matrix")
plt.show()
"""
    ),
    markdown_cell(
        """
## 13. Final Findings

**Concept**  
The final findings combine descriptive statistics, probability, sampling, and model evidence into one interpretation.

**Interpretation**  
The concluding code below prints short academically responsible findings based on the current dataset snapshot.
"""
    ),
    code_cell(
        """
findings = [
    f"The cleaned survey dataset contains {prepared.metadata['clean_row_count']} usable rows after excluding malformed responses.",
    f"The mean derived Addiction Score is {score_stats['mean']:.2f} with standard deviation {score_stats['standard_deviation']:.2f}.",
    f"The probability of being in the highest daily-use band is {probabilities['heavy_use_probability']:.2%}.",
    f"Linear regression achieved R^2 = {model_results['linear']['metrics']['r2']:.3f} on the held-out test split.",
    f"Logistic regression achieved accuracy = {model_results['logistic']['metrics']['accuracy']:.3f} on the held-out test split.",
]

for item in findings:
    print("-", item)
"""
    ),
]


NOTEBOOK_02_CELLS = [
    markdown_cell(
        """
# Soch Machine Learning Models

This notebook documents the machine-learning pipeline for the **Soch** project. It uses the shared Python modules to keep data cleaning, feature encoding, target engineering, training, evaluation, and export logic consistent with the frontend artifact flow.
"""
    ),
    code_cell(SETUP_CODE),
    markdown_cell(
        """
## 1. ML Notebook Introduction

**Concept**  
The goal is to train two interpretable models:

1. Linear Regression for continuous Addiction Score prediction
2. Logistic Regression for binary addiction-risk prediction

The pipeline is designed for browser deployment through exported JSON artifacts.
"""
    ),
    markdown_cell(
        """
## 2. Feature Engineering

**Concept**  
Only the strongest, frontend-available features are used in the models. Their order must stay fixed so Python and TypeScript produce the same predictions.

**Formula**  
Feature vector:

\\[
X = [x_1, x_2, \\dots, x_8]
\\]
"""
    ),
    code_cell(
        """
feature_table = pd.DataFrame(
    [
        {
            "frontend_key": spec.frontend_key,
            "python_key": spec.key,
            "label": spec.label,
            "allowed_codes": spec.options,
            "default_code": prepared.feature_defaults[spec.key],
        }
        for spec in MODEL_FEATURE_SPECS
    ]
)
display(feature_table)
"""
    ),
    markdown_cell(
        """
## 3. Target Engineering

**Concept**  
The target is not taken from a black-box label. It is built from documented behavioral components and a transparent threshold rule.

**Formula**  
Weighted Addiction Score:

\\[
\\text{Score} = \\frac{\\sum w_i s_i}{\\sum w_i} \\times 100
\\]

Binary risk label:

\\[
Y =
\\begin{cases}
1 & \\text{if score} \\ge 60 \\\\
1 & \\text{if score} \\ge 55 \\text{ and self-report is Yes/Maybe} \\\\
0 & \\text{otherwise}
\\end{cases}
\\]
"""
    ),
    code_cell(
        """
component_table = pd.DataFrame(
    [
        {
            "feature_key": component.feature_key,
            "label": next(spec.label for spec in MODEL_FEATURE_SPECS if spec.key == component.feature_key)
            if component.feature_key in {spec.key for spec in MODEL_FEATURE_SPECS}
            else component.feature_key,
            "weight": component.weight,
            "rationale": component.rationale,
        }
        for component in ADDICTION_SCORE_COMPONENTS
    ]
)
display(component_table)
display(model_df[["response_id", "addiction_score", "risk_binary", "risk_label"]].head())
"""
    ),
    markdown_cell(
        """
## 4. Train/Test Split

**Concept**  
Evaluation uses a fixed random seed and a hold-out test split so the reported metrics are teacher-checkable and reproducible.
"""
    ),
    code_cell(
        """
display(pd.Series(model_results["split"]).to_frame(name="value"))
"""
    ),
    markdown_cell(
        """
## 5. Linear Regression Model

**Concept**  
Linear regression estimates how much each feature changes the predicted Addiction Score while keeping the other features fixed.
"""
    ),
    code_cell(
        """
linear_summary = pd.Series(model_results["linear"]["metrics"])
linear_coefficients = pd.DataFrame(model_results["linear"]["coefficient_items"])
display(linear_summary.to_frame(name="value"))
display(linear_coefficients)

linear_predictions = pd.DataFrame(model_results["linear"]["test_predictions"])
display(linear_predictions.head())
"""
    ),
    markdown_cell(
        """
## 6. Logistic Regression Model

**Concept**  
Logistic regression estimates the probability of elevated addiction risk from the same fixed-order feature set.
"""
    ),
    code_cell(
        """
logistic_summary = pd.Series(model_results["logistic"]["metrics"])
logistic_coefficients = pd.DataFrame(model_results["logistic"]["coefficient_items"])
display(logistic_summary.to_frame(name="value"))
display(logistic_coefficients)

logistic_predictions = pd.DataFrame(model_results["logistic"]["test_predictions"])
display(logistic_predictions.head())
"""
    ),
    markdown_cell(
        """
## 7. Model Evaluation

**Concept**  
Model evaluation compares predicted values to actual held-out values using standard regression and classification metrics.
"""
    ),
    code_cell(
        """
linear_predictions = pd.DataFrame(model_results["linear"]["test_predictions"])

plt.figure(figsize=(6, 6))
plt.scatter(linear_predictions["actual_score"], linear_predictions["predicted_score"], color="#457b9d")
plt.plot([0, 100], [0, 100], linestyle="--", color="#d90429")
plt.xlabel("Actual Addiction Score")
plt.ylabel("Predicted Addiction Score")
plt.title("Linear regression: actual vs predicted")
plt.show()

if not logistic_predictions.empty:
    logistic_predictions = pd.DataFrame(model_results["logistic"]["test_predictions"])
    plt.figure(figsize=(6, 4))
    plt.hist(logistic_predictions["predicted_probability"], bins=8, color="#2a9d8f", edgecolor="white")
    plt.xlabel("Predicted probability")
    plt.ylabel("Frequency")
    plt.title("Logistic regression probability distribution")
    plt.show()
"""
    ),
    markdown_cell(
        """
## 8. Model Interpretation

**Concept**  
Positive coefficients push the score or probability upward. Negative coefficients pull the prediction downward.
"""
    ),
    code_cell(
        """
display(
    linear_coefficients.assign(direction=linear_coefficients["value"].map(lambda value: "Positive" if value >= 0 else "Negative"))
    .sort_values("value", ascending=False)
)

display(
    logistic_coefficients.assign(direction=logistic_coefficients["value"].map(lambda value: "Positive" if value >= 0 else "Negative"))
    .sort_values("value", ascending=False)
)
"""
    ),
    markdown_cell(
        """
## 9. Sample Prediction Examples

**Concept**  
Sample cases help verify that Python inference and frontend inference stay aligned.
"""
    ),
    code_cell(
        """
export_results = create_artifacts()
validation_cases = pd.DataFrame(export_results["model_artifacts"]["validation_cases"])
display(validation_cases[["case_id", "label", "input", "expected"]].head())
"""
    ),
    markdown_cell(
        """
## 10. Artifact Export for Frontend

**Concept**  
The exported JSON files contain the trained parameters, fixed feature order, preprocessing defaults, validation cases, and label mappings needed for in-browser inference.
"""
    ),
    code_cell(
        """
artifact_overview = pd.Series(
    {
        "Model artifact": "artifacts/model_artifacts.json",
        "Preprocessing artifact": "artifacts/preprocessing_config.json",
        "Cleaned dataset": "artifacts/cleaned_dataset.csv",
    }
)
display(artifact_overview.to_frame(name="path"))
"""
    ),
    markdown_cell(
        """
## 11. Final ML Conclusion

**Interpretation**  
The Soch ML layer is intentionally interpretable: the targets are transparent, the models are standard scikit-learn regressions, the preprocessing rules are centralized, and the frontend can run the final predictors without a backend.
"""
    ),
    code_cell(
        """
for line in [
    f"Model rows available for training: {prepared.metadata['model_row_count']}",
    f"Linear regression R^2: {model_results['linear']['metrics']['r2']:.3f}",
    f"Logistic regression accuracy: {model_results['logistic']['metrics']['accuracy']:.3f}",
    "Artifacts were exported for browser inference with validation cases embedded.",
]:
    print("-", line)
"""
    ),
]


def main() -> None:
    NOTEBOOKS_DIR.mkdir(parents=True, exist_ok=True)
    (NOTEBOOKS_DIR / "01_probability_statistics_analysis.ipynb").write_text(
        json.dumps(notebook(NOTEBOOK_01_CELLS), indent=2),
        encoding="utf-8",
    )
    (NOTEBOOKS_DIR / "02_machine_learning_models.ipynb").write_text(
        json.dumps(notebook(NOTEBOOK_02_CELLS), indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
