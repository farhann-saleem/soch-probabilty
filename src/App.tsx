import { motion } from "framer-motion";
import { type ReactNode, startTransition, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildHistogram,
  fetchSurveySnapshot,
  predictLinearScore,
  predictLogisticProbability,
  predictionFields,
  simulateSampleMeans,
  type DistributionDatum,
  type HistogramDatum,
  type PredictionFieldDefinition,
  type PredictionInput,
  type SurveySnapshot,
} from "./lib/soch-data";

type ProbabilityCard = {
  label: string;
  value: number;
  note: string;
};

type ChartDatum = DistributionDatum | HistogramDatum | { label: string; percentage: number };

const sectionMotion = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] as const },
};

const sectionLinks = [
  { label: "Sample", path: "/", hash: "#sample" },
  { label: "Scores", path: "/", hash: "#scores" },
  { label: "Probability", path: "/", hash: "#probability" },
  { label: "CLT", path: "/clt", hash: "#clt" },
  { label: "Models", path: "/models", hash: "#models" },
  { label: "Sandbox", path: "/sandbox", hash: "#sandbox" },
] as const;

const numberFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

function shortenLabel(label: string, max = 14) {
  return label.length <= max ? label : `${label.slice(0, max - 1)}...`;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<SurveySnapshot | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [sampleSize, setSampleSize] = useState(8);
  const [simulationCount, setSimulationCount] = useState(180);
  const [simulationHistogram, setSimulationHistogram] = useState<HistogramDatum[]>([]);
  const [riskThreshold, setRiskThreshold] = useState(0.5);
  const [predictionInput, setPredictionInput] = useState<PredictionInput>({
    dailyHours: 2,
    checkingFrequency: 2,
    beforeSleep: 2,
    anxiousWithoutPhone: 1,
    studyDistraction: 2,
    wasteTime: 1,
    socialMediaIntensity: 3,
    reductionIntent: 3,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      setLoadState("loading");
      setErrorMessage("");

      try {
        const nextSnapshot = await fetchSurveySnapshot();

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setSnapshot(nextSnapshot);
          setPredictionInput(nextSnapshot.defaultPredictionInput);
          setLoadState("ready");
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadState("error");
        setErrorMessage(error instanceof Error ? error.message : "Could not load live data.");
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    startTransition(() => {
      const sampleMeans = simulateSampleMeans(
        snapshot.rows.map((row) => row.addictionScore),
        sampleSize,
        simulationCount,
      );
      setSimulationHistogram(buildHistogram(sampleMeans, 10));
    });
  }, [sampleSize, simulationCount, snapshot]);

  if (loadState === "loading" && !snapshot) {
    return (
      <StatusScreen
        title="Loading Soch Analytics"
        detail="Fetching the live survey feed and building the dashboard."
      />
    );
  }

  if (loadState === "error" && !snapshot) {
    return <StatusScreen title="Live data unavailable" detail={errorMessage} error />;
  }

  if (!snapshot) {
    return null;
  }

  const probabilityCards: ProbabilityCard[] = [
    {
      label: "Heavy use",
      value: snapshot.probabilities.heavyUse,
      note: "Students in the highest daily-use band.",
    },
    {
      label: "Sleep affected",
      value: snapshot.probabilities.sleepAffected,
      note: "Students reporting direct sleep impact.",
    },
    {
      label: "Study distraction",
      value: snapshot.probabilities.studyDistraction,
      note: "Students often or always distracted while studying.",
    },
    {
      label: "Sleep | heavy use",
      value: snapshot.probabilities.sleepAffectedGivenHeavyUse,
      note: "Sleep impact inside the heavy-use subgroup.",
    },
  ];

  const probabilityChartData = probabilityCards.map((card) => ({
    label: card.label,
    percentage: Number((card.value * 100).toFixed(0)),
  }));

  const strongestLinear = [...snapshot.regression.linear.coefficients]
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 5);
  const strongestLogistic = [...snapshot.regression.logistic.weights]
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 5);

  const predictedScore = predictLinearScore(snapshot.regression.linear, predictionInput);
  const predictedProbability = predictLogisticProbability(
    snapshot.regression.logistic,
    predictionInput,
  );
  const predictedBand =
    predictedProbability >= 0.64
      ? "High-use risk"
      : predictedProbability >= 0.38
        ? "Elevated use"
        : "Steady use";
  const thresholdDecision =
    predictedProbability >= riskThreshold ? "Above threshold" : "Below threshold";
  const thresholdGap = predictedProbability - riskThreshold;
  const scoreDelta = predictedScore - snapshot.descriptiveStats.mean;
  const modelRows = snapshot.rows.filter(
    (row): row is (typeof snapshot.rows)[number] & { modelFeatures: PredictionInput } =>
      row.modelFeatures !== null,
  );
  const sandboxPresets: Array<{ label: string; input: PredictionInput }> = [
    { label: "Dataset default", input: snapshot.defaultPredictionInput },
    {
      label: "Balanced",
      input: {
        dailyHours: 2,
        checkingFrequency: 2,
        beforeSleep: 2,
        anxiousWithoutPhone: 0,
        studyDistraction: 2,
        wasteTime: 1,
        socialMediaIntensity: 2,
        reductionIntent: 3,
      },
    },
    {
      label: "Heavy scroll",
      input: {
        dailyHours: 4,
        checkingFrequency: 4,
        beforeSleep: 3,
        anxiousWithoutPhone: 2,
        studyDistraction: 4,
        wasteTime: 2,
        socialMediaIntensity: 5,
        reductionIntent: 4,
      },
    },
    {
      label: "Study mode",
      input: {
        dailyHours: 2,
        checkingFrequency: 1,
        beforeSleep: 1,
        anxiousWithoutPhone: 0,
        studyDistraction: 1,
        wasteTime: 0,
        socialMediaIntensity: 2,
        reductionIntent: 4,
      },
    },
    {
      label: "Night habit",
      input: {
        dailyHours: 3,
        checkingFrequency: 3,
        beforeSleep: 3,
        anxiousWithoutPhone: 1,
        studyDistraction: 3,
        wasteTime: 2,
        socialMediaIntensity: 4,
        reductionIntent: 3,
      },
    },
  ];

  const applyPredictionInput = (nextInput: PredictionInput) => {
    setPredictionInput({ ...nextInput });
  };

  const applyRandomProfile = () => {
    if (modelRows.length === 0) {
      return;
    }

    const randomProfile =
      modelRows[Math.floor(Math.random() * modelRows.length)]?.modelFeatures ??
      snapshot.defaultPredictionInput;
    applyPredictionInput(randomProfile);
  };

  const setPredictionField = (field: keyof PredictionInput, value: number) => {
    setPredictionInput((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="dashboard-shell">
      <div className="ambient ambient-matcha" />
      <div className="ambient ambient-slushie" />
      <div className="ambient ambient-pomegranate" />

      <ScrollManager />

      <AppChrome snapshot={snapshot}>
        <Routes>
          <Route
            path="/"
            element={
              <AnalyticsPage
                probabilityCards={probabilityCards}
                probabilityChartData={probabilityChartData}
                snapshot={snapshot}
              />
            }
          />
          <Route
            path="/clt"
            element={
              <CltPage
                sampleSize={sampleSize}
                setSampleSize={setSampleSize}
                setSimulationCount={setSimulationCount}
                simulationCount={simulationCount}
                simulationHistogram={simulationHistogram}
                snapshot={snapshot}
              />
            }
          />
          <Route
            path="/models"
            element={
              <ModelsPage
                snapshot={snapshot}
                strongestLinear={strongestLinear}
                strongestLogistic={strongestLogistic}
              />
            }
          />
          <Route
            path="/sandbox"
            element={
              <SandboxPage
                predictedBand={predictedBand}
                predictedProbability={predictedProbability}
                predictedScore={predictedScore}
                predictionInput={predictionInput}
                probabilityThreshold={riskThreshold}
                scoreDelta={scoreDelta}
                setPredictionField={setPredictionField}
                setRiskThreshold={setRiskThreshold}
                thresholdDecision={thresholdDecision}
                thresholdGap={thresholdGap}
                sandboxPresets={sandboxPresets}
                applyPredictionInput={applyPredictionInput}
                applyRandomProfile={applyRandomProfile}
              />
            }
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppChrome>
    </div>
  );
}

function AnalyticsPage({
  snapshot,
  probabilityCards,
  probabilityChartData,
}: {
  snapshot: SurveySnapshot;
  probabilityCards: ProbabilityCard[];
  probabilityChartData: Array<{ label: string; percentage: number }>;
}) {
  return (
    <main className="dashboard-page">
      <DashboardSection
        id="sample"
        kicker="Live sample"
        title="Current phone-usage patterns"
        summary="The sample view stays close to the raw survey categories."
      >
        <div className="dashboard-grid dashboard-grid-sample">
          <ChartCard
            kicker="Main chart"
            title="Daily phone use distribution"
            summary="Tallest bar = most common daily-use band in the live class sample."
            formula="count = responses in each usage category"
            hero
          >
            <DistributionChart
              data={snapshot.distributions.usageHours}
              color="#0d8d5b"
              orientation="vertical"
            />
          </ChartCard>

          <div className="dashboard-stack">
            <ChartCard
              kicker="Breakdown"
              title="Main phone purpose"
              summary="Purpose shows why most of the screen time is happening."
              formula="count = responses in each purpose category"
            >
              <DistributionChart
                data={snapshot.distributions.mainPurposes}
                color="#0091b5"
                height={270}
                orientation="vertical"
              />
            </ChartCard>

            <ChartCard
              kicker="Breakdown"
              title="Most-used app category"
              summary="App categories make the usage profile easier to scan quickly."
              formula="count = responses in each app category"
            >
              <DistributionChart
                data={snapshot.distributions.favoriteApps}
                color="#fb7f8c"
                height={270}
                orientation="vertical"
              />
            </ChartCard>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        id="scores"
        kicker="Score analytics"
        title="Distribution of the addiction score"
        summary="The score section focuses on center, spread, and band split."
      >
        <div className="mini-metric-grid">
          <MiniMetric label="Mean" value={decimalFormatter.format(snapshot.descriptiveStats.mean)} />
          <MiniMetric
            label="Median"
            value={decimalFormatter.format(snapshot.descriptiveStats.median)}
          />
          <MiniMetric label="Mode" value={decimalFormatter.format(snapshot.descriptiveStats.mode)} />
          <MiniMetric
            label="Std. dev."
            value={decimalFormatter.format(snapshot.descriptiveStats.standardDeviation)}
          />
        </div>

        <div className="dashboard-grid">
          <ChartCard
            kicker="Main chart"
            title="Addiction score histogram"
            summary="The histogram shows where students cluster and how wide the score spread is."
            formula="x̄ = Σx / n"
            hero
          >
            <DistributionChart
              data={snapshot.distributions.scoreHistogram}
              color="#01418d"
              height={320}
              orientation="vertical"
            />
          </ChartCard>

          <ChartCard
            kicker="Grouped view"
            title="Students by score band"
            summary="Bands compress the score into steady use, elevated use, and high-use risk."
            formula="band = grouped addiction score"
          >
            <DistributionChart
              data={snapshot.distributions.addictionBands}
              color="#5821b5"
              height={320}
            />
          </ChartCard>
        </div>
      </DashboardSection>

      <DashboardSection
        id="probability"
        kicker="Probability"
        title="Empirical event rates from the class data"
        summary="The rate cards and comparison chart are the full probability story."
      >
        <div className="probability-card-grid">
          {probabilityCards.map((card) => (
            <article className="stat-card" key={card.label}>
              <span className="card-kicker">{card.label}</span>
              <strong>{percentFormatter.format(card.value)}</strong>
              <p>{card.note}</p>
            </article>
          ))}
        </div>

        <div className="dashboard-grid dashboard-grid-single">
          <ChartCard
            kicker="Comparison"
            title="Probability comparison"
            summary="The conditional bar shows how the rate changes inside the heavy-use subgroup."
            formula="P(A) = n(A) / n(S),  P(A | B) = n(A ∩ B) / n(B)"
            hero
          >
            <DistributionChart
              data={probabilityChartData}
              color="#5821b5"
              dataKey="percentage"
              height={320}
              valueFormatter={(value) => `${value}%`}
              orientation="vertical"
            />
          </ChartCard>
        </div>
      </DashboardSection>
    </main>
  );
}

function CltPage({
  snapshot,
  sampleSize,
  setSampleSize,
  simulationCount,
  setSimulationCount,
  simulationHistogram,
}: {
  snapshot: SurveySnapshot;
  sampleSize: number;
  setSampleSize: (value: number) => void;
  simulationCount: number;
  setSimulationCount: (value: number) => void;
  simulationHistogram: HistogramDatum[];
}) {
  return (
    <main className="dashboard-page">
      <DashboardSection
        id="clt"
        kicker="Interactive CLT"
        title="Repeated samples smooth the mean"
        summary="Change the sample size and redraw count, then watch the mean distribution react."
        className="dashboard-section-featured"
      >
        <div className="dashboard-grid dashboard-grid-clt">
          <ChartCard
            kicker="Simulation"
            title="Sample-mean histogram"
            summary="Larger samples usually create a tighter distribution of sample means."
            formula="x̄ = Σx / n, repeated across many samples"
            hero
          >
            <AreaHistogramChart data={simulationHistogram} />
          </ChartCard>

          <article className="card control-card card-featured">
            <div className="card-head">
              <span className="card-kicker">Controls</span>
              <h3>Sampling setup</h3>
            </div>

            <SliderField
              label="Sample size"
              value={sampleSize}
              min={3}
              max={24}
              onChange={setSampleSize}
            />
            <SliderField
              label="Simulations"
              value={simulationCount}
              min={60}
              max={400}
              step={20}
              onChange={setSimulationCount}
            />

            <div className="formula-strip">
              <span>Population mean</span>
              <strong>{decimalFormatter.format(snapshot.descriptiveStats.mean)}</strong>
            </div>
            <div className="formula-strip">
              <span>Current rule</span>
              <strong>Higher n = tighter means</strong>
            </div>
            <div className="formula-strip">
              <span>Current draw count</span>
              <strong>{simulationCount}</strong>
            </div>
          </article>
        </div>
      </DashboardSection>
    </main>
  );
}

function ModelsPage({
  snapshot,
  strongestLinear,
  strongestLogistic,
}: {
  snapshot: SurveySnapshot;
  strongestLinear: Array<{ label: string; value: number }>;
  strongestLogistic: Array<{ label: string; value: number }>;
}) {
  return (
    <main className="dashboard-page">
      <DashboardSection
        id="models"
        kicker="Model view"
        title="Which features drive the models most"
        summary="The machine-learning section now stands on its own page."
        className="dashboard-section-advanced dashboard-section-models"
      >
        <div className="dashboard-grid dashboard-grid-models">
          <ModelCard
            kicker="Linear regression"
            title="Continuous score model"
            summary="Longer bars mean a stronger effect on the predicted score."
            formula="ŷ = β0 + Σβixi"
            metrics={[
              { label: "Rows", value: numberFormatter.format(snapshot.regression.linear.sampleSize) },
              { label: "R²", value: snapshot.regression.linear.r2.toFixed(3) },
            ]}
            coefficients={strongestLinear}
          />

          <ModelCard
            kicker="Logistic regression"
            title="Risk probability model"
            summary="These weights show which behaviours shift the probability of high-use risk."
            formula="p = 1 / (1 + e^-z)"
            metrics={[
              {
                label: "Rows",
                value: numberFormatter.format(snapshot.regression.logistic.sampleSize),
              },
              {
                label: "Accuracy",
                value: percentFormatter.format(snapshot.regression.logistic.accuracy),
              },
            ]}
            coefficients={strongestLogistic}
            dark
            featured
          />
        </div>
      </DashboardSection>
    </main>
  );
}

function SandboxPage({
  predictionInput,
  setPredictionField,
  predictedScore,
  predictedProbability,
  predictedBand,
  probabilityThreshold,
  setRiskThreshold,
  thresholdDecision,
  thresholdGap,
  scoreDelta,
  sandboxPresets,
  applyPredictionInput,
  applyRandomProfile,
}: {
  predictionInput: PredictionInput;
  setPredictionField: (field: keyof PredictionInput, value: number) => void;
  predictedScore: number;
  predictedProbability: number;
  predictedBand: string;
  probabilityThreshold: number;
  setRiskThreshold: (value: number) => void;
  thresholdDecision: string;
  thresholdGap: number;
  scoreDelta: number;
  sandboxPresets: Array<{ label: string; input: PredictionInput }>;
  applyPredictionInput: (nextInput: PredictionInput) => void;
  applyRandomProfile: () => void;
}) {
  return (
    <main className="dashboard-page">
      <DashboardSection
        id="sandbox"
        kicker="Sandbox"
        title="Test, compare, and stress the model"
        summary="Presets, manual inputs, threshold testing, and random profiles all live here."
        className="dashboard-section-advanced dashboard-section-sandbox"
      >
        <div className="dashboard-grid dashboard-grid-sandbox">
          <article className="card sandbox-result-card card-dark card-featured">
            <div className="card-head">
              <span className="card-kicker">Output</span>
              <h3>Prediction result</h3>
            </div>

            <div className="result-grid">
              <ResultTile
                label="Predicted score"
                value={decimalFormatter.format(predictedScore)}
                helper="Linear output"
              />
              <ResultTile
                label="Probability"
                value={percentFormatter.format(predictedProbability)}
                helper="Logistic output"
              />
              <ResultTile label="Band" value={predictedBand} helper="Class label" />
            </div>

            <div className="metric-line-grid top-gap-tight">
              <div className="formula-strip">
                <span>Threshold view</span>
                <strong>{thresholdDecision}</strong>
              </div>
              <div className="formula-strip">
                <span>Vs class mean</span>
                <strong>
                  {scoreDelta >= 0 ? "+" : ""}
                  {decimalFormatter.format(scoreDelta)}
                </strong>
              </div>
            </div>

            <p className="card-summary">
              Change presets, move the threshold, or edit each feature manually to see the result
              shift live.
            </p>
            <div className="card-formula">ŷ = β0 + Σβixi,  p = 1 / (1 + e^-z)</div>
          </article>

          <div className="dashboard-stack">
            <article className="card">
              <div className="card-head">
                <span className="card-kicker">Inputs</span>
                <h3>Behaviour controls</h3>
              </div>

              <div className="field-grid">
                {predictionFields.map((field) => (
                  <PredictionField
                    field={field}
                    key={field.key}
                    value={predictionInput[field.key]}
                    onChange={(value) => setPredictionField(field.key, value)}
                  />
                ))}
              </div>
            </article>

            <article className="card">
              <div className="card-head">
                <span className="card-kicker">Extra sandboxes</span>
                <h3>Presets and threshold tester</h3>
              </div>

              <div className="preset-row">
                {sandboxPresets.map((preset) => (
                  <button
                    className="preset-button"
                    key={preset.label}
                    type="button"
                    onClick={() => applyPredictionInput(preset.input)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  className="preset-button preset-button-ghost"
                  type="button"
                  onClick={applyRandomProfile}
                >
                  Random row
                </button>
              </div>

              <SliderField
                label="Risk threshold"
                value={Number(probabilityThreshold.toFixed(2))}
                min={0.2}
                max={0.8}
                step={0.02}
                onChange={setRiskThreshold}
              />

              <div className="mini-metric-grid mini-metric-grid-compact">
                <MiniMetric label="Threshold" value={probabilityThreshold.toFixed(2)} />
                <MiniMetric
                  label="Gap"
                  value={`${thresholdGap >= 0 ? "+" : ""}${thresholdGap.toFixed(2)}`}
                />
                <MiniMetric
                  label="Score delta"
                  value={`${scoreDelta >= 0 ? "+" : ""}${decimalFormatter.format(scoreDelta)}`}
                />
                <MiniMetric label="Decision" value={thresholdDecision} />
              </div>
            </article>
          </div>
        </div>
      </DashboardSection>
    </main>
  );
}

function AppChrome({
  snapshot,
  children,
}: {
  snapshot: SurveySnapshot;
  children: ReactNode;
}) {
  const location = useLocation();
  const pageLabel =
    location.pathname === "/clt"
      ? "Interactive CLT"
      : location.pathname === "/models"
        ? "Model view"
        : location.pathname === "/sandbox"
          ? "Sandbox"
          : "Live phone usage dashboard";

  return (
    <>
      <header className="dashboard-topbar">
        <div className="topbar-main">
          <Link className="brand-lockup" to="/">
            <span className="brand-badge">SO</span>
            <div>
              <strong>Soch Analytics</strong>
              <small>{pageLabel}</small>
            </div>
          </Link>

          <div className="topbar-metrics">
            <MetricPill label="Responses" value={numberFormatter.format(snapshot.meta.totalResponses)} />
            <MetricPill label="Clean rows" value={numberFormatter.format(snapshot.meta.cleanResponses)} />
            <MetricPill label="Updated" value={snapshot.meta.lastUpdatedLabel} />
          </div>
        </div>

        <nav className="section-rail" aria-label="Dashboard sections">
          {sectionLinks.map((section) => (
            <Link
              className={
                isSectionLinkActive(location.pathname, location.hash, section)
                  ? "section-pill section-pill-active"
                  : "section-pill"
              }
              key={`${section.path}-${section.hash}`}
              to={`${section.path}${section.hash}`}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </>
  );
}

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0 });
      return;
    }

    const id = location.hash.slice(1);
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return null;
}

function isSectionLinkActive(
  pathname: string,
  hash: string,
  section: (typeof sectionLinks)[number],
) {
  if (pathname !== section.path) {
    return false;
  }

  if (hash === section.hash) {
    return true;
  }

  if (!hash && pathname === "/" && section.hash === "#sample") {
    return true;
  }

  if (!hash && pathname === "/clt" && section.hash === "#clt") {
    return true;
  }

  if (!hash && pathname === "/models" && section.hash === "#models") {
    return true;
  }

  if (!hash && pathname === "/sandbox" && section.hash === "#sandbox") {
    return true;
  }

  return false;
}

function StatusScreen({
  title,
  detail,
  error,
}: {
  title: string;
  detail: string;
  error?: boolean;
}) {
  return (
    <div className="status-screen">
      <div className={`status-card ${error ? "status-card-error" : ""}`.trim()}>
        <span className="card-kicker">{error ? "Error" : "Loading"}</span>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function DashboardSection({
  id,
  kicker,
  title,
  summary,
  children,
  className = "",
}: {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section className={`dashboard-section ${className}`.trim()} id={id} {...sectionMotion}>
      <div className="section-head">
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
      {children}
    </motion.section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ChartCard({
  kicker,
  title,
  summary,
  formula,
  children,
  hero,
}: {
  kicker: string;
  title: string;
  summary: string;
  formula: string;
  children: ReactNode;
  hero?: boolean;
}) {
  return (
    <article className={`card chart-card ${hero ? "chart-card-hero" : ""}`.trim()}>
      <div className="card-head">
        <span className="card-kicker">{kicker}</span>
        <h3>{title}</h3>
      </div>
      <div className="chart-frame">{children}</div>
      <p className="card-summary">{summary}</p>
      <div className="card-formula">{formula}</div>
    </article>
  );
}

function ModelCard({
  kicker,
  title,
  summary,
  formula,
  metrics,
  coefficients,
  dark,
  featured,
}: {
  kicker: string;
  title: string;
  summary: string;
  formula: string;
  metrics: Array<{ label: string; value: string }>;
  coefficients: Array<{ label: string; value: number }>;
  dark?: boolean;
  featured?: boolean;
}) {
  return (
    <article
      className={`card model-card ${dark ? "card-dark" : ""} ${featured ? "card-featured" : ""}`.trim()}
    >
      <div className="card-head">
        <span className="card-kicker">{kicker}</span>
        <h3>{title}</h3>
      </div>

      <div className="metric-line-grid">
        {metrics.map((metric) => (
          <div className="formula-strip" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <CoefficientList coefficients={coefficients} dark={dark} />
      <p className="card-summary">{summary}</p>
      <div className="card-formula">{formula}</div>
    </article>
  );
}

function DistributionChart({
  data,
  color,
  height = 300,
  dataKey = "count",
  valueFormatter = (value: number | string) => `${value}`,
  orientation = "auto",
}: {
  data: ChartDatum[];
  color: string;
  height?: number;
  dataKey?: string;
  valueFormatter?: (value: number | string) => string;
  orientation?: "auto" | "vertical" | "horizontal";
}) {
  const hasLongLabels = data.some(
    (datum) => String(datum.label).length > 12 || String(datum.label).includes(" "),
  );
  const useHorizontal =
    orientation === "horizontal" || (orientation === "auto" && hasLongLabels);
  const resolvedHeight = useHorizontal ? Math.max(height, data.length * 54 + 40) : height;
  const useSlantedVerticalTicks = !useHorizontal && orientation === "vertical" && hasLongLabels;
  const axisWidth = Math.min(
    160,
    Math.max(
      88,
      data.reduce(
        (max, datum) => Math.max(max, shortenLabel(String(datum.label), 18).length),
        0,
      ) * 7,
    ),
  );

  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <BarChart
        data={data}
        layout={useHorizontal ? "vertical" : "horizontal"}
        margin={
          useHorizontal
            ? { top: 4, right: 8, bottom: 4, left: 8 }
            : { top: 4, right: 8, bottom: 4, left: 0 }
        }
      >
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.08)" />
        {useHorizontal ? (
          <>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5c5953", fontSize: 11 }}
              tickFormatter={valueFormatter}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickFormatter={(value) => shortenLabel(String(value), 18)}
              tickLine={false}
              axisLine={false}
              width={axisWidth}
              tick={{ fill: "#5c5953", fontSize: 11 }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tickFormatter={(value) =>
                shortenLabel(String(value), useSlantedVerticalTicks ? 15 : 12)
              }
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={useSlantedVerticalTicks ? -18 : 0}
              textAnchor={useSlantedVerticalTicks ? "end" : "middle"}
              height={useSlantedVerticalTicks ? 74 : 56}
              tickMargin={10}
              tick={{ fill: "#5c5953", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={42}
              tick={{ fill: "#5c5953", fontSize: 11 }}
            />
          </>
        )}
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={useHorizontal ? [0, 14, 14, 0] : [14, 14, 4, 4]}
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AreaHistogramChart({ data }: { data: HistogramDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="cltDashGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5821b5" stopOpacity={0.96} />
            <stop offset="95%" stopColor="#5821b5" stopOpacity={0.14} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#5821b5"
          strokeWidth={3}
          fill="url(#cltDashGradient)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CoefficientList({
  coefficients,
  dark,
}: {
  coefficients: Array<{ label: string; value: number }>;
  dark?: boolean;
}) {
  const colors = ["#0d8d5b", "#0091b5", "#5821b5", "#f4b640", "#fb7f8c"];

  return (
    <div className="coefficient-list">
      {coefficients.map((coefficient, index) => (
        <div className="coefficient-row" key={`${coefficient.label}-${coefficient.value}`}>
          <div className="coefficient-copy">
            <span>{coefficient.label}</span>
            <strong>{coefficient.value.toFixed(3)}</strong>
          </div>
          <div className={`coefficient-track ${dark ? "coefficient-track-dark" : ""}`.trim()}>
            <span
              style={{
                background: colors[index % colors.length],
                width: `${Math.max(12, Math.min(100, Math.abs(coefficient.value) * 28))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictionField({
  field,
  value,
  onChange,
}: {
  field: PredictionFieldDefinition;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="prediction-field">
      <span>{field.label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {field.options.map((option) => (
          <option key={`${field.key}-${option.code}`} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-field">
      <span className="slider-head">
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function ResultTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="result-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (value: number | string) => `${value}`,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string }>;
  label?: string;
  valueFormatter?: (value: number | string) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <span key={`${entry.name}-${entry.value}`}>
          {entry.name}: {valueFormatter(entry.value)}
        </span>
      ))}
    </div>
  );
}
