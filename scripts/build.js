// Production Build Script for Hyperlink Chrome Extension
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function build() {
  console.log('⚡ Starting Hyperlink Production Build...\n');

  // 1. Generate Icons
  console.log('🎨 Generating icons...');
  execSync('node scripts/generate-icons.js', { cwd: rootDir, stdio: 'inherit' });

  // 2. Ensure dist directories
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const iconsDistDir = path.join(distDir, 'icons');
  if (!fs.existsSync(iconsDistDir)) {
    fs.mkdirSync(iconsDistDir, { recursive: true });
  }

  // 3. Copy Manifest & Icons
  console.log('📋 Copying manifest & assets...');
  fs.copyFileSync(
    path.join(rootDir, 'public/manifest.json'),
    path.join(distDir, 'manifest.json')
  );

  const publicIconsDir = path.join(rootDir, 'public/icons');
  if (fs.existsSync(publicIconsDir)) {
    const iconFiles = fs.readdirSync(publicIconsDir);
    for (const file of iconFiles) {
      fs.copyFileSync(
        path.join(publicIconsDir, file),
        path.join(iconsDistDir, file)
      );
    }
  }

  // 4. Bundle Background Service Worker (ESM)
  console.log('⚙️ Bundling background service worker...');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/background/service-worker.ts')],
    outfile: path.join(distDir, 'background.js'),
    bundle: true,
    format: 'esm',
    target: ['chrome110'],
    platform: 'browser',
    minify: true,
    sourcemap: true,
  });

  // 5. Bundle Content Script (IIFE for isolated content script execution)
  console.log('🛡️ Bundling content script (Isolated IIFE)...');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/content/index.tsx')],
    outfile: path.join(distDir, 'content.js'),
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    platform: 'browser',
    minify: true,
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  // 6. Bundle Popup & Options App
  console.log('💻 Bundling Popup & Options UI...');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/popup/popup.tsx')],
    outfile: path.join(distDir, 'popup.js'),
    bundle: true,
    format: 'esm',
    target: ['chrome110'],
    platform: 'browser',
    minify: true,
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/options/options.tsx')],
    outfile: path.join(distDir, 'options.js'),
    bundle: true,
    format: 'esm',
    target: ['chrome110'],
    platform: 'browser',
    minify: true,
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  // 7. Write HTML files for Popup and Options
  fs.writeFileSync(
    path.join(distDir, 'popup.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hyperlink</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body class="bg-[#0a0e18] text-slate-100 antialiased">
    <div id="root"></div>
    <script type="module" src="popup.js"></script>
  </body>
</html>`
  );

  fs.writeFileSync(
    path.join(distDir, 'options.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hyperlink Settings & Preferences</title>
    <link rel="stylesheet" href="options.css" />
  </head>
  <body class="bg-[#070a13] text-slate-100 antialiased">
    <div id="root"></div>
    <script type="module" src="options.js"></script>
  </body>
</html>`
  );

  // 8. Compile Tailwind CSS (Run strictly AFTER bundling so output CSS is clean and minified)
  console.log('🎨 Compiling Tailwind CSS stylesheets...');
  execSync(
    'npx tailwindcss -i src/content/content.css -o dist/content.css --minify',
    { cwd: rootDir, stdio: 'inherit' }
  );

  // Post-process dist/content.css to convert all rem units to exact px (1rem = 16px).
  // Websites like YouTube set html { font-size: 10px; } or 62.5%, which causes
  // standard rem-based Tailwind styles in injected extensions to shrink to 60% size.
  // Converting rem to px guarantees 100% pixel-perfect font and UI sizing on all sites!
  const contentCssPath = path.join(distDir, 'content.css');
  if (fs.existsSync(contentCssPath)) {
    let contentCss = fs.readFileSync(contentCssPath, 'utf8');
    contentCss = contentCss.replace(/([\d.]+)rem/g, (_match, val) => {
      const px = parseFloat(val) * 16;
      return `${Math.round(px * 100) / 100}px`;
    });
    fs.writeFileSync(contentCssPath, contentCss);
    console.log('✨ Converted content.css rem units to absolute px for universal host-font immunity (YouTube fix).');
  }

  execSync(
    'npx tailwindcss -i src/popup/popup.css -o dist/popup.css --minify',
    { cwd: rootDir, stdio: 'inherit' }
  );

  execSync(
    'npx tailwindcss -i src/options/options.css -o dist/options.css --minify',
    { cwd: rootDir, stdio: 'inherit' }
  );

  // 9. Copy test demo harness if available
  if (fs.existsSync(path.join(rootDir, 'test/demo.html'))) {
    fs.copyFileSync(
      path.join(rootDir, 'test/demo.html'),
      path.join(distDir, 'demo.html')
    );
  }

  console.log('\n✅ Build completed successfully!');
  console.log('📦 Output files in dist/:');
  fs.readdirSync(distDir).forEach(f => {
    const stats = fs.statSync(path.join(distDir, f));
    if (stats.isFile()) {
      console.log(`   - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`   - ${f}/`);
    }
  });
}

build().catch(err => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});

