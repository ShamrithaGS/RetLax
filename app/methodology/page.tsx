'use client';

export default function MethodologyPage() {
  return (
    <main className="hb-page-content" style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <h1>Methodology & Assumptions</h1>
      <p>This page explains the core formulas, risk assumptions and limitations used by RetLax.</p>

      <section style={{ marginTop: 32 }}>
        <h2>1. Expense inflation</h2>
        <p>RetLax inflates each expense bucket separately over the pre-retirement horizon:</p>
        <ul>
          <li><strong>Basic expenses</strong>: <code>B_ret = B_now × (1 + i_g)^t</code></li>
          <li><strong>Medical expenses</strong>: <code>M_ret = M_now × (1 + i_m)^t</code></li>
          <li><strong>Lifestyle expenses</strong>: <code>L_ret = L_now × (1 + i_l)^t</code></li>
        </ul>
        <p>Each rate is set by the user and the model uses a simple compounding approach.</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>2. Retirement corpus</h2>
        <p>The required corpus is the present value of a growing annuity that funds annual retirement withdrawals.</p>
        <p>If post-retirement return <code>r</code> equals blended inflation <code>g</code>:</p>
        <p><code>C = W × t_r / (1 + r)</code></p>
        <p>Otherwise:</p>
        <p><code>C = W × [1 - ((1 + g) / (1 + r))^t_r] / (r - g)</code></p>
        <p><strong>W</strong> is annual retirement expense, <strong>t<sub>r</sub></strong> is years in retirement.</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>3. Existing savings</h2>
        <p>Existing savings are compounded to retirement using the pre-retirement return assumption and then deducted from the corpus requirement.</p>
        <p>The model optionally applies a linear glide path to annual returns when enabled, shifting expected returns from pre-retirement to post-retirement levels.</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>4. SIP calculation</h2>
        <p>Required monthly SIP is found with a binary search that solves for the monthly payment whose future value at retirement matches the target corpus.</p>
        <p>With top-up enabled, the model steps up each year by the chosen top-up rate and finds the starting SIP that reaches the same corpus.</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>5. Monte Carlo assumptions</h2>
        <p>Monte Carlo uses 500 simulated annual return paths drawn from a log-normal distribution.</p>
        <ul>
          <li>Returns are assumed independent and identically distributed (i.i.d.).</li>
          <li>The model does not capture multi-year correlation, economic cycles, or mean reversion.</li>
          <li>Volatility is set based on the selected post-retirement return and is illustrative only.</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>6. Known limitations</h2>
        <ul>
          <li>The withdrawal tax toggle is a simplified flat-rate adjustment and does not represent full Indian tax slab rules.</li>
          <li>Currency formatting is India-focused and not internationalised.</li>
          <li>Sequence-of-returns risk is shown in Monte Carlo, but the tool does not model detailed historical correlation.</li>
          <li>The tool is illustrative only and is not financial advice.</li>
        </ul>
      </section>
    </main>
  );
}
