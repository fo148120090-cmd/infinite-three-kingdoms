import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/infinite-three-kingdoms/',
  plugins: [react()],
});
