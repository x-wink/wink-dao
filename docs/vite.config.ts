import Vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [Vue()],
    server: {
        host: '0.0.0.0',
        open: true,
    },
});
