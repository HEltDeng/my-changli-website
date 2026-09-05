import { resolve } from 'node:path';
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

const copyRuntimeFiles = () => ({
  name: 'copy-runtime-files',
  closeBundle() {
    mkdirSync(resolve(import.meta.dirname, 'dist/config'), { recursive: true });
    mkdirSync(resolve(import.meta.dirname, 'dist/assets/docs'), { recursive: true });
    copyFileSync(
      resolve(import.meta.dirname, 'config/site-config.json'),
      resolve(import.meta.dirname, 'dist/config/site-config.json'),
    );
    copyFileSync(
      resolve(import.meta.dirname, 'config/support-config.json'),
      resolve(import.meta.dirname, 'dist/config/support-config.json'),
    );
    copyFileSync(
      resolve(import.meta.dirname, 'assets/docs/MyChangli-V1.0.0-User-Manual.pdf'),
      resolve(import.meta.dirname, 'dist/assets/docs/MyChangli-V1.0.0-User-Manual.pdf'),
    );
    const supportImages = resolve(import.meta.dirname, 'assets/images/support');
    if (existsSync(supportImages)) {
      cpSync(supportImages, resolve(import.meta.dirname, 'dist/assets/images/support'), { recursive: true });
    }
    const communityImages = resolve(import.meta.dirname, 'assets/images/community');
    if (existsSync(communityImages)) {
      cpSync(communityImages, resolve(import.meta.dirname, 'dist/assets/images/community'), { recursive: true });
    }
    const interfaceIcons = resolve(import.meta.dirname, 'assets/icons');
    if (existsSync(interfaceIcons)) {
      cpSync(interfaceIcons, resolve(import.meta.dirname, 'dist/assets/icons'), { recursive: true });
    }
    const downloads = resolve(import.meta.dirname, 'downloads');
    if (existsSync(downloads)) {
      cpSync(downloads, resolve(import.meta.dirname, 'dist/downloads'), { recursive: true });
    }
  },
});

export default defineConfig({
  plugins: [sites(), copyRuntimeFiles()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        features: resolve(import.meta.dirname, 'features.html'),
        download: resolve(import.meta.dirname, 'download.html'),
        updates: resolve(import.meta.dirname, 'updates.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        thanks: resolve(import.meta.dirname, 'thanks.html'),
        support: resolve(import.meta.dirname, 'support.html'),
        guides: resolve(import.meta.dirname, 'guides.html'),
        commercial: resolve(import.meta.dirname, 'commercial.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
        manual: resolve(import.meta.dirname, 'manual.html'),
      },
    },
  },
});
