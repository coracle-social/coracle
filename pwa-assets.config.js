import dotenv from "dotenv"
import {defineConfig, minimalPreset as preset} from "@vite-pwa/assets-generator/config"

dotenv.config({path: ".env"})
dotenv.config({path: ".env.template"})

export default defineConfig({
  preset,
  images: [process.env.VITE_PLATFORM_LOGO],
})
