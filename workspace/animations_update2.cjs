const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');

content = content.replace(/viewport=\{\{ once: true, amount: 0\.2 \}\}/g, 'viewport={{ once: false, amount: 0.15 }}');
content = content.replace(/<motion\.div variants=\{FADE_RIGHT\} className="lg:w-1\/2 w-full">([\s\S]*?)<div className="grid gap-4">/g, '<motion.div variants={FADE_LEFT} className="lg:w-1/2 w-full">$1<div className="grid gap-4">');

// Animate elements inside the grid of departments
content = content.replace(/variants=\{FADE_UP\} className="flex items-center gap-4/g, 'variants={FADE_UP} className="flex items-center gap-4');

// We can add scale animation for the stats grid
// content = content.replace(/className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-12"/g, ...) it's already staggering
content = content.replace(/variants=\{STAGGER_CONTAINER\}/g, "variants={STAGGER_CONTAINER}");

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log("Replaced");
