const fs = require("node:fs");
const path = require("node:path");

const bundlePath = path.resolve(__dirname, "../assets/index-BA4wyRB2.js");
let source = fs.readFileSync(bundlePath, "utf8");

const cmsLoader = `/* VIJAY_CMS */var __VIT_CMS__=await new Promise(o=>{let x=new XMLHttpRequest;x.open(\`GET\`,\`https://vijay-tours-admin.mittar963.chatgpt.site/api/public/bootstrap\`,!0),x.timeout=4e3,x.onload=()=>{try{o(x.status>=200&&x.status<300?JSON.parse(x.responseText):null)}catch{o(null)}},x.onerror=x.ontimeout=()=>o(null),x.send()});globalThis.__VIT_CMS__=__VIT_CMS__,document.documentElement.dataset.cmsTours=String(__VIT_CMS__?.tours?.length||0);`;
source = source.replace(/^\/\* VIJAY_CMS \*\/var __VIT_CMS__=.*?globalThis\.__VIT_CMS__=__VIT_CMS__;/, cmsLoader);

if (!source.startsWith("/* VIJAY_CMS */")) {
  const bootstrap = `${cmsLoader}var __vitTour=e=>({...e,type:e.type===\`international\`?\`international\`:\`current\`,days:(e.itinerary?.length?e.itinerary:e.destinations||[]).map((t,n)=>({day:n+1,place:e.destinations?.[n]||\`Day \${n+1}\`,activities:t,landmarks:\`\`,transport:\`\`,meals:\`\`,optional:\`\`})),included:e.inclusions?.length?e.inclusions:[\`Private transport and sightseeing as described\`,\`Selected accommodation and local assistance\`],excluded:e.exclusions?.length?e.exclusions:[\`Flights, visas, insurance and personal expenses\`],departureYears:e.departureYears||[],languages:e.languages||[],styles:e.styles||[],destinations:e.destinations||[]});var __vitOfficial=e=>({...e,type:\`official\`,dayCount:e.duration||0,overview:e.description||\`\`,plan:(e.destinations||[]).join(\` - \`),days:(e.itinerary||[]).map((t,n)=>({day:n+1,place:e.destinations?.[n]||\`Day \${n+1}\`,description:t})),highlights:(e.highlights||[]).join(\` · \`),destinations:e.destinations||[],duration:e.duration||0});`;
  source = bootstrap + source;
}

const oldContact = 'yt={phone:`+91 79760 64160`,phoneHref:`tel:+917976064160`,email:`info@vijayindiatours.com`,address:`2nd Floor, Shop 20–21, Khatipura Road, Chand Bihari Nagar, Jhotwara, Jaipur 302012`}';
const newContact = 'yt={phone:__VIT_CMS__?.settings?.phone||`+91 79760 64160`,phoneHref:`tel:${(__VIT_CMS__?.settings?.phone||`+91 79760 64160`).replace(/[^+\\d]/g,``)}`,email:__VIT_CMS__?.settings?.email||`info@vijayindiatours.com`,address:`2nd Floor, Shop 20–21, Khatipura Road, Chand Bihari Nagar, Jhotwara, Jaipur 302012`}';
source = source.replace(oldContact, newContact);

const oldOfficial = 'Et=rt.map(e=>({...e,...Tt[e.id]||{},type:`official`,duration:e.dayCount||null,description:Tt[e.id]?.description||e.overview,destinations:e.plan?e.plan.split(/\\s*(?:->|>|–|-)\\s*/).filter(Boolean):[],origin:e.plan?.split(/\\s*(?:->|>|–|-)\\s*/)[0]||`India`,end:e.plan?.split(/\\s*(?:->|>|–|-)\\s*/).filter(Boolean).at(-1)||`India`,included:[],excluded:[],departureYears:[]}))';
const newOfficial = 'Et=__VIT_CMS__?.tours?__VIT_CMS__.tours.filter(e=>e.type===`official`).map(__vitOfficial):rt.map(e=>({...e,...Tt[e.id]||{},type:`official`,duration:e.dayCount||null,description:Tt[e.id]?.description||e.overview,destinations:e.plan?e.plan.split(/\\s*(?:->|>|–|-)\\s*/).filter(Boolean):[],origin:e.plan?.split(/\\s*(?:->|>|–|-)\\s*/)[0]||`India`,end:e.plan?.split(/\\s*(?:->|>|–|-)\\s*/).filter(Boolean).at(-1)||`India`,included:[],excluded:[],departureYears:[]}))';
source = source.replace(oldOfficial, newOfficial);

const oldCurrent = 'A=nt.map(e=>{let t={...e,name:Dt[e.id]||e.name,type:`current`};return{...t,description:jt(t)}})';
const newCurrent = 'A=__VIT_CMS__?.tours?__VIT_CMS__.tours.filter(e=>e.type!==`official`&&e.type!==`international`).map(__vitTour):nt.map(e=>{let t={...e,name:Dt[e.id]||e.name,type:`current`};return{...t,description:jt(t)}})';
source = source.replace(oldCurrent, newCurrent);
source = source.replace('Mt=pt,Nt=[...A,...Et,...Mt]', 'Mt=__VIT_CMS__?.tours?__VIT_CMS__.tours.filter(e=>e.type===`international`).map(__vitTour):pt,Nt=[...A,...Et,...Mt]');

for (const marker of [newContact, newOfficial, newCurrent, 'Mt=__VIT_CMS__?.tours?']) {
  if (!source.includes(marker)) throw new Error(`CMS patch marker missing: ${marker.slice(0, 40)}`);
}

fs.writeFileSync(bundlePath, source);
console.log("CMS data source connected to the public bundle.");
