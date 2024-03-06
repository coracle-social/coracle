import dotenv from 'dotenv'
import {defineConfig, minimalPreset as preset} from '@vite-pwa/assets-generator/config'

dotenv.config({path: '.env.local'})
dotenv.config({path: '.env'})

export default defineConfig({
  preset,
  images: ['public' + process.env.VITE_APP_LOGO],
})
