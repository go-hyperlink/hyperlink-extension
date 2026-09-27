// Chrome Web Store Packaging Script for Hyperlink
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function createPackage() {
  console.log('📦 Preparing Chrome Web Store Release Package...\n');

  // 1. Run fresh build
  console.log('🔨 Step 1: Building production bundle...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Read version from package.json and manifest.json
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
  const version = manifest.version || pkg.version || '1.0.0';

  const zipFileName = `hyperlink-webstore-v${version}.zip`;
  const zipFilePath = path.join(rootDir, zipFileName);

  // 3. Remove old zip if exists
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  // 4. Create clean staging directory for store packaging
  const stageDir = path.join(rootDir, '.store_stage');
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stageDir, { recursive: true });

  // Files required for Web Store (exclude sourcemaps and test files to keep zip lightweight)
  const filesToInclude = [
    'manifest.json',
    'background.js',
    'content.js',
    'content.css',
    'popup.html',
    'popup.js',
    'popup.css',
    'options.html',
    'options.js',
    'options.css'
  ];

  for (const file of filesToInclude) {
    const src = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(stageDir, file));
    }
  }

  // Copy icons
  const iconsDistDir = path.join(distDir, 'icons');
  const stageIconsDir = path.join(stageDir, 'icons');
  if (fs.existsSync(iconsDistDir)) {
    fs.mkdirSync(stageIconsDir, { recursive: true });
    for (const icon of fs.readdirSync(iconsDistDir)) {
      fs.copyFileSync(path.join(iconsDistDir, icon), path.join(stageIconsDir, icon));
    }
  }

  // 5. Create zip file using standard zip command
  console.log(`\n🗜️  Step 2: Compressing files into ${zipFileName}...`);
  execSync(`zip -r -9 "${zipFilePath}" .`, { cwd: stageDir, stdio: 'inherit' });

  // Clean staging
  fs.rmSync(stageDir, { recursive: true, force: true });

  const stats = fs.statSync(zipFilePath);
  const sizeKb = (stats.size / 1024).toFixed(1);

  console.log(`\n🎉 Chrome Web Store zip ready!`);
  console.log(`   📁 Path: ${zipFilePath}`);
  console.log(`   ⚖️  Size: ${sizeKb} KB`);
  console.log(`   🏷️  Version: v${version}`);
}

createPackage().catch(err => {
  console.error('\n❌ Packaging failed:', err);
  process.exit(1);
});
