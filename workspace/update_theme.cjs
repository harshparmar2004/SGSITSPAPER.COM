const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');

// Colors and Theme
content = content.replace(/bg-\[\#111827\]/g, 'bg-[#FAF7F2]');
content = content.replace(/selection\:bg-white\/20/g, 'selection:bg-amber-200/50');
content = content.replace(/text-slate-50/g, 'text-stone-900');
content = content.replace(/text-white/g, 'text-stone-900');
content = content.replace(/text-slate-300/g, 'text-stone-700');
content = content.replace(/text-slate-400/g, 'text-stone-600');
content = content.replace(/text-slate-500/g, 'text-stone-500');
content = content.replace(/text-slate-600/g, 'text-stone-400');
content = content.replace(/text-slate-900/g, 'text-white'); 

// Sky to Amber/Orange
content = content.replace(/sky-300/g, 'amber-700');
content = content.replace(/sky-400/g, 'amber-600');
content = content.replace(/sky-500/g, 'amber-500');
content = content.replace(/sky-900\/30/g, 'amber-100/50');

// Indigo to Stone
content = content.replace(/indigo-300/g, 'stone-600');
content = content.replace(/indigo-400/g, 'stone-500');
content = content.replace(/indigo-500/g, 'stone-400');
content = content.replace(/indigo-600/g, 'stone-900 text-white');
content = content.replace(/hover\:bg-indigo-500/g, 'hover:bg-stone-800');

// Emerald to Teal
content = content.replace(/emerald-200/g, 'teal-500');
content = content.replace(/emerald-300/g, 'teal-600');
content = content.replace(/emerald-400/g, 'teal-700');
content = content.replace(/emerald-500/g, 'teal-800');

// Borders and Backgrounds
content = content.replace(/border-white\/5/g, 'border-stone-200');
content = content.replace(/border-white\/10/g, 'border-stone-200/80');
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-white');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-white');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-white');
content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-stone-50');
content = content.replace(/bg-white\/\[0\.08\]/g, 'bg-stone-100');
content = content.replace(/bg-white\/5/g, 'bg-stone-100');
content = content.replace(/bg-white\/10/g, 'bg-stone-200');

// Specific Dark Mode things
content = content.replace(/shadow-\[0_8px_32px_0_rgba\(0,0,0,0\.5\)\]/g, 'shadow-sm');
content = content.replace(/shadow-2xl backdrop-blur-sm/g, 'shadow-xl bg-white border border-stone-200/50');
content = content.replace(/bg-\[linear-gradient\(to_right,#ffffff05_1px,transparent_1px\),linear-gradient\(to_bottom,#ffffff05_1px,transparent_1px\)\]/g, 'bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)]');
content = content.replace(/via-\[\#111827\]\/50/g, 'via-[#FAF7F2]/50');
content = content.replace(/to-\[\#111827\]/g, 'to-[#FAF7F2]');

// Login button fix
content = content.replace(/bg-white hover\:bg-white text-stone-900 border border-stone-200\/80 hover\:border-amber-700\/40/g, 'bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 hover:border-amber-700/40');

// Some border and layout tweaks
content = content.replace(/border-\[\#111827\]/g, 'border-[#FAF7F2]');

// Fix documentation button text color issue
content = content.replace(/bg-white text-white font-bold rounded-xl/g, 'bg-stone-900 text-stone-50 font-bold rounded-xl hover:bg-stone-800 cursor-pointer');
content = content.replace(/text-transparent bg-clip-text/g, 'text-transparent bg-clip-text');

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log("Replaced colors");
