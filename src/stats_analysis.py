from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def descriptive_statistics(values: pd.Series) -> dict[str, float]:
    clean = pd.to_numeric(values, errors="coerce").dropna().astype(float)
    if clean.empty:
        return {
            "count": 0.0,
            "mean": 0.0,
            "median": 0.0,
            "mode": 0.0,
            "variance": 0.0,
            "standard_deviation": 0.0,
            "minimum": 0.0,
            "maximum": 0.0,
        }

    modes = clean.mode()
    mode_value = float(modes.iloc[0]) if not modes.empty else float(clean.iloc[0])
    return {
        "count": float(clean.count()),
        "mean": round(float(clean.mean()), 4),
        "median": round(float(clean.median()), 4),
        "mode": round(mode_value, 4),
        "variance": round(float(clean.var(ddof=0)), 4),
        "standard_deviation": round(float(clean.std(ddof=0)), 4),
        "minimum": round(float(clean.min()), 4),
        "maximum": round(float(clean.max()), 4),
    }


def build_frequency_table(values: pd.Series, dropna: bool = True) -> pd.DataFrame:
    series = values.dropna() if dropna else values.fillna("Missing")
    counts = series.value_counts(dropna=dropna).sort_index()
    total = counts.sum()
    result = counts.rename("count").to_frame()
    result["probability"] = result["count"] / total if total else 0.0
    result["percentage"] = result["probability"] * 100
    return result.reset_index(names="value")


def probability_summary(cleaned_df: pd.DataFrame) -> dict[str, float]:
    valid_rows = cleaned_df.loc[~cleaned_df["is_malformed"]].copy()
    if valid_rows.empty:
        return {
            "heavy_use_probability": 0.0,
            "sleep_affected_probability": 0.0,
            "study_distraction_probability": 0.0,
            "sleep_affected_given_heavy_use": 0.0,
        }

    heavy_use = valid_rows["daily_hours_code"] == 4
    sleep_affected = valid_rows["sleep_affected_code"] == 2
    study_distraction = valid_rows["study_distraction_code"] >= 3

    heavy_count = int(heavy_use.sum())
    return {
        "heavy_use_probability": round(float(heavy_use.mean()), 4),
        "sleep_affected_probability": round(float(sleep_affected.mean()), 4),
        "study_distraction_probability": round(float(study_distraction.mean()), 4),
        "sleep_affected_given_heavy_use": round(
            float(sleep_affected[heavy_use].mean()) if heavy_count else 0.0,
            4,
        ),
    }


def random_variable_summary(values: pd.Series) -> dict[str, Any]:
    distribution = build_frequency_table(values)
    if distribution.empty:
        return {
            "distribution": distribution,
            "expected_value": 0.0,
            "variance": 0.0,
        }

    numeric_values = pd.to_numeric(distribution["value"], errors="coerce")
    probabilities = distribution["probability"].astype(float)
    expected_value = float((numeric_values * probabilities).sum())
    variance = float((((numeric_values - expected_value) ** 2) * probabilities).sum())
    return {
        "distribution": distribution,
        "expected_value": round(expected_value, 4),
        "variance": round(variance, 4),
    }


def clt_simulation(
    values: pd.Series | np.ndarray | list[float],
    sample_size: int = 8,
    simulations: int = 500,
    random_state: int = 42,
) -> np.ndarray:
    clean_values = pd.to_numeric(pd.Series(values), errors="coerce").dropna().to_numpy(dtype=float)
    if sample_size <= 0 or simulations <= 0 or clean_values.size == 0:
        return np.array([], dtype=float)

    rng = np.random.default_rng(random_state)
    samples = rng.choice(clean_values, size=(simulations, sample_size), replace=True)
    return samples.mean(axis=1)


def histogram_frame(values: np.ndarray | list[float], bins: int = 10) -> pd.DataFrame:
    array = np.asarray(values, dtype=float)
    if array.size == 0:
        return pd.DataFrame(columns=["bin_start", "bin_end", "count"])

    counts, edges = np.histogram(array, bins=bins)
    return pd.DataFrame(
        {
            "bin_start": edges[:-1],
            "bin_end": edges[1:],
            "count": counts,
        }
    )
