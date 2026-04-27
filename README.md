# Soch

Soch is a BSCS Probability & Statistics semester-final project focused on **student mobile phone addiction analysis**. The frontend remains a React/Vite application, while the full machine-learning pipeline is implemented in Python and exported as frontend-ready JSON artifacts so predictions can run in the browser without a backend.

## What this project now includes

- Automated dataset loading with CSV/XLSX detection
- Centralized cleaning and encoding rules
- A derived continuous **Addiction Score**
- A derived binary **Addiction Risk** label
- `scikit-learn` Linear Regression for score prediction
- `scikit-learn` Logistic Regression for risk prediction
- Exported JSON artifacts for direct browser inference
- Teacher-friendly notebooks for Probability & Statistics and ML

## Folder structure

```text
artifacts/
  cleaned_dataset.csv
  model_artifacts.json
  preprocessing_config.json
data/
  raw/
    soch_survey_snapshot.csv
frontend_integration/
  README_FRONTEND_INTEGRATION.md
  modelInference.ts
  modelTypes.ts
notebooks/
  01_probability_statistics_analysis.ipynb
  02_machine_learning_models.ipynb
scripts/
  generate_notebooks.py
src/
  data_loader.py
  preprocessing.py
  stats_analysis.py
  ml_models.py
  export_artifacts.py
  ...existing frontend source...
```

## Python setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Train models and export artifacts

```bash
.venv/bin/python -m src.export_artifacts
```

This command:

- loads the survey dataset
- cleans malformed rows
- engineers the targets
- trains both models
- evaluates both models
- exports:
  - `artifacts/model_artifacts.json`
  - `artifacts/preprocessing_config.json`
  - `artifacts/cleaned_dataset.csv`

## Generate notebooks

```bash
.venv/bin/python scripts/generate_notebooks.py
```

Optional execution step:

```bash
.venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/01_probability_statistics_analysis.ipynb
.venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/02_machine_learning_models.ipynb
```

## Frontend inference without a backend

The frontend uses `frontend_integration/modelInference.ts` to:

- validate user input
- apply the same feature order used by Python
- apply safe defaults for malformed or missing values
- compute the linear-regression Addiction Score
- compute the logistic-regression addiction probability
- return the final risk class and simple contribution explanations

No Python runtime is required in the browser.

## Run the frontend

```bash
npm run dev
```

The existing frontend continues to fetch live survey rows for the dashboard, but prediction logic uses the exported JSON artifacts so inference stays deterministic and backend-free.
If the live Google Sheet is unavailable, the frontend falls back to `public/soch_survey_snapshot.csv` for demo-safe dashboard loading.

## Model behavior

### Continuous target

The **Addiction Score** is a transparent weighted score derived from behavior-related survey items such as:

- daily phone usage
- checking frequency
- use before sleep
- study distraction
- anxiety without the phone
- class usage
- sleep impact
- waste of time
- battery discomfort
- social media intensity
- reduction attempts

### Binary target

The **Addiction Risk** label is derived primarily from the Addiction Score threshold, with self-reported addiction used only as documented support inside the borderline score band.

## Notes for presentation

- The project uses responsible academic language.
- Predictions are **educational estimates**, not diagnosis.
- Python is the single source of truth for preprocessing, training, evaluation, and artifact generation.
- The browser only performs inference from exported artifacts.
