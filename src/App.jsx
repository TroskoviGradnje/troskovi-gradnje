import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";

// ─── DIZAJN SISTEM ───────────────────────────────────────────────────────────
const C = {
  bg:      "#F7F5F0",
  bg2:     "#EDEAE3",
  bg3:     "#FFFFFF",
  border:  "#E0DBD0",
  border2: "#CCC7BA",
  text:    "#1C1A16",
  muted:   "#6B6357",
  dim:     "#9E9890",
  gold:    "#8B5E1A",
  goldL:   "#C4923A",
  goldBg:  "#FDF6EB",
  green:   "#2D6A3F",
  greenBg: "#EEF7F1",
  greenBd: "#90CCA4",
  red:     "#C0392B",
  redBg:   "#FDF0EE",
  redBd:   "#E8B4B0",
  blue:    "#1A4A8B",
  blueBg:  "#EEF2FB",
  blueBd:  "#90AADA",
  font:    "'DM Sans','Segoe UI Variable',sans-serif",
  serif:   "'DM Serif Display','Georgia',serif",
  shadow:  "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  shadowL: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
};

const inp = (x={}) => ({ background:"#fff", border:`1px solid ${C.border2}`, borderRadius:8, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:C.font, boxSizing:"border-box", outline:"none", width:"100%", ...x });
const card = (x={}) => ({ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:12, boxShadow:C.shadow, ...x });
const pill = (color="gold") => {
  const m = { gold:{bg:C.goldBg,bd:C.goldL,cl:C.gold}, green:{bg:C.greenBg,bd:C.greenBd,cl:C.green}, red:{bg:C.redBg,bd:C.redBd,cl:C.red}, blue:{bg:C.blueBg,bd:C.blueBd,cl:C.blue} };
  const s = m[color]||m.gold;
  return { fontSize:11, background:s.bg, border:`1px solid ${s.bd}`, color:s.cl, borderRadius:20, padding:"3px 10px", fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 };
};
const btn = (v="gold",x={}) => {
  const m = { gold:{background:C.gold,color:"#fff",border:"none"}, ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border2}`}, danger:{background:C.redBg,color:C.red,border:`1px solid ${C.redBd}`}, green:{background:C.greenBg,color:C.green,border:`1px solid ${C.greenBd}`}, purple:{background:"#534AB7",color:"#fff",border:"none"}, dark:{background:C.text,color:"#fff",border:"none"} };
  return { ...(m[v]||m.gold), borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:C.font, transition:"all 0.15s", ...x };
};

// ─── PODACI ───────────────────────────────────────────────────────────────────
const INIT_KATEGORIJE = [
  { id:"zemljani", naziv:"Zemljani radovi", ikona:"⛏", stavke:[
    {id:"ir",naziv:"Ručni iskop zemlje",jm:"m³",cijena:28},
    {id:"im",naziv:"Mašinski iskop",jm:"m³",cijena:12},
    {id:"na",naziv:"Nasipanje i zbijanje",jm:"m³",cijena:18},
    {id:"od",naziv:"Odvoz viška materijala",jm:"m³",cijena:22},
  ]},
  { id:"betonski", naziv:"Betonski radovi", ikona:"🏗", stavke:[
    {id:"te",naziv:"Betoniranje temelja MB 25",jm:"m³",cijena:145},
    {id:"pl",naziv:"Armirano-betonska ploča",jm:"m²",cijena:65},
    {id:"st",naziv:"AB stub 30×30",jm:"m¹",cijena:95},
    {id:"gr",naziv:"AB greda 25×50",jm:"m¹",cijena:88},
    {id:"za",naziv:"AB zid d=20cm",jm:"m²",cijena:72},
  ]},
  { id:"zidarski", naziv:"Zidarski radovi", ikona:"🧱", stavke:[
    {id:"b25",naziv:"Zidanje blok opekom 25cm",jm:"m²",cijena:38},
    {id:"b20",naziv:"Zidanje blok opekom 20cm",jm:"m²",cijena:33},
    {id:"op",naziv:"Zidanje punom opekom",jm:"m²",cijena:45},
    {id:"pr",naziv:"Pregradni zid 10cm",jm:"m²",cijena:22},
  ]},
  { id:"fasaderski", naziv:"Fasaderski radovi", ikona:"🏠", stavke:[
    {id:"mv",naziv:"Vanjska žbuka u dva sloja",jm:"m²",cijena:28},
    {id:"st2",naziv:"Toplinska fasada (stiropor 10cm)",jm:"m²",cijena:65},
    {id:"mu",naziv:"Unutarnja gips žbuka",jm:"m²",cijena:18},
    {id:"gl",naziv:"Gletovanje i glačanje",jm:"m²",cijena:12},
  ]},
  { id:"podopolaganje", naziv:"Podopolaganje", ikona:"▦", stavke:[
    {id:"ke",naziv:"Postavljanje keramike",jm:"m²",cijena:22},
    {id:"pa",naziv:"Postavljanje parketa",jm:"m²",cijena:18},
    {id:"la",naziv:"Postavljanje laminata",jm:"m²",cijena:12},
    {id:"es",naziv:"Cementni estrih d=5cm",jm:"m²",cijena:24},
  ]},
  { id:"krovni", naziv:"Krovni radovi", ikona:"△", stavke:[
    {id:"kd",naziv:"Drvena krovna konstrukcija",jm:"m²",cijena:55},
    {id:"kc",naziv:"Pokrivanje crijepom",jm:"m²",cijena:32},
    {id:"kl",naziv:"Pokrivanje limom (pocinčani)",jm:"m²",cijena:28},
    {id:"hi",naziv:"Hidroizolacija krova",jm:"m²",cijena:18},
  ]},
];

const INIT_FAZE_KAT = {
  f1:[
    {id:"f1-a",naziv:"Iskop i betoniranje temelja",jm:"m³",cijena:145,opis:"Ručni i mašinski iskop + beton"},
    {id:"f1-b",naziv:"AB konstrukcija",jm:"m²",cijena:80,opis:"Stubovi, grede, ploče"},
    {id:"f1-c",naziv:"Zidanje vanjskih zidova",jm:"m²",cijena:38,opis:"Blok opeka 25cm"},
    {id:"f1-d",naziv:"Krovišna konstrukcija",jm:"m²",cijena:55,opis:"Drvena krovna konstrukcija"},
    {id:"f1-e",naziv:"Pokrivanje krova",jm:"m²",cijena:32,opis:"Crijep ili lim"},
  ],
  f2:[
    {id:"f2-a",naziv:"Pregradni zidovi",jm:"m²",cijena:22,opis:"Blok opeka 10cm"},
    {id:"f2-b",naziv:"Vanjska fasada",jm:"m²",cijena:65,opis:"Stiropor 10cm + žbuka"},
    {id:"f2-c",naziv:"Unutarnja žbuka",jm:"m²",cijena:18,opis:"Gips žbuka u dva sloja"},
    {id:"f2-d",naziv:"Stolarija",jm:"kom",cijena:800,opis:"Prozori i vanjska vrata"},
    {id:"f2-e",naziv:"Grube instalacije",jm:"m²",cijena:35,opis:"Voda, kanalizacija, struja"},
  ],
  f3:[
    {id:"f3-a",naziv:"Gletovanje i bojenje",jm:"m²",cijena:16,opis:"Dva sloja glet + boja"},
    {id:"f3-b",naziv:"Podne obloge",jm:"m²",cijena:22,opis:"Keramika ili parket"},
    {id:"f3-c",naziv:"Unutarnja vrata",jm:"kom",cijena:350,opis:"Ugradnja komplet"},
    {id:"f3-d",naziv:"Kupatilo i kuhinja",jm:"m²",cijena:85,opis:"Pločice + sanitarije"},
    {id:"f3-e",naziv:"Završne instalacije",jm:"m²",cijena:25,opis:"Utičnice, osvjetljenje"},
  ],
};

const FAZE = [
  {id:"f1",naziv:"Faza 1 — Gruba gradnja",ikona:"🏗",cijena:45000,
   opis:"Nosivi skelet objekta: temelji, AB konstrukcija, zidanje i krov.",
   stavke:["Iskop i betoniranje temelja","AB konstrukcija","Zidanje vanjskih zidova","Krovišna konstrukcija","Pokrivanje"]},
  {id:"f2",naziv:"Faza 2 — Zatvaranje objekta",ikona:"🧱",cijena:32000,
   opis:"Pregradni zidovi, žbuka, stolarija i grube instalacije.",
   stavke:["Pregradni zidovi","Vanjska fasada","Unutarnja žbuka","Stolarija","Grube instalacije"]},
  {id:"f3",naziv:"Faza 3 — Završni radovi",ikona:"✨",cijena:28000,
   opis:"Gletovanje, podne obloge, vrata, kupatilo i završne instalacije.",
   stavke:["Gletovanje i bojenje","Podne obloge","Unutarnja vrata","Kupatilo i kuhinja","Završne instalacije"]},
];

const INIT_PROFIL = {naziv:"Vaš Izvođač d.o.o.",telefon:"+387 65 123 456",email:"info@vasizvođač.ba",adresa:"Banja Luka, BiH",pdv:"",opis:"Kvalitetna gradnja po pristupačnim cijenama. Više od 15 godina iskustva."};

const fmtKM = (n) => Number(n).toLocaleString("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2})+" KM";
const genId = () => Math.random().toString(36).slice(2,9);

// ─── SUPABASE ────────────────────────────────────────────────────────────────

// Auth — real Supabase Auth. Password hashing/verification is handled by
// Supabase itself; korisnici is just the profile row (uloga/firma_id) keyed
// by the same id as auth.users.
async function login(email, password) {
  try {
    const {data,error} = await supabase.auth.signInWithPassword({email,password});
    if(error||!data?.user) return null;
    return await getKorisnikProfil(data.user.id);
  } catch { return null; }
}
async function getKorisnikProfil(userId) {
  try {
    const {data} = await supabase.from('korisnici').select('*').eq('id',userId).single();
    return data||null;
  } catch { return null; }
}
async function getFirma(firmaId) {
  try {
    const {data} = await supabase.from('firme').select('*').eq('id',firmaId).single();
    return data;
  } catch { return null; }
}
async function getFirmaBySlug(slug) {
  try {
    const {data} = await supabase.from('firme').select('*').eq('slug',slug).single();
    return data;
  } catch { return null; }
}
async function getAllFirme() {
  try {
    const {data} = await supabase.from('firme').select('*').order('naziv');
    return data||[];
  } catch { return []; }
}
async function getAllKorisnici() {
  try {
    const {data} = await supabase.from('korisnici').select('id,email,uloga,firma_id,created_at').order('created_at');
    return data||[];
  } catch { return []; }
}
// Resetting ANOTHER user's password, or creating/deleting an account, needs
// the service role key — routed through the admin-users edge function, which
// re-checks server-side that the caller is a superadmin before doing anything.
async function invokeAdminUsers(method, path, body) {
  try {
    const {data,error} = await supabase.functions.invoke(`admin-users${path||""}`, {method,body});
    if(error) return {error:error.message};
    return data;
  } catch(e) { return {error:e.message}; }
}
async function updatePassword(korisnikId, newPassword) {
  const res = await invokeAdminUsers("PATCH", `/${korisnikId}`, {password:newPassword});
  return !res?.error;
}
async function dodajFirmu(naziv, slug) {
  try {
    const {data} = await supabase.from('firme').insert({id:genId(),naziv,slug}).select().single();
    return data;
  } catch { return null; }
}
async function dodajKorisnika(firmaId, email, password) {
  const res = await invokeAdminUsers("POST", "", {firmaId,email,password});
  return res?.error ? null : res.data;
}
async function obrisiKorisnika(id) {
  const res = await invokeAdminUsers("DELETE", `/${id}`);
  return !res?.error;
}
async function obrisiFiremu(id) {
  try { await supabase.from('firme').delete().eq('id',id); return true; } catch { return false; }
}

// Settings per firma
async function dbGet(key, fallback, firmaId=null) {
  try {
    let q = supabase.from('settings').select('data').eq('key',key);
    if(firmaId) q = q.eq('firma_id',firmaId); else q = q.is('firma_id',null);
    const {data,error} = await q.single();
    if(error||!data) return fallback; return data.data;
  } catch { return fallback; }
}
async function dbSet(key, value, firmaId=null) {
  try {
    // Delete existing record first, then insert — avoids constraint issues
    let dq = supabase.from('settings').delete().eq('key',key);
    if(firmaId) dq = dq.eq('firma_id',firmaId); else dq = dq.is('firma_id',null);
    await dq;
    const rec = {key, data:value, updated_at:new Date().toISOString(), firma_id:firmaId||null};
    await supabase.from('settings').insert(rec);
  } catch(e){console.error('dbSet error:',e);}
}

// Upiti per firma
async function upitiGet(firmaId=null) {
  try {
    let q = supabase.from('upiti').select('*').order('created_at',{ascending:false});
    if(firmaId) q = q.eq('firma_id',firmaId);
    const {data,error} = await q;
    if(error||!data) return [];
    return data.map(r=>({...r.data,_firma_id:r.firma_id}));
  } catch { return []; }
}
async function upitiUpsert(upit, firmaId=null) {
  try {
    const rec = {id:upit.id,data:upit,created_at:new Date().toISOString()};
    if(firmaId) rec.firma_id=firmaId;
    await supabase.from('upiti').upsert(rec);
  } catch(e){console.error(e);}
}
async function upitiUpdate(upit) {
  try { await supabase.from('upiti').update({data:upit}).eq('id',upit.id); } catch(e){console.error(e);}
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const GFont = () => <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />;

const TitleBar = ({ onAdmin, onBack, title="Troškovi gradnje" }) => (
  <div style={{height:36,background:C.bg3,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px 0 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0,boxShadow:"0 1px 0 rgba(0,0,0,0.04)"}}>
    <span style={{fontSize:14,color:C.text,fontWeight:700,letterSpacing:"0.01em"}}>{title}</span>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {onBack && <button onClick={onBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12,padding:"0 12px",fontFamily:C.font,display:"flex",alignItems:"center",gap:4}}>← Klijentski prikaz</button>}
      {onAdmin && <button onClick={onAdmin} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:11,padding:"0 10px",fontFamily:C.font}}>Admin</button>}
      {["–","□","✕"].map(s=><div key={s} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.dim,cursor:"pointer",borderRadius:4}}>{s}</div>)}
    </div>
  </div>
);

const StatusBadge = ({s}) => {
  const m = {nov:{color:"gold",label:"Novi upit",dot:"🟡"},pregledano:{color:"blue",label:"Pregledano",dot:"🔵"},potvrdjeno:{color:"green",label:"Potvrđeno",dot:"🟢"}};
  const x=m[s]||m.nov;
  return <span style={pill(x.color)}>{x.dot} {x.label}</span>;
};

const M3Info = ({naziv}) => {
  const [open,setOpen] = useState(false);
  const FORMULE = { iskop:{f:"dužina × širina × dubina",p:"6m × 4m × 1.2m = 28.8 m³"}, beton:{f:"dužina × širina × debljina",p:"10m × 5m × 0.25m = 12.5 m³"}, nasip:{f:"dužina × širina × visina",p:"8m × 5m × 0.4m = 16 m³"}, default:{f:"dužina × širina × visina",p:"5m × 4m × 0.3m = 6 m³"} };
  const n=naziv.toLowerCase();
  const {f,p}=FORMULE[n.includes("iskop")?"iskop":n.includes("beton")||n.includes("ab ")?"beton":n.includes("nasip")?"nasip":"default"];
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <span onClick={e=>{e.stopPropagation();setOpen(!open)}} style={{width:16,height:16,borderRadius:"50%",background:open?C.gold:C.bg2,border:`1px solid ${open?C.gold:C.border2}`,color:open?"#fff":C.muted,fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:5,userSelect:"none",transition:"all 0.15s"}}>i</span>
      {open&&(<><span onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:99}}/><div style={{position:"absolute",left:22,top:"50%",transform:"translateY(-50%)",zIndex:100,...card(),padding:"10px 14px",width:230}}><p style={{fontSize:11,color:C.dim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 6px"}}>Kako izračunati m³</p><p style={{fontSize:13,color:C.text,fontWeight:500,margin:"0 0 4px"}}>{f}</p><p style={{fontSize:12,color:C.muted,margin:0,fontStyle:"italic"}}>Npr: {p}</p></div></>)}
    </span>
  );
};

const DaNeBtn = ({val,aktivan,onClick}) => (
  <button onClick={onClick} style={{flex:1,padding:"11px",fontSize:14,fontWeight:700,borderRadius:9,cursor:"pointer",fontFamily:C.font,border:`1.5px solid ${aktivan?C.gold:C.border2}`,background:aktivan?C.goldBg:"#fff",color:aktivan?C.gold:C.muted,transition:"all 0.15s"}}>
    {val===true?"DA":"NE"}
  </button>
);

const Sekcija = ({label,children,required}) => (
  <div style={{marginBottom:"1.5rem"}}>
    <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:8}}>
      {label} {required&&<span style={{color:C.red}}>*</span>}
    </label>
    {children}
  </div>
);

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({onLogin,onCancel,firmaSlug}) {
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    if(!email||!pass)return;
    setLoading(true);setErr("");
    const korisnik = await login(email, pass);
    if(!korisnik){setErr("Pogrešan email ili lozinka.");setLoading(false);return;}
    if(korisnik.uloga==="admin" && firmaSlug) {
      const firma = await getFirma(korisnik.firma_id);
      if(!firma||firma.slug!==firmaSlug){setErr("Nemate pristup ovoj firmi.");setLoading(false);return;}
    }
    setLoading(false);
    onLogin(korisnik);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GFont/>
      <TitleBar onBack={onCancel}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{...card(),padding:"2rem 2.5rem",width:360}}>
          <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
            <div style={{width:52,height:52,background:C.goldBg,border:`1px solid ${C.goldL}`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem",fontSize:24}}>🔐</div>
            <h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Admin panel</h2>
            <p style={{fontSize:13,color:C.dim,margin:0}}>{firmaSlug?`Firma: ${firmaSlug}`:"Prijava"}</p>
          </div>
          <input type="email" placeholder="Email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...inp(),marginBottom:10}}/>
          <input type="password" placeholder="Lozinka" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...inp(),border:`1px solid ${err?C.red:C.border2}`,marginBottom:8}}/>
          {err&&<p style={{fontSize:12,color:C.red,margin:"0 0 8px"}}>{err}</p>}
          <button onClick={submit} disabled={loading} style={{...btn("gold"),width:"100%",padding:"11px",fontSize:14}}>{loading?"Provjera...":"Prijavi se"}</button>
          <button onClick={onCancel} style={{...btn("ghost"),width:"100%",border:"none",marginTop:6,fontSize:13}}>Odustani</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({kategorije:katInit,setKategorije:syncKategorije,upiti,setUpiti,fazeKatProp,onFazeKatChange,firmaId,korisnik,onBack,onLogout,onChangePass}) {
  const [tab,setTab] = useState("dashboard");
  // Lokalni state — ne šalje u bazu dok ne klikneš Sačuvaj
  const [kategorije,setKategorijeLok] = useState(katInit);
  const [fazeKat,setFazeKatLok] = useState(fazeKatProp);
  const [katPromjene,setKatPromjene] = useState(false);
  const [fazePromjene,setFazePromjene] = useState(false);
  const [sprema,setSprema] = useState(false);

  // Wrapper koji prati promjene lokalno
  const setKategorije = (next) => {
    setKategorijeLok(prev => {
      const r = typeof next === "function" ? next(prev) : next;
      setKatPromjene(true);
      return r;
    });
  };
  const sacuvajFazeKat = (next) => {
    setFazeKatLok(next);
    setFazePromjene(true);
  };

  // Dynamic faze list
  const [fazeList,setFazeListRaw] = useState(FAZE);
  const [fazeListPromjene,setFazeListPromjene] = useState(false);
  useEffect(()=>{ dbGet("faze_list",FAZE,firmaId).then(f=>{ setFazeListRaw(f); if(f.length>0&&!aktivnaAdminFaza) setAktivnaAdminFaza(f[0].id); }); },[]);
  const saveFazeList = (next) => { setFazeListRaw(next); setFazeListPromjene(true); };

  const dodajFazu = () => {
    if(!novaFaza.naziv) return;
    const id = `f${genId()}`;
    const nova = {id,naziv:novaFaza.naziv,ikona:novaFaza.ikona||"🏗",opis:novaFaza.opis,cijena:parseFloat(novaFaza.cijena)||0,stavke:[]};
    saveFazeList([...fazeList,nova]);
    setFazeKatLok(prev=>({...prev,[id]:[]}));
    setFazePromjene(true);
    setAktivnaAdminFaza(id);
    setNovaFaza({naziv:"",ikona:"🏗",opis:"",cijena:""});
  };

  const obrisiFirezu = (fId) => {
    if(!window.confirm("Obrisati fazu i sve njene stavke?")) return;
    const ostale = fazeList.filter(f=>f.id!==fId);
    saveFazeList(ostale);
    setFazeKatLok(prev=>{const n={...prev};delete n[fId];return n;});
    setFazePromjene(true);
    setAktivnaAdminFaza(ostale[0]?.id||null);
  };

  const sacuvajFazuMeta = (fId,data) => {
    saveFazeList(fazeList.map(f=>f.id!==fId?f:{...f,...data}));
    setEditFazaId(null);
  };

  const sacuvajUSbazu = async () => {
    setSprema(true);
    if (katPromjene) { await syncKategorije(kategorije); setKatPromjene(false); }
    if (fazePromjene) { await onFazeKatChange(fazeKat); setFazePromjene(false); }
    if (fazeListPromjene) { await dbSet("faze_list",fazeList,firmaId); setFazeListPromjene(false); }
    setSprema(false);
    flash("Sve izmjene sačuvane u bazu ✓");
  };

  const imaPromjena = katPromjene || fazePromjene || fazeListPromjene;

  const [aktKat,setAktKat] = useState(kategorije[0]?.id);
  const [editCijena,setEditCijena] = useState({});
  const [editKat,setEditKat] = useState(null);
  const [editKatNaziv,setEditKatNaziv] = useState("");
  const [odabraniUpit,setOdabraniUpit] = useState(null);
  const [korekcija,setKorekcija] = useState({});
  const [fazaOtvorena,setFazaOtvorena] = useState(null);
  const [previewOtvoren,setPreviewOtvoren] = useState(false);
  const [ponudaZaPreview,setPonudaZaPreview] = useState(null);
  const [novaStavka,setNovaStavka] = useState({naziv:"",jm:"m²",cijena:""});
  const [novaKat,setNovaKat] = useState({naziv:"",ikona:"🔧"});
  const [editFazaCijena,setEditFazaCijena] = useState({});
  const [novaFazaStavka,setNovaFazaStavka] = useState({naziv:"",jm:"m²",cijena:"",opis:""});
  const [aktivnaAdminFaza,setAktivnaAdminFaza] = useState(null);
  const [novaFaza,setNovaFaza] = useState({naziv:"",ikona:"🏗",opis:"",cijena:""});
  const [editFazaId,setEditFazaId] = useState(null);
  const [editFazaData,setEditFazaData] = useState({});
  const [pretraga,setPretraga] = useState("");
  const [filterStatus,setFilterStatus] = useState("svi");
  const [poruka,setPoruka] = useState("");
  const [dragOver,setDragOver] = useState(null);
  const dragSrc = React.useRef(null);
  const flash = msg => { setPoruka(msg); setTimeout(()=>setPoruka(""),2500); };
  const [profil,setProfilRaw] = useState(INIT_PROFIL);
  useEffect(()=>{dbGet("profil",INIT_PROFIL,firmaId).then(p=>setProfilRaw(p));},[]);
  const setProfil = fn => setProfilRaw(prev=>{const next=typeof fn==="function"?fn(prev):fn;dbSet("profil",next,firmaId);return next;});

  // Drag helpers
  const reorder = (arr, fromId, toId) => {
    const from = arr.findIndex(x=>x.id===fromId);
    const to = arr.findIndex(x=>x.id===toId);
    if(from===-1||to===-1||from===to) return arr;
    const r=[...arr];
    const [item]=r.splice(from,1);
    r.splice(to,0,item);
    return r;
  };
  // type: "stavka" | "fazaStavka" | "faza"
  const dragProps = (id, katId, type="stavka") => ({
    draggable: true,
    onDragStart: ()=>{ dragSrc.current={id,katId,type}; },
    onDragOver: e=>{ e.preventDefault(); setDragOver(id); },
    onDragLeave: ()=>setDragOver(null),
    onDrop: e=>{ e.preventDefault(); setDragOver(null);
      const src=dragSrc.current;
      if(!src||src.id===id||src.type!==type) return;
      if(type==="faza") {
        saveFazeList(reorder(fazeList,src.id,id));
      } else if(type==="fazaStavka") {
        setFazeKatLok(prev=>{const next={...prev,[katId]:reorder(prev[katId]||[],src.id,id)};setFazePromjene(true);return next;});
      } else {
        setKategorije(prev=>prev.map(k=>k.id!==katId?k:{...k,stavke:reorder(k.stavke,src.id,id)}));
      }
      dragSrc.current=null;
    },
    onDragEnd: ()=>{ setDragOver(null); dragSrc.current=null; },
  });

  // Stats
  const stats = useMemo(()=>{
    const uk = upiti.reduce((s,u)=>s+u.stavke.reduce((ss,x)=>ss+x.kolicina*x.cijena,0),0);
    const ukFaze = upiti.reduce((s,u)=>s+fazeList.filter(f=>u.odabraneFaze?.includes(f.id)).reduce((ss,f)=>ss+f.cijena,0),0);
    return {
      total: upiti.length,
      novi: upiti.filter(u=>u.status==="nov").length,
      potvrdjeni: upiti.filter(u=>u.status==="potvrdjeno").length,
      vrijednost: uk+ukFaze,
      konverzija: upiti.length?Math.round((upiti.filter(u=>u.status==="potvrdjeno").length/upiti.length)*100):0,
    };
  },[upiti]);

  const filtrirani = useMemo(()=>upiti.filter(u=>{
    const matchStatus = filterStatus==="svi"||u.status===filterStatus;
    const matchSearch = !pretraga||u.ime.toLowerCase().includes(pretraga.toLowerCase())||u.telefon.includes(pretraga)||(u.email||"").toLowerCase().includes(pretraga.toLowerCase());
    return matchStatus&&matchSearch;
  }),[upiti,pretraga,filterStatus]);

  const sacuvajCijenu = (katId,stavkaId,data) => {
    setKategorije(prev=>prev.map(k=>k.id!==katId?k:{...k,stavke:k.stavke.map(s=>s.id!==stavkaId?s:{...s,naziv:data.naziv??s.naziv,jm:data.jm??s.jm,cijena:parseFloat(data.cijena)||s.cijena})}));
    setEditCijena(prev=>{const n={...prev};delete n[`${katId}-${stavkaId}`];return n;});
  };
  const obrisiStavku = (katId,stavkaId) => setKategorije(prev=>prev.map(k=>k.id!==katId?k:{...k,stavke:k.stavke.filter(s=>s.id!==stavkaId)}));
  const dodajStavku = (katId) => {
    if(!novaStavka.naziv||!novaStavka.cijena)return;
    setKategorije(prev=>prev.map(k=>k.id!==katId?k:{...k,stavke:[...k.stavke,{id:genId(),naziv:novaStavka.naziv,jm:novaStavka.jm,cijena:parseFloat(novaStavka.cijena)}]}));
    setNovaStavka({naziv:"",jm:"m²",cijena:""});
  };
  const dodajKategoriju = () => {
    if(!novaKat.naziv)return;
    const id=genId();
    setKategorije(prev=>[...prev,{id,naziv:novaKat.naziv,ikona:novaKat.ikona,stavke:[]}]);
    setNovaKat({naziv:"",ikona:"🔧"});setAktKat(id);
  };
  const promijeniStatus = (upitId,status) => {
    setUpiti(prev=>prev.map(u=>u.id!==upitId?u:{...u,status}));
    setOdabraniUpit(prev=>prev?.id===upitId?{...prev,status}:prev);
  };
  const otvoriPreview = (upitId) => {
    const upit=upiti.find(u=>u.id===upitId);
    if(!upit)return;
    const stavkeSaK=upit.stavke.map((s,i)=>({...s,cijena:parseFloat(korekcija[`${upitId}-${i}`])||s.cijena}));
    setPonudaZaPreview({...upit,stavke:stavkeSaK});
    setPreviewOtvoren(true);
  };
  const potvrdiPonudu = () => {
    if(!ponudaZaPreview)return;
    setUpiti(prev=>prev.map(u=>u.id!==ponudaZaPreview.id?u:{...ponudaZaPreview,status:"potvrdjeno"}));
    setPreviewOtvoren(false);setPonudaZaPreview(null);
    flash("Ponuda potvrđena ✓ · Email će biti poslan klijentu");
    setOdabraniUpit(null);
  };
  const generirajPDF = (ponuda) => {
    const ukBez=ponuda.stavke.reduce((s,x)=>s+x.kolicina*x.cijena,0);
    const pdv=ukBez*0.17;const ukSa=ukBez+pdv;
    const datum=new Date().toLocaleDateString("bs-BA");
    const brP=`PON-${ponuda.id.toUpperCase().slice(0,6)}-${new Date().getFullYear()}`;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1814;font-size:13px}.hd{display:flex;justify-content:space-between;margin-bottom:30px;border-bottom:3px solid #8B5E1A;padding-bottom:20px}.firma{font-size:24px;font-weight:700;color:#8B5E1A}.sub{color:#888;font-size:12px;margin-top:4px}h2{font-size:17px;margin:20px 0 8px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;background:#F7F5F0;padding:16px;border-radius:8px}.ml{font-size:10px;color:#888;text-transform:uppercase;display:block;margin-bottom:2px}.mv{font-weight:600}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#8B5E1A;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase}td{padding:9px 12px;border-bottom:1px solid #e8e4de}tr:nth-child(even) td{background:#fafaf8}.tr{text-align:right;font-weight:600}.tc{text-align:center}.ft td{border:none;padding:5px 12px}.tot td{font-weight:700;font-size:15px;color:#8B5E1A;border-top:2px solid #8B5E1A;padding-top:10px}.nap{margin-top:24px;padding:12px 16px;background:#FDF6EB;border-left:3px solid #8B5E1A;border-radius:4px;font-size:12px}.foot{margin-top:40px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #ddd;padding-top:16px}</style></head><body>
    <div class="hd"><div><div class="firma">Troškovi gradnje</div><div class="sub">Ponuda za građevinske radove</div></div><div style="text-align:right"><div style="font-weight:700;font-size:15px">Broj: ${brP}</div><div style="color:#888;font-size:12px">Datum: ${datum}</div></div></div>
    <h2>Ponuda za: ${ponuda.ime}</h2>
    <div class="meta"><div><span class="ml">Klijent</span><span class="mv">${ponuda.ime}</span></div><div><span class="ml">Telefon</span><span class="mv">${ponuda.telefon}</span></div>${ponuda.email?`<div><span class="ml">Email</span><span class="mv">${ponuda.email}</span></div>`:""}<div><span class="ml">Datum upita</span><span class="mv">${ponuda.datum}</span></div></div>
    <table><thead><tr><th>#</th><th>Opis rada</th><th class="tc">JM</th><th class="tr">Količina</th><th class="tr">Jed. cijena</th><th class="tr">Iznos (KM)</th></tr></thead><tbody>${ponuda.stavke.map((s,i)=>`<tr><td>${i+1}</td><td>${s.naziv}</td><td class="tc">${s.jm}</td><td class="tr">${s.kolicina}</td><td class="tr">${s.cijena.toFixed(2)}</td><td class="tr">${(s.kolicina*s.cijena).toLocaleString("bs-BA",{minimumFractionDigits:2})}</td></tr>`).join("")}</tbody></table>
    <table class="ft" style="max-width:340px;margin-left:auto"><tr><td>Ukupno bez PDV-a:</td><td style="text-align:right">${ukBez.toLocaleString("bs-BA",{minimumFractionDigits:2})} KM</td></tr><tr><td>PDV (17%):</td><td style="text-align:right">${pdv.toLocaleString("bs-BA",{minimumFractionDigits:2})} KM</td></tr><tr class="tot"><td>UKUPNO SA PDV:</td><td style="text-align:right">${ukSa.toLocaleString("bs-BA",{minimumFractionDigits:2})} KM</td></tr></table>
    ${ponuda.napomena?`<div class="nap"><strong>Napomena:</strong> ${ponuda.napomena}</div>`:""}
    <div class="foot">Ova ponuda je generisana elektronski i vrijedi 30 dana od datuma izdavanja.</div>
    </body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);
  };

  const tabS = t => ({background:"transparent",border:"none",borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t?C.text:C.dim,fontSize:13,fontWeight:tab===t?600:400,padding:"10px 16px",cursor:"pointer",fontFamily:C.font,marginBottom:-1,transition:"color 0.15s"});
  const noviUpiti = upiti.filter(u=>u.status==="nov").length;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GFont/>
      <TitleBar onBack={onBack} title="Troškovi gradnje · Admin"/>

      {/* Tab bar */}
      <div style={{display:"flex",alignItems:"center",background:C.bg3,padding:"0 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <button style={tabS("dashboard")} onClick={()=>setTab("dashboard")}>📊 Dashboard</button>
        <button style={tabS("upiti")} onClick={()=>setTab("upiti")}>
          📋 Upiti {noviUpiti>0&&<span style={{background:C.gold,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 7px",marginLeft:5,fontWeight:700}}>{noviUpiti}</span>}
        </button>
        <button style={tabS("cijenovnik")} onClick={()=>setTab("cijenovnik")}>💰 Cijenovnik</button>
        <button style={tabS("faze")} onClick={()=>setTab("faze")}>🏗 Faze radova</button>
        <button style={tabS("profil")} onClick={()=>setTab("profil")}>⚙ Profil firme</button>
        <div style={{flex:1}}/>
        {imaPromjena && (
          <button onClick={sacuvajUSbazu} disabled={sprema}
            style={{...btn("gold",{padding:"7px 16px",fontSize:12}),background:sprema?C.border:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`,marginRight:8,display:"flex",alignItems:"center",gap:6}}>
            {sprema ? "Čuvanje..." : "💾 Sačuvaj izmjene"}
          </button>
        )}
        {imaPromjena && !sprema && <span style={{fontSize:11,color:C.goldL,marginRight:8,fontWeight:500}}>● Nesačuvane izmjene</span>}
        {poruka&&<span style={{fontSize:12,color:C.green,marginRight:8,fontWeight:500}}>{poruka}</span>}
        {onChangePass&&<button onClick={onChangePass} style={btn("ghost",{fontSize:11,padding:"5px 10px",marginRight:4})}>🔑 Lozinka</button>}
        {onLogout&&<button onClick={onLogout} style={btn("ghost",{fontSize:11,padding:"5px 10px"})}>Odjavi se</button>}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard"&&(
        <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
          <h2 style={{fontFamily:C.font,fontSize:20,fontWeight:700,margin:"0 0 1.25rem"}}>Pregled</h2>
          {/* Stat kartice */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:"2rem"}}>
            {[
              {ikona:"📥",label:"Ukupno upita",val:stats.total,color:"blue"},
              {ikona:"🟡",label:"Novi upiti",val:stats.novi,color:"gold"},
              {ikona:"✅",label:"Potvrđeno",val:stats.potvrdjeni,color:"green"},
              {ikona:"💰",label:"Ukupna vrijednost",val:fmtKM(stats.vrijednost),color:"gold",big:true},
              {ikona:"📈",label:"Konverzija",val:`${stats.konverzija}%`,color:"blue"},
            ].map(s=>(
              <div key={s.label} style={{...card(),padding:"1.25rem"}}>
                <div style={{fontSize:24,marginBottom:8}}>{s.ikona}</div>
                <p style={{fontSize:11,color:C.muted,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</p>
                <p style={{fontSize:s.big?18:24,fontWeight:700,color:s.color==="gold"?C.gold:s.color==="green"?C.green:C.blue,margin:0}}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Zadnji upiti */}
          <h3 style={{fontSize:15,fontWeight:600,margin:"0 0 1rem"}}>Zadnji upiti</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upiti.slice(0,5).map(u=>{
              const uk=u.stavke.reduce((s,x)=>s+x.kolicina*x.cijena,0)+fazeList.filter(f=>u.odabraneFaze?.includes(f.id)).reduce((s,f)=>s+f.cijena,0);
              return (
                <div key={u.id} onClick={()=>{setTab("upiti");setOdabraniUpit(u);}} style={{...card(),padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"box-shadow 0.15s"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:"0 0 2px",fontSize:14,fontWeight:600,color:C.text}}>{u.ime}</p>
                    <p style={{margin:0,fontSize:12,color:C.muted}}>{u.datum}</p>
                  </div>
                  <StatusBadge s={u.status}/>
                  {uk>0&&<span style={{fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>{fmtKM(uk*1.17)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── UPITI ── */}
      {tab==="upiti"&&(
        <div style={{flex:1,display:"flex",overflow:"auto"}}>
          {/* Lista */}
          <div style={{width:320,flexShrink:0,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",background:C.bg3}}>
            <div style={{padding:"12px",borderBottom:`1px solid ${C.border}`}}>
              <input placeholder="🔍  Pretraži upite..." value={pretraga} onChange={e=>setPretraga(e.target.value)} style={{...inp({padding:"8px 12px",fontSize:13}),marginBottom:8}}/>
              <div style={{display:"flex",gap:6}}>
                {[["svi","Svi"],["nov","Novi"],["pregledano","Pregledano"],["potvrdjeno","Potvrđeno"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setFilterStatus(v)} style={{flex:1,padding:"5px 0",fontSize:11,fontWeight:filterStatus===v?700:400,borderRadius:6,cursor:"pointer",fontFamily:C.font,border:`1px solid ${filterStatus===v?C.gold:C.border2}`,background:filterStatus===v?C.goldBg:"transparent",color:filterStatus===v?C.gold:C.muted,transition:"all 0.15s"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflow:"auto"}}>
              {filtrirani.length===0&&<p style={{fontSize:13,color:C.dim,padding:"1rem",textAlign:"center"}}>Nema rezultata</p>}
              {filtrirani.map(u=>{
                const uk=u.stavke.reduce((s,x)=>s+x.kolicina*x.cijena,0)+fazeList.filter(f=>u.odabraneFaze?.includes(f.id)).reduce((s,f)=>s+f.cijena,0);
                const akt=odabraniUpit?.id===u.id;
                return (
                  <div key={u.id} onClick={()=>{setOdabraniUpit(u);setKorekcija({});setFazaOtvorena(null);if(u.status==="nov")promijeniStatus(u.id,"pregledano");}}
                    style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:akt?C.bg:"transparent",borderLeft:akt?`3px solid ${C.gold}`:"3px solid transparent",transition:"all 0.1s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:600,color:C.text}}>{u.ime}</span>
                      <StatusBadge s={u.status}/>
                    </div>
                    <p style={{margin:"0 0 4px",fontSize:12,color:C.dim}}>{u.datum}</p>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      {uk>0&&<p style={{margin:0,fontSize:13,color:C.gold,fontWeight:700}}>{fmtKM(uk*(u.imaProjekat==="ne"?1:1.17))}</p>}
                      {u.imaProjekat&&<span style={pill(u.imaProjekat==="da"?"green":"gold")}>{u.imaProjekat==="da"?"✓ Projekat":"∅ Bez projekta"}</span>}
                    </div>
                    {u.napomena&&<p style={{margin:"4px 0 0",fontSize:11,color:C.dim,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{u.napomena}"</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalj */}
          <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
            {!odabraniUpit?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",color:C.dim}}>
                <span style={{fontSize:48,marginBottom:16}}>📋</span>
                <p style={{fontSize:15,fontWeight:500}}>Odaberite upit sa liste</p>
                <p style={{fontSize:13,color:C.dim}}>ili pretražite po imenu i kontaktu</p>
              </div>
            ):(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:"0 0 4px"}}>{odabraniUpit.ime}</h2>
                    <span style={{fontSize:12,color:C.dim}}>{odabraniUpit.datum} · </span><StatusBadge s={odabraniUpit.status}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {odabraniUpit.status!=="potvrdjeno"&&<button onClick={()=>otvoriPreview(odabraniUpit.id)} style={btn("gold")}>Pregled i slanje ponude →</button>}
                    <button onClick={()=>promijeniStatus(odabraniUpit.id,"potvrdjeno")} style={btn("ghost")}>Arhiviraj</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1.5rem"}}>
                  {[
                    {label:"Telefon",val:odabraniUpit.telefon,ikona:"📞"},
                    {label:"Email",val:odabraniUpit.email||"—",ikona:"📧"},
                    {label:"Projekat",val:odabraniUpit.imaProjekat==="da"?"✓ Ima projekat":odabraniUpit.imaProjekat==="ne"?"✗ Nema":"—",ikona:"📋"},
                    {label:"Faze",val:odabraniUpit.odabraneFaze?.length>0?odabraniUpit.odabraneFaze.map(f=>fazeList.find(x=>x.id===f)?.naziv.split("—")[0].trim()||f).join(", "):"—",ikona:"📊"},
                  ].map(f=>(
                    <div key={f.label} style={{...card(),padding:"10px 14px"}}>
                      <p style={{fontSize:11,color:C.dim,margin:"0 0 3px"}}>{f.ikona} {f.label}</p>
                      <p style={{fontSize:13,fontWeight:600,margin:0}}>{f.val}</p>
                    </div>
                  ))}
                </div>

                {/* Upitnik */}
                {odabraniUpit.upitnik&&Object.values(odabraniUpit.upitnik).some(v=>v!==""&&v!==null)&&(
                  <div style={{marginBottom:"1.5rem"}}>
                    <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>Informacije o gradnji</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
                      {[
                        {key:"finansiranje",label:"Finansiranje",fmt:v=>({samofinansiranje:"Samofinansiranje",irb:"IRB kredit",stambeni:"Stambeni kredit"}[v]||v)},
                        {key:"lokacija",label:"Adresa",fmt:v=>v},
                        {key:"grad",label:"Grad",fmt:v=>v},
                        {key:"ravnoZemljiste",label:"Ravno zemljište",fmt:v=>v===true?"Da":"Ne"},
                        {key:"pristupniPut",label:"Pristupni put",fmt:v=>v===true?"Da":"Ne"},
                        {key:"gradjevinDozvola",label:"Građ. dozvola",fmt:v=>v===true?"Da":"Ne"},
                        {key:"strujaVoda",label:"Struja i voda",fmt:v=>v===true?"Da":"Ne"},
                        {key:"pocetakRadova",label:"Početak radova",fmt:v=>{if(!v)return"—";const[g,m,d]=v.split("-");const mj=["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];return`${parseInt(d)}. ${mj[parseInt(m)-1]} ${g}.`;}},
                        {key:"temelji",label:"Temelji",fmt:v=>({trake:"Temeljne trake",ploca:"Temeljna ploča"}[v]||v)},
                        {key:"krov",label:"Krov",fmt:v=>({ravni:"Ravni krov",dvije:"Krov na 2 vode",vise:"Krov na 4+ voda"}[v]||v)},
                      ].filter(f=>odabraniUpit.upitnik[f.key]!==""&&odabraniUpit.upitnik[f.key]!==null&&odabraniUpit.upitnik[f.key]!==undefined).map(f=>(
                        <div key={f.key} style={{...card(),padding:"10px 14px"}}>
                          <p style={{fontSize:11,color:C.dim,margin:"0 0 3px"}}>{f.label}</p>
                          <p style={{fontSize:13,fontWeight:600,margin:0}}>{f.fmt(odabraniUpit.upitnik[f.key])}</p>
                        </div>
                      ))}
                    </div>
                    {odabraniUpit.upitnik.fajlovi?.length>0&&(
                      <div style={{marginTop:10}}>
                        <p style={{fontSize:11,color:C.dim,fontWeight:600,margin:"0 0 8px",textTransform:"uppercase"}}>Priloženi dokumenti</p>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {odabraniUpit.upitnik.fajlovi.map((f,i)=>(
                            <div key={i} style={{...card(),padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:16}}>{f.tip?.includes("pdf")?"📄":f.tip?.includes("image")?"🖼":"📎"}</span>
                              <span style={{flex:1,fontSize:13}}>{f.naziv}</span>
                              <span style={{fontSize:11,color:C.dim}}>{(f.velicina/1024).toFixed(0)} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Faze */}
                {odabraniUpit.imaProjekat==="ne"&&odabraniUpit.odabraneFaze?.length>0&&(
                  <div style={{marginBottom:"1.5rem"}}>
                    <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>Odabrane faze</p>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {fazeList.filter(f=>odabraniUpit.odabraneFaze.includes(f.id)).map(f=>{
                        const fazeStavkeU=(odabraniUpit.stavke||[]).filter(s=>s.faza===f.id);
                        const otvoren=fazaOtvorena===f.id;
                        const ukF=fazeStavkeU.reduce((s,x)=>s+x.kolicina*x.cijena,0);
                        return (
                          <div key={f.id} style={{border:`1px solid ${otvoren?C.greenBd:C.border}`,borderRadius:10,overflow:"hidden",transition:"all 0.15s",background:C.bg3}}>
                            <div onClick={()=>setFazaOtvorena(otvoren?null:f.id)} style={{background:otvoren?C.greenBg:C.bg3,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",userSelect:"none"}}>
                              <span style={{fontSize:20}}>{f.ikona}</span>
                              <div style={{flex:1}}>
                                <p style={{margin:"0 0 2px",fontSize:14,fontWeight:600,color:otvoren?C.green:C.text}}>{f.naziv}</p>
                                <p style={{margin:0,fontSize:12,color:C.muted}}>{fazeStavkeU.length>0?`${fazeStavkeU.length} stavki`:"Bez detaljnih količina"}</p>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                                {ukF>0&&<span style={{fontSize:13,fontWeight:700,color:C.gold}}>{fmtKM(ukF)}</span>}
                                <span style={{fontSize:16,color:C.dim,transition:"transform 0.2s",display:"inline-block",transform:otvoren?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                              </div>
                            </div>
                            {otvoren&&(
                              <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px"}}>
                                {fazeStavkeU.length===0?(
                                  <p style={{fontSize:13,color:C.muted,margin:0}}>Klijent nije unio količine. Stavke faze: {f.stavke.join(" · ")}</p>
                                ):(
                                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                    {fazeStavkeU.map((s,i)=>(
                                      <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:C.bg2,borderRadius:8}}>
                                        <p style={{margin:0,fontSize:13,flex:1}}>{s.naziv}</p>
                                        <span style={{fontSize:12,color:C.muted}}>{s.kolicina} {s.jm}</span>
                                        <span style={{fontSize:13,fontWeight:600,color:C.gold}}>{fmtKM(s.kolicina*s.cijena)}</span>
                                      </div>
                                    ))}
                                    <div style={{display:"flex",justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                                      <span style={{fontSize:13,fontWeight:700,color:C.gold}}>Ukupno: {fmtKM(ukF)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div style={{...card(),padding:"12px 20px",display:"flex",justifyContent:"flex-end"}}>
                        <div style={{textAlign:"right"}}>
                          <p style={{fontSize:11,color:C.dim,margin:"0 0 2px"}}>Okvirno ukupno</p>
                          <p style={{fontSize:20,fontWeight:700,color:C.gold,margin:0}}>~{fazeList.filter(f=>odabraniUpit.odabraneFaze.includes(f.id)).reduce((s,f)=>s+f.cijena,0).toLocaleString("bs-BA")} KM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Napomena */}
                {odabraniUpit.napomena&&(
                  <div style={{background:C.goldBg,border:`1px solid ${C.goldL}`,borderRadius:10,padding:"12px 16px",marginBottom:"1.5rem"}}>
                    <p style={{fontSize:11,color:C.gold,fontWeight:600,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Napomena klijenta</p>
                    <p style={{fontSize:13,color:C.muted,margin:0}}>{odabraniUpit.napomena}</p>
                  </div>
                )}

                {/* Stavke */}
                {odabraniUpit.stavke?.length>0&&(
                  <>
                    <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>Stavke predmjera · korigovati cijenu po potrebi</p>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1.5rem"}}>
                      {odabraniUpit.stavke.map((s,i)=>{
                        const kljuc=`${odabraniUpit.id}-${i}`;
                        const tc=parseFloat(korekcija[kljuc]??s.cijena);
                        const prm=korekcija[kljuc]!==undefined&&parseFloat(korekcija[kljuc])!==s.cijena;
                        return (
                          <div key={i} style={{...card(),background:prm?C.greenBg:C.bg3,border:`1px solid ${prm?C.greenBd:C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{margin:"0 0 2px",fontSize:13,color:C.text}}>{s.naziv}</p>
                              <p style={{margin:0,fontSize:13,color:C.dim}}>{s.kolicina} {s.jm}</p>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                              <div>
                                <p style={{fontSize:10,color:C.dim,margin:"0 0 3px",textAlign:"right"}}>Cijena / {s.jm}</p>
                                <input type="number" value={korekcija[kljuc]!==undefined?korekcija[kljuc]:s.cijena}
                                  onChange={e=>setKorekcija(prev=>({...prev,[kljuc]:e.target.value}))}
                                  style={{width:80,background:"#fff",border:`1px solid ${prm?C.greenBd:C.border2}`,borderRadius:6,padding:"5px 8px",color:prm?C.green:C.text,fontSize:13,fontFamily:C.font,textAlign:"right",outline:"none"}}/>
                              </div>
                              <div style={{textAlign:"right",minWidth:90}}>
                                <p style={{fontSize:10,color:C.dim,margin:"0 0 3px"}}>Iznos</p>
                                <p style={{fontSize:13,fontWeight:600,color:C.gold,margin:0}}>{fmtKM(s.kolicina*tc)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(()=>{
                      const ukBez=odabraniUpit.stavke.reduce((sum,s,i)=>sum+s.kolicina*(parseFloat(korekcija[`${odabraniUpit.id}-${i}`])||s.cijena),0);
                      return (
                        <div style={{...card(),padding:"14px 20px"}}>
                          <div style={{display:"flex",justifyContent:"flex-end",gap:28}}>
                            {[["Bez PDV-a",fmtKM(ukBez)],["PDV 17%",fmtKM(ukBez*0.17)],["Ukupno sa PDV",fmtKM(ukBez*1.17)]].map(([l,v],idx)=>(
                              <div key={l} style={{textAlign:"right"}}>
                                <p style={{fontSize:11,color:C.dim,margin:"0 0 2px"}}>{l}</p>
                                <p style={{fontSize:idx===2?18:14,fontWeight:idx===2?700:500,color:idx===2?C.gold:C.text,margin:0}}>{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CIJENOVNIK ── */}
      {tab==="cijenovnik"&&(
        <div style={{flex:1,display:"flex",overflow:"auto"}}>
          <div style={{width:220,flexShrink:0,background:C.bg3,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:0}}>Kategorije</p>
            </div>
            <div style={{flex:1,overflow:"auto"}}>
              {kategorije.map(k=>(
                <div key={k.id} onClick={()=>setAktKat(k.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:aktKat===k.id?C.bg:C.bg3,borderLeft:aktKat===k.id?`3px solid ${C.gold}`:"3px solid transparent",cursor:"pointer",transition:"all 0.1s"}}>
                  <span style={{fontSize:18}}>{k.ikona}</span>
                  {editKat===k.id ? (
                    <input autoFocus value={editKatNaziv}
                      onChange={e=>setEditKatNaziv(e.target.value)}
                      onKeyDown={e=>{
                        if(e.key==="Enter"){setKategorije(p=>p.map(x=>x.id!==k.id?x:{...x,naziv:editKatNaziv}));setEditKat(null);flash("Kategorija ažurirana ✓");}
                        if(e.key==="Escape")setEditKat(null);
                      }}
                      onClick={e=>e.stopPropagation()}
                      style={{flex:1,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:5,padding:"3px 7px",fontSize:12,fontFamily:C.font,outline:"none",minWidth:0,color:C.text}}/>
                  ) : (
                    <>
                      <span style={{fontSize:13,color:aktKat===k.id?C.text:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.naziv}</span>
                      <button onClick={e=>{e.stopPropagation();setEditKat(k.id);setEditKatNaziv(k.naziv);}} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:11,padding:"0 2px",opacity:0.6}}>✏</button>
                    </>
                  )}
                  <button onClick={e=>{e.stopPropagation();if(window.confirm("Obrisati kategoriju?"))setKategorije(p=>p.filter(x=>x.id!==k.id));}} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:14,padding:0}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{padding:12,borderTop:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,color:C.dim,margin:"0 0 6px",fontWeight:500}}>Nova kategorija</p>
              <input placeholder="Naziv" value={novaKat.naziv} onChange={e=>setNovaKat(p=>({...p,naziv:e.target.value}))} style={{...inp({padding:"6px 10px",fontSize:12}),marginBottom:6}}/>
              <div style={{display:"flex",gap:6}}>
                <input placeholder="🔧" value={novaKat.ikona} onChange={e=>setNovaKat(p=>({...p,ikona:e.target.value}))} style={{...inp({width:44,padding:"6px 8px",fontSize:14,textAlign:"center"})}}/>
                <button onClick={dodajKategoriju} style={{...btn("ghost",{flex:1,fontSize:12,border:`1px solid ${C.border2}`,color:C.gold})}}>+ Dodaj</button>
              </div>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
            {kategorije.filter(k=>k.id===aktKat).map(kat=>(
              <div key={kat.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.25rem"}}>
                  <span style={{fontSize:28}}>{kat.ikona}</span>
                  {editKat===kat.id ? (
                    <>
                      <input autoFocus value={editKatNaziv}
                        onChange={e=>setEditKatNaziv(e.target.value)}
                        onKeyDown={e=>{
                          if(e.key==="Enter"){setKategorije(p=>p.map(x=>x.id!==kat.id?x:{...x,naziv:editKatNaziv}));setEditKat(null);flash("Kategorija ažurirana ✓");}
                          if(e.key==="Escape")setEditKat(null);
                        }}
                        style={{fontFamily:C.font,fontSize:20,fontWeight:700,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:8,padding:"5px 12px",outline:"none",color:C.text,minWidth:200}}/>
                      <button onClick={()=>{setKategorije(p=>p.map(x=>x.id!==kat.id?x:{...x,naziv:editKatNaziv}));setEditKat(null);flash("Kategorija ažurirana ✓");}} style={{...btn("green",{padding:"5px 12px",borderRadius:7,fontSize:13})}}>✓</button>
                      <button onClick={()=>setEditKat(null)} style={{...btn("ghost",{padding:"5px 10px",borderRadius:7,fontSize:13})}}>✕</button>
                    </>
                  ) : (
                    <>
                      <h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:"0 0 2px"}}>{kat.naziv}</h2>
                      <button onClick={()=>{setEditKat(kat.id);setEditKatNaziv(kat.naziv);}} style={{...btn("ghost",{padding:"4px 10px",borderRadius:6,fontSize:12})}}>✏</button>
                    </>
                  )}
                  <span style={{...pill("blue")}}>{kat.stavke.length} stavki</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1.5rem"}}>
                  {kat.stavke.map(s=>{
                    const key=`${kat.id}-${s.id}`;const em=editCijena[key]!==undefined;
                    return (
                      <div key={s.id} {...dragProps(s.id,kat.id,"stavka")} style={{...card(),padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"grab",border:`1px solid ${dragOver===s.id?C.gold:C.border}`,transition:"border-color 0.15s"}}>
                        <span style={{color:C.dim,fontSize:16,flexShrink:0,cursor:"grab"}}>⠿</span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:"0 0 2px",fontSize:13,color:C.text}}>{s.naziv}</p>
                          <p style={{margin:0,fontSize:13,color:C.dim}}>JM: {s.jm}</p>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          {em?(
                            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                              <input autoFocus value={editCijena[key]?.naziv??s.naziv}
                                onChange={e=>setEditCijena(p=>({...p,[key]:{...p[key],naziv:e.target.value}}))}
                                placeholder="Naziv"
                                style={{width:180,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 8px",fontSize:13,fontFamily:C.font,outline:"none", color: C.text}}/>
                              <select value={editCijena[key]?.jm??s.jm}
                                onChange={e=>setEditCijena(p=>({...p,[key]:{...p[key],jm:e.target.value}}))}
                                style={{ background: "#fff", border: `1px solid ${C.gold}`, borderRadius: 6, padding: "5px 6px", fontSize: 13, fontFamily: C.font, outline: "none", color: C.text}}>
                                {["m²","m³","m¹","kom","t","kg","h"].map(j=><option key={j}>{j}</option>)}
                              </select>
                              <input type="number" value={editCijena[key]?.cijena??s.cijena}
                                onChange={e=>setEditCijena(p=>({...p,[key]:{...p[key],cijena:e.target.value}}))}
                                placeholder="Cijena"
                                onKeyDown={e=>{if(e.key==="Enter")sacuvajCijenu(kat.id,s.id,editCijena[key]);if(e.key==="Escape")setEditCijena(p=>{const n={...p};delete n[key];return n;});}}
                                style={{width:80,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 8px",color:C.gold,fontSize:13,fontFamily:C.font,textAlign:"right",outline:"none"}}/>
                              <button onClick={()=>sacuvajCijenu(kat.id,s.id,editCijena[key])} style={btn("green",{padding:"5px 10px",borderRadius:6})}>✓</button>
                              <button onClick={()=>setEditCijena(p=>{const n={...p};delete n[key];return n;})} style={btn("ghost",{padding:"5px 10px",borderRadius:6})}>✕</button>
                            </div>
                          ):(
                            <>
                              <span style={{fontSize:14,fontWeight:700,color:C.gold,minWidth:80,textAlign:"right"}}>{fmtKM(s.cijena)}</span>
                              <button onClick={()=>setEditCijena(p=>({...p,[key]:{naziv:s.naziv,jm:s.jm,cijena:s.cijena}}))} style={btn("ghost",{padding:"5px 10px",borderRadius:6})}>✏</button>
                              <button onClick={()=>obrisiStavku(kat.id,s.id)} style={btn("danger",{padding:"5px 10px",borderRadius:6})}>✕</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:"#F0EEFA",border:"1px solid #D8D0F0",borderRadius:10,padding:"16px"}}>
                  <p style={{fontSize:12,color:"#534AB7",fontWeight:600,margin:"0 0 10px"}}>+ Nova stavka</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{flex:2,minWidth:160}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Naziv</p><input placeholder="Opis rada" value={novaStavka.naziv} onChange={e=>setNovaStavka(p=>({...p,naziv:e.target.value}))} style={inp({padding:"7px 10px",fontSize:13})}/></div>
                    <div style={{width:72}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>JM</p><select value={novaStavka.jm} onChange={e=>setNovaStavka(p=>({...p,jm:e.target.value}))} style={inp({width:"100%",padding:"7px 6px",fontSize:13})}>{["m²","m³","m¹","kom","t","kg","h"].map(j=><option key={j}>{j}</option>)}</select></div>
                    <div style={{width:90}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Cijena (KM)</p><input type="number" placeholder="0.00" value={novaStavka.cijena} onChange={e=>setNovaStavka(p=>({...p,cijena:e.target.value}))} style={inp({padding:"7px 8px",fontSize:13,textAlign:"right"})}/></div>
                    <button onClick={()=>dodajStavku(kat.id)} style={btn("purple",{borderRadius:6,whiteSpace:"nowrap"})}>+ Dodaj stavku</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAZE RADOVA ── */}
      {tab==="faze"&&(
        <div style={{flex:1,display:"flex",overflow:"auto"}}>
          <div style={{width:220,flexShrink:0,background:C.bg3,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`}}><p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:0}}>Faze gradnje</p></div>
            <div style={{flex:1,overflow:"auto"}}>
              {fazeList.map(f=>(
                <div key={f.id} {...dragProps(f.id,null,"faza")} onClick={()=>setAktivnaAdminFaza(f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:aktivnaAdminFaza===f.id?C.bg:C.bg3,borderLeft:aktivnaAdminFaza===f.id?`3px solid ${C.gold}`:"3px solid transparent",cursor:"grab",position:"relative",border:"none",borderTop:`1px solid ${dragOver===f.id?C.gold:"transparent"}`,transition:"border-color 0.15s"}}>
                  <span style={{color:C.dim,fontSize:14,flexShrink:0}}>⠿</span>
                  <span style={{fontSize:18}}>{f.ikona}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:13,color:aktivnaAdminFaza===f.id?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.naziv}</p>
                    <p style={{margin:0,fontSize:11,color:C.dim}}>{(fazeKat[f.id]||[]).length} stavki</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();obrisiFirezu(f.id);}} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:13,padding:0,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{padding:12,borderTop:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,color:C.dim,margin:"0 0 6px",fontWeight:500}}>Nova faza</p>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <input placeholder="🏗" value={novaFaza.ikona} onChange={e=>setNovaFaza(p=>({...p,ikona:e.target.value}))} style={{...inp({width:44,padding:"6px 8px",fontSize:14,textAlign:"center"})}}/>
                <input placeholder="Naziv faze" value={novaFaza.naziv} onChange={e=>setNovaFaza(p=>({...p,naziv:e.target.value}))} style={inp({padding:"6px 10px",fontSize:12})}/>
              </div>
              <input placeholder="Kratki opis" value={novaFaza.opis} onChange={e=>setNovaFaza(p=>({...p,opis:e.target.value}))} style={{...inp({padding:"6px 10px",fontSize:12}),marginBottom:6}}/>
              <button onClick={dodajFazu} style={{...btn("ghost",{width:"100%",fontSize:12,border:`1px solid ${C.border2}`,color:C.gold})}}>+ Dodaj fazu</button>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
            {(()=>{
              const f=fazeList.find(x=>x.id===aktivnaAdminFaza);
              const stavke=fazeKat[aktivnaAdminFaza]||[];
              return (<>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.25rem",flexWrap:"wrap"}}>
                  <span style={{fontSize:28}}>{f?.ikona}</span>
                  {editFazaId===aktivnaAdminFaza ? (<>
                    <input value={editFazaData.ikona??f?.ikona??""} onChange={e=>setEditFazaData(p=>({...p,ikona:e.target.value}))} style={{width:44,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:7,padding:"5px 8px",fontSize:18,fontFamily:C.font,outline:"none",textAlign:"center"}}/>
                    <input value={editFazaData.naziv??f?.naziv??""} onChange={e=>setEditFazaData(p=>({...p,naziv:e.target.value}))} style={{flex:1,minWidth:120,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:7,padding:"5px 10px",fontSize:16,fontWeight:700,fontFamily:C.font,outline:"none",color:C.text}}/>
                    <input value={editFazaData.opis??f?.opis??""} onChange={e=>setEditFazaData(p=>({...p,opis:e.target.value}))} placeholder="Kratki opis" style={{flex:2,minWidth:140,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:7,padding:"5px 10px",fontSize:13,fontFamily:C.font,outline:"none",color:C.text}}/>
                    <button onClick={()=>sacuvajFazuMeta(aktivnaAdminFaza,editFazaData)} style={btn("green",{padding:"5px 12px",borderRadius:7})}>✓</button>
                    <button onClick={()=>setEditFazaId(null)} style={btn("ghost",{padding:"5px 10px",borderRadius:7})}>✕</button>
                  </>) : (<>
                    <h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:"0 0 2px"}}>{f?.naziv}</h2>
                    <button onClick={()=>{setEditFazaId(aktivnaAdminFaza);setEditFazaData({ikona:f?.ikona,naziv:f?.naziv,opis:f?.opis});}} style={btn("ghost",{padding:"4px 10px",borderRadius:6,fontSize:12})}>✏</button>
                  </>)}
                  <span style={pill("blue")}>{stavke.length} stavki</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1.5rem"}}>
                  {stavke.map(s=>{
                    const em=editFazaCijena[s.id]!==undefined;
                    const sačuvaj = () => {
                      sacuvajFazeKat({...fazeKat,[aktivnaAdminFaza]:stavke.map(x=>x.id!==s.id?x:{...x,naziv:editFazaCijena[s.id]?.naziv??s.naziv,opis:editFazaCijena[s.id]?.opis??s.opis,jm:editFazaCijena[s.id]?.jm??s.jm,cijena:parseFloat(editFazaCijena[s.id]?.cijena)||s.cijena})});
                      setEditFazaCijena(p=>{const n={...p};delete n[s.id];return n;});
                    };
                    return (
                      <div key={s.id} {...dragProps(s.id,aktivnaAdminFaza,"fazaStavka")} style={{...card(),padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"grab",border:`1px solid ${dragOver===s.id?C.gold:C.border}`,transition:"border-color 0.15s"}}>
                        <span style={{color:C.dim,fontSize:16,flexShrink:0,cursor:"grab"}}>⠿</span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:"0 0 2px",fontSize:13,color:C.text}}>{s.naziv}</p>
                          <p style={{margin:"0 0 2px",fontSize:12,color:C.dim,fontStyle:"italic"}}>{s.opis}</p>
                          <p style={{margin:0,fontSize:13,color:C.dim}}>JM: {s.jm}</p>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          {em ? (
                            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                              <input value={editFazaCijena[s.id]?.naziv??s.naziv}
                                onChange={e=>setEditFazaCijena(p=>({...p,[s.id]:{...p[s.id],naziv:e.target.value}}))}
                                placeholder="Naziv"
                                style={{width:160,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 8px",fontSize:13,fontFamily:C.font,outline:"none",color:C.text}}/>
                              <input value={editFazaCijena[s.id]?.opis??s.opis}
                                onChange={e=>setEditFazaCijena(p=>({...p,[s.id]:{...p[s.id],opis:e.target.value}}))}
                                placeholder="Kratki opis"
                                style={{width:140,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 8px",fontSize:13,fontFamily:C.font,outline:"none",color:C.text}}/>
                              <select value={editFazaCijena[s.id]?.jm??s.jm}
                                onChange={e=>setEditFazaCijena(p=>({...p,[s.id]:{...p[s.id],jm:e.target.value}}))}
                                style={{background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 6px",fontSize:13,fontFamily:C.font,outline:"none",color:C.text}}>
                                {["m²","m³","m¹","kom","t","kg","h"].map(j=><option key={j}>{j}</option>)}
                              </select>
                              <input type="number" value={editFazaCijena[s.id]?.cijena??s.cijena}
                                onChange={e=>setEditFazaCijena(p=>({...p,[s.id]:{...p[s.id],cijena:e.target.value}}))}
                                onKeyDown={e=>{if(e.key==="Enter")sačuvaj();if(e.key==="Escape")setEditFazaCijena(p=>{const n={...p};delete n[s.id];return n;});}}
                                placeholder="Cijena"
                                style={{width:80,background:"#fff",border:`1px solid ${C.gold}`,borderRadius:6,padding:"5px 8px",color:C.gold,fontSize:13,fontFamily:C.font,textAlign:"right",outline:"none"}}/>
                              <button onClick={sačuvaj} style={btn("green",{padding:"5px 10px",borderRadius:6})}>✓</button>
                              <button onClick={()=>setEditFazaCijena(p=>{const n={...p};delete n[s.id];return n;})} style={btn("ghost",{padding:"5px 10px",borderRadius:6})}>✕</button>
                            </div>
                          ) : (<>
                            <span style={{fontSize:14,fontWeight:700,color:C.gold,minWidth:80,textAlign:"right"}}>{fmtKM(s.cijena)}</span>
                            <button onClick={()=>setEditFazaCijena(p=>({...p,[s.id]:{naziv:s.naziv,opis:s.opis,jm:s.jm,cijena:s.cijena}}))} style={btn("ghost",{padding:"5px 10px",borderRadius:6})}>✏</button>
                            <button onClick={()=>sacuvajFazeKat({...fazeKat,[aktivnaAdminFaza]:stavke.filter(x=>x.id!==s.id)})} style={btn("danger",{padding:"5px 10px",borderRadius:6})}>✕</button>
                          </>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:"#F0EEFA",border:"1px solid #D8D0F0",borderRadius:10,padding:"16px"}}>
                  <p style={{fontSize:12,color:"#534AB7",fontWeight:600,margin:"0 0 10px"}}>+ Nova stavka u fazi</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{flex:2,minWidth:150}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Naziv</p><input placeholder="Opis rada" value={novaFazaStavka.naziv} onChange={e=>setNovaFazaStavka(p=>({...p,naziv:e.target.value}))} style={inp({padding:"7px 10px",fontSize:13})}/></div>
                    <div style={{flex:2,minWidth:150}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Kratki opis</p><input placeholder="Pojašnjenje" value={novaFazaStavka.opis} onChange={e=>setNovaFazaStavka(p=>({...p,opis:e.target.value}))} style={inp({padding:"7px 10px",fontSize:13})}/></div>
                    <div style={{width:72}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>JM</p><select value={novaFazaStavka.jm} onChange={e=>setNovaFazaStavka(p=>({...p,jm:e.target.value}))} style={inp({width:"100%",padding:"7px 6px",fontSize:13})}>{["m²","m³","m¹","kom","t","kg","h"].map(j=><option key={j}>{j}</option>)}</select></div>
                    <div style={{width:90}}><p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Cijena</p><input type="number" placeholder="0.00" value={novaFazaStavka.cijena} onChange={e=>setNovaFazaStavka(p=>({...p,cijena:e.target.value}))} style={inp({padding:"7px 8px",fontSize:13,textAlign:"right"})}/></div>
                          <button onClick={() => {
                              if (!novaFazaStavka.naziv || !novaFazaStavka.cijena) return; sacuvajFazeKat({ ...fazeKat, [aktivnaAdminFaza]: [...stavke, { id: `${aktivnaAdminFaza}-${genId()}`, naziv: novaFazaStavka.naziv, jm: novaFazaStavka.jm, cijena: parseFloat(novaFazaStavka.cijena), opis: novaFazaStavka.opis }] }); setNovaFazaStavka({ naziv: "", jm: "m²", cijena: "", opis: "" });}} style={btn("purple",{borderRadius:6,whiteSpace:"nowrap"})}>+ Dodaj</button>
                  </div>
                </div>
              </>);
            })()}
          </div>
        </div>
      )}

      {/* ── PROFIL ── */}
      {tab==="profil"&&(
        <div style={{flex:1,overflow:"auto",padding:"2rem",maxWidth:560}}>
          <h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:"0 0 0.25rem"}}>Profil firme</h2>
          <p style={{fontSize:13,color:C.dim,margin:"0 0 1.75rem"}}>Prikazuje se klijentima po slanju upita.</p>
          {[{key:"naziv",label:"Naziv firme",placeholder:"Npr. Gradnja d.o.o."},{key:"telefon",label:"Kontakt telefon",placeholder:"+387 6x xxx xxx"},{key:"email",label:"Email adresa",placeholder:"info@firma.ba"},{key:"adresa",label:"Adresa",placeholder:"Ulica, Grad"},{key:"pdv",label:"PDV broj",placeholder:"BA1234567890"}].map(f=>(
            <div key={f.key} style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>{f.label}</label>
              <input value={profil[f.key]} placeholder={f.placeholder} onChange={e=>setProfil(p=>({...p,[f.key]:e.target.value}))} style={inp({background:C.bg3})}/>
            </div>
          ))}
          <div style={{marginBottom:"1.5rem"}}>
            <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>Kratki opis</label>
            <textarea rows={3} value={profil.opis} onChange={e=>setProfil(p=>({...p,opis:e.target.value}))} style={{...inp({background:C.bg3,resize:"vertical"})}}/>
          </div>
          <button onClick={()=>flash("Profil sačuvan ✓")} style={btn("gold",{padding:"11px 28px",fontSize:14})}>Sačuvaj izmjene</button>
          <p style={{fontSize:12,color:C.dim,marginTop:"2rem",paddingTop:"1.5rem",borderTop:`1px solid ${C.border}`}}>
            Podaci se čuvaju lokalno.{" "}
            <span onClick={async()=>{if(window.confirm("Resetovati SVE podatke na početne vrijednosti?")){await Promise.all([dbSet("kategorije",INIT_KATEGORIJE),dbSet("faze_kat",INIT_FAZE_KAT),dbSet("profil",INIT_PROFIL)]);await supabase.from("upiti").delete().neq("id","x");window.location.reload();}}} style={{color:C.gold,cursor:"pointer",textDecoration:"underline"}}>Resetuj na početne vrijednosti</span>
          </p>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewOtvoren&&ponudaZaPreview&&(()=>{
        const ukBez=ponudaZaPreview.stavke.reduce((s,x)=>s+x.kolicina*x.cijena,0);
        const brP=`PON-${ponudaZaPreview.id.toUpperCase().slice(0,6)}-${new Date().getFullYear()}`;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(28,26,22,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(4px)"}}>
            <div style={{...card(),boxShadow:C.shadowL,width:"100%",maxWidth:740,maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div><h2 style={{fontFamily:C.font,fontSize:18,fontWeight:700,margin:"0 0 2px"}}>Pregled ponude</h2><p style={{fontSize:12,color:C.muted,margin:0}}>Broj: {brP} · {new Date().toLocaleDateString("bs-BA")}</p></div>
                <button onClick={()=>setPreviewOtvoren(false)} style={{background:"transparent",border:"none",fontSize:20,color:C.dim,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>✕</button>
              </div>
              <div style={{overflow:"auto",padding:"1.5rem",flex:1}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1.5rem"}}>
                  {[["Klijent",ponudaZaPreview.ime],["Telefon",ponudaZaPreview.telefon],["Email",ponudaZaPreview.email||"—"],["Datum upita",ponudaZaPreview.datum]].map(([l,v])=>(
                    <div key={l} style={{background:C.bg2,borderRadius:8,padding:"10px 14px"}}><p style={{fontSize:11,color:C.dim,margin:"0 0 2px",textTransform:"uppercase"}}>{l}</p><p style={{fontSize:13,fontWeight:600,margin:0}}>{v}</p></div>
                  ))}
                </div>
                <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",marginBottom:"1rem"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",background:C.gold,padding:"9px 14px",gap:16}}>
                    {["Opis rada","JM / Kol.","Jed. cijena","Iznos"].map(h=><span key={h} style={{fontSize:11,fontWeight:700,color:"#fff",textTransform:"uppercase"}}>{h}</span>)}
                  </div>
                  {ponudaZaPreview.stavke.map((s,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",padding:"10px 14px",gap:16,borderBottom:`1px solid ${C.border}`,background:i%2===0?C.bg3:C.bg}}>
                      <span style={{fontSize:13}}>{s.naziv}</span>
                      <span style={{fontSize:13,color:C.muted,textAlign:"right"}}>{s.kolicina} {s.jm}</span>
                      <span style={{fontSize:13,color:C.muted,textAlign:"right"}}>{s.cijena.toFixed(2)} KM</span>
                      <span style={{fontSize:13,fontWeight:600,color:C.gold,textAlign:"right"}}>{fmtKM(s.kolicina*s.cijena)}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end",marginBottom:"1.25rem"}}>
                  {[["Bez PDV-a",fmtKM(ukBez)],["PDV 17%",fmtKM(ukBez*0.17)]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",gap:32}}><span style={{fontSize:13,color:C.muted,minWidth:100}}>{l}</span><span style={{fontSize:13,minWidth:110,textAlign:"right"}}>{v}</span></div>
                  ))}
                  <div style={{display:"flex",gap:32,borderTop:`2px solid ${C.gold}`,paddingTop:8,marginTop:4}}>
                    <span style={{fontSize:15,fontWeight:700,minWidth:100}}>UKUPNO SA PDV:</span>
                    <span style={{fontSize:15,fontWeight:700,color:C.gold,minWidth:110,textAlign:"right"}}>{fmtKM(ukBez*1.17)}</span>
                  </div>
                </div>
                {ponudaZaPreview.napomena&&<div style={{background:C.goldBg,border:`1px solid ${C.goldL}`,borderRadius:8,padding:"12px 16px"}}><p style={{fontSize:11,color:C.gold,fontWeight:600,margin:"0 0 4px",textTransform:"uppercase"}}>Napomena</p><p style={{fontSize:13,color:C.muted,margin:0}}>{ponudaZaPreview.napomena}</p></div>}
              </div>
              <div style={{padding:"1rem 1.5rem",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",background:C.bg2,borderRadius:"0 0 12px 12px",flexShrink:0}}>
                <button onClick={()=>generirajPDF(ponudaZaPreview)} style={btn("ghost",{fontSize:14,padding:"10px 20px"})}>⬇ Preuzmi PDF</button>
                <button onClick={potvrdiPonudu} style={btn("gold",{fontSize:14,padding:"10px 24px"})}>✓ Potvrdi i pošalji klijentu</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── UPITNIK KOMPONENTE ───────────────────────────────────────────────────────
const ChoiceBtn = ({label,aktivan,onClick,ikona}) => (
  <button onClick={onClick} style={{padding:"11px 16px",fontSize:13,fontWeight:aktivan?700:500,borderRadius:9,cursor:"pointer",fontFamily:C.font,border:`1.5px solid ${aktivan?C.gold:C.border2}`,background:aktivan?C.goldBg:"#fff",color:aktivan?C.gold:C.muted,transition:"all 0.15s",display:"flex",alignItems:"center",gap:6}}>
    {ikona&&<span style={{fontSize:16}}>{ikona}</span>}{label}
  </button>
);

// ─── PROMJENA LOZINKE ────────────────────────────────────────────────────────
function PromijeniLozinku({onClose}) {
  const [stara,setStara] = useState("");
  const [nova,setNova] = useState("");
  const [potvrda,setPotvrda] = useState("");
  const [err,setErr] = useState("");
  const [ok,setOk] = useState(false);
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    if(nova.length<6){setErr("Nova lozinka mora imati najmanje 6 znakova.");return;}
    if(nova!==potvrda){setErr("Lozinke se ne podudaraju.");return;}
    setLoading(true);setErr("");
    const {error} = await supabase.auth.updateUser({password:nova});
    setLoading(false);
    if(!error){setOk(true);setTimeout(onClose,1500);}
    else setErr("Greška pri promjeni lozinke.");
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,26,22,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{...card(),padding:"2rem",width:360,boxShadow:C.shadowL}}>
        <h3 style={{fontFamily:C.font,fontSize:18,fontWeight:700,margin:"0 0 1.25rem"}}>Promjena lozinke</h3>
        {ok ? (
          <p style={{color:C.green,fontWeight:600,textAlign:"center",padding:"1rem 0"}}>✓ Lozinka uspješno promijenjena!</p>
        ) : (<>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Nova lozinka</label>
            <input type="password" value={nova} onChange={e=>{setNova(e.target.value);setErr("");}} style={inp({background:C.bg3})}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Potvrdi novu lozinku</label>
            <input type="password" value={potvrda} onChange={e=>{setPotvrda(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...inp({background:C.bg3}),borderColor:potvrda&&nova!==potvrda?C.red:undefined}}/>
          </div>
          {err&&<p style={{fontSize:12,color:C.red,margin:"0 0 10px"}}>{err}</p>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={submit} disabled={loading} style={{...btn("gold",{flex:1,padding:"10px"})}}>
              {loading?"Čuvanje...":"Sačuvaj"}
            </button>
            <button onClick={onClose} style={btn("ghost",{padding:"10px 16px"})}>Odustani</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── SUPER ADMIN PANEL ───────────────────────────────────────────────────────
function SuperAdminPanel({onLogout,kategorije:katInit,setKategorije:syncKategorije,upiti,setUpiti,fazeKatProp,onFazeKatChange,firmaIdProp}) {
  const [tab,setTab] = useState("firme");
  const [firme,setFirme] = useState([]);
  const [korisnici,setKorisnici] = useState([]);
  const [sviUpiti,setSviUpiti] = useState([]);
  const [loading,setLoading] = useState(true);
  const [novaFirma,setNovaFirma] = useState({naziv:"",slug:""});
  const [noviKorisnik,setNoviKorisnik] = useState({firmaId:"",email:"",password:""});
  const [poruka,setPoruka] = useState("");
  const [editPassKorisnik,setEditPassKorisnik] = useState(null);
  const [novaLozinka,setNovaLozinka] = useState({});
  const [filterFirma,setFilterFirma] = useState("sve");
  const [aktivnaFirma,setAktivnaFirma] = useState(null); // kad superadmin uđe u firmu

  const flash = msg => {setPoruka(msg);setTimeout(()=>setPoruka(""),2500);};

  useEffect(()=>{
    async function load(){
      setLoading(true);
      const [f,k,u]=await Promise.all([getAllFirme(),getAllKorisnici(),upitiGet()]);
      setFirme(f);setKorisnici(k);setSviUpiti(u);setLoading(false);
    }
    load();
  },[]);

  const handleDodajFirmu = async () => {
    if(!novaFirma.naziv||!novaFirma.slug){flash("Popunite naziv i slug!");return;}
    const f = await dodajFirmu(novaFirma.naziv, novaFirma.slug.toLowerCase().replace(/\s+/g,"-"));
    if(f){setFirme(p=>[...p,f]);setNovaFirma({naziv:"",slug:""});flash("Firma dodana ✓");}
    else flash("Greška — slug možda već postoji.");
  };

  const handleDodajKorisnika = async () => {
    if(!noviKorisnik.firmaId||!noviKorisnik.email||!noviKorisnik.password){flash("Popunite sva polja!");return;}
    const k = await dodajKorisnika(noviKorisnik.firmaId,noviKorisnik.email,noviKorisnik.password);
    if(k){setKorisnici(p=>[...p,k]);setNoviKorisnik({firmaId:"",email:"",password:""});flash("Korisnik dodan ✓");}
    else flash("Greška — email možda već postoji.");
  };

  const handleObrisiKorisnika = async (id) => {
    if(!window.confirm("Obrisati korisnika?"))return;
    if(await obrisiKorisnika(id)){setKorisnici(p=>p.filter(k=>k.id!==id));flash("Korisnik obrisan ✓");}
  };

  const handleObrisiFiremu = async (id) => {
    if(!window.confirm("Obrisati firmu i sve njene podatke?"))return;
    if(await obrisiFiremu(id)){setFirme(p=>p.filter(f=>f.id!==id));setKorisnici(p=>p.filter(k=>k.firma_id!==id));flash("Firma obrisana ✓");}
  };

  const [firmaKategorije,setFirmaKategorijeLok] = useState(INIT_KATEGORIJE);
  const [firmaFazeKat,setFirmaFazeKatLok] = useState(INIT_FAZE_KAT);
  const [firmaUpiti,setFirmaUpitiLok] = useState([]);
  const [firmaLoading,setFirmaLoading] = useState(false);

  const uđiUFiremu = async (firma) => {
    setFirmaLoading(true);
    const [kat,faze,upitiData] = await Promise.all([
      dbGet("kategorije",INIT_KATEGORIJE,firma.id),
      dbGet("faze_kat",INIT_FAZE_KAT,firma.id),
      upitiGet(firma.id),
    ]);
    setFirmaKategorijeLok(kat);setFirmaFazeKatLok(faze);setFirmaUpitiLok(upitiData);
    setAktivnaFirma(firma);
    setFirmaLoading(false);
  };

  const syncFirmaKategorije = async (val) => { setFirmaKategorijeLok(val); await dbSet("kategorije",val,aktivnaFirma?.id); };

  const handlePromijeniPass = async (korisnikId) => {
    const nova = novaLozinka[korisnikId];
    if(!nova||nova.length<6){flash("Lozinka mora imati min. 6 znakova.");return;}
    if(await updatePassword(korisnikId,nova)){
      setNovaLozinka(p=>({...p,[korisnikId]:""}));
      setEditPassKorisnik(null);
      flash("Lozinka promijenjena ✓");
    }
  };

  const tabS = t => ({background:"transparent",border:"none",borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t?C.text:C.dim,fontSize:13,fontWeight:tab===t?600:400,padding:"10px 16px",cursor:"pointer",fontFamily:C.font,marginBottom:-1});

  const filtrirani = filterFirma==="sve"?sviUpiti:sviUpiti.filter(u=>u._firma_id===filterFirma);

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.font}}>
      <GFont/>
      <p style={{color:C.muted}}>Učitavanje...</p>
    </div>
  );

  if(firmaLoading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.font,flexDirection:"column",gap:12}}>
      <GFont/>
      <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:C.muted,fontSize:14}}>Učitavanje podataka firme...</p>
    </div>
  );

  if(aktivnaFirma) return (
    <AdminPanel
      kategorije={firmaKategorije} setKategorije={syncFirmaKategorije}
      upiti={firmaUpiti} setUpiti={next=>setFirmaUpitiLok(typeof next==="function"?next(firmaUpiti):next)}
      fazeKatProp={firmaFazeKat} onFazeKatChange={async next=>{setFirmaFazeKatLok(next);await dbSet("faze_kat",next,aktivnaFirma.id);}}
      firmaId={aktivnaFirma.id} korisnik={null}
      onBack={()=>setAktivnaFirma(null)}
      onLogout={null} onChangePass={null}
    />
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GFont/>
      <div style={{height:36,background:C.bg3,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <span style={{fontSize:14,color:C.text,fontWeight:700}}>🛡 Super Admin</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {poruka&&<span style={{fontSize:12,color:C.green,fontWeight:500}}>{poruka}</span>}
          <button onClick={onLogout} style={btn("ghost",{fontSize:12,padding:"5px 12px"})}>Odjavi se</button>
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",background:C.bg3,padding:"0 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <button style={tabS("firme")} onClick={()=>setTab("firme")}>🏢 Firme ({firme.length})</button>
        <button style={tabS("korisnici")} onClick={()=>setTab("korisnici")}>👤 Korisnici ({korisnici.filter(k=>k.uloga!=="superadmin").length})</button>
        <button style={tabS("upiti")} onClick={()=>setTab("upiti")}>📋 Svi upiti ({sviUpiti.length})</button>
      </div>

      {/* ── FIRME ── */}
      {tab==="firme"&&(
        <div style={{flex:1,overflow:"auto",padding:"1.5rem",maxWidth:800,width:"100%",margin:"0 auto"}}>
          <h2 style={{fontFamily:C.font,fontSize:20,fontWeight:700,margin:"0 0 1.25rem"}}>Firme</h2>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"2rem"}}>
            {firme.map(f=>(
              <div key={f.id} style={{...card(),padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 2px",fontSize:14,fontWeight:600}}>{f.naziv}</p>
                  <p style={{margin:0,fontSize:12,color:C.muted}}>/{f.slug} · {korisnici.filter(k=>k.firma_id===f.id).length} korisnika</p>
                </div>
                <a href={`/${f.slug}`} target="_blank" rel="noreferrer" style={{...btn("ghost",{fontSize:12,padding:"5px 12px"}),textDecoration:"none"}}>Otvori →</a>
                <button onClick={()=>uđiUFiremu(f)} style={btn("gold",{fontSize:12,padding:"5px 12px"})}>⚙ Upravljaj</button>
                <button onClick={()=>handleObrisiFiremu(f.id)} style={btn("danger",{fontSize:12,padding:"5px 12px"})}>Obriši</button>
              </div>
            ))}
          </div>

          <div style={{...card(),padding:"1.25rem"}}>
            <p style={{fontSize:13,fontWeight:600,margin:"0 0 12px",color:C.gold}}>+ Dodaj novu firmu</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:2,minWidth:150}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Naziv firme</p>
                <input placeholder="Npr. Gradnja d.o.o." value={novaFirma.naziv} onChange={e=>setNovaFirma(p=>({...p,naziv:e.target.value}))} style={inp({padding:"8px 12px",fontSize:13})}/>
              </div>
              <div style={{flex:1,minWidth:120}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Slug (URL)</p>
                <input placeholder="gradnja-doo" value={novaFirma.slug} onChange={e=>setNovaFirma(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")}))} style={inp({padding:"8px 12px",fontSize:13})}/>
              </div>
              <button onClick={handleDodajFirmu} style={btn("gold",{whiteSpace:"nowrap"})}>+ Dodaj firmu</button>
            </div>
          </div>
        </div>
      )}

      {/* ── KORISNICI ── */}
      {tab==="korisnici"&&(
        <div style={{flex:1,overflow:"auto",padding:"1.5rem",maxWidth:800,width:"100%",margin:"0 auto"}}>
          <h2 style={{fontFamily:C.font,fontSize:20,fontWeight:700,margin:"0 0 1.25rem"}}>Korisnici</h2>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"2rem"}}>
            {korisnici.filter(k=>k.uloga!=="superadmin").map(k=>{
              const firma = firme.find(f=>f.id===k.firma_id);
              const editingPass = editPassKorisnik===k.id;
              return (
                <div key={k.id} style={{...card(),padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <p style={{margin:"0 0 2px",fontSize:14,fontWeight:600}}>{k.email}</p>
                      <p style={{margin:0,fontSize:12,color:C.muted}}>{firma?.naziv||"—"} · {k.uloga}</p>
                    </div>
                    <button onClick={()=>setEditPassKorisnik(editingPass?null:k.id)} style={btn("ghost",{fontSize:12,padding:"5px 12px"})}>🔑 Lozinka</button>
                    <button onClick={()=>handleObrisiKorisnika(k.id)} style={btn("danger",{fontSize:12,padding:"5px 12px"})}>Obriši</button>
                  </div>
                  {editingPass&&(
                    <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center",paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                      <input type="password" placeholder="Nova lozinka (min. 6 znakova)" value={novaLozinka[k.id]||""} onChange={e=>setNovaLozinka(p=>({...p,[k.id]:e.target.value}))} style={{...inp({padding:"7px 12px",fontSize:13}),flex:1}}/>
                      <button onClick={()=>handlePromijeniPass(k.id)} style={btn("green",{whiteSpace:"nowrap",padding:"7px 14px"})}>Sačuvaj</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{...card(),padding:"1.25rem"}}>
            <p style={{fontSize:13,fontWeight:600,margin:"0 0 12px",color:C.gold}}>+ Dodaj korisnika</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:1,minWidth:140}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Firma</p>
                <select value={noviKorisnik.firmaId} onChange={e=>setNoviKorisnik(p=>({...p,firmaId:e.target.value}))} style={inp({padding:"8px 10px",fontSize:13,cursor:"pointer",color:C.text})}>
                  <option value="">Odaberi firmu</option>
                  {firme.map(f=><option key={f.id} value={f.id}>{f.naziv}</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:120}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Email</p>
                <input type="email" placeholder="email@firma.ba" value={noviKorisnik.email} onChange={e=>setNoviKorisnik(p=>({...p,email:e.target.value}))} style={inp({padding:"8px 12px",fontSize:13})}/>
              </div>
              <div style={{flex:1,minWidth:120}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Lozinka</p>
                <input type="password" placeholder="lozinka" value={noviKorisnik.password} onChange={e=>setNoviKorisnik(p=>({...p,password:e.target.value}))} style={inp({padding:"8px 12px",fontSize:13})}/>
              </div>
              <button onClick={handleDodajKorisnika} style={btn("gold",{whiteSpace:"nowrap"})}>+ Dodaj</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SVI UPITI ── */}
      {tab==="upiti"&&(
        <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.25rem",flexWrap:"wrap"}}>
            <h2 style={{fontFamily:C.font,fontSize:20,fontWeight:700,margin:0}}>Svi upiti</h2>
            <select value={filterFirma} onChange={e=>setFilterFirma(e.target.value)} style={{...inp({padding:"6px 10px",fontSize:13,cursor:"pointer",color:C.text}),width:"auto"}}>
              <option value="sve">Sve firme</option>
              {firme.map(f=><option key={f.id} value={f.id}>{f.naziv}</option>)}
            </select>
            <span style={pill("blue")}>{filtrirani.length} upita</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtrirani.map(u=>{
              const firma = firme.find(f=>f.id===u._firma_id);
              const uk = u.stavke?.reduce((s,x)=>s+x.kolicina*x.cijena,0)||0;
              return (
                <div key={u.id} style={{...card(),padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <p style={{margin:0,fontSize:14,fontWeight:600}}>{u.ime}</p>
                      {firma&&<span style={pill("blue")}>{firma.naziv}</span>}
                      <StatusBadge s={u.status}/>
                    </div>
                    <p style={{margin:0,fontSize:12,color:C.muted}}>{u.telefon} · {u.datum}</p>
                  </div>
                  {uk>0&&<span style={{fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>{fmtKM(uk*1.17)}</span>}
                </div>
              );
            })}
            {filtrirani.length===0&&<p style={{fontSize:13,color:C.dim,textAlign:"center",padding:"2rem"}}>Nema upita.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GLAVNA APLIKACIJA ────────────────────────────────────────────────────────
export default function App() {
  // ── Routing — čitaj slug iz URL ─────────────────────────────────────────
  const firmaSlug = window.location.pathname.replace(/^\//, "").split("/")[0] || null;

  const [view,setView] = useState("home");
  const [adminView,setAdminView] = useState(null); // null | "login" | "panel" | "superadmin"
  const [korisnik,setKorisnik] = useState(null); // prijavljeni korisnik
  const [firma,setFirma] = useState(null); // firma za ovaj URL
  const [kategorije,setKategorijeLoc] = useState(INIT_KATEGORIJE);
  const [upiti,setUpitiLoc] = useState([]);
  const [fazeKat,setFazeKatLoc] = useState(INIT_FAZE_KAT);
  const [klijentskeFaze,setKlijentskeFaze] = useState(FAZE);
  const [loading,setLoading] = useState(true);
  const [aktivnaKat,setAktivnaKat] = useState(INIT_KATEGORIJE[0].id);
  const [showChangePass,setShowChangePass] = useState(false);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      let currentFirma = null;
      if(firmaSlug) {
        currentFirma = await getFirmaBySlug(firmaSlug);
        setFirma(currentFirma);
      }
      const fId = currentFirma?.id || null;
      const [kat,faze,upitiData,fazeListData]=await Promise.all([
        dbGet("kategorije",INIT_KATEGORIJE,fId),
        dbGet("faze_kat",INIT_FAZE_KAT,fId),
        upitiGet(fId),
        dbGet("faze_list",FAZE,fId),
      ]);
      setKategorijeLoc(kat);setFazeKatLoc(faze);setUpitiLoc(upitiData);
      setKlijentskeFaze(fazeListData);
      setAktivnaKat(kat[0]?.id||INIT_KATEGORIJE[0].id);
      setLoading(false);
    }
    load();
  },[]);

  const firmaId = firma?.id || null;

  const syncKategorije = async (val) => { setKategorijeLoc(val); await dbSet("kategorije",val,firmaId); };

  const setUpiti = (next) => setUpitiLoc(prev=>{
    const r=typeof next==="function"?next(prev):next;
    if(Array.isArray(r)&&Array.isArray(prev)){
      r.filter(u=>!prev.find(p=>p.id===u.id)).forEach(u=>upitiUpsert(u,firmaId));
      r.filter(u=>{const o=prev.find(p=>p.id===u.id);return o&&JSON.stringify(o)!==JSON.stringify(u);}).forEach(u=>upitiUpdate(u));
    }
    return r;
  });

  const handleLogin = (k) => {
    setKorisnik(k);
    if(k.uloga==="superadmin") setAdminView("superadmin");
    else setAdminView("panel");
  };

  const handleLogout = () => { supabase.auth.signOut(); setKorisnik(null); setAdminView(null); };

  // Keep an admin logged in across a page refresh by restoring their Supabase
  // Auth session, then looking up their role/firma_id from korisnici.
  useEffect(()=>{
    let active = true;
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if(!session||!active) return;
      const profil = await getKorisnikProfil(session.user.id);
      if(profil&&active) handleLogin(profil);
    });
    const {data:sub} = supabase.auth.onAuthStateChange((event)=>{
      if(event==="SIGNED_OUT"){ setKorisnik(null); setAdminView(null); }
    });
    return ()=>{ active=false; sub.subscription.unsubscribe(); };
  },[]);

  const [stavke,setStavke] = useState({});
  const [kontakt,setKontakt] = useState({ime:"",telefon:"",email:"",napomena:""});
  const [sidebar,setSidebar] = useState(true);
  const [imaProjekat,setImaProjekat] = useState(null);
  const [odabraneFaze,setOdabraneFaze] = useState([]);
  const [fazeStavke,setFazeStavke] = useState({});
  const [aktivnaFaza,setAktivnaFaza] = useState(null);
  const [datumDan,setDatumDan] = useState("");
  const [datumMj,setDatumMj] = useState("");
  const [datumGod,setDatumGod] = useState("");
  const [prethodniView,setPrethodniView] = useState("home");
  const [upitnik,setUpitnik] = useState({finansiranje:"",lokacija:"",grad:"",ravnoZemljiste:null,pristupniPut:null,gradjevinDozvola:null,strujaVoda:null,pocetakRadova:"",temelji:"",krov:""});
  const [profil,setProfil] = useState(INIT_PROFIL);
  useEffect(()=>{ if(!loading) dbGet("profil",INIT_PROFIL,firmaId).then(p=>setProfil(p)); },[loading]);

  const ukupno = Object.values(stavke).reduce((s,x)=>s+x.kolicina*x.cijena,0);
  const broJStavki = Object.values(stavke).filter(s=>s.kolicina>0).length;
  const aktivneStavke = Object.entries(stavke).filter(([,s])=>s.kolicina>0);
  const ukupnoFaze = klijentskeFaze.filter(f=>odabraneFaze.includes(f.id)).reduce((s,f)=>s+f.cijena,0);
  const odabraneStavkeFaze = odabraneFaze.flatMap(fId2=>(fazeKat[fId2]||[]).map(s=>({...s,kolicina:fazeStavke[s.id]||0,iznos:(fazeStavke[s.id]||0)*s.cijena})));

  const setKolicina = (id,cijena,naziv,jm,val) => setStavke(prev=>({...prev,[id]:{kolicina:parseFloat(val)||0,cijena,naziv,jm}}));
  const setU = (key,val) => setUpitnik(p=>({...p,[key]:val}));

  const navigiraj = (novi) => {
    setPrethodniView(view);
    if(novi==="faze-detalj") setAktivnaFaza(odabraneFaze[0]||null);
    setView(novi);
  };
  const nazad = () => { setView(prethodniView); setPrethodniView("home"); };

  const upitnikValidan = upitnik.finansiranje&&upitnik.lokacija&&upitnik.grad&&upitnik.ravnoZemljiste!==null&&upitnik.pristupniPut!==null&&upitnik.gradjevinDozvola!==null&&upitnik.strujaVoda!==null&&upitnik.pocetakRadova&&upitnik.temelji&&upitnik.krov;
  const telefonValidan = /^[\+]?[\d\s\-\(\)]{8,15}$/.test(kontakt.telefon);
  const emailValidan = !kontakt.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kontakt.email);

  const posaljiUpit = () => {
    if(!kontakt.ime||!kontakt.telefon||!telefonValidan||!emailValidan)return;
    const stavkeFaze = odabraneStavkeFaze.filter(s=>s.kolicina>0).map(s=>({naziv:s.naziv,kolicina:s.kolicina,jm:s.jm,cijena:s.cijena,faza:s.id.split("-")[0]}));
    setUpiti(prev=>[{id:genId(),datum:new Date().toLocaleString("bs-BA").slice(0,16),status:"nov",imaProjekat,odabraneFaze,upitnik,...kontakt,stavke:imaProjekat==="ne"?stavkeFaze:aktivneStavke.map(([,s])=>({naziv:s.naziv,kolicina:s.kolicina,jm:s.jm,cijena:s.cijena}))}, ...prev]);
    setView("upit-poslan");
  };

  const resetujSesiju = () => {
    setView("home");setStavke({});setFazeStavke({});setAktivnaFaza(null);
    setKontakt({ime:"",telefon:"",email:"",napomena:""});
    setImaProjekat(null);setOdabraneFaze([]);
    setDatumDan("");setDatumMj("");setDatumGod("");
    setUpitnik({finansiranje:"",lokacija:"",grad:"",ravnoZemljiste:null,pristupniPut:null,gradjevinDozvola:null,strujaVoda:null,pocetakRadova:"",temelji:"",krov:""});
  };

  // ── Render logic ──────────────────────────────────────────────────────────
  if(adminView==="login") return <AdminLogin firmaSlug={firmaSlug} onLogin={handleLogin} onCancel={()=>setAdminView(null)}/>;
  if(adminView==="superadmin") return <SuperAdminPanel onLogout={handleLogout}/>;
  if(adminView==="panel") return (
    <>
      <AdminPanel
        kategorije={kategorije} setKategorije={syncKategorije}
        upiti={upiti} setUpiti={setUpiti}
        fazeKatProp={fazeKat} onFazeKatChange={async next=>{setFazeKatLoc(next);await dbSet("faze_kat",next,firmaId);}}
        firmaId={firmaId} korisnik={korisnik}
        onBack={()=>setAdminView(null)}
        onLogout={handleLogout}
        onChangePass={()=>setShowChangePass(true)}
      />
      {showChangePass&&korisnik&&<PromijeniLozinku onClose={()=>setShowChangePass(false)}/>}
    </>
  );

  const GF = () => <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>;

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GF/>
      <TitleBar/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:40,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{fontSize:14,color:C.muted}}>Učitavanje podataka...</p>
      </div>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  if(view==="home") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GF/>
      <TitleBar onAdmin={()=>setAdminView("login")}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem 2rem",textAlign:"center"}}>
        <div style={{width:76,height:76,background:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.5rem",fontSize:36,boxShadow:`0 8px 24px ${C.gold}40`}}>📐</div>
        <h1 style={{fontFamily:C.font,fontSize:42,fontWeight:700,margin:"0 0 0.5rem",letterSpacing:"-0.02em",color:C.text}}>Troškovi gradnje</h1>
        <p style={{fontSize:16,color:C.muted,margin:"0 0 0.25rem"}}>Kalkulator troškova građevinskih radova</p>
        <p style={{fontSize:13,color:C.dim,margin:"0 0 2.5rem"}}>Odmah vidite okvirnu cijenu · Bez registracije · Šaljete direktno izvođaču</p>

        <div style={{...card(),padding:"2rem",maxWidth:440,width:"100%",marginBottom:"2rem"}}>
          <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 0.5rem"}}>Imate gotov projekat?</p>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 1.5rem",lineHeight:1.6}}>Ako imate projekat s mjerama, unesite stavke direktno.<br/>Ako nemate, prikazat ćemo okvirne cijene po fazama.</p>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>{setImaProjekat("da");navigiraj("kalkulacija");}} style={{flex:1,background:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`,color:"#fff",border:"none",borderRadius:11,padding:"15px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:C.font,boxShadow:`0 4px 16px ${C.gold}40`}}>DA</button>
            <button onClick={()=>{setImaProjekat("ne");navigiraj("faze");}} style={{flex:1,background:C.bg2,color:C.text,border:`1.5px solid ${C.border2}`,borderRadius:11,padding:"15px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:C.font}}>NE</button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:520,width:"100%"}}>
          {[{ikona:"⚡",tekst:"Instant kalkulacija"},{ikona:"🔒",tekst:"Vaši podaci su sigurni"},{ikona:"📞",tekst:"Direktan kontakt"}].map(f=>(
            <div key={f.tekst} style={{...card(),padding:"1rem",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:6}}>{f.ikona}</div>
              <div style={{fontSize:12,color:C.muted,fontWeight:500}}>{f.tekst}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── FAZE ──────────────────────────────────────────────────────────────────
  if(view==="faze") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GF/>
      <TitleBar onAdmin={()=>setAdminView("login")}/>
      <div style={{flex:1,overflow:"auto",padding:"2rem",maxWidth:740,margin:"0 auto",width:"100%"}}>
        <button onClick={nazad} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontFamily:C.font,fontSize:13,padding:"0 0 1.25rem",display:"block"}}>← Nazad</button>
        <h2 style={{fontFamily:C.font,fontSize:28,fontWeight:700,margin:"0 0 0.25rem"}}>Okvirne cijene po fazama</h2>
        <p style={{fontSize:13,color:C.muted,margin:"0 0 1.75rem",lineHeight:1.6}}>Odaberite faze koje vas zanimaju. Cijene su okvirne za ~100m².</p>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:"1.5rem"}}>
          {klijentskeFaze.map(f=>{
            const od=odabraneFaze.includes(f.id);
            return (
              <div key={f.id} onClick={()=>setOdabraneFaze(prev=>od?prev.filter(x=>x!==f.id):[...prev,f.id])}
                style={{...card(),background:od?C.greenBg:C.bg3,border:`2px solid ${od?C.greenBd:C.border}`,padding:"1.5rem",cursor:"pointer",transition:"all 0.15s",userSelect:"none"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{width:50,height:50,background:od?C.greenBg:C.bg2,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,border:`1px solid ${od?C.greenBd:C.border}`,transition:"all 0.15s"}}>{f.ikona}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:12}}>
                      <p style={{fontSize:16,fontWeight:700,color:od?C.green:C.text,margin:0}}>{f.naziv}</p>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                        <span style={{fontSize:17,fontWeight:700,color:C.gold}}>~{f.cijena.toLocaleString("bs-BA")} KM</span>
                        <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${od?C.green:C.border2}`,background:od?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>{od?"✓":""}</div>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:C.muted,margin:"0 0 12px",lineHeight:1.65}}>{f.opis}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {f.stavke.map(s=><span key={s} style={{fontSize:11,background:od?C.greenBg:C.bg2,color:od?C.green:C.muted,border:`1px solid ${od?C.greenBd:C.border}`,borderRadius:20,padding:"3px 10px",transition:"all 0.15s"}}>{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {odabraneFaze.length>0&&(
          <div style={{...card(),padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",boxShadow:C.shadowL,border:`1px solid ${C.goldL}`}}>
            <div>
              <p style={{fontSize:12,color:C.muted,margin:"0 0 2px"}}>Odabrane {odabraneFaze.length} {odabraneFaze.length===1?"faza":"faze"}</p>
              <p style={{fontSize:26,fontWeight:700,color:C.gold,margin:0}}>~{ukupnoFaze.toLocaleString("bs-BA")} KM</p>
              <p style={{fontSize:11,color:C.dim,margin:"2px 0 0"}}>Okvirno za ~100m² bez PDV-a</p>
            </div>
            <button onClick={()=>navigiraj("faze-detalj")} style={{...btn("gold",{padding:"13px 28px",fontSize:14}),background:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`,boxShadow:`0 4px 16px ${C.gold}40`}}>Dalje → Unesite količine</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── FAZE DETALJ ───────────────────────────────────────────────────────────
  if(view==="faze-detalj") {
    const stavkeFaze = fazeKat[aktivnaFaza]||[];
    const popunjeneStavke = odabraneStavkeFaze.filter(s=>s.kolicina>0);
    const ukupnoPopunjeno = popunjeneStavke.reduce((s,x)=>s+x.iznos,0);
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
        <GF/>
        <TitleBar onAdmin={()=>setAdminView("login")}/>
        <div style={{flex:1,display:"flex",overflow:"auto"}}>
          {/* Sidebar faze */}
          <div style={{width:200,flexShrink:0,background:C.bg3,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`}}><p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:0}}>Vaše faze</p></div>
            {klijentskeFaze.filter(f=>odabraneFaze.includes(f.id)).map(f=>(
              <button key={f.id} onClick={()=>setAktivnaFaza(f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:aktivnaFaza===f.id?C.bg:C.bg3,border:"none",borderLeft:aktivnaFaza===f.id?`3px solid ${C.gold}`:"3px solid transparent",cursor:"pointer",fontFamily:C.font,textAlign:"left",width:"100%"}}>
                <span style={{fontSize:18}}>{f.ikona}</span>
                <span style={{fontSize:13,color:aktivnaFaza===f.id?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.naziv.split("—")[0].trim()}</span>
              </button>
            ))}
          </div>

          {/* Stavke */}
          <div style={{flex:1,overflow:"auto",padding:"1.5rem"}}>
            <button onClick={nazad} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontFamily:C.font,fontSize:13,padding:"0 0 1rem",display:"block"}}>← Nazad</button>
            {klijentskeFaze.filter(f=>f.id===aktivnaFaza).map(f=>(
              <div key={f.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.25rem"}}>
                  <span style={{fontSize:28}}>{f.ikona}</span>
                  <div><h2 style={{fontFamily:C.font,fontSize:22,fontWeight:700,margin:0}}>{f.naziv}</h2><p style={{fontSize:12,color:C.dim,margin:0}}>Unesite količine za precizniju kalkulaciju</p></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {stavkeFaze.map(s=>{
                    const kol=fazeStavke[s.id]||0;const akt=kol>0;
                    return (
                      <div key={s.id} style={{...card(),background:akt?C.greenBg:C.bg3,border:`1px solid ${akt?C.greenBd:C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:"0 0 2px",fontSize:14,color:akt?C.green:C.text,fontWeight:akt?600:400}}>{s.naziv}</p>
                          <p style={{margin:"0 0 2px",fontSize:12,color:C.dim,fontStyle:"italic"}}>{s.opis}</p>
                          <p style={{margin:0,fontSize:14,color:C.dim}}>{s.cijena.toFixed(2)} KM / {s.jm}{s.jm==="m³"&&<M3Info naziv={s.naziv}/>}</p>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <input type="number" min="0" step="0.5" placeholder="0" value={kol||""} onChange={e=>setFazeStavke(prev=>({...prev,[s.id]:parseFloat(e.target.value)||0}))}
                            style={{width:80,background:"#fff",border:`1px solid ${C.border2}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:14,fontFamily:C.font,textAlign:"right",outline:"none"}}/>
                          <span style={{fontSize:14,color:C.muted,display:"flex",alignItems:"center"}}>{s.jm}</span>
                          <span style={{fontSize:14,fontWeight:600,color:akt?C.gold:C.dim,minWidth:80,textAlign:"right"}}>{akt?fmtKM(kol*s.cijena):"—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Rekapitulacija */}
          {popunjeneStavke.length>0&&(
            <div style={{width:260,flexShrink:0,background:C.bg3,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"1rem"}}>
              <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 12px"}}>Rekapitulacija</p>
              <div style={{flex:1,overflow:"auto"}}>
                {popunjeneStavke.map((s,i)=>(
                  <div key={i} style={{borderBottom:`1px solid ${C.border}`,padding:"8px 0"}}>
                    <p style={{margin:"0 0 2px",fontSize:12,color:C.muted,lineHeight:1.3}}>{s.naziv}</p>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.dim}}>{s.kolicina} {s.jm}</span><span style={{fontSize:12,color:C.gold,fontWeight:500}}>{fmtKM(s.iznos)}</span></div>
                  </div>
                ))}
              </div>
              <div style={{borderTop:`1px solid ${C.border2}`,paddingTop:12,marginTop:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                  <span style={{fontSize:13,fontWeight:600}}>Ukupno (okvirno)</span>
                  <span style={{fontSize:15,fontWeight:700,color:C.gold}}>~{fmtKM(ukupnoPopunjeno)}</span>
                </div>
                <button onClick={()=>navigiraj("upitnik")} style={{width:"100%",...btn("gold",{padding:"11px",fontSize:13}),background:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`}}>Pošalji upit →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── UPITNIK ───────────────────────────────────────────────────────────────
  if(view==="upitnik") {
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
        <GF/>
        <TitleBar onAdmin={()=>setAdminView("login")}/>
        <div style={{flex:1,overflow:"auto",padding:"2rem",maxWidth:620,margin:"0 auto",width:"100%"}}>
          <button onClick={nazad} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontFamily:C.font,fontSize:13,padding:"0 0 1.25rem",display:"block"}}>← Nazad</button>
          <h2 style={{fontFamily:C.font,fontSize:28,fontWeight:700,margin:"0 0 0.25rem"}}>Informacije o gradnji</h2>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 2rem",lineHeight:1.6}}>Pomažu izvođaču da pripremi precizniju ponudu. Sva polja su obavezna.</p>

          <Sekcija label="Način finansiranja" required>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["samofinansiranje","💰","Samofinansiranje"],["irb","🏦","IRB kredit"],["stambeni","🏠","Stambeni kredit"]].map(([v,ik,l])=>(
                <ChoiceBtn key={v} label={l} ikona={ik} aktivan={upitnik.finansiranje===v} onClick={()=>setU("finansiranje",v)}/>
              ))}
            </div>
          </Sekcija>

          <Sekcija label="Lokacija gradnje" required>
            <div style={{display:"flex",gap:10}}>
              <input placeholder="Adresa / ulica" value={upitnik.lokacija} onChange={e=>setU("lokacija",e.target.value)} style={{...inp({background:C.bg3}),flex:2}}/>
              <input placeholder="Grad" value={upitnik.grad} onChange={e=>setU("grad",e.target.value)} style={{...inp({background:C.bg3}),flex:1}}/>
            </div>
          </Sekcija>

          {[{key:"ravnoZemljiste",label:"Da li je zemljište ravno?"},{key:"pristupniPut",label:"Da li zemljište ima pristupni put?"},{key:"gradjevinDozvola",label:"Da li je obezbijeđena građevinska dozvola?"},{key:"strujaVoda",label:"Da li je obezbijeđen pristup struji i vodi?"}].map(({key,label})=>(
            <Sekcija key={key} label={label} required>
              <div style={{display:"flex",gap:10}}>
                <DaNeBtn val={true} aktivan={upitnik[key]===true} onClick={()=>setU(key,true)}/>
                <DaNeBtn val={false} aktivan={upitnik[key]===false} onClick={()=>setU(key,false)}/>
              </div>
            </Sekcija>
          ))}

          <Sekcija label="Planirani početak izvođenja radova" required>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:"0 0 90px"}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Dan</p>
                <select value={datumDan} onChange={e=>{setDatumDan(e.target.value);if(datumGod&&datumMj&&e.target.value)setU("pocetakRadova",`${datumGod}-${datumMj}-${e.target.value}`);}} style={{...inp({background:C.bg3,padding:"10px 12px",cursor:"pointer",width:"100%"})}}>
                  <option value="">Dan</option>
                  {Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0")).map(d=><option key={d} value={d}>{parseInt(d)}</option>)}
                </select>
              </div>
              <div style={{flex:"1 1 140px"}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Mjesec</p>
                <select value={datumMj} onChange={e=>{setDatumMj(e.target.value);if(datumGod&&e.target.value&&datumDan)setU("pocetakRadova",`${datumGod}-${e.target.value}-${datumDan}`);}} style={{...inp({background:C.bg3,padding:"10px 12px",cursor:"pointer",width:"100%"})}}>
                  <option value="">Mjesec</option>
                  {["Januar","Februar","Mart","April","Maj","Jun","Jul","August","Septembar","Oktobar","Novembar","Decembar"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
                </select>
              </div>
              <div style={{flex:"0 0 110px"}}>
                <p style={{fontSize:11,color:C.dim,margin:"0 0 4px"}}>Godina</p>
                <select value={datumGod} onChange={e=>{setDatumGod(e.target.value);if(e.target.value&&datumMj&&datumDan)setU("pocetakRadova",`${e.target.value}-${datumMj}-${datumDan}`);}} style={{...inp({background:C.bg3,padding:"10px 12px",cursor:"pointer",width:"100%"})}}>
                  <option value="">Godina</option>
                  {Array.from({length:6},(_,i)=>new Date().getFullYear()+i).map(g=><option key={g} value={String(g)}>{g}</option>)}
                </select>
              </div>
            </div>
          </Sekcija>

          <Sekcija label="Vrsta temelja" required>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["trake","🧱","Temeljne trake sa podnom pločom"],["ploca","▭","Plivajuća temeljna ploča"]].map(([v,ik,l])=>(
                <ChoiceBtn key={v} label={l} ikona={ik} aktivan={upitnik.temelji===v} onClick={()=>setU("temelji",v)}/>
              ))}
            </div>
          </Sekcija>

          <Sekcija label="Vrsta krova" required>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["ravni","▬","Ravni krov"],["dvije","△","Krov na 2 vode"],["vise","⬡","Krov na 4 ili više voda"]].map(([v,ik,l])=>(
                <ChoiceBtn key={v} label={l} ikona={ik} aktivan={upitnik.krov===v} onClick={()=>setU("krov",v)}/>
              ))}
            </div>
          </Sekcija>

          {/* Prilog */}
          <div style={{marginBottom:"1.5rem"}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>Priložite dokument</label>
            <p style={{fontSize:12,color:C.muted,margin:"0 0 10px",lineHeight:1.6}}>Skica, fotografija lokacije, situacioni plan ili bilo kakav dokument koji može pomoći izvođaču.</p>
            <div onClick={()=>document.getElementById("file-upload-input").click()} style={{border:`2px dashed ${upitnik.fajlovi?.length>0?C.gold:C.border2}`,borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:upitnik.fajlovi?.length>0?C.goldBg:C.bg3,transition:"all 0.15s"}}>
              <input id="file-upload-input" type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{const fajlovi=Array.from(e.target.files).map(f=>({naziv:f.name,velicina:f.size,tip:f.type}));setU("fajlovi",[...(upitnik.fajlovi||[]),...fajlovi]);e.target.value="";}}/>
              <div style={{fontSize:28,marginBottom:8}}>📎</div>
              <p style={{fontSize:14,color:C.muted,margin:"0 0 4px",fontWeight:500}}>Kliknite da odaberete fajl</p>
              <p style={{fontSize:12,color:C.dim,margin:0}}>PDF, Excel, Word, JPG, PNG</p>
            </div>
            {upitnik.fajlovi?.length>0&&(
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                {upitnik.fajlovi.map((f,i)=>(
                  <div key={i} style={{...card(),display:"flex",alignItems:"center",gap:10,padding:"8px 12px"}}>
                    <span style={{fontSize:18}}>{f.tip?.includes("pdf")?"📄":f.tip?.includes("image")?"🖼":"📎"}</span>
                    <span style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.naziv}</span>
                    <span style={{fontSize:11,color:C.dim}}>{(f.velicina/1024).toFixed(0)} KB</span>
                    <button onClick={e=>{e.stopPropagation();setU("fajlovi",upitnik.fajlovi.filter((_,j)=>j!==i));}} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:16,padding:0}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!upitnikValidan&&<p style={{fontSize:12,color:C.red,textAlign:"center",marginBottom:10}}>Molimo popunite sva obavezna polja označena sa *</p>}
          <button onClick={()=>upitnikValidan&&navigiraj("kontakt")} disabled={!upitnikValidan}
            style={{width:"100%",...btn("gold",{padding:"14px",fontSize:15}),background:upitnikValidan?`linear-gradient(135deg, ${C.goldL}, ${C.gold})`:C.border,color:upitnikValidan?"#fff":C.dim,cursor:upitnikValidan?"pointer":"not-allowed",marginTop:"0.5rem"}}>
            Dalje → Kontakt podaci
          </button>
        </div>
      </div>
    );
  }

  // ── UPIT POSLAN ───────────────────────────────────────────────────────────
  if(view==="upit-poslan") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GF/>
      <TitleBar onAdmin={()=>setAdminView("login")}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"2rem"}}>
        <div style={{width:76,height:76,background:C.greenBg,border:`2px solid ${C.greenBd}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.5rem",fontSize:34,color:C.green,boxShadow:`0 8px 24px ${C.green}30`}}>✓</div>
        <h2 style={{fontFamily:C.font,fontSize:32,fontWeight:700,margin:"0 0 0.5rem"}}>Upit je poslan!</h2>
        <p style={{color:C.muted,fontSize:15,margin:"0 0 0.25rem"}}>Hvala, <strong style={{color:C.text}}>{kontakt.ime}</strong>. Javit ćemo se u najkraćem roku.</p>
        <p style={{color:C.dim,fontSize:13,margin:"0 0 2.5rem"}}>{imaProjekat==="ne"?`Okvirna vrijednost: ~${ukupnoFaze.toLocaleString("bs-BA")} KM`:`Ukupna vrijednost: ${fmtKM(ukupno*1.17)} (sa PDV)`}</p>
        <div style={{...card(),padding:"1.25rem 2rem",marginBottom:"2rem",textAlign:"left"}}>
          <p style={{fontSize:11,color:C.muted,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Kontakt izvođača</p>
          <p style={{fontSize:16,fontWeight:700,margin:"0 0 2px"}}>{profil.naziv}</p>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 2px"}}>{profil.telefon}</p>
          {profil.email&&<p style={{fontSize:13,color:C.gold,margin:0,fontWeight:500}}>{profil.email}</p>}
        </div>
        <button onClick={resetujSesiju} style={{...btn("ghost"),padding:"11px 28px",fontSize:14}}>Novi predmjer</button>
      </div>
    </div>
  );

  // ── KALKULATOR ────────────────────────────────────────────────────────────
  const tabBar = t => ({background:"transparent",border:"none",borderBottom:view===t?`2px solid ${C.gold}`:"2px solid transparent",color:view===t?C.text:C.dim,fontSize:13,fontWeight:view===t?600:400,padding:"10px 16px",cursor:"pointer",fontFamily:C.font,marginBottom:-1,transition:"color 0.15s"});

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text}}>
      <GF/>
      <TitleBar onAdmin={()=>setAdminView("login")}/>
      <div style={{display:"flex",alignItems:"center",background:C.bg3,padding:"0 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <button onClick={nazad} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontFamily:C.font,fontSize:13,padding:"10px 14px 10px 0",borderRight:`1px solid ${C.border}`,marginRight:8}}>← Nazad</button>
        <button style={tabBar("kalkulacija")} onClick={()=>setView("kalkulacija")}>Kalkulator</button>
        <button style={tabBar("kontakt")} onClick={()=>navigiraj("upitnik")}>Upit{broJStavki>0?` (${broJStavki})`:""}</button>
        <div style={{flex:1}}/>
        {ukupno>0&&<span style={{fontSize:13,color:C.gold,fontWeight:700}}>{fmtKM(ukupno*1.17)} sa PDV</span>}
      </div>

      {view==="kalkulacija"&&(
        <div style={{flex:1,display:"flex",overflow:"auto"}}>
          <div style={{width:sidebar?200:40,flexShrink:0,background:C.bg3,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width 0.2s",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:sidebar?"space-between":"center",padding:sidebar?"10px 12px":"10px 0",borderBottom:`1px solid ${C.border}`}}>
              {sidebar&&<span style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>Kategorije</span>}
              <button onClick={()=>setSidebar(!sidebar)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:16,padding:0}}>{sidebar?"◂":"▸"}</button>
            </div>
            {kategorije.map(k=>(
              <button key={k.id} onClick={()=>setAktivnaKat(k.id)} style={{display:"flex",alignItems:"center",gap:8,padding:sidebar?"9px 12px":"10px 0",justifyContent:sidebar?"flex-start":"center",background:aktivnaKat===k.id?C.bg:C.bg3,border:"none",borderLeft:aktivnaKat===k.id?`3px solid ${C.gold}`:"3px solid transparent",color:aktivnaKat===k.id?C.text:C.dim,cursor:"pointer",fontFamily:C.font,fontSize:12,width:"100%",textAlign:"left",transition:"all 0.1s"}}>
                <span style={{fontSize:16,flexShrink:0}}>{k.ikona}</span>
                {sidebar&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.naziv}</span>}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflow:"auto",padding:"1rem"}}>
            {kategorije.filter(k=>k.id===aktivnaKat).map(kat=>(
              <div key={kat.id}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
                  <span style={{fontSize:24}}>{kat.ikona}</span>
                  <div>
                    <h2 style={{fontFamily:C.font,fontSize:18,fontWeight:700,margin:0}}>{kat.naziv}</h2>
                    <p style={{fontSize:11,color:C.dim,margin:0}}>Unesite količinu za svaku stavku</p>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {kat.stavke.map(s=>{
                    const kol=stavke[s.id]?.kolicina||0;const akt=kol>0;
                    return (
                      <div key={s.id} style={{...card(),background:akt?C.greenBg:C.bg3,border:`1px solid ${akt?C.greenBd:C.border}`,padding:"12px 14px",transition:"all 0.15s"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:"0 0 2px",fontSize:13,color:akt?C.green:C.text,fontWeight:akt?600:400,lineHeight:1.4}}>{s.naziv}</p>
                            <p style={{margin:0,fontSize:12,color:C.dim}}>{s.cijena.toFixed(2)} KM / {s.jm}{s.jm==="m³"&&<M3Info naziv={s.naziv}/>}</p>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <input type="number" min="0" step="0.5" placeholder="0" value={kol||""} onChange={e=>setKolicina(s.id,s.cijena,s.naziv,s.jm,e.target.value)} style={{flex:1,minWidth:0,background:"#fff",border:`1px solid ${C.border2}`,borderRadius:7,padding:"8px 10px",color:C.text,fontSize:15,fontFamily:C.font,textAlign:"right",outline:"none"}}/>
                          <span style={{fontSize:13,color:C.muted,flexShrink:0}}>{s.jm}</span>
                          <span style={{fontSize:13,fontWeight:600,color:akt?C.gold:C.dim,flexShrink:0,minWidth:70,textAlign:"right"}}>{akt?fmtKM(kol*s.cijena):"—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {aktivneStavke.length>0&&(
            <div style={{width:220,flexShrink:0,background:C.bg3,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"1rem"}}>
              <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 12px"}}>Rekapitulacija</p>
              <div style={{flex:1,overflow:"auto"}}>
                {aktivneStavke.map(([id,s])=>(
                  <div key={id} style={{borderBottom:`1px solid ${C.border}`,padding:"8px 0"}}>
                    <p style={{margin:"0 0 2px",fontSize:11,color:C.muted,lineHeight:1.3}}>{s.naziv}</p>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.dim}}>{s.kolicina} {s.jm}</span><span style={{fontSize:12,color:C.gold,fontWeight:500}}>{fmtKM(s.kolicina*s.cijena)}</span></div>
                  </div>
                ))}
              </div>
              <div style={{borderTop:`1px solid ${C.border2}`,paddingTop:12,marginTop:8}}>
                {[["Bez PDV-a",fmtKM(ukupno)],["PDV (17%)",fmtKM(ukupno*0.17)]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:C.dim}}>{l}</span><span style={{fontSize:11}}>{v}</span></div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,marginTop:4}}>
                  <span style={{fontSize:12,fontWeight:600}}>Ukupno</span>
                  <span style={{fontSize:14,fontWeight:700,color:C.gold}}>{fmtKM(ukupno*1.17)}</span>
                </div>
                <button onClick={()=>navigiraj("upitnik")} style={{width:"100%",...btn("gold",{padding:"11px",fontSize:13}),background:`linear-gradient(135deg, ${C.goldL}, ${C.gold})`}}>Pošalji upit →</button>
                <p style={{fontSize:10,color:C.dim,textAlign:"center",margin:"6px 0 0"}}>Cijene su okvirne · Potvrda stiže emailom</p>
              </div>
            </div>
          )}
        </div>
      )}

      {view==="kontakt"&&(
        <div style={{flex:1,overflow:"auto",display:"flex"}}>
          <div style={{flex:1,padding:"2rem",maxWidth:520}}>
            <h2 style={{fontFamily:C.font,fontSize:26,fontWeight:700,margin:"0 0 0.25rem"}}>Pošaljite upit</h2>
            <p style={{fontSize:13,color:C.dim,margin:"0 0 1.75rem"}}>Izvođač će vas kontaktirati i potvrditi cijene u najkraćem roku.</p>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>Ime i prezime <span style={{color:C.gold}}>*</span></label>
              <input type="text" placeholder="Npr. Marko Marković" value={kontakt.ime} onChange={e=>setKontakt(p=>({...p,ime:e.target.value}))} style={inp({background:C.bg3})}/>
            </div>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>Broj telefona <span style={{color:C.gold}}>*</span></label>
              <input type="tel" placeholder="+387 6x xxx xxx" value={kontakt.telefon} onChange={e=>setKontakt(p=>({...p,telefon:e.target.value}))} style={{...inp({background:C.bg3}),borderColor:kontakt.telefon&&!telefonValidan?C.red:undefined}}/>
              {kontakt.telefon&&!telefonValidan&&<p style={{fontSize:11,color:C.red,margin:"4px 0 0"}}>Unesite ispravan broj telefona (npr. +387 65 123 456)</p>}
            </div>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>Email adresa</label>
              <input type="email" placeholder="marko@email.com" value={kontakt.email} onChange={e=>setKontakt(p=>({...p,email:e.target.value}))} style={{...inp({background:C.bg3}),borderColor:kontakt.email&&!emailValidan?C.red:undefined}}/>
              {kontakt.email&&!emailValidan&&<p style={{fontSize:11,color:C.red,margin:"4px 0 0"}}>Unesite ispravnu email adresu (npr. marko@email.com)</p>}
            </div>
            <div style={{marginBottom:"1.5rem"}}>
              <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>Napomena za korekciju cijene (opcionalno)</label>
              <textarea placeholder="Npr. Da li je moguć popust za veće količine?" value={kontakt.napomena} onChange={e=>setKontakt(p=>({...p,napomena:e.target.value}))} rows={4} style={{...inp({background:C.bg3,resize:"vertical"})}}/>
            </div>
            {(()=>{const ok=kontakt.ime&&kontakt.telefon&&telefonValidan&&emailValidan;return(
            <button onClick={posaljiUpit} disabled={!ok}
              style={{width:"100%",...btn("gold",{padding:"13px",fontSize:14}),background:ok?`linear-gradient(135deg, ${C.goldL}, ${C.gold})`:C.border,color:ok?"#fff":C.dim,cursor:ok?"pointer":"not-allowed"}}>
              Pošalji upit izvođaču
            </button>);})()}
          </div>
          <div style={{width:300,background:C.bg3,borderLeft:`1px solid ${C.border}`,padding:"1.5rem",overflow:"auto"}}>
            <p style={{fontSize:11,color:C.dim,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 12px"}}>Vaš predmjer</p>
            {aktivneStavke.length===0?<p style={{fontSize:13,color:C.dim}}>Nema unesenih stavki.</p>:(
              <>
                {aktivneStavke.map(([id,s])=>(
                  <div key={id} style={{borderBottom:`1px solid ${C.border}`,padding:"8px 0"}}>
                    <p style={{margin:"0 0 2px",fontSize:12,color:C.muted}}>{s.naziv}</p>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.dim}}>{s.kolicina} {s.jm}</span><span style={{fontSize:12,color:C.gold,fontWeight:500}}>{fmtKM(s.kolicina*s.cijena)}</span></div>
                  </div>
                ))}
                <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border2}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.dim}}>Bez PDV-a</span><span style={{fontSize:12}}>{fmtKM(ukupno)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600}}>Sa PDV-om</span><span style={{fontSize:14,fontWeight:700,color:C.gold}}>{fmtKM(ukupno*1.17)}</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
