import dotenv from 'dotenv'
import {defineConfig, minimalPreset as preset} from '@vite-pwa/assets-generator/config'

dotenv.config({path: '.env.local'})
dotenv.config({path: '.env'})

let logoPath = process.env.VITE_PLATFORM_LOGO

if (logoPath.startsWith('https://')) {
}

export default defineConfig({
  preset,
  images: [logoPath],
})
