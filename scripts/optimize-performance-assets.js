const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cssPath = path.join(root, "assets", "index-B-HpPFcG.css");
const bundlePath = path.join(root, "assets", "index-BA4wyRB2.js");

const fontCss = `/* LOCAL_FONTS */@font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url('/assets/dm-sans-latin.woff2') format('woff2')}@font-face{font-family:'Montserrat';font-style:normal;font-weight:600 800;font-display:swap;src:url('/assets/montserrat-latin.woff2') format('woff2')}`;

let css = fs.readFileSync(cssPath, "utf8");
const rootRule = css.indexOf(":root{");
if (rootRule < 0) throw new Error("Unable to locate the application root CSS rule.");
css = fontCss + css.slice(rootRule);
fs.writeFileSync(cssPath, css);

let bundle = fs.readFileSync(bundlePath, "utf8");
bundle = bundle
  .replaceAll("https://vijay-tours-admin.mittar963.chatgpt.site", "https://omax-admin-control.pkmmittal97.chatgpt.site")
  .replaceAll("/assets/oamx-logo-transparent-D0fBhq3P.png", "/assets/oamx-logo-optimized.png")
  .replaceAll("/assets/vijay-destination-icons-D9R-KowQ.png", "/assets/vijay-destination-icons-optimized.png")
  .replace(
    "var __VIT_CMS__=await new Promise(o=>{let x=new XMLHttpRequest;x.open(`GET`,`https://vijay-tours-admin.mittar963.chatgpt.site/api/public/bootstrap`,!0),x.timeout=4e3,x.onload=()=>{try{o(x.status>=200&&x.status<300?JSON.parse(x.responseText):null)}catch{o(null)}},x.onerror=x.ontimeout=()=>o(null),x.send()});",
    "var __VIT_CMS_CACHE__=(()=>{try{return JSON.parse(sessionStorage.getItem(`vit-cms`)||`null`)}catch{return null}})(),__VIT_CMS_REQUEST__=new Promise(o=>{let x=new XMLHttpRequest;x.open(`GET`,`https://omax-admin-control.pkmmittal97.chatgpt.site/api/public/bootstrap`,!0),x.timeout=8e3,x.onload=()=>{try{let e=x.status>=200&&x.status<300?JSON.parse(x.responseText):null;e&&sessionStorage.setItem(`vit-cms`,JSON.stringify(e)),o(e)}catch{o(null)}},x.onerror=x.ontimeout=()=>o(null),x.send()}),__VIT_CMS__=__VIT_CMS_CACHE__||await Promise.race([__VIT_CMS_REQUEST__,new Promise(o=>setTimeout(()=>o(null),1200))]);"
  )
  .replace(
    "function Xt({id:e,eyebrow:t,title:n,copy:r,video:i,items:a,onOpen:o,onExplore:s,tone:c}){return",
    "function Xt({id:e,eyebrow:t,title:n,copy:r,video:i,items:a,onOpen:o,onExplore:s,tone:c}){let l=(0,C.useRef)(null),[u,d]=(0,C.useState)(!1);return(0,C.useEffect)(()=>{let e=l.current;if(!e)return;let t=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(d(!0),t.disconnect())},{rootMargin:`300px`});return t.observe(e),()=>t.disconnect()},[]),"
  )
  .replace(
    "className:`journey-video`,autoPlay:!0,muted:!0,loop:!0,playsInline:!0,preload:`metadata`,\"aria-label\":`${n} destination film`,children:(0,k.jsx)(`source`,{src:i,type:`video/mp4`})",
    "className:`journey-video`,ref:l,autoPlay:!0,muted:!0,loop:!0,playsInline:!0,preload:`none`,\"aria-label\":`${n} destination film`,children:(0,k.jsx)(`source`,{src:u?i:void 0,type:`video/mp4`})"
  )
  .replace(
    "(0,k.jsx)(`img`,{src:t.tour.image,alt:t.name})",
    "(0,k.jsx)(`img`,{src:t.tour.image,alt:t.name,loading:`lazy`,decoding:`async`})"
  )
  .replace(
    "function Vt(e,t){if(!e)return`Price on request`;let n=t.currency===`INR`?Math.round(Number(e)*t.usdRate/100)*100:Number(e);return new Intl.NumberFormat(t.locale,{style:`currency`,currency:t.currency,maximumFractionDigits:0}).format(n)}",
    "function Vt(e,t){if(!e)return`Price on request`;let n=t.currency===`INR`?Math.round(Number(e)*t.usdRate/100)*100:Number(e)*t.usdRate;return new Intl.NumberFormat(t.locale,{style:`currency`,currency:t.currency,maximumFractionDigits:0}).format(n)}"
  );

if (!bundle.includes("/* CMS_CURRENCIES */")) {
  bundle = bundle.replace(
    /bt=(\{india:\{[\s\S]*?\}\}),xt=\(0,C\.createContext\)\(bt\.india\)/,
    "bt=__VIT_CMS__?.currencies?.length?Object.fromEntries(__VIT_CMS__.currencies.map(c=>{let m={IN:`india`,US:`usa`,AU:`australia`,DE:`germany`,GB:`london`,NL:`netherlands`}[c.countryCode]||c.countryCode.toLowerCase(),f=String.fromCodePoint(...[...c.countryCode].map(x=>127397+x.charCodeAt()));return[m,{code:m,name:c.country,shortName:c.shortName||c.country,flag:f,currency:c.currency,currencyName:c.currency,phoneCode:c.phoneCode,phonePlaceholder:`Phone number`,locale:c.locale||`en-IN`,usdRate:Number(c.rate||1)}]})):$1/* CMS_CURRENCIES */,xt=(0,C.createContext)(bt.india||Object.values(bt)[0])"
  );
}

if (!bundle.includes("/* CMS_REVIEWS */")) {
  bundle = bundle.replace(/var on=(\[\{name:`Chuck`[\s\S]*?\}\]);function sn/, "var on=__VIT_CMS__?.reviews?.length?__VIT_CMS__.reviews:$1/* CMS_REVIEWS */;function sn");
}

if (!bundle.includes("/* CMS_FEATURED */")) {
  bundle = bundle.replace(/Lt=(\[A\[0\],Mt\[0\],A\[4\],Mt\[1\],A\[5\],Mt\[3\],A\[2\],Mt\[4\]\]),Rt=/, "Lt=__VIT_CMS__?.tours?.some(e=>e.featured)?Nt.filter(e=>e.featured).slice(0,8):$1/* CMS_FEATURED */,Rt=");
}

const requiredMarkers = [
  "/assets/oamx-logo-optimized.png",
  "/assets/vijay-destination-icons-optimized.png",
  "__VIT_CMS_CACHE__",
  "className:`journey-video`,ref:l",
  "alt:t.name,loading:`lazy`,decoding:`async`",
  "CMS_CURRENCIES",
  "CMS_REVIEWS",
  "CMS_FEATURED",
];
for (const marker of requiredMarkers) {
  if (!bundle.includes(marker)) throw new Error(`Performance optimization marker missing: ${marker}`);
}
fs.writeFileSync(bundlePath, bundle);

console.log("Performance assets optimized.");
