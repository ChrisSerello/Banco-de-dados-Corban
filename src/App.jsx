import { createClient } from "@supabase/supabase-js";
import Landing from "./Landing";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Download, Trash2, Edit2, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronLeft, Upload, User, CreditCard, FileText,
  LogOut, X, Check, Loader2, Building2, AlertCircle, Shield,
  RefreshCw, Plus, Eye, EyeOff, Building, Star, ArrowLeft,
  Users, TrendingUp, BadgeCheck, Printer, Lock, Award, Zap, MapPin
} from "lucide-react";

const SB_URL = "https://ptxieyftrwjdkbebblwj.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eGlleWZ0cndqZGtiZWJibHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzAwMjQsImV4cCI6MjA5MDEwNjAyNH0.KlzSQrDe55mk7YozDkRQgl5dtyi8YmTku70tvXKTKW8";
const sb = createClient(SB_URL, SB_KEY);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, msg: "" }; }
  static getDerivedStateFromError(e) { return { hasError: true, msg: e?.message || "" }; }
  componentDidCatch(e) { console.error("App crash:", e); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F0EEF8",padding:24}}>
        <div style={{maxWidth:460,background:"#fff",borderRadius:18,padding:40,textAlign:"center",border:"1px solid #E2DFF2"}}>
          <div style={{fontSize:36,marginBottom:14}}>{"⚠️"}</div>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:10,color:"#1C1040"}}>Algo deu errado</h2>
          <p style={{fontSize:14,color:"#5E5490",marginBottom:24,lineHeight:1.6}}>{this.state.msg||"Recarregue a página."}</p>
          <button onClick={()=>window.location.reload()} style={{background:"linear-gradient(135deg,#5C2ED8,#7C3AED)",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontWeight:600,fontSize:14,cursor:"pointer"}}>Recarregar</button>
        </div>
      </div>
    );
  }
}

const T = {
  bg:"#F0EEF8", surface:"#FAFAFE", white:"#FFFFFF",
  border:"#E2DFF2", borderHov:"#C5BFEA",
  brand:"#5C2ED8", brandMid:"#7C3AED", brandLight:"#EDE9FE", brandPale:"#F3F1FD",
  text:"#1C1040", textSub:"#5E5490", textMuted:"#9B93C4",
  success:"#059669", successBg:"#ECFDF5",
  warn:"#D97706", warnBg:"#FFFBEB",
  danger:"#DC2626", dangerBg:"#FEF2F2",
  sidebar:"#1A0F3C",
  shadow:"0 1px 3px rgba(92,46,216,.05),0 4px 16px rgba(92,46,216,.04)",
  radius:"12px", radiusLg:"18px",
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'DM Sans',system-ui,sans-serif;background:${T.bg};color:${T.text};-webkit-font-smoothing:antialiased}
  input,select,textarea,button{font-family:inherit}
  input,select,textarea{width:100%;padding:11px 14px;font-size:14px;color:${T.text};background:${T.white};border:1.5px solid ${T.border};border-radius:${T.radius};outline:none;transition:border-color .15s,box-shadow .15s}
  input:focus,select:focus,textarea:focus{border-color:${T.brandMid};box-shadow:0 0 0 3px rgba(124,58,237,.10)}
  input::placeholder,textarea::placeholder{color:${T.textMuted}}
  button{cursor:pointer;transition:all .15s ease}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fade-up{animation:fadeUp .35s cubic-bezier(.22,1,.36,1)}
  .fade-in{animation:fadeIn .25s ease}
  .spin{animation:spin 1s linear infinite}
  .pulse{animation:pulse 1.8s ease infinite}
`;

const fmt = {
  cnpj:v=>{const d=v.replace(/\D/g,"").slice(0,14);return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5");},
  cpf: v=>{const d=v.replace(/\D/g,"").slice(0,11); return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,"$1.$2.$3-$4");},
  tel: v=>{const d=v.replace(/\D/g,"").slice(0,11); return d.replace(/^(\d{2})(\d{5})(\d{4})$/,"($1) $2-$3");},
  cep: v=>{const d=v.replace(/\D/g,"").slice(0,8);  return d.replace(/^(\d{5})(\d{3})$/,"$1-$2");},
};

async function lookupCNPJ(cnpj) {
  const limpo = cnpj.replace(/\D/g, "");
  try {
    // Dev: chama BrasilAPI direto (sem CORS no localhost)
    // Prod: usa o proxy do Vercel (sem CORS no domínio)
    const url = import.meta.env.DEV
      ? `https://brasilapi.com.br/api/cnpj/v1/${limpo}`
      : `/api/cnpj?cnpj=${limpo}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;  // falha silenciosa — fluxo continua
  }
}

const Spin = ({size=18,color=T.brandMid}) => <Loader2 size={size} color={color} className="spin"/>;

const Btn = ({children,onClick,disabled,loading,variant="primary",size="md",full,icon:Icon,style={}}) => {
  const base = {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:"none",fontWeight:600,borderRadius:T.radius,cursor:"pointer",transition:"all .18s ease",whiteSpace:"nowrap",
    ...(size==="sm"&&{padding:"8px 16px",fontSize:13}),
    ...(size==="md"&&{padding:"12px 22px",fontSize:14}),
    ...(size==="lg"&&{padding:"14px 30px",fontSize:15}),
    ...(full&&{width:"100%"})};
  const V = {
    primary:{background:disabled||loading?"#C4B8F0":`linear-gradient(135deg,${T.brand},${T.brandMid})`,color:"#fff",boxShadow:disabled||loading?"none":"0 4px 14px rgba(92,46,216,.28)"},
    secondary:{background:"transparent",color:T.brandMid,border:`1.5px solid ${T.border}`},
    ghost:{background:"transparent",color:T.textSub},
    danger:{background:T.dangerBg,color:T.danger},
    success:{background:T.successBg,color:T.success},
  };
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{...base,...V[variant],...style}}
      onMouseEnter={e=>{if(!disabled&&!loading&&variant==="primary")e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
      {loading?<Spin size={15} color={variant==="primary"?"#fff":T.brandMid}/>:Icon?<Icon size={15}/>:null}{children}
    </button>
  );
};

const StatusBadge = ({status}) => {
  const C={
    pendente: {l:"Pendente",  bg:T.warnBg,    c:T.warn,    I:Clock},
    aprovado: {l:"Aprovado",  bg:T.successBg,  c:T.success,  I:CheckCircle},
    reprovado:{l:"Reprovado", bg:T.dangerBg,   c:T.danger,   I:XCircle},
    rascunho: {l:"Rascunho",  bg:"#EDE9FE",    c:"#7C3AED",  I:FileText},
  }[status]||{l:"Pendente",bg:T.warnBg,c:T.warn,I:Clock};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:20,background:C.bg,color:C.c,fontSize:12,fontWeight:700}}><C.I size={11}/>{C.l}</span>;
};

const FG = ({label,required,children}) => (
  <div>
    <label style={{display:"block",fontSize:13,fontWeight:600,color:T.textSub,marginBottom:6}}>
      {label}{required&&<span style={{color:T.danger,marginLeft:3}}>*</span>}
    </label>
    {children}
  </div>
);

const FF = ({label,name,value,onChange,placeholder,type="text",mask,required}) => {
  const h = e => {
    let v=e.target.value;
    if(mask==="cnpj")v=fmt.cnpj(v); if(mask==="cpf")v=fmt.cpf(v);
    if(mask==="tel")v=fmt.tel(v);   if(mask==="cep")v=fmt.cep(v);
    onChange(name,v);
  };
  return <FG label={label} required={required}><input type={type} value={value||""} onChange={h} placeholder={placeholder}/></FG>;
};

const Card = ({children,style={}}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.radiusLg,boxShadow:T.shadow,...style}}>{children}</div>
);

const SecHead = ({icon:Icon,title,sub}) => (
  <div style={{display:"flex",alignItems:"center",gap:14,padding:"18px 24px",borderBottom:`1px solid ${T.border}`}}>
    <div style={{width:38,height:38,background:T.brandLight,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={18} color={T.brandMid}/></div>
    <div><p style={{fontSize:15,fontWeight:700,color:T.text}}>{title}</p>{sub&&<p style={{fontSize:12,color:T.textMuted,marginTop:1}}>{sub}</p>}</div>
  </div>
);

// FIX 2: DR filtra valores zero/traço (placeholders antigos)
const DR = ({label,value,mono}) => (value && value !== "00000000000" && value !== "-") ? (
  <div style={{padding:"9px 0",borderBottom:`1px solid ${T.bg}`}}>
    <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:.6,marginBottom:3}}>{label}</p>
    <p style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:mono?"'DM Mono',monospace":undefined}}>{value}</p>
  </div>
) : null;

const Shell = ({icon:I,title,sub,children}) => (
  <Card style={{overflow:"hidden"}}>
    <SecHead icon={I} title={title} sub={sub}/>
    <div style={{padding:28}}>{children}</div>
  </Card>
);

// LOGIN
function Login({onBack}) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [show,setShow]=useState(false); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const go = async () => {
    if(!email||!pass) return setErr("Preencha e-mail e senha.");
    setLoading(true); setErr("");
    const {error:e} = await sb.auth.signInWithPassword({email,password:pass});
    if(e) setErr("Credenciais inválidas.");
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{G}</style>
      <div style={{width:"100%",maxWidth:420,padding:24}} className="fade-up">
        <button onClick={onBack} style={{background:"none",border:"none",color:T.textSub,display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,marginBottom:28}}><ArrowLeft size={15}/> Voltar</button>
        <Card style={{padding:40}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:50,height:50,background:`linear-gradient(135deg,${T.brand},${T.brandMid})`,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Shield size={22} color="#fff"/></div>
            <h2 style={{fontSize:20,fontWeight:800,color:T.text}}>Acesso Restrito</h2>
            <p style={{fontSize:13,color:T.textSub,marginTop:4}}>Painel de Gestão Starcard</p>
          </div>
          {err&&<div style={{background:T.dangerBg,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.danger,display:"flex",alignItems:"center",gap:8,marginBottom:18}}><AlertCircle size={14}/>{err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FG label="E-mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@starcard.com" onKeyDown={e=>e.key==="Enter"&&go()}/></FG>
            <FG label="Senha">
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{paddingRight:42}} onKeyDown={e=>e.key==="Enter"&&go()}/>
                <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.textMuted}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </FG>
            <Btn onClick={go} loading={loading} full style={{marginTop:6}}>Entrar</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// WIZARD
const BLANK={
  pj_cnpj:"",pj_razao_social:"",pj_nome_fantasia:"",pj_endereco:"",pj_uf:"",pj_cep:"",pj_regime:"",pj_telefone:"",
  tipo_operacao:"",estados_atuacao:[],produtos_atuacao:[],bancos_parceiros:[],producao_mensal:"",
  pf_nome:"",pf_cpf:"",pf_rg:"",pf_rg_uf:"SP",pf_nascimento:"",pf_mae:"",
  pf_naturalidade:"",pf_naturalidade_uf:"",pf_sexo:"FEMININO",pf_nacionalidade:"brasileira",
  pf_endereco:"",pf_cep:"",pf_complemento:"",pf_cidade:"",pf_uf:"",pf_estado_civil:"CASADO",
  pf_email:"",pf_telefone:"",
  banco_nome:"",banco_agencia:"",banco_conta:"",banco_digito:"",banco_pix:"",
};
const STEPS=["Empresa","Perfil","Dados Pessoais","Documentos","Bancários","Revisão"];

function ChipGroup({options,selected=[],onToggle}) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {options.map(opt=>{
        const active=(selected||[]).includes(opt.key||opt);
        return (
          <button key={opt.key||opt} onClick={()=>onToggle(opt.key||opt)}
            style={{padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:600,border:`1.5px solid ${active?T.brand:T.border}`,
              background:active?T.brand:T.surface,color:active?"#fff":T.textSub,cursor:"pointer",transition:"all .15s"}}>
            {opt.label||opt}
          </button>
        );
      })}
    </div>
  );
}

function TypeCard({label,desc,icon:Icon,active,onClick}) {
  return (
    <button onClick={onClick} style={{flex:1,minWidth:160,padding:"20px 16px",borderRadius:14,
      border:`2px solid ${active?T.brand:T.border}`,background:active?T.brandPale:T.surface,
      cursor:"pointer",textAlign:"center",transition:"all .18s",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      <div style={{width:44,height:44,borderRadius:12,background:active?T.brand:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={20} color={active?"#fff":T.textSub}/>
      </div>
      <div>
        <p style={{fontSize:14,fontWeight:700,color:active?T.brand:T.text,margin:0}}>{label}</p>
        <p style={{fontSize:12,color:T.textMuted,marginTop:3}}>{desc}</p>
      </div>
    </button>
  );
}

function Wizard({onDone,onBack}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState(BLANK);
  const [docs,setDocs]=useState({});
  const [corbanId,setCorbanId]=useState(null);
  const [cnpjLoading,setCL]=useState(false);
  const [cnpjOk,setCO]=useState(false);
  const [cnpjErr,setCE]=useState("");
  const [leadSaving,setLS]=useState(false);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggle=(k,v)=>setForm(f=>({...f,[k]:(f[k]||[]).includes(v)?(f[k]||[]).filter(x=>x!==v):[...(f[k]||[]),v]}));

  // FIX 1: INSERT sem placeholders falsos
  const handleStep1=async()=>{
    if(!form.pj_telefone) return setCE("Informe o telefone de contato.");
    setCL(true);setCE("");setCO(false);
    try {
      const d = await lookupCNPJ(form.pj_cnpj);
      const updated = d ? {
        ...form,
        pj_razao_social: d.razao_social || form.pj_razao_social,
        pj_nome_fantasia: form.pj_nome_fantasia || d.nome_fantasia || "",
        pj_endereco: `${d.logradouro||""}, ${d.numero||""}`.trim().replace(/,$/,""),
        pj_uf: d.uf || "",
        pj_cep: d.cep?.replace(/\D/g,"").replace(/(\d{5})(\d{3})/,"$1-$2") || "",
      } : form;
      setForm(updated);
      if(d) setCO(true);
      setLS(true);
      const {data:lead,error}=await sb.from("corbans").insert([{
        pj_cnpj:updated.pj_cnpj.replace(/\D/g,""),
        pj_razao_social:updated.pj_razao_social,
        pj_nome_fantasia:updated.pj_nome_fantasia,
        pj_telefone:updated.pj_telefone.replace(/\D/g,""),
        pj_endereco:updated.pj_endereco,
        pj_uf:updated.pj_uf,
        pj_cep:updated.pj_cep.replace(/\D/g,""),
        pf_nome:"",pf_cpf:"",pf_email:"",pf_telefone:"",
        status:"rascunho",
      }]).select("id").single();
      if(error) throw error;
      setCorbanId(lead.id);
      setLS(false);
      setTimeout(()=>setStep(2),500);
    }catch(e){setCE(e.message||"CNPJ não encontrado. Verifique e tente novamente.");}
    setCL(false);setLS(false);
  };

  const updateCorban=async(patch)=>{
    if(!corbanId) return;
    await sb.from("corbans").update(patch).eq("id",corbanId);
  };

  const handleStep2=async()=>{
    await updateCorban({
      tipo_operacao:form.tipo_operacao,
      estados_atuacao:form.estados_atuacao,
      produtos_atuacao:form.produtos_atuacao,
      bancos_parceiros:form.bancos_parceiros,
      producao_mensal:form.producao_mensal,
    });
    setStep(3);
  };

  const submit=async()=>{
    setSaving(true);
    try{
      if(!corbanId) throw new Error("Sessão inválida. Volte ao início e tente novamente.");
      const {data:updated,error}=await sb.from("corbans").update({
        pf_nome:form.pf_nome,pf_nascimento:form.pf_nascimento||null,pf_sexo:form.pf_sexo,
        pf_rg:form.pf_rg,pf_rg_uf:form.pf_rg_uf,pf_cpf:form.pf_cpf.replace(/\D/g,""),
        pf_mae:form.pf_mae,pf_nacionalidade:form.pf_nacionalidade,
        pf_naturalidade:form.pf_naturalidade,pf_naturalidade_uf:form.pf_naturalidade_uf,
        pf_endereco:form.pf_endereco,pf_cep:form.pf_cep.replace(/\D/g,""),
        pf_complemento:form.pf_complemento,pf_cidade:form.pf_cidade,pf_uf:form.pf_uf,
        pf_estado_civil:form.pf_estado_civil,pf_email:form.pf_email,
        pf_telefone:form.pf_telefone.replace(/\D/g,""),
        banco_nome:form.banco_nome,banco_agencia:form.banco_agencia,
        banco_conta:form.banco_conta,banco_digito:form.banco_digito,banco_pix:form.banco_pix,
        status:"pendente",
      }).eq("id",corbanId).select("id");
      if(error) throw error;
      if(!updated||updated.length===0) throw new Error("Não foi possível salvar. Tente novamente.");
      for(const[tipo,file]of Object.entries(docs)){
        if(!file)continue;
        const path=`${corbanId}/${tipo}_${Date.now()}.${file.name.split(".").pop()}`;
        await sb.storage.from("corban-documentos").upload(path,file);
        await sb.from("corban_documentos").insert([{corban_id:corbanId,tipo,nome_arquivo:file.name,storage_path:path,tamanho_bytes:file.size,mime_type:file.type}]);
      }
      onDone();
    }catch(e){alert("Erro ao enviar: "+e.message);}
    setSaving(false);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}><style>{G}</style>
      <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 28px",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:T.textSub,display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}><ArrowLeft size={15}/></button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:`linear-gradient(135deg,${T.brand},${T.brandMid})`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Star size={14} color="#fff" fill="#fff"/></div>
          <span style={{fontSize:14,fontWeight:700,color:T.text}}>Starcard</span>
          <span style={{color:T.border,margin:"0 4px"}}>·</span>
          <span style={{fontSize:13,color:T.textSub}}>Cadastro Correspondente</span>
        </div>
      </header>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"18px 0",overflowX:"auto"}}>
        <div style={{minWidth:600,maxWidth:760,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center"}}>
          {STEPS.map((label,i)=>{
            const n=i+1,done=n<step,active=n===step;
            return(
              <div key={n} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"initial"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:done?T.brand:active?T.brandPale:T.bg,
                    border:`2px solid ${done?T.brand:active?T.brandMid:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>
                    {done?<Check size={12} color="#fff"/>:<span style={{fontSize:10,fontWeight:700,color:active?T.brandMid:T.textMuted}}>{n}</span>}
                  </div>
                  <span style={{fontSize:9,fontWeight:active?700:500,color:active?T.brand:done?T.brand:T.textMuted,whiteSpace:"nowrap"}}>{label}</span>
                </div>
                {i<STEPS.length-1&&<div style={{flex:1,height:2,background:done?T.brand:T.border,margin:"0 4px",marginBottom:16,transition:"background .3s"}}/>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,display:"flex",justifyContent:"center",padding:"32px 16px"}}>
        <div style={{width:"100%",maxWidth:620}} className="fade-up">
          {step===1&&<WS1 form={form} set={set} loading={cnpjLoading||leadSaving} ok={cnpjOk} err={cnpjErr} onNext={handleStep1}/>}
          {step===2&&<WS2 form={form} set={set} toggle={toggle} onNext={handleStep2} onBack={()=>setStep(1)}/>}
          {step===3&&<WS3 form={form} set={set} onNext={()=>setStep(4)} onBack={()=>setStep(2)}/>}
          {step===4&&<WS4 docs={docs} setDocs={setDocs} onNext={()=>setStep(5)} onBack={()=>setStep(3)}/>}
          {step===5&&<WS5 form={form} set={set} onNext={()=>setStep(6)} onBack={()=>setStep(4)}/>}
          {step===6&&<WS6 form={form} docs={docs} loading={saving} onSubmit={submit} onBack={()=>setStep(5)}/>}
        </div>
      </div>
    </div>
  );
}

function WS1({form,set,loading,ok,err,onNext}) {
  return(
    <Shell icon={Building2} title="Dados da Empresa" sub="Informe o CNPJ — preencheremos o restante automaticamente">
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <FF label="CNPJ da empresa" name="pj_cnpj" value={form.pj_cnpj} onChange={set} placeholder="00.000.000/0000-00" mask="cnpj" required/>
        <FF label="Nome Fantasia / Nome Comercial" name="pj_nome_fantasia" value={form.pj_nome_fantasia} onChange={set} placeholder="Como sua empresa é conhecida" required/>
        <FF label="Telefone de Contato" name="pj_telefone" value={form.pj_telefone} onChange={set} placeholder="(00) 00000-0000" mask="tel" required/>
        {err&&<div style={{display:"flex",alignItems:"center",gap:8,background:T.dangerBg,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.danger}}><AlertCircle size={14}/>{err}</div>}
        {ok&&<div style={{background:T.successBg,border:`1px solid #6EE7B7`,borderRadius:12,padding:14}} className="fade-in">
          <p style={{fontSize:12,fontWeight:700,color:T.success,marginBottom:4,display:"flex",alignItems:"center",gap:5}}><CheckCircle size={12}/>Empresa encontrada — dados preenchidos</p>
          <p style={{fontSize:14,fontWeight:700,color:T.text}}>{form.pj_razao_social}</p>
          <p style={{fontSize:12,color:T.textMuted,marginTop:2}}>{form.pj_endereco} — {form.pj_uf}</p>
        </div>}
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <Btn onClick={onNext} loading={loading}>{loading?"Consultando e salvando...":"Continuar"}<ChevronRight size={15}/></Btn>
        </div>
      </div>
    </Shell>
  );
}

const PRODUTOS=["Consignado INSS","Consignado Público","Consignado Privado","FGTS / Saque-Aniversário","Crédito Pessoal","CDC","Cartão de Crédito","Financiamento Imobiliário","Seguros","Portabilidade"];
const BANCOS=["Caixa","Banco do Brasil","Itaú","Bradesco","Santander","BMG","Pan","Facta","Daycoval","Safra","C6 Bank","Nubank","Outro"];
const FAIXAS=["Até R$ 50 mil","R$ 50k – 200k","R$ 200k – 500k","R$ 500k – 1M","Acima de R$ 1M"];
const UFS=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function WS2({form,set,toggle,onNext,onBack}) {
  const blk=(title,sub,children)=>(
    <div style={{borderBottom:`1px solid ${T.border}`,paddingBottom:20,marginBottom:20}}>
      <p style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{title}</p>
      {sub&&<p style={{fontSize:12,color:T.textMuted,marginBottom:12}}>{sub}</p>}
      {children}
    </div>
  );
  return(
    <Shell icon={TrendingUp} title="Perfil do Negócio" sub="Toque nas opções — leva menos de 2 minutos">
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {blk("Como você opera?","",
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[{key:"promotora",label:"Promotora",desc:"Vendas externas",icon:Users},{key:"loja_fisica",label:"Loja Física",desc:"Atendimento local",icon:Building},{key:"ambos",label:"Promotora + Loja",desc:"Modelo híbrido",icon:Zap}].map(t=>(
              <TypeCard key={t.key} label={t.label} desc={t.desc} icon={t.icon} active={form.tipo_operacao===t.key} onClick={()=>set("tipo_operacao",t.key)}/>
            ))}
          </div>
        )}
        {blk("Produção mensal estimada","",
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {FAIXAS.map(f=>{const active=form.producao_mensal===f;return(
              <button key={f} onClick={()=>set("producao_mensal",f)} style={{padding:"9px 16px",borderRadius:10,fontSize:13,fontWeight:600,border:`1.5px solid ${active?T.brand:T.border}`,background:active?T.brand:T.surface,color:active?"#fff":T.textSub,cursor:"pointer",transition:"all .15s"}}>{f}</button>
            );})}
          </div>
        )}
        {blk("Produtos que você trabalha","Pode selecionar mais de um",
          <ChipGroup options={PRODUTOS} selected={form.produtos_atuacao} onToggle={v=>toggle("produtos_atuacao",v)}/>
        )}
        {blk("Bancos / Fintechs parceiros","Com quais já tem relacionamento",
          <ChipGroup options={BANCOS} selected={form.bancos_parceiros} onToggle={v=>toggle("bancos_parceiros",v)}/>
        )}
        {blk("Estados de atuação","Onde você já opera ou pretende operar",
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {UFS.map(uf=>{const active=(form.estados_atuacao||[]).includes(uf);return(
              <button key={uf} onClick={()=>toggle("estados_atuacao",uf)} style={{width:44,height:36,borderRadius:8,fontSize:12,fontWeight:700,border:`1.5px solid ${active?T.brand:T.border}`,background:active?T.brand:T.surface,color:active?"#fff":T.textSub,cursor:"pointer",transition:"all .12s"}}>{uf}</button>
            );})}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",paddingTop:4}}>
          <Btn onClick={onBack} variant="secondary" icon={ChevronLeft}>Voltar</Btn>
          <Btn onClick={onNext} disabled={!form.tipo_operacao}>Continuar<ChevronRight size={15}/></Btn>
        </div>
      </div>
    </Shell>
  );
}

function WS3({form,set,onNext,onBack}) {
  return(
    <Shell icon={User} title="Dados Pessoais" sub="Preencha os dados do representante legal">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{gridColumn:"span 2"}}><FF label="Nome Completo" name="pf_nome" value={form.pf_nome} onChange={set} placeholder="Nome como no documento" required/></div>
        <FF label="CPF" name="pf_cpf" value={form.pf_cpf} onChange={set} placeholder="000.000.000-00" mask="cpf" required/>
        <FF label="RG" name="pf_rg" value={form.pf_rg} onChange={set} placeholder="Número do RG"/>
        <FF label="Data de Nascimento" name="pf_nascimento" value={form.pf_nascimento} onChange={set} type="date"/>
        <FG label="Sexo"><select value={form.pf_sexo} onChange={e=>set("pf_sexo",e.target.value)}><option>FEMININO</option><option>MASCULINO</option></select></FG>
        <div style={{gridColumn:"span 2"}}><FF label="Nome da Mãe" name="pf_mae" value={form.pf_mae} onChange={set} placeholder="Nome completo da mãe"/></div>
        <FF label="Naturalidade" name="pf_naturalidade" value={form.pf_naturalidade} onChange={set} placeholder="Cidade de nascimento"/>
        <FF label="UF Naturalidade" name="pf_naturalidade_uf" value={form.pf_naturalidade_uf} onChange={set} placeholder="SP"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={onBack} variant="secondary" icon={ChevronLeft}>Voltar</Btn>
        <Btn onClick={onNext} disabled={!form.pf_nome||!form.pf_cpf}>Continuar<ChevronRight size={15}/></Btn>
      </div>
    </Shell>
  );
}

const DOC_LIST=[
  {key:"rg_cnh",               label:"RG ou CNH (frente e verso)", req:true},
  {key:"comprovante_endereco", label:"Comprovante de Endereço",    req:true},
  {key:"cartao_cnpj",          label:"Cartão CNPJ",                req:true},
  {key:"cert_mei",             label:"Certificado MEI / Contrato Social", req:true},
  {key:"comp_end_estab",       label:"Comprovante do Estabelecimento", req:true},
  {key:"domicilio_bancario",   label:"Domicílio Bancário",          req:true},
  {key:"certificado",          label:"Certificado FEBRABAN / ANEPS",req:false},
  {key:"logo",                 label:"Logo em PNG",                 req:false},
];

function WS4({docs,setDocs,onNext,onBack}) {
  return(
    <Shell icon={FileText} title="Documentos" sub="Envie os documentos para análise">
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
        {DOC_LIST.map(({key,label,req})=>{
          const file=docs[key];
          return(
            <label key={key} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",cursor:"pointer",border:`1.5px solid ${file?T.brand:T.border}`,borderRadius:T.radius,background:file?T.brandPale:T.surface,transition:"all .15s"}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:file?T.brand:T.bg}}>
                {file?<Check size={17} color="#fff"/>:<Upload size={14} color={T.textMuted}/>}
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:600,color:T.text}}>{label}{req&&<span style={{color:T.danger,marginLeft:3}}>*</span>}</p>
                <p style={{fontSize:11,color:file?T.brandMid:T.textMuted,marginTop:2}}>{file?file.name:"Clique para selecionar"}</p>
              </div>
              <input type="file" style={{display:"none"}} accept="image/*,.pdf" onChange={e=>{const f=e.target.files?.[0];if(f)setDocs(d=>({...d,[key]:f}));}}/>
            </label>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={onBack} variant="secondary" icon={ChevronLeft}>Voltar</Btn>
        <Btn onClick={onNext}>Continuar<ChevronRight size={15}/></Btn>
      </div>
    </Shell>
  );
}

function WS5({form,set,onNext,onBack}) {
  return(
    <Shell icon={CreditCard} title="Dados Bancários e Contato" sub="Últimas informações para finalizar">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{gridColumn:"span 2"}}><FF label="Nome do Banco" name="banco_nome" value={form.banco_nome} onChange={set} placeholder="Ex: Itaú, Bradesco, Nubank..." required/></div>
        <FF label="Agência" name="banco_agencia" value={form.banco_agencia} onChange={set} placeholder="0000"/>
        <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:8}}>
          <FF label="Nº Conta" name="banco_conta" value={form.banco_conta} onChange={set} placeholder="00000"/>
          <FF label="Dígito" name="banco_digito" value={form.banco_digito} onChange={set} placeholder="0"/>
        </div>
        <div style={{gridColumn:"span 2"}}><FF label="Chave PIX" name="banco_pix" value={form.banco_pix} onChange={set} placeholder="CPF, e-mail ou telefone"/></div>
        <div style={{gridColumn:"span 2",borderTop:`1px solid ${T.border}`,paddingTop:14,marginTop:4}}>
          <p style={{fontSize:12,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:.6,marginBottom:14}}>Contato e Endereço do Representante</p>
        </div>
        <FF label="E-mail pessoal" name="pf_email" value={form.pf_email} onChange={set} placeholder="seuemail@email.com" type="email" required/>
        <FF label="Celular pessoal" name="pf_telefone" value={form.pf_telefone} onChange={set} placeholder="(00) 00000-0000" mask="tel" required/>
        <div style={{gridColumn:"span 2"}}><FF label="Endereço Residencial" name="pf_endereco" value={form.pf_endereco} onChange={set} placeholder="Rua, número"/></div>
        <FF label="CEP" name="pf_cep" value={form.pf_cep} onChange={set} placeholder="00000-000" mask="cep"/>
        <FF label="Complemento" name="pf_complemento" value={form.pf_complemento} onChange={set} placeholder="Apto, bloco..."/>
        <FF label="Cidade" name="pf_cidade" value={form.pf_cidade} onChange={set} placeholder="Cidade"/>
        <FF label="UF" name="pf_uf" value={form.pf_uf} onChange={set} placeholder="SP"/>
        <FG label="Estado Civil"><select value={form.pf_estado_civil} onChange={e=>set("pf_estado_civil",e.target.value)}><option>SOLTEIRO</option><option>CASADO</option><option>DIVORCIADO</option><option>VIÚVO</option><option>UNIÃO ESTÁVEL</option></select></FG>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={onBack} variant="secondary" icon={ChevronLeft}>Voltar</Btn>
        <Btn onClick={onNext} disabled={!form.pf_email||!form.pf_telefone||!form.banco_nome}>Revisar<ChevronRight size={15}/></Btn>
      </div>
    </Shell>
  );
}

function WS6({form,docs,loading,onSubmit,onBack}) {
  const dc=Object.values(docs).filter(Boolean).length;
  const infoBox=(label,val)=>val?<div key={label}><p style={{fontSize:11,color:T.textMuted,marginBottom:2}}>{label}</p><p style={{fontSize:13,fontWeight:600,color:T.text}}>{val}</p></div>:null;
  const section=(title,rows)=>(
    <div key={title} style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
      <div style={{background:T.bg,padding:"8px 14px",borderBottom:`1px solid ${T.border}`}}>
        <p style={{fontSize:12,fontWeight:700,color:T.brandMid,textTransform:"uppercase",letterSpacing:.5}}>{title}</p>
      </div>
      <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px",background:T.surface}}>
        {rows.map(([k,v])=>infoBox(k,v))}
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <SecHead icon={BadgeCheck} title="Revisão Final" sub="Confirme antes de enviar"/>
        <div style={{padding:22,display:"flex",flexDirection:"column",gap:12}}>
          {section("Empresa",[["Razão Social",form.pj_razao_social],["CNPJ",form.pj_cnpj],["Nome Fantasia",form.pj_nome_fantasia],["Telefone",form.pj_telefone]])}
          {section("Perfil Comercial",[["Tipo de Operação",form.tipo_operacao],["Produção Mensal",form.producao_mensal],["Produtos",form.produtos_atuacao?.join(", ")||"—"],["Bancos/Fintechs",form.bancos_parceiros?.join(", ")||"—"],["Estados",form.estados_atuacao?.join(", ")||"—"]])}
          {section("Representante Legal",[["Nome",form.pf_nome],["CPF",form.pf_cpf],["RG",form.pf_rg],["Nascimento",form.pf_nascimento],["E-mail",form.pf_email],["Celular",form.pf_telefone]])}
          {section("Dados Bancários",[["Banco",form.banco_nome],["Agência",form.banco_agencia],["Conta",`${form.banco_conta}-${form.banco_digito}`],["PIX",form.banco_pix]])}
          <div style={{display:"flex",alignItems:"center",gap:9,background:T.brandPale,borderRadius:12,padding:"10px 14px"}}>
            <FileText size={14} color={T.brandMid}/>
            <p style={{fontSize:13,fontWeight:600,color:T.brand}}>{dc} documento(s) anexado(s)</p>
          </div>
          <div style={{background:T.warnBg,borderRadius:12,padding:"10px 14px",fontSize:13,color:T.warn}}>
            Após envio, cadastro fica <strong>Pendente</strong> até análise da equipe Starcard (até 48h úteis).
          </div>
        </div>
      </Card>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={onBack} variant="secondary" icon={ChevronLeft}>Voltar</Btn>
        <Btn onClick={onSubmit} loading={loading} icon={Check}>{loading?"Enviando...":"Confirmar e Enviar"}</Btn>
      </div>
    </div>
  );
}

function Success({onBack}) {
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{G}</style>
      <div style={{maxWidth:420,width:"100%",padding:24}} className="fade-up">
        <Card style={{padding:44,textAlign:"center"}}>
          <div style={{width:68,height:68,background:T.successBg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px"}}><CheckCircle size={32} color={T.success}/></div>
          <h2 style={{fontSize:24,fontWeight:800,color:T.text,marginBottom:10}}>Cadastro enviado!</h2>
          <p style={{fontSize:15,color:T.textSub,lineHeight:1.7,marginBottom:32}}>Recebemos seu cadastro e está em análise. Retornaremos em até <strong>48h úteis</strong>.</p>
          <p style={{fontSize:13,color:T.textMuted,marginBottom:24}}>Dúvidas: <a href="mailto:corban@starbank.tec.br" style={{color:T.brandMid,fontWeight:600}}>corban@starbank.tec.br</a></p>
          <Btn onClick={onBack} variant="secondary" full>Voltar ao início</Btn>
        </Card>
      </div>
    </div>
  );
}

// DASHBOARD
function Dashboard({user,onLogout}) {
  const [corbans,setCorbans]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("todos");
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState(null);

  const load=useCallback(async()=>{setLoading(true);const{data}=await sb.from("corbans").select("*").order("created_at",{ascending:false});setCorbans(data||[]);setLoading(false);},[]);
  useEffect(()=>{load();},[load]);

  const ativos=corbans.filter(c=>c.status!=="rascunho");
  const rascunhos=corbans.filter(c=>c.status==="rascunho");
  const counts={
    todos:    ativos.length,
    pendente: ativos.filter(c=>c.status==="pendente").length,
    aprovado: ativos.filter(c=>c.status==="aprovado").length,
    reprovado:ativos.filter(c=>c.status==="reprovado").length,
    rascunho: rascunhos.length,
  };
  const filtered=(filter==="rascunho"?rascunhos:ativos).filter(c=>{
    const ms=filter==="todos"||filter==="rascunho"||c.status===filter;
    const q=search.toLowerCase();
    return ms&&(!q||c.pf_nome?.toLowerCase().includes(q)||c.pj_cnpj?.includes(q)||c.pf_cpf?.includes(q)||c.pj_razao_social?.toLowerCase().includes(q)||c.pj_nome_fantasia?.toLowerCase().includes(q)||c.pj_telefone?.includes(q));
  });

  const showT=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const onStatus=async(id,status,motivo="")=>{
    await sb.from("corbans").update({status,status_motivo:motivo,parecer_decisao:motivo,aprovado_por_nome:user?.email,aprovado_em:new Date().toISOString()}).eq("id",id);
    await sb.from("corban_reg_audit").insert([{user_nome:user?.email,action:`corban_${status}`,corban_id:id,detalhes:motivo}]);
    showT(status==="aprovado"?"Corban aprovado!":"Corban reprovado.");
    load();
    if(selected?.id===id)setSelected(p=>({...p,status,status_motivo:motivo}));
  };
  const onDelete=async(id)=>{if(!confirm("Deletar? Ação irreversível."))return;await sb.from("corbans").delete().eq("id",id);showT("Removido.","error");load();if(selected?.id===id)setSelected(null);};
  const onEdit=async(id,u)=>{await sb.from("corbans").update(u).eq("id",id);showT("Atualizado!");load();setSelected(p=>({...p,...u}));};
  const printFicha=c=>{const w=window.open("","_blank");w.document.write(fichaHTML(c));w.document.close();setTimeout(()=>w.print(),500);};

  if(selected) return(<AdminLayout user={user} onLogout={onLogout}>{toast&&<Toast {...toast}/>}<Detail corban={selected} onBack={()=>setSelected(null)} onStatus={onStatus} onDelete={onDelete} onEdit={onEdit} onPrint={printFicha}/></AdminLayout>);

  return(
    <AdminLayout user={user} onLogout={onLogout}>
      {toast&&<Toast {...toast}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:22}}>
        {[
          {label:"Submetidos", value:counts.todos,     icon:Users,         c:T.brandMid, bg:T.brandLight},
          {label:"Aguardando", value:counts.pendente,  icon:Clock,         c:T.warn,     bg:T.warnBg},
          {label:"Aprovados",  value:counts.aprovado,  icon:CheckCircle,   c:T.success,  bg:T.successBg},
          {label:"Reprovados", value:counts.reprovado, icon:XCircle,       c:T.danger,   bg:T.dangerBg},
          {label:"Rascunhos",  value:counts.rascunho,  icon:FileText,      c:"#7C3AED",  bg:"#EDE9FE"},
        ].map(({label,value,icon:Icon,c,bg})=>(
          <Card key={label} style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,background:bg,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={20} color={c}/></div>
            <div><p style={{fontSize:26,fontWeight:800,color:T.text,lineHeight:1}}>{value}</p><p style={{fontSize:12,color:T.textMuted,marginTop:3}}>{label}</p></div>
          </Card>
        ))}
      </div>
      <Card style={{overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:200}}>
            <Search size={14} color={T.textMuted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, CNPJ, CPF, telefone..." style={{paddingLeft:34,height:38}}/>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[{k:"todos",l:"Todos"},{k:"pendente",l:"Pendente"},{k:"aprovado",l:"Aprovado"},{k:"reprovado",l:"Reprovado"},{k:"rascunho",l:"Rascunhos"}].map(({k,l})=>(
              <button key={k} onClick={()=>setFilter(k)} style={{padding:"6px 12px",borderRadius:18,fontSize:12,fontWeight:600,border:"none",background:filter===k?T.brand:T.bg,color:filter===k?"#fff":T.textSub,display:"flex",alignItems:"center",gap:5}}>
                {l}
                {k!=="todos"&&counts[k]>0&&(
                  <span style={{background:filter===k?"rgba(255,255,255,.25)":"rgba(92,46,216,.12)",color:filter===k?"#fff":T.brandMid,borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700}}>{counts[k]}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={load} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.textSub,display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600}}><RefreshCw size={13}/> Atualizar</button>
        </div>
        {loading?(<div style={{padding:56,textAlign:"center"}}><Spin size={26}/><p style={{marginTop:12,color:T.textMuted,fontSize:13}}>Carregando...</p></div>)
        :filtered.length===0?(<div style={{padding:56,textAlign:"center"}}><Users size={36} color={T.border} style={{marginBottom:12}}/><p style={{fontSize:14,color:T.textSub}}>Nenhum encontrado</p></div>)
        :(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:T.bg}}>
                {["Correspondente","CNPJ",filter==="rascunho"?"Telefone":"E-mail","Status","Data","Ações"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((c,i)=>(
                  <tr key={c.id} style={{borderTop:`1px solid ${T.border}`,cursor:"pointer",background:i%2===0?T.surface:"#F6F4FC"}} onClick={()=>setSelected(c)} onMouseEnter={e=>e.currentTarget.style.background=T.brandPale} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?T.surface:"#F6F4FC"}>
                    <td style={{padding:"13px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.brand},${T.brandMid})`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>
                          {c.status==="rascunho"?(c.pj_nome_fantasia?.[0]||"?"):(c.pf_nome?.[0]?.toUpperCase()||"?")}
                        </div>
                        <div>
                          <p style={{fontSize:14,fontWeight:600,color:T.text}}>
                            {c.status==="rascunho"?(c.pj_nome_fantasia||c.pj_razao_social||"Sem nome"):(c.pf_nome||"—")}
                          </p>
                          <p style={{fontSize:11,color:c.status==="rascunho"?T.brandMid:T.textMuted}}>
                            {c.status==="rascunho"?"Lead incompleto":(c.pj_razao_social||"—")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"13px 14px",fontSize:12,color:T.textSub,fontFamily:"'DM Mono',monospace"}}>{c.pj_cnpj?c.pj_cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5"):"—"}</td>
                    <td style={{padding:"13px 14px",fontSize:13,color:T.textSub}}>{c.status==="rascunho"?(c.pj_telefone||"—"):(c.pf_email||"—")}</td>
                    <td style={{padding:"13px 14px"}}><StatusBadge status={c.status}/></td>
                    <td style={{padding:"13px 14px",fontSize:12,color:T.textMuted}}>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td style={{padding:"13px 14px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setSelected(c)} style={{background:T.brandLight,border:"none",borderRadius:7,padding:"6px 9px",color:T.brandMid}}><Eye size={13}/></button>
                        <button onClick={()=>printFicha(c)} style={{background:T.bg,border:"none",borderRadius:7,padding:"6px 9px",color:T.textSub}}><Printer size={13}/></button>
                        <button onClick={()=>onDelete(c.id)} style={{background:T.dangerBg,border:"none",borderRadius:7,padding:"6px 9px",color:T.danger}}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

// DETAIL
function Detail({corban,onBack,onStatus,onDelete,onEdit,onPrint}) {
  const [editing,setEditing]=useState(false);
  const [ed,setEd]=useState(corban);
  const [rejectOpen,setRO]=useState(false);
  const [decisaoTipo,setDecisaoTipo]=useState("reprovado");
  const [decisaoParecer,setDP]=useState("");
  const [parecerErr,setPErr]=useState("");
  const [docs,setDocs]=useState([]);
  const [saving,setSaving]=useState(false);
  const setF=(k,v)=>setEd(f=>({...f,[k]:v}));
  useEffect(()=>{sb.from("corban_documentos").select("*").eq("corban_id",corban.id).then(({data})=>setDocs(data||[]));},[corban.id]);
  const save=async()=>{setSaving(true);await onEdit(corban.id,ed);setEditing(false);setSaving(false);};
  const getUrl=async path=>{const{data}=await sb.storage.from("corban-documentos").createSignedUrl(path,60);if(data?.signedUrl)window.open(data.signedUrl,"_blank");};
  return(
    <div className="fade-in">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 14px",display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:T.textSub}}><ArrowLeft size={14}/> Voltar</button>
          <div>
            <h2 style={{fontSize:19,fontWeight:800,color:T.text}}>
              {ed.status==="rascunho"?(ed.pj_nome_fantasia||ed.pj_razao_social||"Lead incompleto"):(corban.pf_nome||"—")}
            </h2>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}><StatusBadge status={ed.status}/><span style={{fontSize:12,color:T.textMuted}}>{new Date(corban.created_at).toLocaleDateString("pt-BR")}</span></div>
          </div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {!editing&&<>
            <Btn onClick={()=>setEditing(true)} variant="secondary" size="sm" icon={Edit2}>Editar</Btn>
            <Btn onClick={()=>onPrint(ed)} variant="secondary" size="sm" icon={Download}>PDF</Btn>
            {ed.status!=="aprovado"&&<Btn onClick={()=>{setDecisaoTipo("aprovado");setRO(true);}} size="sm" style={{background:T.successBg,color:T.success,boxShadow:"none"}} icon={CheckCircle}>Aprovar</Btn>}
            {ed.status!=="reprovado"&&<Btn onClick={()=>{setDecisaoTipo("reprovado");setRO(true);}} size="sm" style={{background:T.dangerBg,color:T.danger,boxShadow:"none"}} icon={XCircle}>Reprovar</Btn>}
            <Btn onClick={()=>onDelete(corban.id)} variant="danger" size="sm" icon={Trash2}>Deletar</Btn>
          </>}
          {editing&&<><Btn onClick={save} loading={saving} size="sm" icon={Check}>Salvar</Btn><Btn onClick={()=>{setEditing(false);setEd(corban);}} variant="secondary" size="sm" icon={X}>Cancelar</Btn></>}
        </div>
      </div>
      {rejectOpen&&(
        <Card style={{padding:22,marginBottom:20,border:`2px solid ${decisaoTipo==="aprovado"?"#6EE7B7":"#FCA5A5"}`}} className="fade-in">
          <p style={{fontWeight:700,marginBottom:4,fontSize:15,color:T.text}}>{decisaoTipo==="aprovado"?"✅ Aprovar Correspondente":"❌ Reprovar Correspondente"}</p>
          <p style={{fontSize:13,color:T.textSub,marginBottom:14}}>Descreva o motivo da sua decisão. Este parecer ficará registrado na ficha cadastral.</p>
          <textarea value={decisaoParecer} onChange={e=>{setDP(e.target.value);setPErr("");}} rows={4}
            placeholder={decisaoTipo==="aprovado"?"Ex: Documentação completa e verificada. CNPJ ativo, sem restrições...":"Ex: Documentação incompleta. Comprovante vencido..."}
            style={{marginBottom:8}}/>
          {parecerErr&&<p style={{fontSize:12,color:T.danger,marginBottom:8,fontWeight:600}}>{parecerErr}</p>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{
              if(!decisaoParecer.trim()||decisaoParecer.trim().length<10) return setPErr("O parecer é obrigatório e deve ter ao menos 10 caracteres.");
              onStatus(corban.id,decisaoTipo,decisaoParecer.trim());
              setRO(false);setDP("");setPErr("");
            }} size="sm" style={{background:decisaoTipo==="aprovado"?T.success:T.danger,color:"#fff",boxShadow:"none"}} icon={decisaoTipo==="aprovado"?CheckCircle:XCircle}>
              Confirmar {decisaoTipo==="aprovado"?"Aprovação":"Reprovação"}
            </Btn>
            <Btn onClick={()=>{setRO(false);setDP("");setPErr("");}} variant="secondary" size="sm">Cancelar</Btn>
          </div>
        </Card>
      )}
      {ed.status_motivo&&(
        <div style={{background:ed.status==="aprovado"?T.successBg:T.dangerBg,border:`1px solid ${ed.status==="aprovado"?"#6EE7B7":"#FCA5A5"}`,borderRadius:12,padding:"11px 16px",marginBottom:16,fontSize:13,color:ed.status==="aprovado"?T.success:T.danger}}>
          <strong>Parecer da {ed.status==="aprovado"?"aprovação":"reprovação"}:</strong> {ed.status_motivo}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{overflow:"hidden"}}>
          <SecHead icon={User} title="Representante Legal"/>
          <div style={{padding:18}}>
            {editing?(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <FF label="Nome" name="pf_nome" value={ed.pf_nome} onChange={setF}/>
                <FF label="CPF" name="pf_cpf" value={ed.pf_cpf} onChange={setF} mask="cpf"/>
                <FF label="RG" name="pf_rg" value={ed.pf_rg} onChange={setF}/>
                <FF label="Nascimento" name="pf_nascimento" value={ed.pf_nascimento} onChange={setF} type="date"/>
                <FF label="Nome da Mãe" name="pf_mae" value={ed.pf_mae} onChange={setF}/>
                <FF label="E-mail" name="pf_email" value={ed.pf_email} onChange={setF}/>
                <FF label="Telefone" name="pf_telefone" value={ed.pf_telefone} onChange={setF} mask="tel"/>
                <FF label="Endereço" name="pf_endereco" value={ed.pf_endereco} onChange={setF}/>
                <FF label="Cidade" name="pf_cidade" value={ed.pf_cidade} onChange={setF}/>
              </div>
            ):(
              <><DR label="Nome Completo" value={ed.pf_nome}/><DR label="CPF" value={ed.pf_cpf?.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,"$1.$2.$3-$4")||ed.pf_cpf} mono/><DR label="RG" value={ed.pf_rg}/><DR label="Data Nascimento" value={ed.pf_nascimento}/><DR label="Nome da Mãe" value={ed.pf_mae}/><DR label="Sexo" value={ed.pf_sexo}/><DR label="E-mail" value={ed.pf_email}/><DR label="Telefone" value={ed.pf_telefone}/><DR label="Estado Civil" value={ed.pf_estado_civil}/><DR label="Naturalidade" value={ed.pf_naturalidade?`${ed.pf_naturalidade} - ${ed.pf_naturalidade_uf}`:null}/><DR label="Endereço" value={ed.pf_endereco}/><DR label="Cidade/UF" value={ed.pf_cidade?`${ed.pf_cidade}—${ed.pf_uf}`:null}/><DR label="CEP" value={ed.pf_cep}/></>
            )}
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card style={{overflow:"hidden"}}>
            <SecHead icon={Building2} title="Pessoa Jurídica"/>
            <div style={{padding:18}}>
              {editing?(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <FF label="Razão Social" name="pj_razao_social" value={ed.pj_razao_social} onChange={setF}/>
                  <FF label="Nome Fantasia" name="pj_nome_fantasia" value={ed.pj_nome_fantasia} onChange={setF}/>
                  <FF label="CNPJ" name="pj_cnpj" value={ed.pj_cnpj} onChange={setF} mask="cnpj"/>
                  <FF label="Telefone" name="pj_telefone" value={ed.pj_telefone} onChange={setF} mask="tel"/>
                  <FF label="Regime" name="pj_regime" value={ed.pj_regime} onChange={setF}/>
                </div>
              ):(
                <><DR label="Código Parceiro" value={ed.codigo_parceiro||"—"}/><DR label="Razão Social" value={ed.pj_razao_social}/><DR label="Nome Fantasia" value={ed.pj_nome_fantasia}/><DR label="CNPJ" value={ed.pj_cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5")||ed.pj_cnpj} mono/><DR label="Telefone Empresa" value={ed.pj_telefone}/><DR label="Endereço PJ" value={ed.pj_endereco}/><DR label="Regime" value={ed.pj_regime}/></>
              )}
            </div>
          </Card>
          <Card style={{overflow:"hidden"}}>
            <SecHead icon={CreditCard} title="Dados Bancários"/>
            <div style={{padding:18}}>
              {editing?(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <FF label="Banco" name="banco_nome" value={ed.banco_nome} onChange={setF}/>
                  <FF label="Agência" name="banco_agencia" value={ed.banco_agencia} onChange={setF}/>
                  <FF label="Conta" name="banco_conta" value={ed.banco_conta} onChange={setF}/>
                  <FF label="Dígito" name="banco_digito" value={ed.banco_digito} onChange={setF}/>
                  <FF label="PIX" name="banco_pix" value={ed.banco_pix} onChange={setF}/>
                </div>
              ):(
                <><DR label="Banco" value={ed.banco_nome}/><DR label="Agência" value={ed.banco_agencia} mono/><DR label="Conta/Dígito" value={ed.banco_conta?`${ed.banco_conta}-${ed.banco_digito}`:null} mono/><DR label="Chave PIX" value={ed.banco_pix}/></>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Card style={{marginTop:16,overflow:"hidden"}}>
        <SecHead icon={FileText} title={`Documentos Anexados${docs.length>0?` (${docs.length})`:""}`} sub="Clique para visualizar cada documento"/>
        <div style={{padding:18}}>
          {docs.length===0
            ?<p style={{fontSize:13,color:T.textMuted,textAlign:"center",padding:"12px 0"}}>Nenhum documento anexado.</p>
            :<div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {docs.map(doc=>(
                <button key={doc.id} onClick={()=>getUrl(doc.storage_path)} style={{background:T.brandPale,border:`1px solid ${T.brandLight}`,borderRadius:9,padding:"8px 14px",color:T.brandMid,fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:7}}>
                  <FileText size={12}/>{doc.tipo.replace(/_/g," ")}<Download size={10}/>
                </button>
              ))}
            </div>
          }
        </div>
      </Card>
    </div>
  );
}

function AdminLayout({user,onLogout,children}) {
  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg}}><style>{G}</style>
      <aside style={{width:240,background:T.sidebar,flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"24px 18px",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
            <div style={{width:32,height:32,background:`linear-gradient(135deg,${T.brand},${T.brandMid})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><Star size={16} color="#fff" fill="#fff"/></div>
            <div><p style={{fontSize:14,fontWeight:800,color:"#fff"}}>Starcard</p><p style={{fontSize:10,color:"#8B7FBD"}}>Painel Corban</p></div>
          </div>
          {[{icon:Users,label:"Correspondentes",active:true},{icon:TrendingUp,label:"Relatórios"},{icon:Shield,label:"Configurações"}].map(({icon:Icon,label,active})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:9,background:active?"rgba(124,58,237,.25)":"transparent",color:active?"#C4B5FD":"#8B7FBD",fontWeight:active?600:400,fontSize:13,cursor:"pointer",marginBottom:2}}><Icon size={15}/>{label}</div>
          ))}
        </div>
        <div style={{padding:"14px 18px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
            <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.brand},#A78BFA)`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{user?.email?.[0]?.toUpperCase()||"G"}</div>
            <div style={{minWidth:0}}><p style={{fontSize:12,fontWeight:700,color:"#E0E7FF"}}>Gestor Corban</p><p style={{fontSize:11,color:"#8B7FBD",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</p></div>
          </div>
          <button onClick={onLogout} style={{width:"100%",background:"rgba(239,68,68,.12)",border:"none",borderRadius:8,padding:"8px 12px",color:"#FCA5A5",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:7}}><LogOut size={12}/> Sair</button>
        </div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"13px 24px"}}><p style={{fontSize:14,fontWeight:700,color:T.text}}>Gestão de Correspondentes Bancários</p></div>
        <div style={{flex:1,padding:24,overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

const Toast=({msg,type})=>{const bg={success:T.success,error:T.danger,warn:T.warn}[type]||T.success;return<div style={{position:"fixed",top:18,right:18,background:bg,color:"#fff",padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14,zIndex:9999,display:"flex",alignItems:"center",gap:9,boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}><CheckCircle size={14}/>{msg}</div>;};

// FIX 3: fichaHTML filtra valores falsos/zero no PDF
function fichaHTML(c) {
  const statusBg  = c.status==="aprovado"?"#ECFDF5":c.status==="reprovado"?"#FEF2F2":"#FFFBEB";
  const statusClr = c.status==="aprovado"?"#059669":c.status==="reprovado"?"#DC2626":"#D97706";
  const dataEmit  = new Date().toLocaleDateString("pt-BR");
  const dataCad   = c.created_at?new Date(c.created_at).toLocaleDateString("pt-BR"):"—";
  const dataDecis = c.aprovado_em?new Date(c.aprovado_em).toLocaleString("pt-BR"):"—";
  const parecer   = c.parecer_decisao||c.status_motivo||"";
  const val = (v,...bad) => (v&&!bad.includes(v))?v:"&#8212;";

  const css = [
    "body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;font-size:13px}",
    "h1{font-size:20px;color:#5C2ED8;margin-bottom:4px}",
    "h2{font-size:16px;color:#5C2ED8;margin-bottom:4px}",
    ".sub{font-size:12px;color:#888;margin-bottom:28px;border-bottom:1px solid #eee;padding-bottom:10px}",
    ".sec{margin-bottom:20px}",
    ".sec-t{font-size:11px;font-weight:700;color:#5C2ED8;text-transform:uppercase;letter-spacing:.6px;padding:7px 12px;background:#F3F1FD;border-radius:8px;margin-bottom:10px}",
    "table{width:100%;border-collapse:collapse}",
    "td{padding:7px 10px;border-bottom:1px solid #eee}",
    "td:first-child{font-weight:600;color:#666;width:38%}",
    ".badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:"+statusBg+";color:"+statusClr+"}",
    ".footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:16px}",
    ".parecer-box{border:1px solid #E2DFF2;border-radius:8px;padding:18px 20px;background:#FAFAFE;font-size:14px;line-height:1.7;min-height:120px;white-space:pre-wrap}",
    ".nota-box{border:1px solid #E2DFF2;border-radius:8px;padding:14px 18px;margin-bottom:20px;background:#F3F1FD;font-size:12px;color:#5C2ED8}",
    ".assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px}",
    ".ass-linha{border-top:1px solid #000;padding-top:8px;text-align:center;font-size:12px}",
    ".ass-nome{font-size:11px;color:#888}",
  ].join("");

  let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
    + "<title>Ficha — "+(c.pf_nome||c.pj_nome_fantasia||"")+"</title>"
    + "<style>"+css+"</style></head><body>"
    + "<h1>&#9733; Starcard &#8212; Ficha Cadastral Correspondente Banc&#225;rio</h1>"
    + "<p class='sub'>Emitido em "+dataEmit+" &bull; Status: <span class='badge'>"+(c.status||"pendente").toUpperCase()+"</span></p>"

    + "<div class='sec'><div class='sec-t'>Representante Legal</div><table>"
    + "<tr><td>Nome</td><td>"+val(c.pf_nome,"")+"</td></tr>"
    + "<tr><td>CPF</td><td>"+val(c.pf_cpf,"","00000000000")+"</td></tr>"
    + "<tr><td>RG</td><td>"+val(c.pf_rg,"")+"</td></tr>"
    + "<tr><td>Nascimento</td><td>"+val(c.pf_nascimento,"")+"</td></tr>"
    + "<tr><td>Nome da M&#227;e</td><td>"+val(c.pf_mae,"")+"</td></tr>"
    + "<tr><td>Sexo / Estado Civil</td><td>"+val(c.pf_sexo,"")+" / "+val(c.pf_estado_civil,"")+"</td></tr>"
    + "<tr><td>Naturalidade</td><td>"+val(c.pf_naturalidade,"")+" "+( c.pf_naturalidade_uf||"")+"</td></tr>"
    + "<tr><td>Endere&#231;o</td><td>"+val(c.pf_endereco,"")+" "+(c.pf_complemento||"")+"</td></tr>"
    + "<tr><td>Cidade / UF</td><td>"+val(c.pf_cidade,"")+" / "+val(c.pf_uf,"")+"</td></tr>"
    + "<tr><td>E-mail</td><td>"+val(c.pf_email,"","-")+"</td></tr>"
    + "<tr><td>Telefone</td><td>"+val(c.pf_telefone,"","00000000000")+"</td></tr>"
    + "</table></div>"

    + "<div class='sec'><div class='sec-t'>Pessoa Jur&#237;dica</div><table>"
    + "<tr><td>C&#243;digo Parceiro</td><td>"+val(c.codigo_parceiro,"")+"</td></tr>"
    + "<tr><td>Raz&#227;o Social</td><td>"+val(c.pj_razao_social,"")+"</td></tr>"
    + "<tr><td>Nome Fantasia</td><td>"+val(c.pj_nome_fantasia,"")+"</td></tr>"
    + "<tr><td>CNPJ</td><td>"+val(c.pj_cnpj,"")+"</td></tr>"
    + "<tr><td>Telefone</td><td>"+val(c.pj_telefone,"","00000000000")+"</td></tr>"
    + "<tr><td>Endere&#231;o PJ</td><td>"+val(c.pj_endereco,"")+"</td></tr>"
    + "<tr><td>Regime Tribut&#225;rio</td><td>"+val(c.pj_regime,"")+"</td></tr>"
    + "</table></div>"

    + "<div class='sec'><div class='sec-t'>Dados Banc&#225;rios</div><table>"
    + "<tr><td>Banco</td><td>"+val(c.banco_nome,"")+"</td></tr>"
    + "<tr><td>Ag&#234;ncia</td><td>"+val(c.banco_agencia,"")+"</td></tr>"
    + "<tr><td>Conta / D&#237;gito</td><td>"+val(c.banco_conta,"")+" - "+val(c.banco_digito,"")+"</td></tr>"
    + "<tr><td>Chave PIX</td><td>"+val(c.banco_pix,"")+"</td></tr>"
    + "</table></div>"

    + "<div class='footer'>Starcard &bull; corban@starbank.tec.br &bull; (11) 99197-3406</div>";

  if(parecer){
    html += "<div style='page-break-before:always;padding-top:32px'>"
      + "<h2>Parecer de An&#225;lise Cadastral</h2>"
      + "<p class='sub'>Segunda via &#8212; Uso interno Starcard</p>"
      + "<div class='sec'><div class='sec-t'>Identifica&#231;&#227;o do Cadastro</div><table>"
      + "<tr><td>Correspondente</td><td>"+(c.pf_nome||c.pj_nome_fantasia||"&#8212;")+"</td></tr>"
      + "<tr><td>CPF</td><td>"+val(c.pf_cpf,"","00000000000")+"</td></tr>"
      + "<tr><td>CNPJ</td><td>"+val(c.pj_cnpj,"")+"</td></tr>"
      + "<tr><td>Raz&#227;o Social</td><td>"+val(c.pj_razao_social,"")+"</td></tr>"
      + "<tr><td>Data de Cadastro</td><td>"+dataCad+"</td></tr>"
      + "</table></div>"
      + "<div class='sec'><div class='sec-t'>Decis&#227;o de An&#225;lise</div><table>"
      + "<tr><td>Status</td><td><span class='badge'>"+(c.status||"pendente").toUpperCase()+"</span></td></tr>"
      + "<tr><td>Respons&#225;vel</td><td>"+(c.aprovado_por_nome||"&#8212;")+"</td></tr>"
      + "<tr><td>Data / Hora</td><td>"+dataDecis+"</td></tr>"
      + "</table></div>"
      + "<div class='sec'><div class='sec-t'>Parecer e Justificativa</div>"
      + "<div class='parecer-box'>"+parecer.replace(/</g,"&lt;").replace(/>/g,"&gt;")+"</div></div>"
      + "<div class='nota-box'><strong>Validade:</strong> Este parecer foi emitido no momento da an&#225;lise e integra a ficha cadastral.</div>"
      + "<div class='assinaturas'>"
      + "<div><div class='ass-linha'>Assinatura do Respons&#225;vel<br/><span class='ass-nome'>"+(c.aprovado_por_nome||"___________________________")+"</span></div></div>"
      + "<div><div class='ass-linha'>Visto &#8212; Gest&#227;o Starcard<br/><span class='ass-nome'>___________________________</span></div></div>"
      + "</div>"
      + "<div class='footer'>Documento de uso interno &bull; Starcard &bull; "+dataEmit+"</div>"
      + "</div>";
  }

  html += "</body></html>";
  return html;
}

function AppInner() {
  const [user,setUser]=useState(null);
  const [ready,setReady]=useState(false);
  const [page,setPage]=useState("landing");
  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);if(session?.user)setPage("dashboard");setReady(true);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,s)=>{setUser(s?.user??null);if(s?.user)setPage("dashboard");else setPage("landing");});
    return()=>subscription.unsubscribe();
  },[]);
  if(!ready)return(<div style={{minHeight:"100vh",background:T.sidebar,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><style>{G}</style><div style={{width:40,height:40,background:`linear-gradient(135deg,${T.brand},${T.brandMid})`,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center"}} className="pulse"><Star size={20} color="#fff" fill="#fff"/></div><p style={{color:"#8B7FBD",fontSize:13}}>Carregando...</p></div>);
  if(page==="login")    return <Login onBack={()=>setPage("landing")}/>;
  if(page==="register") return <Wizard onDone={()=>setPage("success")} onBack={()=>setPage("landing")}/>;
  if(page==="success")  return <Success onBack={()=>setPage("landing")}/>;
  if(page==="dashboard"&&user) return <Dashboard user={user} onLogout={async()=>{await sb.auth.signOut();setPage("landing");}}/>;
  return <Landing onRegister={()=>setPage("register")} onLogin={()=>setPage("login")}/>;
}

export default function App() {
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}