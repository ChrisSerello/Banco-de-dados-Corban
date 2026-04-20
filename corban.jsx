import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Download, Trash2, Edit2, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronLeft, Upload, User, CreditCard, FileText,
  LogOut, X, Phone, Mail, MapPin, Check, Loader2, Building2,
  Hash, AlertCircle, Shield, RefreshCw, Plus, Eye, EyeOff,
  Sparkles, Building, Star, Filter, ChevronDown, Printer,
  MoreVertical, ArrowLeft, Users, TrendingUp, BadgeCheck
} from "lucide-react";

const SB_URL = "https://ptxieyftrwjdkbebblwj.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eGlleWZ0cndqZGtiZWJibHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzAwMjQsImV4cCI6MjA5MDEwNjAyNH0.KlzSQrDe55mk7YozDkRQgl5dtyi8YmTku70tvXKTKW8";

let sb = null;
async function getSB() {
  if (!sb) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    sb = createClient(SB_URL, SB_KEY);
  }
  return sb;
}

const PALETTE = {
  brand: "#6D28D9",
  brandLight: "#EDE9FE",
  brandDark: "#4C1D95",
  sidebar: "#1E1B4B",
  sidebarAccent: "#312E81",
  bg: "#F5F3FF",
  white: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  pending: "#D97706",
  pendingBg: "#FEF3C7",
  approved: "#059669",
  approvedBg: "#D1FAE5",
  rejected: "#DC2626",
  rejectedBg: "#FEE2E2",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  :root { --brand: ${PALETTE.brand}; --brand-light: ${PALETTE.brandLight}; --sidebar: ${PALETTE.sidebar}; }
  input, select, textarea { width: 100%; padding: 10px 14px; border: 1px solid ${PALETTE.border}; border-radius: 8px; font-size: 14px; font-family: inherit; background: #fff; color: ${PALETTE.textPrimary}; outline: none; transition: border-color .15s; }
  input:focus, select:focus, textarea:focus { border-color: ${PALETTE.brand}; box-shadow: 0 0 0 3px ${PALETTE.brandLight}; }
  button { cursor: pointer; font-family: inherit; transition: all .15s; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
  @media print { .no-print { display: none !important; } .print-area { display: block !important; } }
  .fade-in { animation: fadeIn .3s ease; } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
  .pulse { animation: pulse 2s infinite; } @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.5 } }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function formatCPF(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}
function formatCEP(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

async function lookupCNPJ(cnpj) {
  const clean = cnpj.replace(/\D/g, "");
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
  if (!r.ok) throw new Error("CNPJ não encontrado");
  return r.json();
}

async function parseDocumentWithClaude(base64, mimeType) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: `Analise este documento de identidade brasileiro (RG, CNH ou CPF) e extraia os dados. Retorne SOMENTE um JSON válido, sem markdown, sem explicações:\n{"nome":"","cpf":"","rg":"","rg_uf":"","data_nascimento":"","nome_mae":"","naturalidade":"","naturalidade_uf":"","sexo":""}` }
        ]
      }]
    })
  });
  const data = await r.json();
  const txt = data.content?.[0]?.text || "{}";
  try { return JSON.parse(txt.replace(/```json|```/g, "").trim()); }
  catch { return {}; }
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

function Spinner({ size = 20, color = PALETTE.brand }) {
  return <Loader2 size={size} color={color} className="spin" />;
}

function StatusBadge({ status }) {
  const map = {
    pendente:  { label: "Pendente",  bg: PALETTE.pendingBg,  color: PALETTE.pending,  Icon: Clock },
    aprovado:  { label: "Aprovado",  bg: PALETTE.approvedBg, color: PALETTE.approved,  Icon: CheckCircle },
    reprovado: { label: "Reprovado", bg: PALETTE.rejectedBg, color: PALETTE.rejected,  Icon: XCircle },
  };
  const { label, bg, color, Icon } = map[status] || map.pendente;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 600 }}>
      <Icon size={12} /> {label}
    </span>
  );
}

function BtnPrimary({ onClick, children, loading, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      background: loading || disabled ? "#9CA3AF" : PALETTE.brand,
      color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px",
      fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, ...style
    }}>
      {loading ? <Spinner size={16} color="#fff" /> : null}
      {children}
    </button>
  );
}

function BtnSecondary({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: PALETTE.brand, border: `1.5px solid ${PALETTE.brand}`,
      borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14,
      display: "flex", alignItems: "center", gap: 8, ...style
    }}>
      {children}
    </button>
  );
}

function Field({ label, value, icon: Icon, half }) {
  if (!value) return null;
  return (
    <div style={{ gridColumn: half ? "span 1" : "span 2", marginBottom: 2 }}>
      <p style={{ fontSize: 11, color: PALETTE.textSecondary, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 7, background: PALETTE.bg, borderRadius: 8, padding: "9px 12px" }}>
        {Icon && <Icon size={14} color={PALETTE.brand} />}
        <p style={{ fontSize: 14, color: PALETTE.textPrimary, fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, placeholder, type = "text", mask, required }) {
  const handleChange = (e) => {
    let v = e.target.value;
    if (mask === "cnpj") v = formatCNPJ(v);
    if (mask === "cpf") v = formatCPF(v);
    if (mask === "phone") v = formatPhone(v);
    if (mask === "cep") v = formatCEP(v);
    onChange(name, v);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: PALETTE.textPrimary }}>
        {label} {required && <span style={{ color: PALETTE.rejected }}>*</span>}
      </label>
      <input type={type} value={value || ""} onChange={handleChange} placeholder={placeholder} />
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({ onRegister, onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${PALETTE.sidebar} 0%, #312E81 50%, #4C1D95 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }} className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, background: PALETTE.brand, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={26} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Starcard</span>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5 }}>
          Portal do<br />
          <span style={{ color: "#C4B5FD" }}>Correspondente</span>
        </h1>
        <p style={{ fontSize: 16, color: "#A5B4FC", marginBottom: 48, lineHeight: 1.6 }}>
          Faça seu cadastro como correspondente bancário Starcard de forma rápida e intuitiva.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          <BtnPrimary onClick={onRegister} style={{ width: 300, justifyContent: "center", fontSize: 16, padding: "15px 28px", borderRadius: 14, background: "#7C3AED" }}>
            <Plus size={18} /> Quero ser Correspondente
          </BtnPrimary>
          <button onClick={onLogin} style={{ background: "rgba(255,255,255,.1)", color: "#E0E7FF", border: "1px solid rgba(255,255,255,.2)", borderRadius: 14, padding: "12px 28px", fontWeight: 600, fontSize: 14, width: 300 }}>
            Acesso Interno — Gestão
          </button>
        </div>
        <p style={{ marginTop: 48, fontSize: 12, color: "#7C83D4" }}>
          Sujeito à análise e aprovação • corban@starbank.tec.br
        </p>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ supabase, onBack }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !pass) return setError("Preencha e-mail e senha.");
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (e) setError("Credenciais inválidas. Verifique e tente novamente.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 20px 60px rgba(109,40,217,.12)" }} className="fade-in">
        <button onClick={onBack} style={{ background: "none", border: "none", color: PALETTE.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, background: PALETTE.brand, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: PALETTE.textPrimary }}>Acesso Restrito</p>
            <p style={{ fontSize: 12, color: PALETTE.textSecondary }}>Gestão Starcard</p>
          </div>
        </div>
        {error && <div style={{ background: PALETTE.rejectedBg, color: PALETTE.rejected, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}><AlertCircle size={15} />{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e => e.key === "Enter" && login()} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ paddingRight: 42 }} onKeyDown={e => e.key === "Enter" && login()} />
              <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: PALETTE.textSecondary }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <BtnPrimary onClick={login} loading={loading} style={{ marginTop: 8, justifyContent: "center" }}>
            Entrar no Painel
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

// ─── Register Wizard ──────────────────────────────────────────────────────────

const INITIAL_FORM = {
  pj_cnpj: "", pj_razao_social: "", pj_nome_fantasia: "", pj_endereco: "", pj_uf: "", pj_cep: "", pj_regime: "MEI",
  pf_nome: "", pf_cpf: "", pf_rg: "", pf_rg_uf: "", pf_nascimento: "", pf_mae: "", pf_naturalidade: "", pf_naturalidade_uf: "", pf_sexo: "FEMININO",
  pf_nacionalidade: "brasileira", pf_endereco: "", pf_cep: "", pf_complemento: "", pf_cidade: "", pf_uf: "", pf_estado_civil: "CASADO",
  pf_email: "", pf_telefone: "",
  banco_nome: "", banco_agencia: "", banco_conta: "", banco_digito: "", banco_pix: "",
};

function RegisterWizard({ supabase, onDone, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [docs, setDocs] = useState({});
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [docMsg, setDocMsg] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCNPJ = async () => {
    setCnpjLoading(true); setCnpjError("");
    try {
      const data = await lookupCNPJ(form.pj_cnpj);
      setForm(f => ({
        ...f,
        pj_razao_social: data.razao_social || "",
        pj_nome_fantasia: data.nome_fantasia || "",
        pj_endereco: `${data.logradouro || ""}, ${data.numero || ""}`.trim().replace(/,$/, ""),
        pj_uf: data.uf || "",
        pj_cep: data.cep?.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") || "",
        pj_regime: data.porte === "MEI" ? "MEI" : f.pj_regime,
      }));
      setStep(2);
    } catch { setCnpjError("CNPJ não encontrado. Verifique e tente novamente."); }
    setCnpjLoading(false);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocLoading(true); setDocMsg("Analisando documento com IA...");
    try {
      const base64 = await fileToBase64(file);
      const extracted = await parseDocumentWithClaude(base64, file.type);
      setForm(f => ({
        ...f,
        pf_nome: extracted.nome || f.pf_nome,
        pf_cpf: extracted.cpf ? formatCPF(extracted.cpf) : f.pf_cpf,
        pf_rg: extracted.rg || f.pf_rg,
        pf_rg_uf: extracted.rg_uf || f.pf_rg_uf,
        pf_nascimento: extracted.data_nascimento || f.pf_nascimento,
        pf_mae: extracted.nome_mae || f.pf_mae,
        pf_naturalidade: extracted.naturalidade || f.pf_naturalidade,
        pf_naturalidade_uf: extracted.naturalidade_uf || f.pf_naturalidade_uf,
        pf_sexo: extracted.sexo || f.pf_sexo,
      }));
      setDocs(d => ({ ...d, rg_cnh: file }));
      setDocMsg("✓ Dados extraídos com sucesso! Revise abaixo.");
    } catch { setDocMsg("Não foi possível extrair automaticamente. Preencha manualmente."); }
    setDocLoading(false);
  };

  const handleOtherDoc = (tipo, file) => {
    if (file) setDocs(d => ({ ...d, [tipo]: file }));
  };

  const submit = async () => {
    setSubmitLoading(true);
    try {
      const client = supabase || await getSB();
      const { data: corban, error } = await client.from("corbans").insert([{
        pf_nome: form.pf_nome, pf_nascimento: form.pf_nascimento || null, pf_sexo: form.pf_sexo,
        pf_rg: form.pf_rg, pf_rg_uf: form.pf_rg_uf, pf_cpf: form.pf_cpf.replace(/\D/g, ""),
        pf_mae: form.pf_mae, pf_nacionalidade: form.pf_nacionalidade, pf_naturalidade: form.pf_naturalidade,
        pf_naturalidade_uf: form.pf_naturalidade_uf, pf_endereco: form.pf_endereco, pf_cep: form.pf_cep.replace(/\D/g, ""),
        pf_complemento: form.pf_complemento, pf_cidade: form.pf_cidade, pf_uf: form.pf_uf,
        pf_estado_civil: form.pf_estado_civil, pf_email: form.pf_email, pf_telefone: form.pf_telefone.replace(/\D/g, ""),
        pj_razao_social: form.pj_razao_social, pj_nome_fantasia: form.pj_nome_fantasia,
        pj_cnpj: form.pj_cnpj.replace(/\D/g, ""), pj_endereco: form.pj_endereco,
        pj_uf: form.pj_uf, pj_cep: form.pj_cep.replace(/\D/g, ""), pj_regime: form.pj_regime,
        banco_nome: form.banco_nome, banco_agencia: form.banco_agencia, banco_conta: form.banco_conta,
        banco_digito: form.banco_digito, banco_pix: form.banco_pix,
        status: "pendente",
      }]).select().single();
      if (error) throw error;
      // Upload documents
      for (const [tipo, file] of Object.entries(docs)) {
        if (!file) continue;
        const path = `${corban.id}/${tipo}_${Date.now()}.${file.name.split(".").pop()}`;
        await client.storage.from("corban-documentos").upload(path, file);
        await client.from("corban_documentos").insert([{ corban_id: corban.id, tipo, nome_arquivo: file.name, storage_path: path, tamanho_bytes: file.size, mime_type: file.type }]);
      }
      onDone();
    } catch (e) {
      alert("Erro ao enviar cadastro: " + e.message);
    }
    setSubmitLoading(false);
  };

  const STEPS = ["CNPJ", "Documento", "Outros Docs", "Dados Bancários", "Revisão"];

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${PALETTE.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: PALETTE.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: PALETTE.textPrimary }}>Cadastro de Correspondente</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Star size={18} color={PALETTE.brand} fill={PALETTE.brand} />
          <span style={{ fontSize: 14, fontWeight: 700, color: PALETTE.brand }}>Starcard</span>
        </div>
      </div>
      {/* Step indicator */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${PALETTE.border}`, padding: "16px 24px", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, maxWidth: 640, margin: "0 auto" }}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? PALETTE.brand : active ? PALETTE.brand : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s" }}>
                    {done ? <Check size={14} color="#fff" /> : <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#fff" : PALETTE.textSecondary }}>{n}</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? PALETTE.brand : done ? PALETTE.brand : PALETTE.textSecondary, whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ height: 2, flex: 2, background: done ? PALETTE.brand : "#E5E7EB", marginBottom: 16, transition: "all .3s" }} />}
              </div>
            );
          })}
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ width: "100%", maxWidth: 580, background: "#fff", borderRadius: 20, padding: 36, boxShadow: "0 8px 32px rgba(109,40,217,.08)" }} className="fade-in">
          {step === 1 && <StepCNPJ form={form} set={set} loading={cnpjLoading} error={cnpjError} onNext={handleCNPJ} />}
          {step === 2 && <StepDocument form={form} set={set} loading={docLoading} msg={docMsg} onUpload={handleDocUpload} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepOtherDocs docs={docs} onDoc={handleOtherDoc} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepBankData form={form} set={set} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <StepReview form={form} docs={docs} loading={submitLoading} onSubmit={submit} onBack={() => setStep(4)} />}
        </div>
      </div>
    </div>
  );
}

function StepCNPJ({ form, set, loading, error, onNext }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color={PALETTE.brand} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.textPrimary }}>Dados da Empresa</h2>
        </div>
        <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Digite o CNPJ e preencheremos os dados automaticamente.</p>
      </div>
      <FormField label="CNPJ" name="pj_cnpj" value={form.pj_cnpj} onChange={set} placeholder="00.000.000/0000-00" mask="cnpj" required />
      {error && <div style={{ color: PALETTE.rejected, fontSize: 13, display: "flex", alignItems: "center", gap: 7, background: PALETTE.rejectedBg, padding: "10px 14px", borderRadius: 10 }}><AlertCircle size={15} />{error}</div>}
      {form.pj_razao_social && (
        <div style={{ background: PALETTE.approvedBg, borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.approved, marginBottom: 6 }}>✓ Empresa encontrada</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: PALETTE.textPrimary }}>{form.pj_razao_social}</p>
          {form.pj_nome_fantasia && <p style={{ fontSize: 13, color: PALETTE.textSecondary }}>{form.pj_nome_fantasia}</p>}
          <p style={{ fontSize: 13, color: PALETTE.textSecondary, marginTop: 4 }}>{form.pj_endereco} — {form.pj_uf}</p>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="CEP" name="pj_cep" value={form.pj_cep} onChange={set} placeholder="00000-000" mask="cep" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Regime Tributário</label>
          <select value={form.pj_regime} onChange={e => set("pj_regime", e.target.value)}>
            <option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>
          </select>
        </div>
      </div>
      <BtnPrimary onClick={onNext} loading={loading} style={{ alignSelf: "flex-end" }}>
        {loading ? "Consultando..." : "Consultar CNPJ"} <ChevronRight size={16} />
      </BtnPrimary>
    </div>
  );
}

function StepDocument({ form, set, loading, msg, onUpload, onNext, onBack }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color={PALETTE.brand} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.textPrimary }}>Documento de Identidade</h2>
        </div>
        <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Envie uma foto do RG ou CNH. A IA extrai os dados automaticamente.</p>
      </div>
      <div onClick={() => ref.current.click()} style={{ border: `2px dashed ${PALETTE.brand}`, borderRadius: 14, padding: 32, textAlign: "center", cursor: "pointer", background: PALETTE.brandLight, transition: "all .2s" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Spinner size={32} />
            <p style={{ color: PALETTE.brand, fontWeight: 600, fontSize: 14 }}>Analisando com IA...</p>
          </div>
        ) : (
          <>
            <Upload size={32} color={PALETTE.brand} style={{ marginBottom: 10 }} />
            <p style={{ fontWeight: 600, color: PALETTE.brand, fontSize: 15 }}>Clique para enviar RG ou CNH</p>
            <p style={{ fontSize: 12, color: PALETTE.textSecondary, marginTop: 4 }}>JPG, PNG ou PDF • máx. 10MB</p>
          </>
        )}
        <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onUpload} />
      </div>
      {msg && <p style={{ fontSize: 13, color: msg.startsWith("✓") ? PALETTE.approved : PALETTE.textSecondary, fontWeight: 600 }}>{msg}</p>}
      {/* Manual fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}><FormField label="Nome Completo" name="pf_nome" value={form.pf_nome} onChange={set} placeholder="Nome completo" required /></div>
        <FormField label="CPF" name="pf_cpf" value={form.pf_cpf} onChange={set} placeholder="000.000.000-00" mask="cpf" required />
        <FormField label="RG" name="pf_rg" value={form.pf_rg} onChange={set} placeholder="00.000.000-0" />
        <FormField label="Data de Nascimento" name="pf_nascimento" value={form.pf_nascimento} onChange={set} type="date" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Sexo</label>
          <select value={form.pf_sexo} onChange={e => set("pf_sexo", e.target.value)}>
            <option>FEMININO</option><option>MASCULINO</option>
          </select>
        </div>
        <FormField label="Nome da Mãe" name="pf_mae" value={form.pf_mae} onChange={set} placeholder="Nome da mãe" />
        <FormField label="Naturalidade" name="pf_naturalidade" value={form.pf_naturalidade} onChange={set} placeholder="Cidade de nascimento" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <BtnSecondary onClick={onBack}><ChevronLeft size={16} /> Voltar</BtnSecondary>
        <BtnPrimary onClick={onNext} disabled={!form.pf_nome || !form.pf_cpf}>Próximo <ChevronRight size={16} /></BtnPrimary>
      </div>
    </div>
  );
}

const DOC_TYPES = [
  { key: "comprovante_endereco", label: "Comprovante de Endereço", required: true },
  { key: "cartao_cnpj", label: "Cartão CNPJ", required: true },
  { key: "cert_mei_contrato", label: "Certificado MEI / Contrato Social", required: true },
  { key: "comp_end_estabelecimento", label: "Comprovante de Endereço do Estabelecimento", required: true },
  { key: "domicilio_bancario", label: "Domicílio Bancário", required: true },
  { key: "logo", label: "Logo em PNG (opcional)", required: false },
  { key: "certificado", label: "Certificado FEBRABAN / ANEPS (opcional)", required: false },
];

function StepOtherDocs({ docs, onDoc, onNext, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} color={PALETTE.brand} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.textPrimary }}>Documentos</h2>
        </div>
        <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Envie os documentos obrigatórios. Arraste ou clique para selecionar.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DOC_TYPES.map(({ key, label, required }) => {
          const file = docs[key];
          return (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `1.5px solid ${file ? PALETTE.brand : PALETTE.border}`, borderRadius: 12, cursor: "pointer", background: file ? PALETTE.brandLight : "#fff", transition: "all .15s" }}>
              <input type="file" style={{ display: "none" }} accept="image/*,.pdf" onChange={e => onDoc(key, e.target.files?.[0])} />
              <div style={{ width: 36, height: 36, background: file ? PALETTE.brand : "#F3F4F6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {file ? <Check size={18} color="#fff" /> : <Upload size={18} color={PALETTE.textSecondary} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: PALETTE.textPrimary }}>{label} {required && <span style={{ color: PALETTE.rejected }}>*</span>}</p>
                {file && <p style={{ fontSize: 11, color: PALETTE.brand, marginTop: 2 }}>{file.name}</p>}
              </div>
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <BtnSecondary onClick={onBack}><ChevronLeft size={16} /> Voltar</BtnSecondary>
        <BtnPrimary onClick={onNext}>Próximo <ChevronRight size={16} /></BtnPrimary>
      </div>
    </div>
  );
}

function StepBankData({ form, set, onNext, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={18} color={PALETTE.brand} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.textPrimary }}>Dados Bancários & Contato</h2>
        </div>
        <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Últimas informações necessárias para o cadastro.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}><FormField label="Nome do Banco" name="banco_nome" value={form.banco_nome} onChange={set} placeholder="Ex: Itaú, Bradesco, Nubank..." required /></div>
        <FormField label="Agência" name="banco_agencia" value={form.banco_agencia} onChange={set} placeholder="0000" />
        <FormField label="Nº Conta Corrente" name="banco_conta" value={form.banco_conta} onChange={set} placeholder="00000" />
        <FormField label="Dígito C/C" name="banco_digito" value={form.banco_digito} onChange={set} placeholder="0" />
        <FormField label="Chave PIX" name="banco_pix" value={form.banco_pix} onChange={set} placeholder="CPF, e-mail ou telefone" />
        <div style={{ gridColumn: "span 2", borderTop: `1px solid ${PALETTE.border}`, paddingTop: 14, marginTop: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: .5 }}>Endereço e Contato</p>
        </div>
        <FormField label="E-mail" name="pf_email" value={form.pf_email} onChange={set} placeholder="seuemail@email.com" type="email" required />
        <FormField label="Telefone" name="pf_telefone" value={form.pf_telefone} onChange={set} placeholder="(00) 00000-0000" mask="phone" required />
        <FormField label="Endereço Residencial" name="pf_endereco" value={form.pf_endereco} onChange={set} placeholder="Rua, nº" />
        <FormField label="CEP" name="pf_cep" value={form.pf_cep} onChange={set} placeholder="00000-000" mask="cep" />
        <FormField label="Complemento" name="pf_complemento" value={form.pf_complemento} onChange={set} placeholder="Apto, bloco..." />
        <FormField label="Cidade" name="pf_cidade" value={form.pf_cidade} onChange={set} placeholder="Cidade" />
        <FormField label="UF" name="pf_uf" value={form.pf_uf} onChange={set} placeholder="SP" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Estado Civil</label>
          <select value={form.pf_estado_civil} onChange={e => set("pf_estado_civil", e.target.value)}>
            <option>SOLTEIRO</option><option>CASADO</option><option>DIVORCIADO</option><option>VIÚVO</option><option>UNIÃO ESTÁVEL</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <BtnSecondary onClick={onBack}><ChevronLeft size={16} /> Voltar</BtnSecondary>
        <BtnPrimary onClick={onNext} disabled={!form.pf_email || !form.pf_telefone || !form.banco_nome}>Revisar <ChevronRight size={16} /></BtnPrimary>
      </div>
    </div>
  );
}

function StepReview({ form, docs, loading, onSubmit, onBack }) {
  const docCount = Object.values(docs).filter(Boolean).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BadgeCheck size={18} color={PALETTE.brand} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.textPrimary }}>Revisão Final</h2>
        </div>
        <p style={{ fontSize: 14, color: PALETTE.textSecondary }}>Confirme os dados antes de enviar para análise.</p>
      </div>
      {[
        { title: "Empresa", rows: [["CNPJ", form.pj_cnpj], ["Razão Social", form.pj_razao_social], ["Nome Fantasia", form.pj_nome_fantasia], ["Endereço PJ", form.pj_endereco], ["Regime", form.pj_regime]] },
        { title: "Representante Legal", rows: [["Nome", form.pf_nome], ["CPF", form.pf_cpf], ["RG", form.pf_rg], ["Nascimento", form.pf_nascimento], ["E-mail", form.pf_email], ["Telefone", form.pf_telefone]] },
        { title: "Dados Bancários", rows: [["Banco", form.banco_nome], ["Agência / Conta", `${form.banco_agencia} / ${form.banco_conta}-${form.banco_digito}`], ["Chave PIX", form.banco_pix]] },
      ].map(({ title, rows }) => (
        <div key={title} style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ background: PALETTE.bg, padding: "10px 16px", borderBottom: `1px solid ${PALETTE.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>{title}</p>
          </div>
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 11, color: PALETTE.textSecondary, marginBottom: 2 }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: PALETTE.textPrimary }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ background: PALETTE.brandLight, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <FileText size={18} color={PALETTE.brand} />
        <p style={{ fontSize: 14, color: PALETTE.brand, fontWeight: 600 }}>{docCount} documento(s) anexado(s)</p>
      </div>
      <div style={{ background: PALETTE.pendingBg, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: PALETTE.pending }}>
        ⚠️ Após envio, seu cadastro ficará como <strong>Pendente</strong> até aprovação da equipe Starcard.
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <BtnSecondary onClick={onBack}><ChevronLeft size={16} /> Voltar</BtnSecondary>
        <BtnPrimary onClick={onSubmit} loading={loading}>
          {loading ? "Enviando..." : "Enviar Cadastro"} <Check size={16} />
        </BtnPrimary>
      </div>
    </div>
  );
}

function SuccessScreen({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ textAlign: "center", maxWidth: 440, padding: 40, background: "#fff", borderRadius: 24, boxShadow: "0 8px 32px rgba(109,40,217,.1)" }} className="fade-in">
        <div style={{ width: 72, height: 72, background: PALETTE.approvedBg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={36} color={PALETTE.approved} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: PALETTE.textPrimary, marginBottom: 12 }}>Cadastro Enviado!</h2>
        <p style={{ fontSize: 15, color: PALETTE.textSecondary, lineHeight: 1.6, marginBottom: 32 }}>Seu cadastro foi recebido com sucesso e está em análise. Entraremos em contato em breve pelo e-mail informado.</p>
        <p style={{ fontSize: 13, color: PALETTE.textSecondary, marginBottom: 24 }}>Dúvidas? Entre em contato: <strong>corban@starbank.tec.br</strong></p>
        <BtnPrimary onClick={onBack} style={{ margin: "0 auto", justifyContent: "center" }}>Voltar ao início</BtnPrimary>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ supabase, user, onLogout }) {
  const [corbans, setCorbans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("corbans").select("*").order("created_at", { ascending: false });
    setCorbans(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const filtered = corbans.filter(c => {
    const matchStatus = statusFilter === "todos" || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.pf_nome?.toLowerCase().includes(q) || c.pj_cnpj?.includes(q) || c.pf_cpf?.includes(q) || c.pj_razao_social?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = { todos: corbans.length, pendente: corbans.filter(c => c.status === "pendente").length, aprovado: corbans.filter(c => c.status === "aprovado").length, reprovado: corbans.filter(c => c.status === "reprovado").length };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleApprove = async (id, status, motivo = "") => {
    await supabase.from("corbans").update({ status, status_motivo: motivo, aprovado_por_nome: user?.email, aprovado_em: new Date().toISOString() }).eq("id", id);
    await supabase.from("corban_reg_audit").insert([{ user_nome: user?.email, action: `corban_${status}`, corban_id: id, detalhes: motivo }]);
    showToast(status === "aprovado" ? "Corban aprovado com sucesso!" : "Corban reprovado.");
    load();
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, status_motivo: motivo }));
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja deletar este corban? Esta ação é irreversível.")) return;
    await supabase.from("corbans").delete().eq("id", id);
    showToast("Corban deletado.", "error");
    load();
    if (selected?.id === id) setSelected(null);
  };

  const handleEdit = async (id, updates) => {
    await supabase.from("corbans").update(updates).eq("id", id);
    showToast("Dados atualizados!");
    load();
    setSelected(prev => ({ ...prev, ...updates }));
  };

  const printFicha = (c) => {
    const html = generateFichaHTML(c);
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (selected) return (
    <AdminLayout user={user} onLogout={onLogout}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <CorbanDetail corban={selected} onBack={() => setSelected(null)} onApprove={handleApprove} onDelete={handleDelete} onEdit={handleEdit} onPrint={printFicha} supabase={supabase} />
    </AdminLayout>
  );

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Corbans", value: counts.todos, icon: Users, color: PALETTE.brand, bg: PALETTE.brandLight },
          { label: "Aguardando", value: counts.pendente, icon: Clock, color: PALETTE.pending, bg: PALETTE.pendingBg },
          { label: "Aprovados", value: counts.aprovado, icon: CheckCircle, color: PALETTE.approved, bg: PALETTE.approvedBg },
          { label: "Reprovados", value: counts.reprovado, icon: XCircle, color: PALETTE.rejected, bg: PALETTE.rejectedBg },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: PALETTE.textPrimary, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: PALETTE.textSecondary, marginTop: 3 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Controls */}
      <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={16} color={PALETTE.textSecondary} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ ou CPF..." style={{ paddingLeft: 38, height: 38 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["todos", "pendente", "aprovado", "reprovado"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none",
                background: statusFilter === s ? PALETTE.brand : PALETTE.bg,
                color: statusFilter === s ? "#fff" : PALETTE.textSecondary,
                transition: "all .15s"
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)} {s !== "todos" && <span style={{ opacity: .7 }}>({counts[s]})</span>}
              </button>
            ))}
          </div>
          <button onClick={load} style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, borderRadius: 10, padding: "8px 12px", color: PALETTE.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spinner /><p style={{ marginTop: 14, color: PALETTE.textSecondary, fontSize: 14 }}>Carregando corbans...</p></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: PALETTE.textSecondary }}>
            <Users size={40} style={{ marginBottom: 12, opacity: .3 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhum corban encontrado</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: PALETTE.bg }}>
                  {["Correspondente", "CNPJ", "Telefone", "Status", "Data", "Ações"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: PALETTE.textSecondary, textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${PALETTE.border}`, background: i % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer" }} onClick={() => setSelected(c)}>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: PALETTE.brandLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>
                          {c.pf_nome?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: PALETTE.textPrimary }}>{c.pf_nome}</p>
                          <p style={{ fontSize: 12, color: PALETTE.textSecondary }}>{c.pj_razao_social}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: PALETTE.textSecondary, fontFamily: "monospace" }}>
                      {c.pj_cnpj ? c.pj_cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: PALETTE.textSecondary }}>{c.pf_telefone || "—"}</td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: PALETTE.textSecondary, whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "13px 16px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setSelected(c)} style={{ background: PALETTE.brandLight, border: "none", borderRadius: 8, padding: "7px 10px", color: PALETTE.brand }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => printFicha(c)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "7px 10px", color: PALETTE.textSecondary }}>
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} style={{ background: PALETTE.rejectedBg, border: "none", borderRadius: 8, padding: "7px 10px", color: PALETTE.rejected }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Corban Detail ─────────────────────────────────────────────────────────────

function CorbanDetail({ corban, onBack, onApprove, onDelete, onEdit, onPrint, supabase }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(corban);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [docs, setDocs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("corban_documentos").select("*").eq("corban_id", corban.id).then(({ data }) => setDocs(data || []));
  }, [corban.id]);

  const setEdit = (k, v) => setEditData(f => ({ ...f, [k]: v }));

  const saveEdit = async () => {
    setSaving(true);
    await onEdit(corban.id, editData);
    setEditing(false);
    setSaving(false);
  };

  const getDocUrl = async (path) => {
    const { data } = await supabase.storage.from("corban-documentos").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const c = editData;

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: PALETTE.textSecondary, fontWeight: 600 }}>
            <ArrowLeft size={15} /> Voltar
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: PALETTE.textPrimary }}>{corban.pf_nome}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <StatusBadge status={c.status} />
              <span style={{ fontSize: 12, color: PALETTE.textSecondary }}>Cadastrado em {new Date(corban.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!editing && <>
            <BtnSecondary onClick={() => setEditing(true)} style={{ fontSize: 13, padding: "8px 16px" }}><Edit2 size={14} /> Editar</BtnSecondary>
            <button onClick={() => onPrint(c)} style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: PALETTE.textPrimary }}>
              <Download size={14} /> PDF
            </button>
            {c.status !== "aprovado" && <button onClick={() => onApprove(corban.id, "aprovado")} style={{ background: PALETTE.approved, border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle size={14} /> Aprovar</button>}
            {c.status !== "reprovado" && <button onClick={() => setRejectModal(true)} style={{ background: PALETTE.rejected, border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}><XCircle size={14} /> Reprovar</button>}
            <button onClick={() => onDelete(corban.id)} style={{ background: PALETTE.rejectedBg, border: "none", borderRadius: 10, padding: "8px 16px", color: PALETTE.rejected, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}><Trash2 size={14} /> Deletar</button>
          </>}
          {editing && <>
            <BtnPrimary onClick={saveEdit} loading={saving} style={{ fontSize: 13, padding: "8px 16px" }}><Check size={14} /> Salvar</BtnPrimary>
            <BtnSecondary onClick={() => { setEditing(false); setEditData(corban); }} style={{ fontSize: 13, padding: "8px 16px" }}><X size={14} /> Cancelar</BtnSecondary>
          </>}
        </div>
      </div>

      {rejectModal && (
        <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Motivo da reprovação (opcional):</p>
          <textarea value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} rows={3} placeholder="Descreva o motivo..." style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <BtnPrimary onClick={() => { onApprove(corban.id, "reprovado", rejectMotivo); setRejectModal(false); }} style={{ background: PALETTE.rejected, fontSize: 13 }}>Confirmar Reprovação</BtnPrimary>
            <BtnSecondary onClick={() => setRejectModal(false)} style={{ fontSize: 13 }}>Cancelar</BtnSecondary>
          </div>
        </div>
      )}

      {c.status === "reprovado" && c.status_motivo && (
        <div style={{ background: PALETTE.rejectedBg, border: `1px solid ${PALETTE.rejected}20`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: PALETTE.rejected }}>
          <strong>Motivo da reprovação:</strong> {c.status_motivo}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* PF Section */}
        <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ background: PALETTE.bg, padding: "12px 18px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={15} color={PALETTE.brand} /><p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>Pessoa Física — Representante Legal</p>
          </div>
          <div style={{ padding: 18 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <FormField label="Nome" name="pf_nome" value={c.pf_nome} onChange={setEdit} />
                <FormField label="CPF" name="pf_cpf" value={c.pf_cpf} onChange={setEdit} mask="cpf" />
                <FormField label="RG" name="pf_rg" value={c.pf_rg} onChange={setEdit} />
                <FormField label="Nascimento" name="pf_nascimento" value={c.pf_nascimento} onChange={setEdit} type="date" />
                <FormField label="Nome da Mãe" name="pf_mae" value={c.pf_mae} onChange={setEdit} />
                <FormField label="E-mail" name="pf_email" value={c.pf_email} onChange={setEdit} />
                <FormField label="Telefone" name="pf_telefone" value={c.pf_telefone} onChange={setEdit} mask="phone" />
                <FormField label="Endereço" name="pf_endereco" value={c.pf_endereco} onChange={setEdit} />
                <FormField label="Cidade" name="pf_cidade" value={c.pf_cidade} onChange={setEdit} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nome" value={c.pf_nome} icon={User} />
                <Field label="CPF" value={c.pf_cpf ? c.pf_cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : c.pf_cpf} icon={Hash} half />
                <Field label="RG" value={c.pf_rg} half />
                <Field label="Nascimento" value={c.pf_nascimento} icon={Calendar} half />
                <Field label="Nome da Mãe" value={c.pf_mae} />
                <Field label="E-mail" value={c.pf_email} icon={Mail} />
                <Field label="Telefone" value={c.pf_telefone} icon={Phone} half />
                <Field label="Estado Civil" value={c.pf_estado_civil} half />
                <Field label="Endereço" value={c.pf_endereco} icon={MapPin} />
                <Field label="Cidade / UF" value={c.pf_cidade ? `${c.pf_cidade} — ${c.pf_uf}` : null} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* PJ Section */}
          <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: PALETTE.bg, padding: "12px 18px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={15} color={PALETTE.brand} /><p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>Pessoa Jurídica</p>
            </div>
            <div style={{ padding: 18 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FormField label="Razão Social" name="pj_razao_social" value={c.pj_razao_social} onChange={setEdit} />
                  <FormField label="Nome Fantasia" name="pj_nome_fantasia" value={c.pj_nome_fantasia} onChange={setEdit} />
                  <FormField label="CNPJ" name="pj_cnpj" value={c.pj_cnpj} onChange={setEdit} mask="cnpj" />
                  <FormField label="Regime Tributário" name="pj_regime" value={c.pj_regime} onChange={setEdit} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Código Parceiro" value={c.codigo_parceiro || "—"} />
                  <Field label="Razão Social" value={c.pj_razao_social} icon={Building2} />
                  <Field label="Nome Fantasia" value={c.pj_nome_fantasia} />
                  <Field label="CNPJ" value={c.pj_cnpj ? c.pj_cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : null} icon={Hash} half />
                  <Field label="Regime" value={c.pj_regime} half />
                  <Field label="Endereço PJ" value={c.pj_endereco} icon={MapPin} />
                </div>
              )}
            </div>
          </div>

          {/* Bank Section */}
          <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: PALETTE.bg, padding: "12px 18px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={15} color={PALETTE.brand} /><p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>Dados Bancários</p>
            </div>
            <div style={{ padding: 18 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FormField label="Banco" name="banco_nome" value={c.banco_nome} onChange={setEdit} />
                  <FormField label="Agência" name="banco_agencia" value={c.banco_agencia} onChange={setEdit} />
                  <FormField label="Conta" name="banco_conta" value={c.banco_conta} onChange={setEdit} />
                  <FormField label="Dígito" name="banco_digito" value={c.banco_digito} onChange={setEdit} />
                  <FormField label="PIX" name="banco_pix" value={c.banco_pix} onChange={setEdit} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Banco" value={c.banco_nome} icon={Building} />
                  <Field label="Agência" value={c.banco_agencia} half />
                  <Field label="Conta / Dígito" value={c.banco_conta ? `${c.banco_conta}-${c.banco_digito}` : null} half />
                  <Field label="Chave PIX" value={c.banco_pix} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden", marginTop: 20 }}>
          <div style={{ background: PALETTE.bg, padding: "12px 18px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} color={PALETTE.brand} /><p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.brand }}>Documentos Anexados ({docs.length})</p>
          </div>
          <div style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {docs.map(doc => (
              <button key={doc.id} onClick={() => getDocUrl(doc.storage_path)} style={{ background: PALETTE.brandLight, border: `1px solid ${PALETTE.brand}30`, borderRadius: 10, padding: "8px 14px", color: PALETTE.brand, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 7 }}>
                <FileText size={13} /> {doc.tipo.replace(/_/g, " ")} <Download size={12} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

function AdminLayout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: PALETTE.bg }}>
      <style>{css}</style>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 0, background: PALETTE.sidebar, transition: "width .3s", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: 240, padding: "28px 20px 20px" }}>
          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{ width: 36, height: 36, background: PALETTE.brand, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Star size={20} color="#fff" fill="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Starcard</p>
              <p style={{ fontSize: 10, color: "#A5B4FC" }}>Painel Corban</p>
            </div>
          </div>
          {/* Nav items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { icon: Users, label: "Corbans", active: true },
              { icon: TrendingUp, label: "Relatórios", active: false },
              { icon: Shield, label: "Configurações", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: active ? PALETTE.brand : "transparent", cursor: "pointer", color: active ? "#fff" : "#A5B4FC", fontWeight: active ? 600 : 400, fontSize: 14 }}>
                <Icon size={17} /> {label}
              </div>
            ))}
          </div>
          {/* Manager card — strategic business placement */}
          <div style={{ marginTop: 32, background: "rgba(124,58,237,.3)", borderRadius: 14, padding: 16, border: "1px solid rgba(167,139,250,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                {user?.email?.[0]?.toUpperCase() || "G"}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#E0E7FF" }}>Gestor Corban</p>
                <p style={{ fontSize: 10, color: "#A5B4FC" }}>Starcard</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#7C83D4", wordBreak: "break-all" }}>{user?.email}</p>
          </div>
          <button onClick={onLogout} style={{ marginTop: 16, width: "100%", background: "rgba(239,68,68,.15)", border: "none", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "#fff", borderBottom: `1px solid ${PALETTE.border}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: PALETTE.textSecondary, padding: 6 }}>
            <Menu size={20} />
          </button>
          <p style={{ fontSize: 15, fontWeight: 700, color: PALETTE.textPrimary }}>Gestão de Correspondentes Bancários</p>
        </div>
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  const bg = type === "error" ? PALETTE.rejected : type === "warning" ? PALETTE.pending : PALETTE.approved;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, background: bg, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,.15)", display: "flex", alignItems: "center", gap: 8 }}>
      <CheckCircle size={16} /> {msg}
    </div>
  );
}

// ─── PDF/Print ────────────────────────────────────────────────────────────────

function generateFichaHTML(c) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ficha Cadastral — ${c.pf_nome}</title>
<style>
body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 32px; }
h1 { font-size: 22px; color: #6D28D9; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
.section { margin-bottom: 20px; }
.section-title { font-size: 13px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: .5px; padding: 8px 12px; background: #EDE9FE; border-radius: 8px; margin-bottom: 10px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid #E5E7EB; }
td:first-child { font-weight: 700; color: #666; width: 40%; }
.status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${c.status === "aprovado" ? "#D1FAE5" : c.status === "reprovado" ? "#FEE2E2" : "#FEF3C7"}; color: ${c.status === "aprovado" ? "#059669" : c.status === "reprovado" ? "#DC2626" : "#D97706"}; }
.footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #E5E7EB; padding-top: 16px; }
</style></head><body>
<h1>⭐ Starcard — Ficha Cadastral Corban</h1>
<p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} • Status: <span class="status">${c.status?.toUpperCase()}</span></p>
<div class="section"><div class="section-title">Pessoa Física — Representante Legal</div>
<table><tr><td>Nome Completo</td><td>${c.pf_nome || "—"}</td></tr><tr><td>CPF</td><td>${c.pf_cpf || "—"}</td></tr><tr><td>RG / UF</td><td>${c.pf_rg || "—"} / ${c.pf_rg_uf || "—"}</td></tr><tr><td>Data de Nascimento</td><td>${c.pf_nascimento || "—"}</td></tr><tr><td>Nome da Mãe</td><td>${c.pf_mae || "—"}</td></tr><tr><td>Sexo</td><td>${c.pf_sexo || "—"}</td></tr><tr><td>Naturalidade</td><td>${c.pf_naturalidade || "—"} / ${c.pf_naturalidade_uf || "—"}</td></tr><tr><td>Residência</td><td>${c.pf_endereco || "—"} ${c.pf_complemento || ""}</td></tr><tr><td>Cidade / UF</td><td>${c.pf_cidade || "—"} / ${c.pf_uf || "—"}</td></tr><tr><td>CEP</td><td>${c.pf_cep || "—"}</td></tr><tr><td>Estado Civil</td><td>${c.pf_estado_civil || "—"}</td></tr><tr><td>E-mail</td><td>${c.pf_email || "—"}</td></tr><tr><td>Telefone</td><td>${c.pf_telefone || "—"}</td></tr></table></div>
<div class="section"><div class="section-title">Pessoa Jurídica</div>
<table><tr><td>Código Parceiro</td><td>${c.codigo_parceiro || "—"}</td></tr><tr><td>Razão Social</td><td>${c.pj_razao_social || "—"}</td></tr><tr><td>Nome Fantasia</td><td>${c.pj_nome_fantasia || "—"}</td></tr><tr><td>CNPJ</td><td>${c.pj_cnpj || "—"}</td></tr><tr><td>Endereço</td><td>${c.pj_endereco || "—"} / ${c.pj_uf || "—"}</td></tr><tr><td>CEP</td><td>${c.pj_cep || "—"}</td></tr><tr><td>Regime Tributário</td><td>${c.pj_regime || "—"}</td></tr></table></div>
<div class="section"><div class="section-title">Dados Bancários</div>
<table><tr><td>Banco</td><td>${c.banco_nome || "—"}</td></tr><tr><td>Agência</td><td>${c.banco_agencia || "—"}</td></tr><tr><td>Conta / Dígito</td><td>${c.banco_conta || "—"}-${c.banco_digito || "—"}</td></tr><tr><td>Chave PIX</td><td>${c.banco_pix || "—"}</td></tr></table></div>
<div class="footer">Starcard — Correspondente Bancário • corban@starbank.tec.br • (11) 99197-3406 • @starcard.tec<br/>Sujeito à análise e aprovação.</div>
</body></html>`;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: PALETTE.sidebar, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <Star size={32} color="#7C3AED" fill="#7C3AED" className="pulse" />
      <p style={{ color: "#A5B4FC", fontSize: 14 }}>Carregando...</p>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("loading");

  useEffect(() => {
    getSB().then(client => {
      setSupabase(client);
      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setPage(session?.user ? "dashboard" : "landing");
      });
      client.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
        if (session?.user) setPage("dashboard");
      });
    });
  }, []);

  if (page === "loading") return <LoadingScreen />;

  if (page === "landing") return <><style>{css}</style><LandingPage onRegister={() => setPage("register")} onLogin={() => setPage("login")} /></>;
  if (page === "register") return <RegisterWizard supabase={supabase} onDone={() => setPage("success")} onBack={() => setPage("landing")} />;
  if (page === "success") return <><style>{css}</style><SuccessScreen onBack={() => setPage("landing")} /></>;
  if (page === "login") return <><style>{css}</style><LoginScreen supabase={supabase} onBack={() => setPage("landing")} /></>;
  if (page === "dashboard" && user) return <AdminDashboard supabase={supabase} user={user} onLogout={async () => { await supabase.auth.signOut(); setPage("landing"); }} />;

  return <><style>{css}</style><LandingPage onRegister={() => setPage("register")} onLogin={() => setPage("login")} /></>;
}