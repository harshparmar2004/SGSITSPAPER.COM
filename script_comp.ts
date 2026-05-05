import fs from 'fs';
import path from 'path';

const dirs = [path.join(process.cwd(), 'src/components'), path.join(process.cwd(), 'src/components/ui')];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const fullPath = path.join(dir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/px-6 py-4/g, 'px-4 py-2');
      content = content.replace(/px-6 py-3/g, 'px-4 py-2');
      content = content.replace(/px-6 py-5/g, 'px-4 py-3');
      content = content.replace(/p-6/g, 'p-4');
      content = content.replace(/text-sm whitespace-nowrap/g, 'text-xs whitespace-nowrap');
      content = content.replace(/text-2xl font-bold/g, 'text-xl font-bold');
      content = content.replace(/space-y-6/g, 'space-y-4');
      content = content.replace(/gap-6/g, 'gap-4');
      content = content.replace(/gap-8/g, 'gap-5');
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  });
});
