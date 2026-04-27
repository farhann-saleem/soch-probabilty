from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO, StringIO
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

import pandas as pd

DEFAULT_DATASET_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQ5IeFvPCjoZrE8jAU1a8aURcmCQf5gSgozCKV-FJqYXMx-RfwAxI7EvGru1KmFKPFeWn7TVecgqaDK/"
    "pub?output=csv"
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOCAL_DATASET = PROJECT_ROOT / "data" / "raw" / "soch_survey_snapshot.csv"
SUPPORTED_SOURCE_TYPES = ("csv", "xlsx", "xls")


@dataclass(slots=True)
class DatasetLoadResult:
    dataframe: pd.DataFrame
    source: str
    source_type: Literal["csv", "xlsx", "xls"]
    original_columns: list[str]
    normalized_columns: list[str]


def normalize_header_name(value: str) -> str:
    compact = (
        value.replace("\u00a0", " ")
        .strip()
        .lower()
        .replace("&", " and ")
        .replace("/", " ")
        .replace("-", " ")
        .replace("–", " ")
    )
    sanitized = []
    last_was_underscore = False

    for character in compact:
        if character.isalnum():
            sanitized.append(character)
            last_was_underscore = False
            continue
        if not last_was_underscore:
            sanitized.append("_")
            last_was_underscore = True

    return "".join(sanitized).strip("_")


def resolve_dataset_source(source: str | Path | None = None) -> str | Path:
    if source is not None:
        return Path(source) if _looks_like_local_path(source) else str(source)

    if DEFAULT_LOCAL_DATASET.exists():
        return DEFAULT_LOCAL_DATASET

    for directory in (PROJECT_ROOT / "data" / "raw", PROJECT_ROOT / "data", PROJECT_ROOT):
        if not directory.exists():
            continue
        for candidate in sorted(directory.glob("*")):
            if candidate.suffix.lower() in {".csv", ".xlsx", ".xls"}:
                return candidate

    return DEFAULT_DATASET_URL


def detect_source_type(source: str | Path) -> Literal["csv", "xlsx", "xls"]:
    text = str(source)
    parsed = urlparse(text)

    if parsed.scheme in {"http", "https"}:
        query = parse_qs(parsed.query)
        requested_output = query.get("output", [""])[0].lower()
        if requested_output in SUPPORTED_SOURCE_TYPES:
            return requested_output  # type: ignore[return-value]
        suffix = Path(parsed.path).suffix.lower()
    else:
        suffix = Path(text).suffix.lower()

    if suffix == ".csv":
        return "csv"
    if suffix == ".xlsx":
        return "xlsx"
    if suffix == ".xls":
        return "xls"

    raise ValueError(
        f"Unsupported dataset source '{source}'. Expected one of: {', '.join(SUPPORTED_SOURCE_TYPES)}."
    )


def load_raw_dataset(source: str | Path | None = None) -> DatasetLoadResult:
    resolved_source = resolve_dataset_source(source)
    source_type = detect_source_type(resolved_source)

    if _is_remote_source(resolved_source):
        raw_frame = _load_remote_dataset(str(resolved_source), source_type)
    else:
        raw_frame = _load_local_dataset(Path(resolved_source), source_type)

    original_columns = [str(column) for column in raw_frame.columns]
    raw_frame.columns = [normalize_header_name(str(column)) for column in raw_frame.columns]
    normalized_columns = list(raw_frame.columns)

    for column in raw_frame.columns:
        raw_frame[column] = raw_frame[column].map(_normalize_cell_value)

    raw_frame = raw_frame.dropna(how="all").reset_index(drop=True)

    return DatasetLoadResult(
        dataframe=raw_frame,
        source=str(resolved_source),
        source_type=source_type,
        original_columns=original_columns,
        normalized_columns=normalized_columns,
    )


def _load_local_dataset(path: Path, source_type: Literal["csv", "xlsx", "xls"]) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset source not found: {path}")

    if source_type == "csv":
        return pd.read_csv(path, dtype=str, keep_default_na=False)

    return pd.read_excel(path, dtype=str)


def _load_remote_dataset(url: str, source_type: Literal["csv", "xlsx", "xls"]) -> pd.DataFrame:
    with urlopen(url) as response:  # nosec B310 - controlled educational data source
        payload = response.read()

    if source_type == "csv":
        text = payload.decode("utf-8-sig")
        return pd.read_csv(StringIO(text), dtype=str, keep_default_na=False)

    return pd.read_excel(BytesIO(payload), dtype=str)


def _normalize_cell_value(value: object) -> object:
    if not isinstance(value, str):
        return value

    compact = " ".join(value.replace("\u00a0", " ").split()).strip()
    if compact == "":
        return pd.NA
    return compact


def _is_remote_source(source: str | Path) -> bool:
    return urlparse(str(source)).scheme in {"http", "https"}


def _looks_like_local_path(source: str | Path) -> bool:
    text = str(source)
    return not text.startswith("http://") and not text.startswith("https://")
