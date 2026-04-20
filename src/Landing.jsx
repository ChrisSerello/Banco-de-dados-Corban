import { useState, useEffect } from "react";

// Global CSS (injected once)
const LANDING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;450;500;550;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #F6F4FB; --panel: #FDFCFE; --panel-alt: #F2EFF8;
    --ink: oklch(18% .015 280); --ink-70: oklch(35% .018 280);
    --ink-60: oklch(45% .018 280); --ink-50: oklch(55% .018 280);
    --ink-40: oklch(65% .015 280); --ink-30: oklch(75% .012 280);
    --ink-20: oklch(85% .008 280); --ink-15: oklch(88% .006 280);
    --ink-10: oklch(92% .004 280); --ink-08: oklch(94% .003 280);
    --ink-05: oklch(96% .002 280); --ink-04: oklch(96.5% .002 280);
    --violet-25: oklch(97.5% .015 282); --violet-50: oklch(96% .028 282);
    --violet-100: oklch(91% .05 282); --violet-200: oklch(85% .08 282);
    --violet-300: oklch(75% .12 282); --violet-400: oklch(65% .16 282);
    --violet-500: oklch(56% .2 282); --violet-600: oklch(48% .22 282);
    --violet-700: oklch(40% .2 282);
    --mint-600: oklch(62% .14 155); --mint-700: oklch(48% .14 155);
    --serif: "Instrument Serif", serif;
    --sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
    --mono: "JetBrains Mono", ui-monospace, monospace;
  }
  .landing * { box-sizing: border-box; }
  .landing { font-family: var(--sans); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .landing a { color: inherit; text-decoration: none; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes float { 0%,100%{transform:translateY(0) rotate(var(--r,0deg))} 50%{transform:translateY(-6px) rotate(var(--r,0deg))} }
  @keyframes landingFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  ::selection { background: var(--violet-500); color: white; }
  @media (max-width: 980px) {
    .landing-nav { padding: 20px 24px !important; flex-wrap: wrap; gap: 12px; }
    .landing-section { padding-left: 24px !important; padding-right: 24px !important; }
    .hero-grid { grid-template-columns: 1fr !important; }
    .hero-grid > :last-child { display: none; }
    .how-grid { grid-template-columns: 1fr !important; }
    .num-grid { grid-template-columns: repeat(2,1fr) !important; }
    .why-grid { grid-template-columns: repeat(2,1fr) !important; }
    .cta-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

function StarGlyph({ size = 14, color = "var(--ink)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M12 2L14.4 8.6L21.5 9.3L16.2 14L17.8 21L12 17.3L6.2 21L7.8 14L2.5 9.3L9.6 8.6Z"
        fill={color} stroke={color} strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}

function Nav({ onLogin, onRegister }) {
  return (
    <nav className="landing-nav" style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "28px 56px", position: "relative", zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.02em", color: "var(--ink)" }}>Starcard</span>
        <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 500, padding: "3px 7px", borderRadius: 4, background: "var(--violet-50)", color: "var(--violet-600)", letterSpacing: ".08em", textTransform: "uppercase" }}>Correspondente</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 36, fontSize: 14, color: "var(--ink-70)" }}>
        <a href="#como" style={{ fontWeight: 450 }}>Como funciona</a>
        <a href="#numeros" style={{ fontWeight: 450 }}>Números</a>
        <a href="#faq" style={{ fontWeight: 450 }}>Perguntas</a>
        <a href="#contato" style={{ fontWeight: 450 }}>Contato</a>
        <button onClick={onLogin} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, border: "1px solid var(--ink-15)", background: "var(--bg)", color: "var(--ink)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Acesso interno
        </button>
      </div>
    </nav>
  );
}

function GridLines() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--ink-04) 1px, transparent 1px), linear-gradient(90deg, var(--ink-04) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)" }} />
  );
}

function FloatCard({ children, style, delay = 0 }) {
  return (
    <div style={{ position: "absolute", background: "var(--panel)", borderRadius: 14, border: "1px solid var(--ink-08)", boxShadow: "0 20px 40px -20px rgba(14,11,26,.25), 0 4px 10px -4px rgba(14,11,26,.06)", animation: `float 6s ease-in-out ${delay}ms infinite`, zIndex: 3, ...style }}>
      {children}
    </div>
  );
}

function dot(c) { return { width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }; }

function PartnerRow({ i, name, city, meta, state }) {
  const badge = { ok: { bg: "color-mix(in oklab, var(--mint-600), white 85%)", fg: "var(--mint-700)", label: "Ativo" }, rev: { bg: "color-mix(in oklab, #F2B54B, white 82%)", fg: "#A36B0A", label: "Revisão" }, pend: { bg: "color-mix(in oklab, #E8A7C6, white 82%)", fg: "#A13E7A", label: "Pendente" } }[state];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--ink-05)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ink-05)", color: "var(--ink)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, letterSpacing: ".02em" }}>{i}</div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 550, color: "var(--ink)", letterSpacing: "-.005em" }}>{name} <span style={{ color: "var(--ink-40)", fontWeight: 400 }}>— {city}</span></div>
        <div style={{ fontSize: 10.5, color: "var(--ink-50)", fontFamily: "var(--mono)", marginTop: 2 }}>{meta}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 9px", borderRadius: 999, background: badge.bg, color: badge.fg, letterSpacing: ".02em" }}>{badge.label}</span>
    </div>
  );
}

function DashboardMock() {
  return (
    <div style={{ position: "relative", minHeight: 540 }}>
      <FloatCard style={{ top: 6, left: -30, padding: "14px 18px", transform: "rotate(-3deg)" }} delay={0}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-50)", fontFamily: "var(--mono)" }}>Volume mensal</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, letterSpacing: "-.02em", marginTop: 2, color: "var(--ink)" }}>R$ 4,2M</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--mint-700)", marginTop: 2, fontFamily: "var(--mono)" }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 2 L9 8 L1 8z" fill="var(--mint-600)"/></svg>
          +18% · este mês
        </div>
      </FloatCard>
      <div style={{ position: "relative", marginTop: 64, marginLeft: 40, background: "var(--panel)", borderRadius: 20, border: "1px solid var(--ink-08)", boxShadow: "0 40px 80px -30px rgba(14,11,26,.22), 0 8px 20px -10px rgba(14,11,26,.08)", padding: 22, transform: "rotate(1.2deg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 5 }}><span style={dot("#E8554E")}/><span style={dot("#F2B54B")}/><span style={dot("#4EC37A")}/></div>
            <span style={{ fontSize: 13, fontWeight: 550, color: "var(--ink)", marginLeft: 8, letterSpacing: "-.01em" }}>Painel Parceiros</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--mono)", color: "var(--mint-700)", background: "color-mix(in oklab, var(--mint-600), white 85%)", padding: "4px 10px", borderRadius: 999, border: "1px solid color-mix(in oklab, var(--mint-600), white 70%)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint-600)", boxShadow: "0 0 0 3px color-mix(in oklab, var(--mint-600), transparent 75%)" }}/>
            Ao vivo
          </div>
        </div>
        <div style={{ background: "linear-gradient(180deg, var(--violet-25) 0%, var(--violet-50) 100%)", borderRadius: 14, padding: "20px 20px 18px", border: "1px solid var(--violet-100)", textAlign: "center", marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 30%, rgba(120,90,240,.14), transparent 60%), radial-gradient(circle at 80% 80%, rgba(120,90,240,.1), transparent 55%)", pointerEvents: "none" }}/>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--violet-600)", fontFamily: "var(--mono)", fontWeight: 500 }}>Correspondentes ativos</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 64, lineHeight: 1, color: "var(--violet-700)", fontWeight: 400, letterSpacing: "-.035em", margin: "6px 0 4px", position: "relative" }}>324</div>
          <div style={{ fontSize: 11, color: "var(--violet-600)", fontFamily: "var(--mono)", letterSpacing: ".05em" }}>↑ 8 novos este mês</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { i: "LC", name: "Lucas Corbanetti", city: "São Paulo", meta: "Aprovado · 19/04", state: "ok" },
            { i: "MR", name: "Marcos Ribeiro", city: "Rio de Janeiro", meta: "Em análise · 18/04", state: "rev" },
            { i: "AP", name: "Ana Prado", city: "Belo Horizonte", meta: "Aguardando docs · 17/04", state: "pend" },
          ].map((p, idx) => <PartnerRow key={idx} {...p} />)}
        </div>
      </div>
      <FloatCard style={{ bottom: -12, right: -10, padding: "14px 18px", transform: "rotate(3deg)" }} delay={400}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-50)", fontFamily: "var(--mono)" }}>Tempo médio</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, letterSpacing: "-.02em", marginTop: 2, color: "var(--ink)" }}>38<span style={{ fontSize: 18, color: "var(--ink-50)" }}>h úteis</span></div>
        <div style={{ fontSize: 10, color: "var(--ink-50)", marginTop: 4, fontFamily: "var(--mono)" }}>SLA 48h · abaixo da meta</div>
      </FloatCard>
    </div>
  );
}

function Hero({ onRegister }) {
  return (
    <section className="landing-section" style={{ position: "relative", padding: "40px 56px 80px", overflow: "hidden" }}>
      <GridLines />
      
      <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: 72, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--violet-600)", fontFamily: "var(--mono)", fontWeight: 500, marginBottom: 32 }}>
            <span style={{ marginRight: 10 }}>※</span>Seja um parceiro Starcard
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(56px, 7vw, 104px)", lineHeight: 0.92, letterSpacing: "-.035em", color: "var(--ink)", margin: "0 0 28px", fontWeight: 400 }}>
            O novo jeito<br/>de ser um<br/>
            <span style={{ fontStyle: "italic", color: "var(--violet-600)", fontWeight: 400 }}>
              correspondente
              <svg viewBox="0 0 300 12" style={{ display: "block", width: "min(560px, 90%)", marginTop: -4 }}>
                <path d="M2 8 Q 80 2, 160 7 T 298 5" stroke="var(--violet-400)" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ color: "var(--ink)" }}> bancário.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-70)", maxWidth: 520, margin: "0 0 40px" }}>
            Cadastro guiado em minutos, análise feita por gente de verdade e aprovação em até 48 horas úteis. Opere com a infraestrutura que processa <b style={{ color: "var(--ink)", fontWeight: 550 }}>R$ 4,2M</b> por mês.
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 56, flexWrap: "wrap" }}>
            <button onClick={onRegister} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 26px", borderRadius: 999, background: "var(--ink)", color: "var(--bg)", border: "none", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 12px 28px -10px rgba(14,11,26,.5), inset 0 1px 0 rgba(255,255,255,.1)", transition: "transform .15s ease" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              Iniciar cadastro
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 22px", borderRadius: 999, background: "transparent", color: "var(--ink)", border: "1px solid var(--ink-15)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--violet-50)", display: "inline-grid", placeItems: "center" }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--violet-600)"><path d="M1 0 L7 4 L1 8z"/></svg>
              </span>
              Ver como funciona em 90s
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderTop: "1px solid var(--ink-10)" }}>
            {[
              { k: "847", l: "aprovações em 2025", accent: false },
              { k: "94%", l: "taxa de aprovação", accent: true },
              { k: "48h", l: "prazo médio de análise", accent: false },
            ].map((s, i) => (
              <div key={i} style={{ padding: "22px 0 0", position: "relative", borderLeft: i === 0 ? "none" : "1px solid var(--ink-10)", paddingLeft: i === 0 ? 0 : 24 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 44, lineHeight: 1, letterSpacing: "-.03em", fontWeight: 400, color: s.accent ? "var(--violet-600)" : "var(--ink)" }}>{s.k}</div>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-50)", marginTop: 8, fontFamily: "var(--mono)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <DashboardMock />
      </div>
    </section>
  );
}

function Ticker() {
  const items = ["Lucas C. · São Paulo · aprovado","Marina R. · Curitiba · 1ª operação","Ana P. · Belo Horizonte · análise","Rafael S. · Fortaleza · aprovado","Bruno K. · Porto Alegre · cadastro enviado","Clara M. · Recife · aprovado","Pedro A. · Salvador · análise","Juliana V. · Manaus · aprovado"];
  const all = [...items, ...items];
  return (
    <section style={{ borderTop: "1px solid var(--ink-10)", borderBottom: "1px solid var(--ink-10)", overflow: "hidden", background: "var(--bg)", padding: "22px 0", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 160, background: "linear-gradient(90deg, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }}/>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 160, background: "linear-gradient(-90deg, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }}/>
      <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", animation: "marquee 50s linear infinite", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-60)", letterSpacing: ".04em" }}>
        {all.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--violet-500)" }}/>
            {t}
            <span style={{ color: "var(--ink-20)", marginLeft: 20 }}>✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function IllForm() {
  return (
    <svg viewBox="0 0 200 120" style={{ width: "80%" }}>
      <rect x="20" y="14" width="160" height="12" rx="3" fill="white" stroke="var(--violet-200)"/>
      <rect x="22" y="18" width="60" height="4" rx="1" fill="var(--violet-400)"/>
      <rect x="20" y="34" width="160" height="22" rx="4" fill="white" stroke="var(--violet-200)"/>
      <rect x="22" y="39" width="40" height="3" rx="1" fill="var(--ink-20)"/>
      <rect x="22" y="46" width="90" height="6" rx="2" fill="var(--ink-10)"/>
      <rect x="20" y="64" width="160" height="22" rx="4" fill="white" stroke="var(--violet-400)" strokeWidth="1.5"/>
      <rect x="22" y="69" width="50" height="3" rx="1" fill="var(--violet-500)"/>
      <rect x="22" y="76" width="110" height="6" rx="2" fill="var(--violet-200)"/>
      <rect x="20" y="94" width="160" height="6" rx="3" fill="var(--violet-100)"/>
      <rect x="20" y="94" width="110" height="6" rx="3" fill="var(--violet-500)"/>
    </svg>
  );
}

function IllAnalysis() {
  return (
    <svg viewBox="0 0 200 120" style={{ width: "80%" }}>
      <circle cx="100" cy="60" r="36" fill="white" stroke="var(--violet-200)"/>
      <circle cx="100" cy="60" r="36" fill="none" stroke="var(--violet-500)" strokeWidth="2" strokeDasharray="170 80" strokeDashoffset="-40" strokeLinecap="round" transform="rotate(-90 100 60)"/>
      <text x="100" y="58" textAnchor="middle" fontFamily="var(--serif)" fontSize="22" fill="var(--violet-700)">94</text>
      <text x="100" y="74" textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="var(--ink-50)" letterSpacing=".1em">APROVAÇÃO</text>
      <circle cx="40" cy="30" r="5" fill="var(--violet-300)"/>
      <circle cx="170" cy="40" r="4" fill="var(--violet-200)"/>
      <circle cx="30" cy="90" r="4" fill="var(--violet-200)"/>
      <circle cx="172" cy="92" r="5" fill="var(--violet-300)"/>
    </svg>
  );
}

function IllOperate() {
  return (
    <svg viewBox="0 0 200 120" style={{ width: "80%" }}>
      <rect x="24" y="24" width="152" height="72" rx="6" fill="white" stroke="var(--violet-200)"/>
      <rect x="24" y="24" width="152" height="14" rx="6" fill="var(--violet-50)"/>
      <circle cx="32" cy="31" r="2" fill="var(--violet-400)"/>
      <circle cx="40" cy="31" r="2" fill="var(--violet-300)"/>
      <circle cx="48" cy="31" r="2" fill="var(--violet-200)"/>
      <rect x="34" y="48" width="60" height="34" rx="4" fill="var(--violet-100)"/>
      <rect x="38" y="54" width="24" height="3" rx="1" fill="var(--violet-500)"/>
      <text x="38" y="74" fontFamily="var(--serif)" fontSize="16" fill="var(--violet-700)">R$ 28k</text>
      <rect x="100" y="48" width="66" height="16" rx="3" fill="var(--ink-05)"/>
      <rect x="104" y="54" width="44" height="3" rx="1" fill="var(--ink-30)"/>
      <rect x="100" y="68" width="66" height="14" rx="3" fill="var(--ink-05)"/>
      <rect x="104" y="74" width="50" height="3" rx="1" fill="var(--ink-30)"/>
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Preencha o cadastro guiado", body: "Formulário dividido em blocos curtos com autopreenchimento por CNPJ. Salva sozinho — volte quando quiser.", detail: "≈ 5 min · 4 etapas", ill: <IllForm/> },
    { n: "02", title: "Análise humana, não robô", body: "Nosso time de compliance revisa cada cadastro. Se algo estiver fora, a gente te liga. Sem e-mails frios.", detail: "48h úteis · resposta garantida", ill: <IllAnalysis/> },
    { n: "03", title: "Comece a operar", body: "Aprovado, você recebe credenciais, acesso ao painel e uma pessoa de onboarding dedicada por 30 dias.", detail: "Suporte 1:1 · primeiros 30 dias", ill: <IllOperate/> },
  ];
  return (
    <section id="como" className="landing-section" style={{ padding: "120px 56px", position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--violet-600)", fontFamily: "var(--mono)", fontWeight: 500, marginBottom: 20 }}>※ Como funciona</div>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(40px,5vw,68px)", lineHeight: 1, letterSpacing: "-.03em", color: "var(--ink)", margin: "0 auto", maxWidth: 800 }}>
          Três passos. <span style={{ fontStyle: "italic", color: "var(--violet-600)" }}>Zero burocracia</span>
        </h2>
      </div>
      <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28, maxWidth: 1280, margin: "0 auto" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ background: "var(--panel)", borderRadius: 20, border: "1px solid var(--ink-08)", padding: 32, position: "relative", display: "flex", flexDirection: "column", gap: 18, minHeight: 420, boxShadow: "0 1px 0 rgba(14,11,26,.02)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 88, lineHeight: 1, color: "var(--violet-600)", fontWeight: 400, letterSpacing: "-.05em", fontStyle: "italic" }}>{s.n}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-50)", letterSpacing: ".08em", textTransform: "uppercase", textAlign: "right", maxWidth: 120 }}>{s.detail}</div>
            </div>
            <div style={{ height: 140, borderRadius: 12, overflow: "hidden", background: "var(--violet-25)", border: "1px solid var(--violet-100)", display: "grid", placeItems: "center" }}>{s.ill}</div>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, letterSpacing: "-.02em", color: "var(--ink)", margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-60)", margin: 0 }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NumbersBand() {
  const stats = [
    { k: "R$ 4,2M", l: "volume mensal processado" },
    { k: "847", l: "cadastros aprovados em 2025" },
    { k: "94%", l: "taxa de aprovação" },
    { k: "38h", l: "tempo médio de análise" },
  ];
  return (
    <section id="numeros" className="landing-section" style={{ background: "var(--ink)", color: "var(--bg)", padding: "100px 56px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 15% 30%, color-mix(in oklab, var(--violet-500), transparent 70%), transparent 50%), radial-gradient(circle at 85% 80%, color-mix(in oklab, var(--violet-600), transparent 75%), transparent 55%)", pointerEvents: "none" }}/>
      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "end", marginBottom: 72 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(44px,5vw,72px)", lineHeight: .95, letterSpacing: "-.03em", margin: 0 }}>
            Números que<br/><span style={{ fontStyle: "italic", color: "var(--violet-300)" }}>não mentem</span>.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.65)", maxWidth: 440, margin: 0 }}>
            Dados agregados do último trimestre, atualizados em tempo real no painel de cada parceiro. Auditado trimestralmente pela controladoria interna.
          </p>
        </div>
        <div className="num-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid rgba(255,255,255,.15)" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "32px 24px 0", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,.15)" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: "clamp(44px,5vw,72px)", lineHeight: 1, letterSpacing: "-.035em", fontWeight: 400 }}>{s.k}</div>
              <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginTop: 14, fontFamily: "var(--mono)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ kind }) {
  const p = { width: 36, height: 36, stroke: "var(--violet-600)", strokeWidth: 1.4, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "form":   return <svg viewBox="0 0 24 24" {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>;
    case "shield": return <svg viewBox="0 0 24 24" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>;
    case "clock":  return <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "panel":  return <svg viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14v3M12 12v5M16 9v8"/></svg>;
    default: return null;
  }
}

function WhyStarcard() {
  const features = [
    { k: "Formulário guiado", t: "Passo a passo com autopreenchimento por CNPJ. Ajuda contextual em cada campo. Sem jargão bancário.", icon: "form" },
    { k: "Segurança ponta a ponta", t: "Criptografia em trânsito e em repouso. Dados sob padrão LGPD + ISO 27001. Auditado trimestralmente.", icon: "shield" },
    { k: "Análise em 48h", t: "Time dedicado retorna em até 48h úteis após o envio completo. Retornamos por ligação, não e-mail.", icon: "clock" },
    { k: "Painel em tempo real", t: "Acompanhe operações, saques, repasses e comissões. Exportação em CSV e integração via API REST.", icon: "panel" },
  ];
  return (
    <section id="por-que" className="landing-section" style={{ padding: "120px 56px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 80, alignItems: "end", marginBottom: 64 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--violet-600)", fontFamily: "var(--mono)", fontWeight: 500, marginBottom: 20 }}>※ Por que a Starcard</div>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(36px,4vw,56px)", lineHeight: 1, letterSpacing: "-.03em", color: "var(--ink)", margin: 0 }}>
              Tudo que você precisa<br/>para <span style={{ fontStyle: "italic", color: "var(--violet-600)" }}>começar bem</span>.
            </h2>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-60)", margin: 0, maxWidth: 520, justifySelf: "end" }}>
            Construímos a infraestrutura que a gente gostaria de ter tido quando começamos. Cada decisão de produto passa por um correspondente ativo antes de virar feature.
          </p>
        </div>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, border: "1px solid var(--ink-10)", borderRadius: 20, overflow: "hidden", background: "var(--panel)" }}>
          {features.map((f, i) => (
            <div key={i} style={{ padding: 32, borderLeft: i === 0 ? "none" : "1px solid var(--ink-10)", display: "flex", flexDirection: "column", gap: 14, minHeight: 260 }}>
              <FeatureIcon kind={f.icon} />
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, letterSpacing: "-.02em", color: "var(--ink)", margin: "auto 0 4px" }}>{f.k}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-60)", margin: 0 }}>{f.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCTA({ onRegister }) {
  return (
    <section id="contato" className="landing-section" style={{ padding: "120px 56px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", background: "linear-gradient(135deg, var(--violet-50) 0%, var(--bg) 70%)", border: "1px solid var(--violet-100)", borderRadius: 28, padding: "64px 56px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center", position: "relative", overflow: "hidden" }} className="cta-grid">
        <div style={{ position: "absolute", right: -80, top: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklab, var(--violet-500), transparent 70%), transparent 70%)" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--violet-600)", fontFamily: "var(--mono)", fontWeight: 500, marginBottom: 18 }}>※ Pronto para começar?</div>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 52, lineHeight: .95, letterSpacing: "-.03em", color: "var(--ink)", margin: "0 0 20px" }}>
            Seu cadastro<br/><span style={{ fontStyle: "italic", color: "var(--violet-600)" }}>pode estar pronto</span><br/>até sexta-feira.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-60)", margin: "0 0 32px", maxWidth: 440 }}>
            Leva cerca de 12 minutos para preencher. Em até 48h úteis, a gente te liga com a resposta.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onRegister} style={{ padding: "16px 26px", borderRadius: 999, background: "var(--ink)", color: "var(--bg)", border: "none", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 12px 28px -10px rgba(14,11,26,.5)", display: "inline-flex", alignItems: "center", gap: 10 }}>
              Iniciar cadastro agora <span>→</span>
            </button>
            <button style={{ padding: "16px 22px", borderRadius: 999, background: "transparent", color: "var(--ink)", border: "1px solid var(--ink-15)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Falar com especialista
            </button>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <blockquote style={{ fontFamily: "var(--serif)", fontSize: 28, lineHeight: 1.2, letterSpacing: "-.01em", fontStyle: "italic", color: "var(--ink)", margin: 0, padding: "0 0 0 20px", borderLeft: "2px solid var(--violet-500)" }}>
            "Em 72 horas eu estava operando. O que eu achei que seria um mês virou uma tarde."
          </blockquote>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--violet-100)", color: "var(--violet-700)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 }}>RS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 550, color: "var(--ink)" }}>Rafael Souza</div>
              <div style={{ fontSize: 12, color: "var(--ink-50)", fontFamily: "var(--mono)" }}>Correspondente · Fortaleza · desde mar/2025</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-section" style={{ padding: "48px 56px 40px", background: "var(--panel-alt)", borderTop: "1px solid var(--ink-08)" }}>
      <div className="footer-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ink)", display: "grid", placeItems: "center" }}>
              <StarGlyph size={14} color="var(--violet-500)" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Starcard</span>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-60)", margin: 0, maxWidth: 280 }}>
            Correspondente bancário autorizado pelo Banco Central. Infraestrutura para operar com segurança desde 2021.
          </p>
        </div>
        {[
          { h: "Produto", l: ["Para parceiros", "Painel", "API", "Changelog"] },
          { h: "Empresa", l: ["Sobre", "Imprensa", "Carreiras", "Contato"] },
          { h: "Legal", l: ["Termos", "Privacidade", "Cookies", "LGPD"] },
        ].map((c, i) => (
          <div key={i}>
            <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-50)", fontFamily: "var(--mono)", marginBottom: 14 }}>{c.h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {c.l.map((x, j) => <li key={j}><a href="#" style={{ fontSize: 13, color: "var(--ink-70)" }}>{x}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: "48px auto 0", paddingTop: 24, borderTop: "1px solid var(--ink-08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--ink-50)", fontFamily: "var(--mono)", letterSpacing: ".04em", flexWrap: "wrap", gap: 12 }}>
        <div>contato@starcard.com.br · (11) 99197-3406</div>
        <div>© 2026 Starcard · Todos os direitos reservados</div>
      </div>
    </footer>
  );
}

export default function Landing({ onRegister, onLogin }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "landing-css";
    if (!document.getElementById("landing-css")) {
      style.textContent = LANDING_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById("landing-css");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="landing" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
      <Nav onLogin={onLogin} onRegister={onRegister} />
      <Hero onRegister={onRegister} />
      <Ticker />
      <HowItWorks />
      <NumbersBand />
      <WhyStarcard />
      <TestimonialCTA onRegister={onRegister} />
      <LandingFooter />
    </div>
  );
}