# DESIGN.md — WorldForge AI / UniDream

> Dark financial-AI command center.  
> A research-grade, B2B AI startup website for a Transformer World Model + reinforcement learning product.  
> The design must feel precise, credible, investor-ready, and technically serious — not generic “AI magic”.

---

## 1. Design North Star

Build the site like a **market intelligence cockpit**, not a decorative AI landing page.

The visual language should combine:

- **Dark command-center depth**: serious, layered, data-rich surfaces.
- **Research-lab restraint**: typography and spacing carry the authority; avoid noisy decoration.
- **Fintech trust**: clear numbers, structured dashboards, explicit risk/proof sections.
- **Product-first storytelling**: show the model pipeline, scorecards, dashboards, and backtest evidence early.

The site should make visitors understand this within 5 seconds:

> “UniDream learns hidden market structure with world models, then turns that learned state into validated trading decisions.”

---

## 2. Personality

Use these adjectives as design constraints:

- Precise
- High-trust
- Technical
- Focused
- Calm
- Premium
- Data-native
- Research-backed
- Slightly cinematic
- Not hype-driven

Avoid:

- Toy-like AI visuals
- Random glowing brains
- Matrix code rain
- Robot illustrations
- Overused blue-purple blobs with no structure
- Generic stock photos
- Floating objects that do not explain the product
- Overly dense hero text
- Uncontrolled gradients
- Over-animated sections

---

## 3. Theme

Default theme: **dark**

The site may contain occasional light/off-white surfaces only for reports, papers, or documentation previews, but the main marketing surface should remain dark.

Recommended visual metaphor:

> “A financial research cockpit at night, lit by a few precise instrument lights.”

---

## 4. Color Tokens

Use CSS variables. Keep accent usage extremely disciplined.

```css
:root {
  /* Base */
  --color-bg: #08090a;
  --color-bg-deep: #050608;
  --color-bg-soft: #0f1117;

  /* Surfaces */
  --color-surface: #12151d;
  --color-surface-raised: #171b25;
  --color-surface-glass: rgba(18, 21, 29, 0.72);
  --color-surface-panel: #1d2330;

  /* Borders */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.16);
  --color-border-blue: rgba(94, 106, 210, 0.36);

  /* Text */
  --color-text: #f4f7fb;
  --color-text-soft: #d0d6e0;
  --color-text-muted: #8a93a3;
  --color-text-faint: #626b7a;

  /* Brand accent */
  --color-primary: #5266eb;
  --color-primary-hover: #6f81ff;
  --color-primary-soft: rgba(82, 102, 235, 0.16);

  /* Data accents */
  --color-cyan: #02b8cc;
  --color-cyan-soft: rgba(2, 184, 204, 0.14);
  --color-lime: #e4f222;
  --color-lime-soft: rgba(228, 242, 34, 0.12);
  --color-violet: #8b5cf6;
  --color-violet-soft: rgba(139, 92, 246, 0.14);

  /* Semantic */
  --color-success: #4ade80;
  --color-warning: #facc15;
  --color-danger: #ff6467;

  /* Shadows / glow */
  --shadow-panel: 0 24px 80px rgba(0, 0, 0, 0.42);
  --shadow-glow-primary: 0 0 80px rgba(82, 102, 235, 0.22);
  --shadow-glow-cyan: 0 0 80px rgba(2, 184, 204, 0.16);
}
```

### Color Rules

Primary CTA uses `--color-primary`.  
Do not use cyan, lime, violet, red, yellow randomly. They are data/status accents only.

- Blue/violet: model intelligence, primary conversion, selected state
- Cyan: predictive state, data flow, information highlights
- Lime: accepted/validated result, active route, positive signal
- Red: drawdown, rejected selector, risk warning
- Yellow: uncertainty, guard, caution

Never use more than two accent colors in the same viewport unless it is a data visualization.

---

## 5. Typography

Use accessible, production-safe fonts.

```css
:root {
  --font-sans: "Inter", "Geist", "Noto Sans JP", system-ui, sans-serif;
  --font-display: "Inter", "Geist", "Noto Sans JP", system-ui, sans-serif;
  --font-mono: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
}
```

### Type Scale

```css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.75rem;
  --text-5xl: 4rem;
  --text-6xl: clamp(3.6rem, 7vw, 6.5rem);
}
```

### Typography Rules

- Hero headline: `clamp(3.6rem, 7vw, 6.5rem)`, line-height `0.95–1.05`, weight `560–680`.
- Section headings: `2.5rem–4rem`, line-height `1.0–1.1`.
- Body text: `1rem–1.125rem`, line-height `1.65`.
- Captions/labels: uppercase or small mono, letter spacing `0.08em`.
- Numbers and metrics: use mono or tabular numbers.
- Japanese copy must be short and sharp. Avoid long emotional sentences.

Good headline patterns:

- `市場の隠れた構造を、世界モデルで読む。`
- `From market history to imagined futures.`
- `Backtests are not enough. Learn the regime.`
- `Research-grade AI for adaptive market decisions.`

Bad headline patterns:

- `AIで未来を変える`
- `革新的な次世代金融AIプラットフォーム`
- `誰でも簡単に爆益`
- `世界初の完全自動トレード革命`

---

## 6. Layout System

Use a centered 12-column grid.

```css
:root {
  --container: 1200px;
  --container-wide: 1440px;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;
}
```

### Page Rhythm

- Navbar height: `72px`
- Hero min-height: `760px` on desktop
- Section vertical padding: `96px–140px`
- Dense dashboard sections: `72px–96px`
- Max text width: `680px`
- Max hero copy width: `760px`
- Main container width: `1200px`
- Wide product preview width: `1440px`

### Grid Rules

- Hero: left text + right/under product preview, or centered headline + massive dashboard frame.
- Product dashboard should be the visual hero, not an unrelated illustration.
- Use asymmetry sparingly: one large card + two smaller cards works better than a uniform grid everywhere.
- Every section needs one dominant focal point.

---

## 7. Background System

The background should be layered, not a raw image pasted behind content.

Use this recipe:

```css
.site-bg {
  background:
    radial-gradient(circle at 18% 8%, rgba(82, 102, 235, 0.22), transparent 34rem),
    radial-gradient(circle at 78% 18%, rgba(2, 184, 204, 0.12), transparent 30rem),
    linear-gradient(180deg, #08090a 0%, #0b0d12 45%, #08090a 100%);
  position: relative;
  overflow: hidden;
}

.site-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at 50% 20%, black, transparent 72%);
}

.site-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  background-image: url("/noise.png");
  mix-blend-mode: soft-light;
}
```

### Background Image Rules

If using `hero-bg.png`:

- Put it on a pseudo-element, not as a normal `<img>` object.
- Use `background-size: cover`.
- Add a dark overlay.
- Add a gradient mask so the image never “cuts off” visibly.
- Never allow a background image edge to appear mid-page.
- Never place text directly on high-contrast image details.

Example:

```css
.hero-visual-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(180deg, rgba(8,9,10,0.20), rgba(8,9,10,0.92)),
    url("/hero-bg.png");
  background-size: cover;
  background-position: center top;
  opacity: 0.72;
  mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
}
```

---

## 8. Component Style

### Navbar

- Transparent at top, blurred glass after scroll.
- Height: `72px`.
- Border-bottom: `1px solid rgba(255,255,255,0.08)` when sticky.
- Left: logo + wordmark.
- Center: Product / Research / Demo / Roadmap / Contact.
- Right: GitHub or Paper link + primary CTA.
- Keep nav labels short.

### Buttons

Primary:

```css
.btn-primary {
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-glow-primary);
  padding: 0.85rem 1.25rem;
  font-weight: 600;
}
```

Secondary:

```css
.btn-secondary {
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.85rem 1.25rem;
}
```

Rules:

- One primary CTA per section.
- Secondary CTA must be lower contrast.
- No rainbow button gradients.
- No oversized pill buttons with childish glow.

### Cards

```css
.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025));
  border: 1px solid var(--color-border);
  border-radius: 28px;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(18px);
}
```

Rules:

- Card radius: `20px–32px`.
- Inner panels: `14px–20px`.
- Use subtle borders instead of heavy shadows.
- Add depth through stacked surfaces, not random blur.

### Dashboard Frame

Use this for product preview / demo screen.

```css
.dashboard-frame {
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)),
    #0f1117;
  box-shadow:
    0 40px 120px rgba(0,0,0,0.55),
    0 0 120px rgba(82,102,235,0.18);
  overflow: hidden;
}
```

The dashboard preview must include real-looking elements:

- Equity curve
- B&H baseline
- AlphaEx / Sharpe / MaxDD deltas
- Fold selector
- Regime tag
- Selector accept/reject status
- Risk guard state
- Position/inventory state
- Model pipeline status

Do not show decorative fake charts with no labels.

### Metrics

Metric cards should feel like financial instrumentation.

Rules:

- Use mono for values.
- Include unit and baseline.
- Show direction clearly.
- Add small label explaining what changed.
- Avoid huge green/red numbers without context.

Example:

```txt
AlphaEx
+12.97 pt
vs B&H baseline / test aggregate
```

---

## 9. Section Structure

Recommended homepage order:

1. **Hero**
   - One sharp headline
   - One technical but readable subcopy
   - Primary CTA: `デモを見る` or `PoC相談`
   - Secondary CTA: `研究概要を読む`
   - Large dashboard/product preview

2. **Problem**
   - “Backtestだけでは市場状態の変化を拾いきれない”
   - Explain regime shift, overfitting, validation leakage, PBO risk.

3. **How It Works**
   - OHLCV / features
   - Walk-forward split
   - Hindsight Oracle teacher
   - Transformer World Model
   - Predictive state bundle
   - Behavior Cloning
   - Imagination Actor-Critic
   - Validation selector
   - Test scorecard / regime report

4. **Product Preview**
   - Dashboard cards and timeline
   - Make it look useful enough to sell.

5. **Evidence / Scorecard**
   - Fold-level metrics
   - B&H comparison
   - Sharpe / MaxDD / AlphaEx
   - PBO and regime breakdown
   - Be explicit about limitations.

6. **Use Cases**
   - Quant research
   - Strategy validation
   - Regime-aware signal generation
   - Risk-aware execution support

7. **Research / Technical Credibility**
   - World model
   - Model-based RL
   - Walk-forward validation
   - Offline evaluation
   - Safety guards

8. **CTA**
   - “共同検証・PoCの相談”
   - Keep serious. No hype.

---

## 10. Hero Rules

Hero should not try to explain everything.

Good hero structure:

```txt
[small label]
金融市場のための Transformer World Model

[headline]
市場の隠れた構造を、
世界モデルで読む。

[subcopy]
UniDreamはOHLCVと特徴量から市場状態を学習し、
想像ロールアウトと検証セレクタで、B&Hを超える意思決定を探索する研究開発プロダクトです。

[CTA]
デモを見る
研究概要を読む
```

Rules:

- Max 2 lines for headline on desktop.
- Subcopy max 2–3 lines.
- Avoid buzzword stack in hero.
- Put technical pipeline below, not in headline.
- Do not use “AIで未来を予測” style copy.

---

## 11. Flow Diagram Style

Use a horizontal, cinematic pipeline for desktop. Use stacked cards for mobile.

Each node:

- Small mono label
- Main title
- One-line explanation
- Status or artifact

Example nodes:

```txt
01 Data
OHLCV / Features
walk-forward ready

02 Teacher
Hindsight Oracle
signal_aim labels

03 World Model
Transformer WM
return / vol / drawdown state

04 Policy
BC + IAC
route + inventory recovery

05 Selector
Validation Gate
accept / reject / cooldown

06 Report
Test Scorecard
M2 / PBO / regime
```

Visual rules:

- Use thin connector lines.
- Use cyan/blue glow only on active connector.
- No giant arrows.
- No dense paragraphs inside nodes.

---

## 12. Data Visualization

Charts should be restrained and credible.

Rules:

- Dark chart background.
- Thin grid lines with `rgba(255,255,255,0.06)`.
- Label axes.
- B&H baseline must be visible.
- Avoid fake overfit-looking hockey-stick curves.
- Use annotations for regime changes.
- Use colors consistently:
  - Strategy: primary blue
  - B&H: muted gray
  - Risk/drawdown: red
  - Validation accepted: lime
  - Uncertainty: yellow

---

## 13. Motion

Motion should explain hierarchy, not decorate.

Allowed:

- Subtle fade/slide on section entry.
- Hover lift: `translateY(-2px)`.
- Dashboard glow follows selected state.
- Pipeline connector gently activates.
- Number count-up only for real metrics.

Avoid:

- Infinite spinning orbs
- Floating cubes
- Particle storms
- Excessive parallax
- Anything that reduces readability or performance

Timing:

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 160ms;
  --duration-base: 240ms;
  --duration-slow: 520ms;
}
```

---

## 14. Copywriting Rules

Tone:

- Confident
- Technical
- Measured
- Honest about validation
- No “guaranteed profit”
- No financial advice language

Use:

- `検証`
- `比較`
- `fold`
- `B&H baseline`
- `regime`
- `risk guard`
- `selector`
- `scorecard`
- `world model`
- `PoC`

Avoid:

- `爆益`
- `誰でも勝てる`
- `未来を完全予測`
- `革命`
- `魔法`
- `完全自動で安心`

Good copy examples:

```txt
Backtestの勝ち負けではなく、どの市場状態で効いたのかまで見る。
```

```txt
方策は直接本番投入せず、validation selectorでaccept / rejectを分ける。
```

```txt
B&Hに対する差分、MaxDD、PBO、regime別の崩れ方を同じ画面で確認する。
```

---

## 15. Trust & Evidence

The site must show credibility through specificity.

Include:

- Exact metric names
- Comparison target
- Evaluation period or fold when available
- Baseline definition
- Known limitations
- “研究開発中” positioning where appropriate
- GitHub / paper / demo links

Avoid:

- Anonymous testimonials if there are none
- Fake logos
- Fake compliance badges
- Fake “trusted by” rows
- Metrics without context

---

## 16. Responsive Rules

Mobile:

- Hero headline: `2.75rem–3.4rem`
- Section padding: `64px–88px`
- Cards become single column.
- Dashboard preview can scroll horizontally inside a frame.
- Navbar collapses to simple menu.
- CTA buttons stack vertically.

Tablet:

- Hero can remain centered.
- Dashboard frame should not exceed viewport width.
- Pipeline becomes 2-column or horizontal scroll.

Desktop:

- Use wide product preview.
- Keep text columns narrow.
- Use whitespace aggressively.

---

## 17. Accessibility

- Body contrast must pass WCAG AA.
- Do not rely on color alone for status.
- Add text labels to charts.
- Buttons need visible focus states.
- Respect `prefers-reduced-motion`.
- Images need meaningful alt text.
- Interactive dashboard cards need keyboard states.

Focus ring:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
```

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 18. Implementation Notes for Next.js / Tailwind

Preferred stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion only for subtle transitions
- shadcn/ui allowed, but restyle heavily
- Recharts / lightweight SVG for charts
- CSS variables for design tokens

Tailwind mapping suggestion:

```ts
colors: {
  bg: "var(--color-bg)",
  "bg-deep": "var(--color-bg-deep)",
  "bg-soft": "var(--color-bg-soft)",
  surface: "var(--color-surface)",
  "surface-raised": "var(--color-surface-raised)",
  border: "var(--color-border)",
  text: "var(--color-text)",
  "text-soft": "var(--color-text-soft)",
  "text-muted": "var(--color-text-muted)",
  primary: "var(--color-primary)",
  cyan: "var(--color-cyan)",
  lime: "var(--color-lime)",
  danger: "var(--color-danger)"
}
```

Component naming:

```txt
components/
  SiteHeader.tsx
  HeroSection.tsx
  ProductPreview.tsx
  MetricCard.tsx
  PipelineFlow.tsx
  EvidenceSection.tsx
  ResearchSection.tsx
  CTASection.tsx
  SiteFooter.tsx
```

---

## 19. QA Checklist

Before shipping, verify:

- The first viewport clearly says what UniDream does.
- The product/demo visual appears above the fold.
- There is one primary CTA.
- There are no generic AI clichés.
- The background does not visibly cut off.
- Each section has one focal point.
- Metrics include baseline/context.
- Cards, buttons, borders, and radii are consistent.
- Mobile is not an afterthought.
- The page still feels serious without any animation.
- The site looks like a credible AI/fintech startup, not a template.

---

## 20. Agent Instruction

When using this file with an AI coding agent:

```txt
Read DESIGN.md first and treat it as the source of truth for visual decisions.

Redesign the current landing page using these rules.
Do not preserve ugly layout decisions just because they already exist.
Do preserve product meaning, Japanese copy intent, existing routes, and working functionality.

Priority:
1. First viewport clarity
2. Product/dashboard credibility
3. Consistent tokens and spacing
4. Mobile responsiveness
5. Performance and accessibility

After editing, explain:
- Which files changed
- Which DESIGN.md rules were applied
- What visual problems were fixed
- Any remaining limitations
```
