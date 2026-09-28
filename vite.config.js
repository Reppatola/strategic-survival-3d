import { defineConfig } from 'vite';

export default defineConfig({
    // Имя репозитория — часть URL. GitHub Pages отдаёт игру
    // по адресу https://<username>.github.io/<repo>/
    base: '/strategic-survival-3d/',

    build: {
        outDir: 'dist',
        sourcemap: false,
    },

    // Вики проекта: https://reppatola.github.io/strategic-survival-wiki/
});