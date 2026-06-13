// ======================================================
// ZONA IGD JS
// BAGIAN 1
// ======================================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let nurses = [
 {no:1,name:"KEPALA RUANGAN"},
 {no:2,name:"YULI WINARNI"},
 {no:3,name:"MELIANTIE"},
 {no:4,name:"PERAWAT 4"},
 {no:5,name:"PERAWAT 5"},
 {no:6,name:"PERAWAT 6"},
 {no:7,name:"PERAWAT 7"},
 {no:8,name:"PERAWAT 8"},
 {no:9,name:"ATI SIDABUTAR"},
 {no:10,name:"ALIDA"},
 {no:11,name:"PERAWAT 11"},
 {no:12,name:"PERAWAT 12"},
 {no:13,name:"PERAWAT 13"},
 {no:14,name:"PERAWAT 14"},
 {no:15,name:"M. KHAIRUL ZED"},
 {no:16,name:"PERAWAT 16"},
 {no:17,name:"PERAWAT 17"},
 {no:18,name:"PERAWAT 18"},
 {no:19,name:"PERAWAT 19"},
 {no:20,name:"PERAWAT 20"},
 {no:21,name:"PERAWAT 21"},
 {no:22,name:"PERAWAT 22"},
 {no:23,name:"PERAWAT 23"},
 {no:24,name:"PERAWAT 24"},
 {no:25,name:"PERAWAT 25"},
 {no:26,name:"PERAWAT 26"},
 {no:27,name:"PERAWAT 27"},
 {no:28,name:"PERAWAT 28"},
 {no:29,name:"PERAWAT 29"},
 {no:30,name:"PERAWAT 30"},
 {no:31,name:"PERAWAT 31"},
 {no:32,name:"PERAWAT 32"},
 {no:33,name:"PERAWAT 33"},
 {no:34,name:"PERAWAT 34"},
 {no:35,name:"PERAWAT 35"},
 {no:36,name:"PERAWAT 36"},
 {no:37,name:"PERAWAT 37"},
 {no:38,name:"PERAWAT 38"},
 {no:39,name:"PERAWAT 39"},
 {no:40,name:"PERAWAT 40"}
];

let schedule =
JSON.parse(localStorage.getItem("igd_schedule") || "{}");

let zones =
JSON.parse(localStorage.getItem("igd_zones") || "{}");

function saveData(){
 localStorage.setItem(
   "igd_schedule",
   JSON.stringify(schedule)
 );

 localStorage.setItem(
   "igd_zones",
   JSON.stringify(zones)
 );
}

function makeKey(date, shift){
 return `${date}-${shift}`;
}

function currentKey(){
 return makeKey(
   dateSelect.value,
   shiftSelect.value
 );
}

function initDateSelect(){

 dateSelect.innerHTML = "";

 for(let i=1;i<=31;i++){

   dateSelect.innerHTML += `
   <option value="${i}">
     ${i}
   </option>`;

 }

}

function getNurse(no){
 return nurses.find(x=>x.no===no);
}

function getWorking(date, shift){

 const list =
 schedule[
   makeKey(date,shift)
 ] || [];

 return list
 .map(no=>getNurse(no))
 .filter(Boolean);

}

function removeFromAllZones(zoneObj,no){

 Object.keys(zoneObj).forEach(zone=>{

   zoneObj[zone] =
   zoneObj[zone].filter(
     x=>x!==no
   );

 });

}

function getPJCandidate(list){

 const priority = [
   9,
   10,
   13,
   14,
   25,
   26,
   3,
   2
 ];

 for(const p of priority){

   if(list.includes(p)){
     return p;
   }

 }

 return null;
}

function getTriaseCandidate(list){

 if(list.includes(3)){

   const anotherTriase =
   list.find(
     no=>no>=4 && no<=8
   );

   if(!anotherTriase){
     return 3;
   }

 }

 const triasePool =
 list.filter(
   no=>no>=3 && no<=8
 );

 if(triasePool.length){

   triasePool.sort(
     (a,b)=>a-b
   );

   return triasePool[0];
 }

 return list[0] || null;
}

function buildZone(date, shift){

 const key =
 makeKey(date,shift);

 const working =
 getWorking(date,shift)
 .map(x=>x.no);

 let zone = {
   triase:[],
   pj:[],
   merah:[],
   kuning:[],
   oncall:[]
 };

 let remaining =
 [...working];

 const total =
 remaining.length;

 // ======================
 // TRIAGE
 // ======================

 let triase =
 getTriaseCandidate(
   remaining
 );

 if(triase){

   zone.triase.push(triase);

   remaining =
   remaining.filter(
     x=>x!==triase
   );

 }

 // ======================
 // PJ
 // ======================

 let pj = null;

 if(total >= 8){

   pj =
   getPJCandidate(
     remaining
   );

   if(pj){

     zone.pj.push(pj);

     remaining =
     remaining.filter(
       x=>x!==pj
     );

   }

 }

 // ======================
 // KHUSUS NOMOR 3
 // Jika ada nomor 3
 // dan masih ada triase lain
 // maka 3 boleh PJ
 // ======================

 const hasNo3 =
 working.includes(3);

 const hasOtherTriase =
 working.some(
   x=>x>=4 && x<=8
 );

 if(
   total >= 8 &&
   hasNo3 &&
   hasOtherTriase &&
   zone.pj.length===0
 ){

   removeFromAllZones(
     zone,
     3
   );

   zone.pj=[3];

   remaining =
   remaining.filter(
     x=>x!==3
   );

   if(
     zone.triase.length &&
     zone.triase[0]===3
   ){

     const newTriase =
     working.find(
       x=>x>=4 && x<=8
     );

     if(newTriase){

       zone.triase=[newTriase];

     }

   }

 }

 // ======================
 // TARGET FORMASI
 // ======================

 let merahTarget=3;
 let kuningTarget=3;

 if(total===9){

   merahTarget=3;
   kuningTarget=4;

 }

 else if(total===8){

   merahTarget=3;
   kuningTarget=3;

 }

 else if(total===7){

   merahTarget=3;
   kuningTarget=3;

   zone.pj=[];

 }

 else if(total===6){

   merahTarget=2;
   kuningTarget=3;

   zone.pj=[];

 }

 else if(total>9){

   merahTarget=3;
   kuningTarget=
   total
   - zone.triase.length
   - zone.pj.length
   - merahTarget;

 }

 // lanjut bagian 2...

// ======================
 // PEMBAGIAN ZONA MERAH & KUNING
 // ======================

 remaining = remaining.filter(no =>
   !zone.triase.includes(no) &&
   !zone.pj.includes(no)
 );

 let merahPool = remaining.filter(no => no >= 9 && no <= 24);
 let kuningPool = remaining.filter(no => no >= 25 && no <= 40);
 let triasePool = remaining.filter(no => no >= 3 && no <= 8);
 let otherPool = remaining.filter(no =>
   no < 3 || no > 40
 );

 // Kuning diutamakan bila jumlah lebih
 zone.kuning = kuningPool.slice(0, kuningTarget);

 remaining = remaining.filter(no =>
   !zone.kuning.includes(no)
 );

 zone.merah = merahPool
   .filter(no => remaining.includes(no))
   .slice(0, merahTarget);

 remaining = remaining.filter(no =>
   !zone.merah.includes(no)
 );

 // Jika merah kurang, ambil dari sisa
 while(zone.merah.length < merahTarget && remaining.length){
   zone.merah.push(remaining.shift());
 }

 // Jika kuning kurang, ambil dari sisa
 while(zone.kuning.length < kuningTarget && remaining.length){
   zone.kuning.push(remaining.shift());
 }

 // Sisa masuk kuning, karena kuning diutamakan lebih banyak
 remaining.forEach(no => {
   if(!zone.kuning.includes(no)){
     zone.kuning.push(no);
   }
 });

 // Anti dobel final
 Object.keys(zone).forEach(z => {
   zone[z] = [...new Set(zone[z])];
 });

 zone.oncall = getOnCall(date, shift, zone);

 zones[key] = zone;
 saveData();
}

function autoBuildCurrent(){
 buildZone(
   dateSelect.value,
   shiftSelect.value
 );
 render();
}

function autoBuildAll(){
 for(let d=1; d<=31; d++){
   ["P","S","M"].forEach(shift => {
     buildZone(d, shift);
   });
 }
 render();
 alert("Semua zona berhasil disusun otomatis.");
}

function getOnCall(date, shift, zone){

 const used = new Set([
   ...zone.triase,
   ...zone.pj,
   ...zone.merah,
   ...zone.kuning
 ]);

 let candidates = [];

 nurses.forEach(n => {

   if(used.has(n.no)) return;

   const liburHariIni =
   (schedule[makeKey(date,"L")] || [])
   .includes(n.no);

   const lepasMalamKemarin =
   date > 1 &&
   (schedule[makeKey(date-1,"M")] || [])
   .includes(n.no);

   if(liburHariIni || lepasMalamKemarin){
     candidates.push(n.no);
   }

 });

 // Jika data libur/lepas kurang, ambil dari yang tidak dinas hari ini
 if(candidates.length < 3){

   nurses.forEach(n => {

     if(candidates.includes(n.no)) return;
     if(used.has(n.no)) return;

     const kerjaHariIni =
     ["P","S","M"].some(s =>
       (schedule[makeKey(date,s)] || [])
       .includes(n.no)
     );

     if(!kerjaHariIni){
       candidates.push(n.no);
     }

   });

 }

 return candidates.slice(0,3);
}

// ======================================================
// EDIT JADWAL MANUAL
// ======================================================

function openManualInput(){

 manualPanel.classList.remove("hidden");

 let lines = [];

 Object.keys(schedule).forEach(k => {

   const [date, shift] = k.split("-");

   schedule[k].forEach(no => {

     const n = getNurse(no);

     if(n){

       lines.push(
         `${no} | ${n.name} | ${date} | ${shift}`
       );

     }

   });

 });

 manualText.value = lines.join("\n");
}

function closeManualInput(){
 manualPanel.classList.add("hidden");
}

function saveManualSchedule(){

 const text =
 manualText.value.trim();

 schedule = {};

 if(!text){
   saveData();
   render();
   return;
 }

 const lines =
 text.split(/\n+/);

 lines.forEach(line => {

   const parts =
   line.split("|")
   .map(x => x.trim());

   if(parts.length < 4) return;

   const no =
   parseInt(parts[0]);

   const name =
   parts[1];

   const date =
   parseInt(parts[2]);

   const shift =
   parts[3].toUpperCase()[0];

   if(!no || !date || !shift) return;

   if(!["P","S","M","L"].includes(shift)) return;

   let nurse =
   getNurse(no);

   if(!nurse){

     nurses.push({
       no:no,
       name:name
     });

   }else{

     nurse.name = name;

   }

   const k =
   makeKey(date, shift);

   if(!schedule[k]){
     schedule[k] = [];
   }

   if(!schedule[k].includes(no)){
     schedule[k].push(no);
   }

 });

 zones = {};
 saveData();
 autoBuildAll();
 closeManualInput();
 render();
}

// ======================================================
// EDIT SHIFT SAAT INI
// ======================================================

function editCurrentShift(){

 const k =
 currentKey();

 const existing =
 (schedule[k] || [])
 .join(",");

 const input =
 prompt(
   "Masukkan nomor perawat yang dinas shift ini, pisahkan koma. Contoh: 3,9,13,25,26,30,31",
   existing
 );

 if(input === null) return;

 const arr =
 input
 .split(",")
 .map(x => parseInt(x.trim()))
 .filter(Boolean);

 schedule[k] = [...new Set(arr)];

 buildZone(
   dateSelect.value,
   shiftSelect.value
 );

 saveData();
 render();
}

// ======================================================
// PINDAH ZONA / ANTI DOBEL
// ======================================================

function movePerson(no, targetZone){

 if(!targetZone) return;

 const k =
 currentKey();

 if(!zones[k]){
   buildZone(
     dateSelect.value,
     shiftSelect.value
   );
 }

 const zone =
 zones[k];

 removeFromAllZones(zone, no);

 if(targetZone !== "hapus"){
   zone[targetZone].push(no);
 }

 saveData();
 render();
}

// ======================================================
// RENDER
// ======================================================

function personCard(no, zoneName){

 const n =
 getNurse(no);

 if(!n) return "";

 const pillClass =
 zoneName === "triase" ? "pill-triase" :
 zoneName === "pj" ? "pill-pj" :
 zoneName === "merah" ? "pill-merah" :
 zoneName === "kuning" ? "pill-kuning" :
 "pill-oncall";

 const label =
 zoneName === "triase" ? "Triase" :
 zoneName === "pj" ? "PJ" :
 zoneName === "merah" ? "Merah" :
 zoneName === "kuning" ? "Kuning" :
 "On Call";

 return `
 <div class="person">
   <div>
     <div class="person-name">
       ${n.name}
       <span class="zone-pill ${pillClass}">
         ${label}
       </span>
     </div>
     <div class="person-no">
       Nomor ${n.no}
     </div>
   </div>

   <select class="zone-select" onchange="movePerson(${n.no}, this.value)">
     <option value="">Pindah</option>
     <option value="triase">Triase</option>
     <option value="pj">PJ</option>
     <option value="merah">Zona Merah</option>
     <option value="kuning">Zona Kuning</option>
     <option value="oncall">On Call</option>
     <option value="hapus">Hapus</option>
   </select>
 </div>`;
}

function renderZone(id, data, zoneName){

 const el =
 document.getElementById(id);

 if(!data || data.length === 0){

   el.innerHTML =
   `<div class="kosong">Kosong</div>`;

   return;
 }

 el.innerHTML =
 data.map(no =>
   personCard(no, zoneName)
 ).join("");
}

function render(){

 const date =
 dateSelect.value;

 const shift =
 shiftSelect.value;

 const k =
 currentKey();

 if(!zones[k]){
   buildZone(date, shift);
 }

 const zone =
 zones[k];

 renderZone("triase", zone.triase, "triase");
 renderZone("pj", zone.pj, "pj");
 renderZone("merah", zone.merah, "merah");
 renderZone("kuning", zone.kuning, "kuning");
 renderZone("oncall", zone.oncall, "oncall");

 const working =
 getWorking(date, shift);

 summary.innerHTML = `
 <div class="mb-3">
   <b>${date} Juni 2026 - Shift ${shift}</b><br>
   Jumlah dinas: <b>${working.length}</b> orang
 </div>

 <div class="summary-grid">
   <div class="summary-item">
     <div class="summary-number">${zone.triase.length}</div>
     <div class="summary-label">Triase</div>
   </div>

   <div class="summary-item">
     <div class="summary-number">${zone.pj.length}</div>
     <div class="summary-label">PJ</div>
   </div>

   <div class="summary-item">
     <div class="summary-number">${zone.merah.length}</div>
     <div class="summary-label">Merah</div>
   </div>

   <div class="summary-item">
     <div class="summary-number">${zone.kuning.length}</div>
     <div class="summary-label">Kuning</div>
   </div>

   <div class="summary-item">
     <div class="summary-number">${zone.oncall.length}</div>
     <div class="summary-label">On Call</div>
   </div>
 </div>
 `;

 allPeople.innerHTML =
 working.map(n => `
   <div class="person">
     <div>
       <div class="person-name">${n.name}</div>
       <div class="person-no">Nomor ${n.no}</div>
     </div>

     <select class="zone-select" onchange="movePerson(${n.no}, this.value)">
       <option value="">Masukkan zona</option>
       <option value="triase">Triase</option>
       <option value="pj">PJ</option>
       <option value="merah">Zona Merah</option>
       <option value="kuning">Zona Kuning</option>
       <option value="oncall">On Call</option>
     </select>
   </div>
 `).join("") || `<div class="kosong">Belum ada jadwal shift ini.</div>`;
}

// ======================================================
// OCR PDF / GAMBAR
// ======================================================

async function processFile(){

 const file =
 fileInput.files[0];

 if(!file){
   alert("Pilih file PDF atau gambar dulu.");
   return;
 }

 status.innerText =
 "Mulai membaca file...";

 let text = "";

 try{

   if(file.type === "application/pdf"){

     const arr =
     await file.arrayBuffer();

     const pdf =
     await pdfjsLib.getDocument({data:arr}).promise;

     for(let p=1; p<=pdf.numPages; p++){

       status.innerText =
       `Membaca halaman ${p} dari ${pdf.numPages}...`;

       const page =
       await pdf.getPage(p);

       const viewport =
       page.getViewport({scale:2});

       const canvas =
       document.createElement("canvas");

       canvas.width =
       viewport.width;

       canvas.height =
       viewport.height;

       const ctx =
       canvas.getContext("2d");

       await page.render({
         canvasContext:ctx,
         viewport:viewport
       }).promise;

       const result =
       await Tesseract.recognize(
         canvas,
         "eng+ind"
       );

       text += "\n" + result.data.text;

     }

   }else{

     const result =
     await Tesseract.recognize(
       file,
       "eng+ind"
     );

     text =
     result.data.text;

   }

   parseOCRText(text);

   zones = {};
   saveData();
   autoBuildAll();

   status.innerText =
   "Jadwal selesai dibaca. Silakan cek/edit bila ada kesalahan OCR.";

 }catch(err){

   console.error(err);

   status.innerText =
   "Gagal membaca file. Coba input manual.";

   alert("OCR gagal. Gunakan Edit Jadwal Manual.");

 }

}

// ======================================================
// PARSE OCR SEDERHANA
// ======================================================

function parseOCRText(text){

 const lines =
 text.split(/\n+/)
 .map(x => x.trim())
 .filter(Boolean);

 lines.forEach(line => {

   const match =
   line.match(/^(\d{1,2})\s+(.+?)\s+([PSML\s]{10,})$/i);

   if(!match) return;

   const no =
   parseInt(match[1]);

   const name =
   match[2].replace(/\s+/g," ").trim();

   const codes =
   (match[3].match(/[PSML]/gi) || [])
   .slice(0,31)
   .map(x => x.toUpperCase());

   let nurse =
   getNurse(no);

   if(!nurse){
     nurses.push({no,name});
   }else{
     nurse.name = name;
   }

   codes.forEach((code,index) => {

     const date =
     index + 1;

     if(!["P","S","M","L"].includes(code)) return;

     const k =
     makeKey(date, code);

     if(!schedule[k]){
       schedule[k] = [];
     }

     if(!schedule[k].includes(no)){
       schedule[k].push(no);
     }

   });

 });

 saveData();
}

// ======================================================
// INIT
// ======================================================

initDateSelect();
render();