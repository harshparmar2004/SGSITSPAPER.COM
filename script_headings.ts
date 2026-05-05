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
      
      content = content.replace(/text-2xl font-extrabold/g, 'text-xl font-extrabold');
      content = content.replace(/text-2xl font-bold/g, 'text-xl font-bold');
      content = content.replace(/text-3xl font-extrabold/g, 'text-2xl font-extrabold');
      content = content.replace(/text-3xl font-bold/g, 'text-2xl font-bold');
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated headings in ${file}`);
    }
  });
});
