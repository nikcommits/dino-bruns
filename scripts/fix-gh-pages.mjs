import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const distFiles = getFiles('dist');
console.log(`[fix-gh-pages] Processing ${distFiles.length} files in dist/ for GitHub Pages base path...`);

for (const file of distFiles) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix hrefs like href="/..." (except /dino-bruns/, //, http)
  content = content.replaceAll(/href="\/([^"/][^"]*)"/g, (match, p1) => {
    if (p1.startsWith('dino-bruns')) return match;
    return `href="/dino-bruns/${p1}"`;
  });

  // Fix href="/"
  content = content.replaceAll('href="/"', 'href="/dino-bruns/"');

  // Fix image src="/images/..." -> src="/dino-bruns/images/..."
  content = content.replaceAll(/src="\/images\//g, 'src="/dino-bruns/images/');
  content = content.replaceAll(/src='\/images\//g, "src='/dino-bruns/images/");

  // Fix image src="/img/..." -> src="/dino-bruns/img/..."
  content = content.replaceAll(/src="\/img\//g, 'src="/dino-bruns/img/');
  content = content.replaceAll(/src='\/img\//g, "src='/dino-bruns/img/");

  // Fix JSON/JS string references to "/images/..." -> "/dino-bruns/images/..."
  content = content.replaceAll(/"\/images\//g, '"/dino-bruns/images/');
  content = content.replaceAll(/'\/images\//g, "'/dino-bruns/images/");
  content = content.replaceAll(/"\/img\//g, '"/dino-bruns/img/');
  content = content.replaceAll(/'\/img\//g, "'/dino-bruns/img/");

  // Fix favicon
  content = content.replaceAll('href="/favicon.svg"', 'href="/dino-bruns/favicon.svg"');

  fs.writeFileSync(file, content, 'utf8');
}

// Make sure .nojekyll exists
fs.writeFileSync('dist/.nojekyll', '', 'utf8');
console.log('[fix-gh-pages] Done! .nojekyll created and all paths prefixed with /dino-bruns/.');
