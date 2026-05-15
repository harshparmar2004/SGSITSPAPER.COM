const fs = require('fs');

let content = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');

// Optimize main wrapper max-width and paddings
content = content.replace(/className="flex-grow pt-32 pb-8 px-6 relative z-10 font-sans"/g, 'className="flex-grow pt-24 md:pt-32 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 font-sans"');

// Optimize Hero text sizes
content = content.replace(/text-4xl md:text-5xl lg:text-\[3\.5rem\]/g, 'text-[2.5rem] sm:text-5xl lg:text-[4rem]');
content = content.replace(/min-h-\[calc\(100vh-250px\)\] mb-32 pt-10/g, 'min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-250px)] mb-20 lg:mb-32 pt-8 lg:pt-10');

// Optimize Login box sizes
content = content.replace(/className="w-full max-w-md relative group mt-4 lg:mt-0"/g, 'className="w-full max-w-[22rem] sm:max-w-md mx-auto relative group mt-8 lg:mt-0"');

// Reduce vertical padding on sections mobile
content = content.replace(/py-16 md:py-24/g, 'py-12 md:py-24');

// Reduce font sizes on headers in sections mobile
content = content.replace(/text-3xl md:text-4xl/g, 'text-2xl sm:text-3xl md:text-4xl');

// Optimize flex-directions for stats
content = content.replace(/grid grid-cols-1 md:grid-cols-3 gap-3 mb-12/g, 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-12');

// Optimize gaps on main section headers
content = content.replace(/gap-10 mb-16/g, 'gap-6 md:gap-10 mb-10 md:mb-16');
content = content.replace(/pb-12/g, 'pb-8 md:pb-12');

// Adjust card paddings to be slightly smaller on mobile
content = content.replace(/p-8 rounded-2xl/g, 'p-6 sm:p-8 rounded-2xl');

// Adjust text descriptions
content = content.replace(/text-base md:text-lg text-stone-600 mb-10/g, 'text-sm sm:text-base md:text-lg text-stone-600 mb-8 md:mb-10');
content = content.replace(/text-base md:text-lg text-stone-600 font-light/g, 'text-sm sm:text-base md:text-lg text-stone-600 font-light');

// Landing Navbar is 'fixed top-0 w-full z-50 ...' we can reduce nav logo size slightly
content = content.replace(/className="w-10 h-10 md:w-12 md:h-12 /g, 'className="w-8 h-8 md:w-12 md:h-12 ');
content = content.replace(/text-lg font-extrabold/g, 'text-base md:text-lg font-extrabold');

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log("Optimized for mobile");
