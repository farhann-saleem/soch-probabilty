# Soch — Technical PRD

## 1. Executive Summary

**Product Name:** Soch
**Product Type:** Live educational analytics platform
**Core Theme:** Probability & Statistics taught through real student survey data
**Primary Subject Domain:** Mobile phone usage and addiction analysis among students
**Frontend Stack:** React + TypeScript
**Design Direction:** Warm, playful, premium, tactile, high-clarity interface inspired by craft-first product design
**Data Source:** Google Form → Google Sheet → published CSV or read endpoint
**AI Role:** Embedded teaching and insight agent that runs automatically inside the product experience without repeated confirmation prompts for normal in-app explanation tasks

Soch is a high-end interactive teaching dashboard built for a Probability & Statistics semester project. It uses live student survey data to explain statistical concepts, visualize real analysis, simulate sampling behavior, and provide regression-based addiction prediction. The product must feel alive, premium, intuitive, and academically strong.

The UI/UX is not secondary. It is a core part of the product identity. The interface must communicate clarity, depth, playfulness, and confidence while preserving strong educational structure.

---

## 2. Product Vision

Build a live teaching platform that makes Probability & Statistics feel visual, interactive, and understandable.

The product should make a student feel that they are not just looking at charts, but entering a guided learning space where:

* the data is current,
* the visuals feel premium,
* the formulas are visible,
* the concepts are explained in plain English,
* the graphs react to the learner,
* the predictive models feel understandable instead of black-box,
* the AI assistant helps teach the material automatically.

Soch should feel like a modern academic experience, not a boring semester report turned into a website.

---

## 3. Product Positioning

Soch is **not** a commercial product and should not be framed like one.

It is:

* an educational analytics dashboard,
* a visual teaching website,
* a live statistics lab,
* a guided exploration tool,
* a polished semester-final system.

The project should be presented as:

**A live, interactive Probability & Statistics teaching platform that uses student survey data to explain descriptive statistics, probability, sampling, central limit theorem, and regression-based prediction.**

---

## 4. Product Goals

### Primary Goals

* Build a React-based live dashboard connected to current Google Form response data.
* Create a premium UI/UX experience that feels professional and memorable.
* Teach core Probability & Statistics concepts in simple English.
* Present live descriptive statistics and probability insights from real survey data.
* Visually simulate sampling and the central limit theorem.
* Add linear and logistic regression as advanced applied learning modules.
* Support interactive, lively graph-driven learning.
* Include a built-in AI teaching assistant that generates insights and explanations automatically.

### Secondary Goals

* Make the system easy to present in class.
* Make the system understandable for non-technical classmates.
* Make the design impressive enough that the dashboard itself becomes part of the project value.
* Build a modular foundation that can later be expanded into a more advanced analytics product.

---

## 5. Non-Goals

* Not a medical diagnosis tool.
* Not a social network or consumer app.
* Not a heavy enterprise admin product.
* Not a deep learning or LLM-first platform.
* Not a write-back tool that edits responses in the sheet.
* Not a generic BI dashboard with random charts and weak storytelling.

---

## 6. Problem Statement

Traditional Probability & Statistics class projects are usually static, low-energy, and visually weak. They often show formulas without intuition, charts without explanation, and results without interactivity.

Students memorize terms, but do not deeply understand what the methods are doing.

Soch solves this by building a live and guided educational experience where:

* survey responses flow into a live dataset,
* descriptive statistics update from current student data,
* probability concepts are shown using real events,
* CLT is demonstrated through simulation,
* regression is explained visually and interactively,
* AI-generated insights help the learner understand every section,
* the overall experience feels premium and coherent.

---

## 7. Core Product Principles

1. **Teach first, impress second.**
2. **Design is part of the learning system.**
3. **Real data makes concepts believable.**
4. **Formulas must stay visible.**
5. **Every graph must explain something.**
6. **Interactivity must feel alive, not decorative.**
7. **AI must guide, not distract.**
8. **The interface should feel warm and crafted, not corporate and cold.**

---

## 8. User Types

### Primary Users

* BSCS students studying Probability & Statistics
* the project team during demo/presentation
* instructors evaluating the project

### Secondary Users

* classmates exploring the data interactively
* viewers during viva or presentation
* anyone wanting to understand phone-usage behavior patterns in a structured way

---

## 9. Core Data Flow

### Live Data Pipeline

1. Student fills the Google Form.
2. Google Form stores the response in a linked Google Sheet.
3. Google Sheet is published as a readable CSV or exposed through a simple read layer.
4. Soch fetches current data from the sheet source.
5. The app cleans and maps the raw responses.
6. The analytics engine computes descriptive statistics, probability values, sampling outputs, and model features.
7. The UI renders live views, interactive graphs, and explanations.
8. The AI insight agent generates contextual interpretations based on the current data and current page.

### Product Rule

The raw response tab must be treated as read-only source data. All cleaning, coding, and analytics should be done in the application or a transform layer, never by manually editing incoming live rows.

---

## 10. Full Product Scope

### In Scope

* live data ingestion from Google Sheets
* multi-page React application
* teaching-oriented landing page
* response explorer
* descriptive statistics section
* probability section
* random variable / coded response section
* sampling and CLT simulation lab
* linear regression learning lab
* logistic regression learning lab
* addiction prediction form
* AI insight side panel and auto-summaries
* high-end craft-inspired UI system
* interactive and animated graph experiences
* 2D and 3D-supporting data visualizations
* responsive layout

### Out of Scope for v1

* authentication
* user-specific saved dashboards
* server-side collaboration features
* source data editing from inside the app
* notifications
* exports to LMS or grading systems
* deep personalization and account history
* long-running autonomous external agent actions

---

## 11. Information Architecture

### Main Navigation

1. Home
2. Survey Explorer
3. Statistics Lab
4. Probability Lab
5. Sampling & CLT Lab
6. Regression Lab
7. Prediction Studio
8. AI Insight Guide
9. Findings & Recommendations

### Navigation Intent

The site must feel like a guided learning environment. Pages should progress from understanding the topic, to exploring the data, to learning concepts, to running predictions.

---

## 12. Experience Architecture

Soch should deliver three simultaneous experiences:

### A. Learning Experience

Teaches statistical concepts in plain English.

### B. Analytical Experience

Uses real survey data to compute and show results.

### C. Exploratory Experience

Allows the user to interact with data, simulations, and predictive inputs.

The product should never feel like only one of these. The strongest experience comes from combining all three.

---

## 13. Detailed Page Requirements

## 13.1 Home / Landing Page

### Purpose

Introduce Soch as a live teaching platform and establish the visual tone immediately.

### Required Content

* project name and hero tagline
* short explanation of what Soch is
* topic introduction: mobile phone usage and addiction among students
* summary metrics:

  * total responses
  * clean responses
  * last updated timestamp
  * number of active modules
* CTA buttons:

  * Explore Data
  * Enter the Lab
  * Try Prediction

### UX Requirements

* strong visual first impression
* premium hero layout
* lively but readable motion
* hero charts or abstract data motion in the background
* section transitions should feel intentional and crafted

### Suggested Hero Tone

Warm cream background, bold display typography, strong card hierarchy, and one signature visual block that combines data, motion, and playfulness.

---

## 13.2 Survey Explorer

### Purpose

Show the real incoming data clearly before deeper statistical explanation.

### Required Features

* response count
* latest response timestamp
* data quality / invalid row indicator
* question-wise charts
* count / percentage toggle
* raw rows preview
* coded rows preview
* optional filters by demographic dimensions if present

### UX Requirements

* clear chart cards
* easy question switching
* strong labels and tooltips
* supportive explanations below each chart
* ability to move between question view and interpretation view

### Key User Outcome

The user should understand what students actually answered and where the dataset comes from.

---

## 13.3 Statistics Lab

### Purpose

Teach descriptive statistics directly on coded survey variables.

### Concepts Covered

* mean
* median
* mode
* variance
* standard deviation
* distribution shape overview

### Required Features

* variable selector
* formula cards beside each computed metric
* explanation panels in simple English
* histogram / bar distribution view
* comparison cards for multiple coded variables
* “What this means” text block per result

### UX Requirements

* educational layout, not BI-style clutter
* formulas should be visually highlighted but not intimidating
* results should animate into place in a calm way
* numeric values should feel clean and trustworthy

---

## 13.4 Probability Lab

### Purpose

Teach probability by using real events from the survey.

### Concepts Covered

* event definition
* empirical probability
* conditional probability
* joint relationship explanation

### Required Features

* event builder from survey conditions
* probability cards
* numerator / denominator explanation
* contingency / comparison view for related events
* support examples such as:

  * P(heavy use)
  * P(sleep affected)
  * P(distraction during study)
  * P(sleep affected | heavy use)

### UX Requirements

* interaction must feel simple and intuitive
* output should feel immediate
* formula should be shown beside result
* visual event chips should make the experience less abstract

---

## 13.5 Random Variable & Distribution View

### Purpose

Bridge survey responses with statistical modeling language.

### Required Features

* mapping from text labels to numeric codes
* variable explanation card
* PMF-style table or discrete distribution summary
* expected value and variance display
* explanation of why coding is necessary
* event highlighting for selected outcomes

### User Value

Helps students see that survey answers can become structured statistical variables.

---

## 13.6 Sampling & CLT Lab

### Purpose

Deliver the strongest teaching moment in the product.

### Required Features

* variable selector
* sample size slider
* number of simulations slider
* run simulation action
* animated histogram of sample means
* comparison for multiple sample sizes
* visual explanation of CLT
* optional overlay showing smoother bell-like shape at larger sample sizes
* text interpretation that updates as sample size changes

### UX Requirements

* must feel alive and interactive
* graph animation should be smooth and informative
* controls must be clear and satisfying to use
* the result should visibly change with sample size

### Educational Outcome

The user should understand that even if raw data is not perfectly normal, the sampling distribution of the mean becomes more normal as sample size grows.

---

## 13.7 Regression Lab

### Purpose

Teach predictive modeling as an applied extension of the statistical workflow.

### Structure

The page should be split into two guided modules.

### Module A — Linear Regression

**Goal:** Predict a continuous addiction score.

#### Required Features

* explanation of what linear regression is
* simplified regression equation
* selected input features and target definition
* coefficient display
* prediction surface or simplified graph view
* residual concept explanation
* interactive controls for seeing how values affect the output

### Module B — Logistic Regression

**Goal:** Predict addiction risk class.

#### Required Features

* explanation of what logistic regression is
* sigmoid curve visualization
* threshold explanation
* feature-to-probability interpretation
* probability output card
* class label output

### UX Requirements

* must feel educational, not black-box
* use visual explanation before showing final output
* show “how it works” sections next to the graphs
* keep the language accessible

---

## 13.8 Prediction Studio

### Purpose

Allow users to enter selected values and generate prediction outputs.

### Required Inputs

Only high-signal inputs should be included:

* daily phone usage duration
* checking frequency
* phone use before sleep
* distraction during study
* urge to check phone
* failed attempts to reduce use
* preference for phone over academic tasks

### Required Outputs

* predicted addiction score
* predicted addiction probability
* predicted class label
* interpretation summary
* caution note that this is educational prediction, not diagnosis

### UX Requirements

* the form must feel clean and premium
* inputs should be structured and easy to scan
* outputs should appear in a strong result card
* motion should guide attention to the result

---

## 13.9 AI Insight Guide

### Purpose

Embed an AI teaching assistant across the experience.

### Core Product Requirement

The AI insight layer should run automatically for normal explanation and insight tasks within the product. It should not repeatedly ask for permission to explain charts, summarize metrics, or describe model outputs during standard app usage.

### Agent Responsibilities

* summarize current dataset state
* explain charts in simple English
* explain formulas currently being viewed
* generate key insights after graphs render
* provide talking points for demo/presentation
* explain what prediction outputs mean
* warn against overclaiming results
* highlight important relationships in the data

### Trigger Points

* page load
* dataset refresh
* variable selection changes
* simulation results update
* prediction result generated
* user clicks “Explain this” on a chart or formula

### Output Modes

* insight card
* side panel explanation
* inline chart interpretation
* quick summary strip
* model limitation note

### Boundaries

* no external autonomous actions
* no edits to source data
* no messaging, emailing, or writing outside the app context
* no diagnostic claims

### UX Requirements

* calm, integrated panel
* not chatbot-heavy by default
* no intrusive popups
* should feel like an intelligent layer inside the dashboard

---

## 13.10 Findings & Recommendations

### Purpose

Close the learning journey with synthesized findings.

### Required Content

* top descriptive patterns
* key conditional probability insights
* CLT learning takeaway
* regression interpretation summary
* limitations of the data
* responsible recommendations for students
* future extension ideas

---

## 14. Design System Requirements

## 14.1 Overall Visual Direction

The interface must feel:

* warm,
* tactile,
* playful,
* premium,
* thoughtful,
* academically creative,
* highly polished.

It should avoid sterile enterprise styling. The visual identity should combine craft-like softness with technical clarity.

### Design Mood

* warm paper-like canvas
* playful but disciplined color usage
* rounded surfaces
* tactile shadows
* lively hover behavior
* generous spacing
* bold typography with personality
* strong contrast between calm structure and vivid accent sections

---

## 14.2 Color System

### Core Surfaces

* **Warm Cream:** `#faf9f7` — default page background
* **Pure White:** `#ffffff` — cards, elevated panels, contrast surfaces
* **Clay Black:** `#000000` — primary text and key headings

### Borders

* **Oat Border:** `#dad4c8` — primary border color
* **Oat Light:** `#eee9df` — lighter structural border
* **Cool Border:** `#e6e8ec` — controlled use in contrast sections
* **Dark Border:** `#525a69` — for dark colored blocks

### Swatch Palette

* **Matcha 300:** `#84e7a5`
* **Matcha 600:** `#078a52`
* **Matcha 800:** `#02492a`
* **Slushie 500:** `#3bd3fd`
* **Slushie 800:** `#0089ad`
* **Lemon 400:** `#f8cc65`
* **Lemon 500:** `#fbbd41`
* **Lemon 700:** `#d08a11`
* **Lemon 800:** `#9d6a09`
* **Ube 300:** `#c1b0ff`
* **Ube 800:** `#43089f`
* **Ube 900:** `#32037d`
* **Pomegranate 400:** `#fc7981`
* **Blueberry 800:** `#01418d`

### Neutral Text

* **Warm Silver:** `#9f9b93`
* **Warm Charcoal:** `#55534e`
* **Dark Charcoal:** `#333333`

### Utility Colors

* **Badge Blue Background:** `#f0f8ff`
* **Badge Blue Text:** `#3859f9`
* **Focus Ring:** `rgb(20, 110, 245)`

### Color Usage Rules

* warm cream is the non-negotiable canvas
* use bold swatch colors for full sections and large highlights
* do not use cold gray as the dominant tone
* do not mix too many swatch colors inside the same section
* keep each section chromatically intentional

---

## 14.3 Typography System

### Font Families

* **Primary:** Roobert (fallback Arial)
* **Monospace / Technical:** Space Mono

### OpenType Rules

Use stylistic sets on heading and interface text.

* heading / display: `ss01`, `ss03`, `ss10`, `ss11`, `ss12`
* body / interface: `ss03`, `ss10`, `ss11`, `ss12`

### Hierarchy

* Display Hero: 80px, weight 600, line-height 1.0, letter-spacing -3.2px
* Display Secondary: 60px, weight 600, line-height 1.0, letter-spacing -2.4px
* Section Heading: 44px, weight 600, line-height 1.1, tight tracking
* Card Heading: 32px, weight 600
* Feature Title: 20px, weight 600
* Body Large: 20px, weight 400
* Body: 18px, weight 400, line-height 1.6
* Body Standard: 16px, weight 400
* UI / Button: 16px, weight 500
* Nav Link: 15px, weight 500
* Caption: 14px, weight 400
* Uppercase Label: 12px, weight 600, uppercase, tracking 1.08px

### Typography Principles

* headings should feel compressed, bold, and energetic
* body should feel open and readable
* strict use of 600 for headings, 500 for interface text, 400 for body
* uppercase labels serve as wayfinding and section anchors

---

## 14.4 Layout Principles

### Spacing System

Base unit: 8px
Use a system including 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.

### Structural Rhythm

* wide breathing space between large sections
* denser content inside cards
* alternating white and colored section blocks
* full-width swatch sections act as visual chapter breaks

### Border Radius Scale

* 4px: compact inputs / minimal controls
* 8px: small elements
* 12px: standard cards / standard buttons
* 24px: feature cards / graph panels / hero visuals
* 40px: large sections / grouped containers
* pill: large CTA buttons

### Border Rules

Mix solid and dashed borders intentionally. Dashed borders are decorative and secondary; solid borders carry structure.

---

## 14.5 Shadow & Elevation System

### Level 0

No shadow — warm cream background.

### Level 1 — Clay Shadow

`rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset, rgba(0,0,0,0.05) 0px -0.5px 1px`

Use for:

* cards
* buttons
* panels
* floating explanatory components

### Level 2 — Hard Hover Shadow

`rgb(0,0,0) -7px 7px`

Use for:

* hover state on CTAs
* playful interactive controls
* selected action components

### Level 3 — Focus Ring

`rgb(20, 110, 245) solid 2px`

Use for accessible focus states.

---

## 14.6 Motion & Interaction Rules

### Signature Hover Style

Primary interactive elements should use a playful physical hover behavior:

* rotateZ(-8deg)
* upward translation
* contrasting background change
* hard offset shadow

### Motion Philosophy

Motion should feel tactile and confident, not soft and corporate.

### Motion Use Cases

* button hover
* chart reveal
* panel transitions
* metric count-up
* graph state switching
* simulation progress
* prediction result reveal

### Motion Rules

* avoid motion that confuses reading
* movement should support learning and focus
* use stronger motion for action controls, calmer motion for educational content

---

## 15. Visualization System

## 15.1 Chart Design Principles

Every chart must answer a question.

Charts are not decoration. Each graph must have:

* title
* context
* value labels where needed
* interpretation summary
* relationship to the current concept

### Standard Visualization Types

* bar charts for categorical counts and percentages
* pie / donut charts for simple composition views
* histograms for coded variable distributions
* probability cards and event chips
* line charts for simulation changes
* scatter plots for regression explanation
* heat / matrix-style tables for conditional relationships

---

## 15.2 3D & Lively Visualization Support

The product should support lively graph experiences and selected 3D visualizations where they improve understanding.

### Appropriate 3D Use Cases

* 3D surface or depth-enhanced view for regression intuition
* layered distribution visuals in CLT lab
* animated probability landscapes for educational effect
* interactive rotating data objects only when they make the concept clearer

### Constraints

* 3D must remain readable
* 3D cannot replace clarity
* 3D should be optional or section-specific
* 2D fallback must exist for all key educational content

### Technical Guidance

Support a graph architecture that can mix standard charting with richer rendering layers when needed.

Possible libraries or combinations:

* Recharts for standard charts
* custom SVG / Canvas for explanatory motion
* React Three Fiber for selective 3D graph or educational scenes
* Framer Motion for interface transitions and graph reveals

---

## 16. Component Requirements

## 16.1 Buttons

### Primary CTA

* white or transparent base depending on section
* strong hover animation
* rounded radius
* weight 500 text
* hard shadow on hover

### Secondary / Ghost

* transparent background
* visible border
* restrained default state
* vivid hover state

### Product Rule

Buttons should feel physical and memorable. Hover interaction is part of brand identity.

---

## 16.2 Cards

### Requirements

* white surface on cream background or inverted card on colored section
* oat-toned border
* clay shadow
* generous radius
* optional dashed border version for supporting panels

### Card Types

* metric card
* formula card
* chart card
* explanation card
* AI insight card
* simulation control card
* prediction result card

---

## 16.3 Navigation

### Requirements

* sticky top navigation
* warm cream background
* thin oat bottom border
* clean left-aligned brand
* right-aligned action area
* responsive collapse below tablet range

### Navigation Tone

Navigation should feel calm, premium, and lightweight.

---

## 16.4 Inputs & Forms

### Requirements

* simple borders
* clear focus ring
* small radius for precision inputs
* larger grouped surfaces around prediction forms
* readable labels and helper text

### Form Tone

Prediction inputs should feel calm and trustworthy, not clinical.

---

## 16.5 Labels & Badges

### Requirements

* uppercase labels with generous tracking
* small status badges for data state, live state, model state, and explanation tags
* consistent semantic meaning

---

## 17. Functional Requirements

### FR-1 Live Data Load

The app must load current survey data from the Google Sheets source.

### FR-2 Refresh Support

The app must support manual refresh and optionally scheduled refresh.

### FR-3 Data Cleaning

The app must identify malformed rows, blanks, and invalid values.

### FR-4 Coding Layer

The app must convert required response values into numeric encodings.

### FR-5 Metric Computation

The app must compute descriptive statistical metrics for coded variables.

### FR-6 Probability Computation

The app must compute empirical and conditional probabilities from current data.

### FR-7 Sampling Simulation

The app must simulate repeated sampling and display sample-mean distributions.

### FR-8 Regression Models

The app must run linear and logistic regression on selected features.

### FR-9 Prediction Inputs

The app must allow selected behavioral features to be entered manually.

### FR-10 Interpretation Layer

The app must show plain-English interpretation beside key results.

### FR-11 AI Auto-Insight

The AI insight layer must generate contextual explanations without repeated user confirmation for normal in-app use.

### FR-12 Responsive UI

The app must remain usable across desktop and tablet, with mobile-friendly simplified layouts.

### FR-13 3D Visualization Support

The app must support selective 3D or depth-rich visualization experiences where they improve learning outcomes.

### FR-14 Graceful Failure

The app must handle unavailable sheet data, malformed rows, or missing values without breaking the experience.

---

## 18. Non-Functional Requirements

### Performance

* charts should render quickly
* page transitions should feel smooth
* data load should not feel blocking
* simulation interactions should feel responsive

### Usability

* the system must be understandable by students with weak technical background
* explanations must be written in simple English
* learning flow must remain clear throughout the app

### Reliability

* invalid data rows must not crash analytics
* the app should show fallback states clearly

### Maintainability

* the app should be modular
* each major lab should have isolated components and computation helpers

### Accessibility

* strong contrast on key text
* keyboard focus states
* charts should include textual interpretation summaries

### Privacy

* the public data feed should avoid exposing unnecessary sensitive information
* only required survey fields should be consumed in the app

---

## 19. Technical Architecture

## 19.1 Frontend Stack

* React
* TypeScript
* Tailwind CSS for layout and theme tokens
* React Router for page structure
* Recharts for standard charts
* Framer Motion for motion system
* React Three Fiber for selected 3D graph scenes or visual education layers

## 19.2 Data Layer

* fetch current CSV or endpoint
* parse and normalize data
* build a local typed dataset model
* derive computed metrics through memoized selectors

## 19.3 Analytics Layer

* descriptive statistics module
* probability module
* event builder module
* coding / preprocessing module
* sampling and CLT simulation engine
* linear regression module
* logistic regression module
* insight generation layer

## 19.4 Suggested Folder Structure

* `src/app` or `src/pages`
* `src/components/ui`
* `src/components/charts`
* `src/components/forms`
* `src/components/insights`
* `src/features/data-explorer`
* `src/features/statistics-lab`
* `src/features/probability-lab`
* `src/features/clt-lab`
* `src/features/regression-lab`
* `src/features/prediction`
* `src/features/agent`
* `src/lib/data`
* `src/lib/stats`
* `src/lib/models`
* `src/lib/visualization`
* `src/lib/theme`
* `src/types`
* `src/constants`

---

## 20. Data Modeling Strategy

### Raw Input Types

* timestamp
* demographic fields if present
* daily phone-use duration
* checking frequency
* before-sleep phone usage
* study distraction responses
* urge / compulsion responses
* reduction-attempt responses
* open-ended comments

### Derived Fields

* normalized category labels
* coded ordinal variables
* addiction score
* addiction class label
* binary event flags
* regression feature matrix
* simulation-ready numeric arrays

### Target Definitions

#### Linear Regression Target

Continuous addiction score derived from selected coded responses.

#### Logistic Regression Target

Binary addiction-risk label derived from self-report or thresholded score.

---

## 21. Model Requirements

## 21.1 Linear Regression

### Purpose

Predict a continuous addiction-related score.

### Model Expectations

* interpretable coefficients
* visual mapping from input change to output change
* educational explanation of residual and fit quality

### UX Requirement

The model should be shown as a teaching concept, not only a prediction machine.

## 21.2 Logistic Regression

### Purpose

Predict addiction probability and class.

### Model Expectations

* probability output between 0 and 1
* visible sigmoid intuition
* visible threshold explanation
* clear class interpretation

### UX Requirement

The model should explain risk gently and responsibly.

---

## 22. AI Insight Agent Spec

### Core Role

The AI agent acts as a built-in learning and explanation layer.

### What It Should Do

* explain the active section automatically
* summarize what the data currently shows
* describe why a probability is high or low
* explain how CLT behavior changes with sample size
* interpret regression outputs
* generate presentation talking points
* keep tone simple, intelligent, and non-hyped

### What It Must Not Do

* perform external actions
* modify data sources
* generate misleading certainty
* diagnose addiction as a medical condition

### Product Requirement

The agent should feel naturally embedded in the product and should not interrupt normal flow with repeated permission prompts for chart explanation, concept teaching, or insight generation.

---

## 23. Responsive Behavior

### Desktop

* full multi-panel layout
* advanced chart and side insight layout
* richer motion and larger hero elements

### Tablet

* two-column grids where possible
* simplified sidebars
* reduced density in graph controls

### Mobile

* single column
* stacked cards
* lighter graphs where necessary
* maintain core readability and prediction usability

### Breakpoints

* mobile small: <479px
* mobile: 479–767px
* tablet: 768–991px
* desktop: 992px+

---

## 24. Risks & Mitigations

### Risk 1 — Overdesigned but unclear

**Mitigation:** keep every page centered on one educational goal.

### Risk 2 — Live data inconsistency

**Mitigation:** add cleaning rules, stale-data indicator, and refresh timestamp.

### Risk 3 — 3D becomes visual noise

**Mitigation:** use 3D only in conceptually helpful places and always provide 2D fallback.

### Risk 4 — AI becomes intrusive

**Mitigation:** use integrated insights, not constant modal interruptions.

### Risk 5 — Teachers think it is only a frontend showcase

**Mitigation:** keep formulas, methods, and interpretations visible at every stage.

---

## 25. MVP Definition

### MVP Must Have

* live sheet ingestion
* premium landing page
* survey explorer
* statistics lab
* probability lab
* CLT simulator
* regression lab
* prediction studio
* AI insight side panel
* coherent craft-inspired design system

### V1 Premium Enhancements

* selective 3D graph experiences
* animated learning transitions
* richer insight summaries
* comparison modes across variables
* demo mode for presentation storytelling

---

## 26. Milestones

### Milestone 1 — Foundation

* live data pipe confirmed
* typed dataset model defined
* design tokens defined

### Milestone 2 — UI System

* color system
* typography system
* cards, buttons, labels, navigation
* motion primitives

### Milestone 3 — Core Analytics Pages

* explorer
* statistics lab
* probability lab

### Milestone 4 — Simulation & Modeling

* CLT simulator
* linear regression
* logistic regression
* prediction studio

### Milestone 5 — Insight Layer & Polish

* AI auto-insight integration
* page-level explanations
* visual polish
* interaction tuning

### Milestone 6 — Demo Readiness

* stable dataset
* clean content
* presentation path tested
* talking points finalized

---

## 27. Acceptance Criteria

The product is ready when:

* live data from the sheet can be displayed reliably,
* the UI feels premium, warm, and coherent,
* the user can understand each section without confusion,
* formulas and interpretations accompany the analytics,
* CLT is visual and interactive,
* regression models are working and explained,
* the AI insight layer is useful and non-intrusive,
* the product can be demonstrated end-to-end as a serious educational platform.

---

## 28. Final Product Statement

**Soch** is a live React-based educational analytics platform for Probability & Statistics. It transforms current Google Form survey responses into a warm, premium, highly interactive teaching experience. The system combines descriptive statistics, probability, coded variable analysis, sampling and CLT simulation, regression-based prediction, lively charting, selective 3D visualization support, and an embedded AI teaching assistant. Its purpose is to make real data, mathematical ideas, and predictive thinking understandable through design, interaction, and guided explanation.
