from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from .data_loader import DatasetLoadResult

MIN_NON_EMPTY_RESPONSES = 6
MAX_MISSING_MODEL_FEATURES = 2
MIN_SCORE_WEIGHT_COVERAGE = 0.7


@dataclass(frozen=True, slots=True)
class EncodingSpec:
    key: str
    label: str
    source_column: str
    options: tuple[tuple[int, str], ...]
    aliases: dict[str, int]
    description: str
    frontend_key: str | None = None
    default_code: int | None = None

    @property
    def minimum_code(self) -> int:
        return min(code for code, _ in self.options)

    @property
    def maximum_code(self) -> int:
        return max(code for code, _ in self.options)

    @property
    def code_to_label(self) -> dict[int, str]:
        return dict(self.options)


@dataclass(frozen=True, slots=True)
class ScoreComponent:
    feature_key: str
    weight: float
    rationale: str


@dataclass(slots=True)
class PreparedSurveyData:
    cleaned_df: pd.DataFrame
    model_df: pd.DataFrame
    feature_defaults: dict[str, int]
    feature_order: list[str]
    frontend_feature_order: list[str]
    metadata: dict[str, Any]


RAW_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "timestamp": ("timestamp",),
    "age_group": ("what_is_your_age_group",),
    "gender": ("what_is_your_gender",),
    "education_level": ("what_is_your_education_level",),
    "daily_hours": ("how_many_hours_do_you_use_your_mobile_phone_daily",),
    "main_purpose": ("what_is_your_main_purpose_for_using_a_mobile_phone",),
    "checking_frequency": ("how_often_do_you_check_your_phone_in_a_day",),
    "wake_check": ("do_you_check_your_phone_immediately_after_waking_up",),
    "before_sleep": ("how_often_do_you_use_your_phone_before_sleeping",),
    "anxious_without_phone": ("do_you_feel_anxious_without_your_phone",),
    "study_distraction": (
        "how_often_do_you_feel_distracted_by_your_phone_while_studying",
    ),
    "class_usage": ("do_you_use_your_phone_during_class_lecture",),
    "self_reported_addiction": ("do_you_think_you_are_addicted_to_your_phone",),
    "sleep_affected": ("has_phone_usage_affected_your_sleep",),
    "academic_performance": (
        "has_mobile_phone_usage_affected_your_academic_performance",
    ),
    "reduction_attempts": ("how_often_do_you_try_to_reduce_your_phone_usage",),
    "favorite_app": ("which_app_do_you_use_the_most",),
    "waste_time": ("do_you_feel_you_waste_time_on_your_phone",),
    "during_meals": ("how_often_do_you_use_your_phone_while_eating",),
    "battery_low": ("i_feel_uncomfortable_when_my_phone_battery_is_low",),
    "online_communication": (
        "i_prefer_online_communication_over_face_to_face_interaction",
    ),
    "social_media_intensity": ("i_spend_a_lot_of_time_on_social_media",),
    "productive_use": (
        "i_use_my_phone_for_productive_purposes_such_as_study_or_work",
    ),
    "reduction_intent": ("i_would_like_to_reduce_my_mobile_phone_usage",),
    "problems": (
        "what_problems_do_you_face_due_to_excessive_use_of_mobile_phones",
    ),
}

MANDATORY_COLUMNS = (
    "timestamp",
    "daily_hours",
    "checking_frequency",
    "before_sleep",
    "anxious_without_phone",
    "study_distraction",
    "waste_time",
    "social_media_intensity",
    "reduction_intent",
    "self_reported_addiction",
)

OPTIONAL_SCORE_COLUMNS = (
    "wake_check",
    "class_usage",
    "sleep_affected",
    "battery_low",
    "reduction_attempts",
)

TEXT_CANONICAL_MAPS: dict[str, dict[str, str]] = {
    "age_group": {
        "15-18": "15-18",
        "15-18 years": "15-18",
        "18-21": "18-21",
        "18-21 years": "18-21",
        "21-25": "21-25",
        "21-25 years": "21-25",
    },
    "gender": {
        "female": "Female",
        "male": "Male",
        "prefer not to say": "Prefer not to say",
        "prefer not say": "Prefer not to say",
    },
    "education_level": {
        "school student": "School student",
        "college student": "College student",
        "university student": "University student",
    },
    "main_purpose": {
        "social media": "Social media",
        "communication": "Communication",
        "studies": "Studies",
        "study": "Studies",
        "gaming": "Gaming",
        "games": "Gaming",
    },
    "academic_performance": {
        "negatively": "Negatively",
        "no effect": "No effect",
        "positively": "Positively",
    },
    "favorite_app": {
        "social media": "Social media",
        "educational apps": "Educational apps",
        "games": "Games",
        "gaming": "Games",
        "others": "Others",
        "other": "Others",
    },
}


def normalize_choice(value: object) -> str:
    if value is None or value is pd.NA:
        return ""
    text = str(value).replace("\u00a0", " ").strip().lower()
    text = text.replace("–", "-").replace("—", "-")
    return " ".join(text.split())


def _normalized_aliases(*pairs: tuple[str, int]) -> dict[str, int]:
    return {normalize_choice(raw): code for raw, code in pairs}


ENCODING_SPECS: tuple[EncodingSpec, ...] = (
    EncodingSpec(
        key="daily_hours",
        frontend_key="dailyHours",
        label="Daily phone usage",
        source_column="daily_hours",
        options=(
            (1, "Less than 2 hours"),
            (2, "2-4 hours"),
            (3, "4-6 hours"),
            (4, "More than 6 hours"),
        ),
        aliases=_normalized_aliases(
            ("Less than 2 hours", 1),
            ("Under 2 hours", 1),
            ("2-4 hours", 2),
            ("2–4 hours", 2),
            ("4-6 hours", 3),
            ("4–6 hours", 3),
            ("More than 6 hours", 4),
            ("Above 6 hours", 4),
            ("6+ hours", 4),
        ),
        default_code=2,
        description="Ordinal coding for the respondent's daily phone-use duration.",
    ),
    EncodingSpec(
        key="checking_frequency",
        frontend_key="checkingFrequency",
        label="Checking frequency",
        source_column="checking_frequency",
        options=(
            (1, "Less than 10 times"),
            (2, "10-30 times"),
            (3, "30-60 times"),
            (4, "More than 60 times"),
        ),
        aliases=_normalized_aliases(
            ("Less than 10 times", 1),
            ("Below 10 times", 1),
            ("10-30 times", 2),
            ("10–30 times", 2),
            ("30-60 times", 3),
            ("30–60 times", 3),
            ("More than 60 times", 4),
            ("Above 60 times", 4),
            ("60+ times", 4),
        ),
        default_code=2,
        description="Ordinal coding for how often the student checks the phone in a day.",
    ),
    EncodingSpec(
        key="before_sleep",
        frontend_key="beforeSleep",
        label="Before-sleep use",
        source_column="before_sleep",
        options=((1, "Sometimes"), (2, "Often"), (3, "Every day")),
        aliases=_normalized_aliases(
            ("Sometimes", 1),
            ("Rarely", 1),
            ("Occasionally", 1),
            ("Often", 2),
            ("Usually", 2),
            ("Every day", 3),
            ("Everyday", 3),
            ("Daily", 3),
            ("Always", 3),
        ),
        default_code=2,
        description="How consistently the student uses the phone before sleeping.",
    ),
    EncodingSpec(
        key="anxious_without_phone",
        frontend_key="anxiousWithoutPhone",
        label="Anxiety without phone",
        source_column="anxious_without_phone",
        options=((0, "No"), (1, "Sometimes"), (2, "Yes")),
        aliases=_normalized_aliases(
            ("No", 0),
            ("Sometimes", 1),
            ("Maybe", 1),
            ("Yes", 2),
        ),
        default_code=1,
        description="Binary-plus-neutral coding for emotional discomfort without phone access.",
    ),
    EncodingSpec(
        key="study_distraction",
        frontend_key="studyDistraction",
        label="Study distraction",
        source_column="study_distraction",
        options=((1, "Never"), (2, "Sometimes"), (3, "Often"), (4, "Always")),
        aliases=_normalized_aliases(
            ("Never", 1),
            ("Rarely", 1),
            ("Sometimes", 2),
            ("Often", 3),
            ("Usually", 3),
            ("Always", 4),
        ),
        default_code=2,
        description="How strongly phone use interrupts studying.",
    ),
    EncodingSpec(
        key="waste_time",
        frontend_key="wasteTime",
        label="Feels like wasted time",
        source_column="waste_time",
        options=((0, "No"), (1, "Sometimes"), (2, "Yes")),
        aliases=_normalized_aliases(
            ("No", 0),
            ("Sometimes", 1),
            ("Maybe", 1),
            ("Yes", 2),
        ),
        default_code=1,
        description="Whether the respondent believes phone use wastes time.",
    ),
    EncodingSpec(
        key="social_media_intensity",
        frontend_key="socialMediaIntensity",
        label="Social media intensity",
        source_column="social_media_intensity",
        options=(
            (1, "Strongly Disagree"),
            (2, "Disagree"),
            (3, "Neutral"),
            (4, "Agree"),
            (5, "Strongly Agree"),
        ),
        aliases=_normalized_aliases(
            ("Strongly Disagree", 1),
            ("Disagree", 2),
            ("No", 2),
            ("Neutral", 3),
            ("Sometimes", 3),
            ("Agree", 4),
            ("Yes", 4),
            ("Strongly Agree", 5),
            ("More than 5 hours", 5),
        ),
        default_code=3,
        description="Likert-coded intensity of social-media use.",
    ),
    EncodingSpec(
        key="reduction_intent",
        frontend_key="reductionIntent",
        label="Reduction intent",
        source_column="reduction_intent",
        options=(
            (1, "Strongly Disagree"),
            (2, "Disagree"),
            (3, "Neutral"),
            (4, "Agree"),
            (5, "Strongly Agree"),
        ),
        aliases=_normalized_aliases(
            ("Strongly Disagree", 1),
            ("Disagree", 2),
            ("Neutral", 3),
            ("Sometimes", 3),
            ("Agree", 4),
            ("Yes", 4),
            ("Strongly Agree", 5),
        ),
        default_code=4,
        description="Likert-coded desire to reduce mobile-phone use.",
    ),
    EncodingSpec(
        key="wake_check",
        label="Wake-up checking",
        source_column="wake_check",
        options=((1, "Never"), (2, "Rarely"), (3, "Sometimes"), (4, "Always")),
        aliases=_normalized_aliases(
            ("Never", 1),
            ("Rarely", 2),
            ("Sometimes", 3),
            ("Often", 4),
            ("Always", 4),
        ),
        default_code=3,
        description="How soon the phone is checked after waking up.",
    ),
    EncodingSpec(
        key="class_usage",
        label="Class usage",
        source_column="class_usage",
        options=((1, "Never"), (2, "Rarely"), (3, "Sometimes"), (4, "Always")),
        aliases=_normalized_aliases(
            ("Never", 1),
            ("Rarely", 2),
            ("Sometimes", 3),
            ("Often", 4),
            ("Always", 4),
        ),
        default_code=2,
        description="How frequently the student uses the phone during class or lecture.",
    ),
    EncodingSpec(
        key="sleep_affected",
        label="Sleep affected",
        source_column="sleep_affected",
        options=((0, "No"), (1, "Sometimes"), (2, "Yes")),
        aliases=_normalized_aliases(
            ("No", 0),
            ("Sometimes", 1),
            ("Maybe", 1),
            ("Yes", 2),
        ),
        default_code=1,
        description="Whether the respondent says phone use affects sleep.",
    ),
    EncodingSpec(
        key="battery_low",
        label="Battery discomfort",
        source_column="battery_low",
        options=(
            (1, "Strongly Disagree"),
            (2, "Disagree"),
            (3, "Neutral"),
            (4, "Agree"),
            (5, "Strongly Agree"),
        ),
        aliases=_normalized_aliases(
            ("Strongly Disagree", 1),
            ("Disagree", 2),
            ("No", 2),
            ("Neutral", 3),
            ("Agree", 4),
            ("Yes", 4),
            ("Strongly Agree", 5),
        ),
        default_code=3,
        description="Likert-coded discomfort when the phone battery is low.",
    ),
    EncodingSpec(
        key="reduction_attempts",
        label="Reduction attempts",
        source_column="reduction_attempts",
        options=((1, "Never"), (2, "Rarely"), (3, "Sometimes"), (4, "Often")),
        aliases=_normalized_aliases(
            ("Never", 1),
            ("Rarely", 2),
            ("Sometimes", 3),
            ("Often", 4),
            ("Always", 4),
        ),
        default_code=3,
        description="How often the respondent tries to reduce phone usage.",
    ),
)

MODEL_FEATURE_SPECS: tuple[EncodingSpec, ...] = tuple(
    spec for spec in ENCODING_SPECS if spec.frontend_key is not None
)
MODEL_FEATURE_KEYS = tuple(spec.key for spec in MODEL_FEATURE_SPECS)
MODEL_FRONTEND_KEYS = tuple(spec.frontend_key for spec in MODEL_FEATURE_SPECS if spec.frontend_key)
ENCODING_SPEC_BY_KEY = {spec.key: spec for spec in ENCODING_SPECS}
ENCODING_SPEC_BY_FRONTEND_KEY = {
    spec.frontend_key: spec for spec in MODEL_FEATURE_SPECS if spec.frontend_key
}

SELF_REPORT_ALIASES = {
    "no": "No",
    "sometimes": "Maybe",
    "maybe": "Maybe",
    "yes": "Yes",
}

ADDICTION_SCORE_COMPONENTS: tuple[ScoreComponent, ...] = (
    ScoreComponent("daily_hours", 0.18, "Long daily usage increases compulsive exposure time."),
    ScoreComponent(
        "checking_frequency",
        0.14,
        "Frequent checking is a strong behavioral marker of dependence.",
    ),
    ScoreComponent(
        "before_sleep",
        0.10,
        "Night-time use is linked to habit reinforcement and poorer self-control.",
    ),
    ScoreComponent(
        "wake_check",
        0.07,
        "Immediate morning checking signals routine-driven dependence.",
    ),
    ScoreComponent(
        "anxious_without_phone",
        0.10,
        "Anxiety without the phone reflects emotional attachment to access.",
    ),
    ScoreComponent(
        "study_distraction",
        0.12,
        "Distraction during study indicates direct interference with academic focus.",
    ),
    ScoreComponent(
        "class_usage",
        0.07,
        "Using the phone during class signals poor control in restricted settings.",
    ),
    ScoreComponent(
        "sleep_affected",
        0.08,
        "Sleep impact is a meaningful downstream consequence of excessive use.",
    ),
    ScoreComponent(
        "waste_time",
        0.07,
        "Perceived time wastage captures self-awareness of unproductive use.",
    ),
    ScoreComponent(
        "battery_low",
        0.03,
        "Discomfort when the battery is low reflects attachment to constant access.",
    ),
    ScoreComponent(
        "social_media_intensity",
        0.02,
        "Heavy social-media involvement often accompanies repeated phone checking.",
    ),
    ScoreComponent(
        "reduction_attempts",
        0.02,
        "Frequent attempts to cut down can indicate loss of control over usage.",
    ),
)


def prepare_survey_dataset(load_result: DatasetLoadResult) -> PreparedSurveyData:
    renamed_frame, missing_mandatory, missing_optional = _rename_and_validate_columns(
        load_result.dataframe
    )

    if missing_mandatory:
        missing = ", ".join(sorted(missing_mandatory))
        raise ValueError(f"Dataset is missing required columns after normalization: {missing}")

    cleaned_rows: list[dict[str, Any]] = []
    for row_index, row in renamed_frame.iterrows():
        cleaned_rows.append(_clean_single_row(row_index=row_index, row=row))

    cleaned_df = pd.DataFrame(cleaned_rows)

    code_columns = [f"{spec.key}_code" for spec in ENCODING_SPECS]
    for column in code_columns:
        cleaned_df[column] = cleaned_df[column].astype("Int64")

    feature_code_columns = [f"{spec.key}_code" for spec in MODEL_FEATURE_SPECS]
    cleaned_df["model_feature_missing_count"] = cleaned_df[feature_code_columns].isna().sum(axis=1)
    cleaned_df["score_component_count"] = cleaned_df[
        [f"{component.feature_key}_code" for component in ADDICTION_SCORE_COMPONENTS]
    ].notna().sum(axis=1)

    feature_defaults = _derive_feature_defaults(cleaned_df)
    model_df = _build_model_frame(cleaned_df, feature_defaults)

    metadata = {
        "dataset_source": load_result.source,
        "source_type": load_result.source_type,
        "raw_row_count": int(len(load_result.dataframe)),
        "clean_row_count": int((~cleaned_df["is_malformed"]).sum()),
        "malformed_row_count": int(cleaned_df["is_malformed"].sum()),
        "model_row_count": int(len(model_df)),
        "missing_optional_columns": sorted(missing_optional),
        "feature_defaults": feature_defaults,
        "feature_order": list(MODEL_FEATURE_KEYS),
        "frontend_feature_order": list(MODEL_FRONTEND_KEYS),
        "dropped_response_ids": cleaned_df.loc[
            cleaned_df["is_malformed"], "response_id"
        ].tolist(),
    }

    return PreparedSurveyData(
        cleaned_df=cleaned_df,
        model_df=model_df,
        feature_defaults=feature_defaults,
        feature_order=list(MODEL_FEATURE_KEYS),
        frontend_feature_order=list(MODEL_FRONTEND_KEYS),
        metadata=metadata,
    )


def row_to_frontend_input(row: pd.Series, feature_defaults: dict[str, int]) -> dict[str, int]:
    payload: dict[str, int] = {}
    for spec in MODEL_FEATURE_SPECS:
        raw_value = row.get(spec.key)
        if pd.isna(raw_value):
            raw_value = row.get(f"{spec.key}_code")
        code = coerce_input_value(spec, raw_value, default_code=feature_defaults[spec.key])[0]
        payload[spec.frontend_key or spec.key] = code
    return payload


def preprocess_prediction_input(
    payload: dict[str, Any],
    feature_defaults: dict[str, int],
) -> dict[str, Any]:
    processed: dict[str, int] = {}
    warnings: list[str] = []
    used_defaults: dict[str, int] = {}

    for spec in MODEL_FEATURE_SPECS:
        raw_value = payload.get(spec.frontend_key or spec.key, payload.get(spec.key))
        code, warning = coerce_input_value(spec, raw_value, default_code=feature_defaults[spec.key])
        processed[spec.key] = code
        if spec.frontend_key:
            processed[spec.frontend_key] = code
        if warning:
            warnings.append(warning)
            used_defaults[spec.frontend_key or spec.key] = code

    return {
        "processed": processed,
        "warnings": warnings,
        "used_defaults": used_defaults,
    }


def coerce_input_value(
    spec: EncodingSpec,
    raw_value: Any,
    default_code: int,
) -> tuple[int, str | None]:
    if raw_value is None or raw_value is pd.NA or raw_value == "":
        return default_code, f"{spec.label}: missing input replaced with default code {default_code}."

    if isinstance(raw_value, str):
        normalized = normalize_choice(raw_value)
        if normalized.isdigit():
            numeric = int(normalized)
            return _validate_numeric_code(spec, numeric, default_code)
        mapped_code = spec.aliases.get(normalized)
        if mapped_code is not None:
            return mapped_code, None
        return (
            default_code,
            f"{spec.label}: unrecognized label '{raw_value}' replaced with default code {default_code}.",
        )

    if isinstance(raw_value, bool):
        numeric = int(raw_value)
        return _validate_numeric_code(spec, numeric, default_code)

    if isinstance(raw_value, (int, float)):
        numeric = int(round(float(raw_value)))
        return _validate_numeric_code(spec, numeric, default_code)

    return (
        default_code,
        f"{spec.label}: unsupported input type replaced with default code {default_code}.",
    )


def serialize_preprocessing_config(prepared: PreparedSurveyData) -> dict[str, Any]:
    features: dict[str, Any] = {}

    for spec in MODEL_FEATURE_SPECS:
        default_code = prepared.feature_defaults[spec.key]
        features[spec.frontend_key or spec.key] = {
            "python_key": spec.key,
            "label": spec.label,
            "source_column": spec.source_column,
            "description": spec.description,
            "allowed_codes": [code for code, _ in spec.options],
            "default_code": default_code,
            "minimum_code": spec.minimum_code,
            "maximum_code": spec.maximum_code,
            "options": [{"code": code, "label": label} for code, label in spec.options],
            "label_to_code": {
                label: code for code, label in spec.options
            },
            "aliases": spec.aliases,
        }

    return {
        "version": "1.0.0",
        "feature_order": [spec.frontend_key for spec in MODEL_FEATURE_SPECS],
        "python_feature_order": list(MODEL_FEATURE_KEYS),
        "default_fill_values": {
            spec.frontend_key: prepared.feature_defaults[spec.key]
            for spec in MODEL_FEATURE_SPECS
        },
        "required_columns": list(MANDATORY_COLUMNS),
        "optional_score_columns": list(OPTIONAL_SCORE_COLUMNS),
        "row_rules": {
            "min_non_empty_responses": MIN_NON_EMPTY_RESPONSES,
            "max_missing_model_features": MAX_MISSING_MODEL_FEATURES,
            "min_score_weight_coverage": MIN_SCORE_WEIGHT_COVERAGE,
        },
        "features": features,
        "column_aliases": {key: list(value) for key, value in RAW_COLUMN_ALIASES.items()},
        "score_definition": {
            "score_name": "Addiction Score",
            "range": [0, 100],
            "components": [
                {
                    "feature_key": component.feature_key,
                    "frontend_key": ENCODING_SPEC_BY_KEY[component.feature_key].frontend_key,
                    "label": ENCODING_SPEC_BY_KEY[component.feature_key].label,
                    "weight": component.weight,
                    "minimum_code": ENCODING_SPEC_BY_KEY[component.feature_key].minimum_code,
                    "maximum_code": ENCODING_SPEC_BY_KEY[component.feature_key].maximum_code,
                    "rationale": component.rationale,
                }
                for component in ADDICTION_SCORE_COMPONENTS
            ],
        },
        "risk_definition": {
            "primary_score_threshold": 60.0,
            "support_window_start": 55.0,
            "supportive_self_report_labels": ["Yes", "Maybe"],
            "label_mapping": {
                "0": "Lower addiction risk",
                "1": "Elevated addiction risk",
            },
        },
    }


def _rename_and_validate_columns(
    raw_frame: pd.DataFrame,
) -> tuple[pd.DataFrame, set[str], set[str]]:
    rename_map: dict[str, str] = {}
    missing_mandatory: set[str] = set()
    missing_optional: set[str] = set()

    for canonical_name, aliases in RAW_COLUMN_ALIASES.items():
        match = next((column for column in raw_frame.columns if column in aliases), None)
        if match is None:
            if canonical_name in MANDATORY_COLUMNS:
                missing_mandatory.add(canonical_name)
            else:
                missing_optional.add(canonical_name)
            continue
        rename_map[match] = canonical_name

    renamed = raw_frame.rename(columns=rename_map).copy()
    for column_name in RAW_COLUMN_ALIASES:
        if column_name not in renamed.columns:
            renamed[column_name] = pd.NA

    return renamed, missing_mandatory, missing_optional


def _clean_single_row(row_index: int, row: pd.Series) -> dict[str, Any]:
    notes: list[str] = []
    response_id = f"R{row_index + 1:03d}"
    answered_count = int(
        sum(bool(normalize_choice(row.get(column_name))) for column_name in RAW_COLUMN_ALIASES if column_name != "timestamp")
    )
    is_malformed = answered_count < MIN_NON_EMPTY_RESPONSES

    cleaned: dict[str, Any] = {
        "response_id": response_id,
        "source_row_number": row_index + 2,
        "answered_count": answered_count,
        "is_malformed": is_malformed,
        "timestamp": pd.to_datetime(row.get("timestamp"), dayfirst=True, errors="coerce"),
        "timestamp_raw": row.get("timestamp"),
    }

    for column_name in (
        "age_group",
        "gender",
        "education_level",
        "main_purpose",
        "academic_performance",
        "favorite_app",
    ):
        cleaned[column_name] = canonicalize_text_value(column_name, row.get(column_name))

    cleaned["problems"] = normalize_problem_text(row.get("problems"))

    self_report = canonicalize_self_report(row.get("self_reported_addiction"))
    cleaned["self_reported_addiction"] = self_report

    for spec in ENCODING_SPECS:
        label, code, warning = encode_response(spec, row.get(spec.source_column))
        cleaned[spec.key] = label
        cleaned[f"{spec.key}_code"] = code
        if warning:
            notes.append(warning)

    score, score_weight_coverage = compute_addiction_score(cleaned)
    cleaned["addiction_score"] = score
    cleaned["score_weight_coverage"] = round(score_weight_coverage, 4)

    if pd.notna(score):
        numeric_score = float(score)
        if numeric_score >= 60:
            score_band = "High-use risk"
        elif numeric_score >= 45:
            score_band = "Elevated use"
        else:
            score_band = "Steady use"
    else:
        score_band = pd.NA

    cleaned["score_band"] = score_band
    cleaned["risk_binary"] = derive_risk_label(score, self_report)
    if pd.isna(cleaned["risk_binary"]):
        cleaned["risk_label"] = pd.NA
    elif cleaned["risk_binary"] == 1:
        cleaned["risk_label"] = "Elevated addiction risk"
    else:
        cleaned["risk_label"] = "Lower addiction risk"
    cleaned["row_notes"] = " | ".join(notes) if notes else pd.NA

    if is_malformed:
        cleaned["row_notes"] = (
            f"{cleaned['row_notes']} | " if pd.notna(cleaned["row_notes"]) else ""
        ) + "Excluded as malformed because the row has too few answered survey fields."

    return cleaned


def encode_response(
    spec: EncodingSpec,
    raw_value: Any,
) -> tuple[Any, Any, str | None]:
    normalized = normalize_choice(raw_value)
    if not normalized:
        return pd.NA, pd.NA, None

    code = spec.aliases.get(normalized)
    if code is None:
        return (
            pd.NA,
            pd.NA,
            f"{spec.label}: unmapped survey value '{raw_value}' left missing for safe handling.",
        )

    label = spec.code_to_label[code]
    return label, code, None


def canonicalize_text_value(field_name: str, raw_value: Any) -> Any:
    normalized = normalize_choice(raw_value)
    if not normalized:
        return pd.NA

    canonical = TEXT_CANONICAL_MAPS.get(field_name, {}).get(normalized)
    if canonical is not None:
        return canonical

    raw_text = str(raw_value).strip()
    return raw_text if raw_text else pd.NA


def canonicalize_self_report(raw_value: Any) -> Any:
    normalized = normalize_choice(raw_value)
    if not normalized:
        return pd.NA
    return SELF_REPORT_ALIASES.get(normalized, str(raw_value).strip())


def normalize_problem_text(raw_value: Any) -> Any:
    if raw_value is None or raw_value is pd.NA:
        return pd.NA

    cleaned = " ".join(str(raw_value).replace("\n", " ").split()).strip()
    if cleaned == "":
        return pd.NA

    normalized = normalize_choice(cleaned)
    if len(cleaned) < 4 or normalized in {"yes", ".", "heheheheh", "heheheheheh"}:
        return pd.NA
    return cleaned


def compute_addiction_score(row_values: dict[str, Any]) -> tuple[Any, float]:
    weighted_sum = 0.0
    available_weight = 0.0

    for component in ADDICTION_SCORE_COMPONENTS:
        spec = ENCODING_SPEC_BY_KEY[component.feature_key]
        code = row_values.get(f"{component.feature_key}_code")
        if pd.isna(code):
            continue

        denominator = spec.maximum_code - spec.minimum_code
        normalized_component = 1.0 if denominator == 0 else (int(code) - spec.minimum_code) / denominator
        weighted_sum += normalized_component * component.weight
        available_weight += component.weight

    if available_weight < MIN_SCORE_WEIGHT_COVERAGE:
        return pd.NA, available_weight

    score = round((weighted_sum / available_weight) * 100, 1)
    return score, available_weight


def derive_risk_label(score: Any, self_report: Any) -> Any:
    if pd.isna(score):
        return pd.NA

    numeric_score = float(score)
    if numeric_score >= 60:
        return 1
    if numeric_score >= 55 and self_report in {"Yes", "Maybe"}:
        return 1
    return 0


def _derive_feature_defaults(cleaned_df: pd.DataFrame) -> dict[str, int]:
    usable_rows = cleaned_df.loc[~cleaned_df["is_malformed"]].copy()
    defaults: dict[str, int] = {}

    for spec in MODEL_FEATURE_SPECS:
        series = usable_rows[f"{spec.key}_code"].dropna().astype(int)
        if series.empty:
            defaults[spec.key] = spec.default_code or spec.minimum_code
            continue

        median_code = int(round(float(series.median())))
        defaults[spec.key] = max(spec.minimum_code, min(spec.maximum_code, median_code))

    return defaults


def _build_model_frame(
    cleaned_df: pd.DataFrame,
    feature_defaults: dict[str, int],
) -> pd.DataFrame:
    model_candidate_mask = (
        (~cleaned_df["is_malformed"])
        & cleaned_df["addiction_score"].notna()
        & cleaned_df["risk_binary"].notna()
        & (cleaned_df["model_feature_missing_count"] <= MAX_MISSING_MODEL_FEATURES)
    )
    model_df = cleaned_df.loc[model_candidate_mask].copy()

    for spec in MODEL_FEATURE_SPECS:
        model_df[spec.key] = (
            model_df[f"{spec.key}_code"]
            .fillna(feature_defaults[spec.key])
            .astype(int)
        )

    model_df["imputed_feature_count"] = model_df[
        [f"{spec.key}_code" for spec in MODEL_FEATURE_SPECS]
    ].isna().sum(axis=1)
    model_df["addiction_score"] = model_df["addiction_score"].astype(float)
    model_df["risk_binary"] = model_df["risk_binary"].astype(int)

    selected_columns = (
        [
            "response_id",
            "timestamp",
            "addiction_score",
            "risk_binary",
            "risk_label",
            "score_band",
            "imputed_feature_count",
        ]
        + list(MODEL_FEATURE_KEYS)
        + [f"{spec.key}_code" for spec in MODEL_FEATURE_SPECS]
    )
    return model_df[selected_columns].reset_index(drop=True)


def _validate_numeric_code(
    spec: EncodingSpec,
    numeric: int,
    default_code: int,
) -> tuple[int, str | None]:
    if spec.minimum_code <= numeric <= spec.maximum_code:
        return numeric, None
    return (
        default_code,
        f"{spec.label}: code {numeric} is outside the allowed range and was replaced with default code {default_code}.",
    )
