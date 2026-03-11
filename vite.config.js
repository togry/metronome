import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/metronome/',
    plugins: [react(), viteSingleFile()],
})
