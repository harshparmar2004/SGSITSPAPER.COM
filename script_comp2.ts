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
      
      content = content.replace(/p-5/g, 'p-4');
      content = content.replace(/sm:p-5/g, 'sm:p-4');
      content = content.replace(/py-5/g, 'py-3');
      content = content.replace(/px-5/g, 'px-4');
      content = content.replace(/h-16/g, 'h-12');
      content = content.replace(/w-16/g, 'w-12');
      content = content.replace(/text-3xl/g, 'text-2xl');
      content = content.replace(/mt-8/g, 'mt-6');
      content = content.replace(/mb-8/g, 'mb-6');
      content = content.replace(/pb-12/g, 'pb-8');
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  });
});
