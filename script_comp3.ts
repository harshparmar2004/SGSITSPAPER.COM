import fs from 'fs';
import path from 'path';

const dirs = [path.join(process.cwd(), 'src/pages'), path.join(process.cwd(), 'src/components')];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const fullPath = path.join(dir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/px-4 py-4/g, 'px-3 py-2');
      content = content.replace(/px-4 py-3/g, 'px-3 py-2');
      content = content.replace(/px-4 py-2/g, 'px-3 py-2');
      content = content.replace(/p-4/g, 'p-3');
      content = content.replace(/gap-4/g, 'gap-3');
      content = content.replace(/mb-6/g, 'mb-4');
      content = content.replace(/mt-6/g, 'mt-4');
      content = content.replace(/space-y-4/g, 'space-y-3');
      content = content.replace(/text-sm font-semibold/g, 'text-xs font-semibold');
      content = content.replace(/text-sm font-medium/g, 'text-xs font-medium');
      content = content.replace(/text-sm/g, 'text-xs');
      content = content.replace(/text-xs text-gray-500/g, 'text-[11px] text-gray-500');
      content = content.replace(/text-xs text-gray-400/g, 'text-[11px] text-gray-400');
      content = content.replace(/max-w-7xl/g, 'max-w-full px-4 sm:px-6');
      content = content.replace(/w-12 h-12/g, 'w-10 h-10');
      content = content.replace(/w-10 h-10/g, 'w-8 h-8');
      content = content.replace(/min-w-full divide-y divide-gray-200/g, 'w-full text-left whitespace-nowrap');
      content = content.replace(/min-w-\[250px\]/g, 'min-w-[150px]');
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  });
});
