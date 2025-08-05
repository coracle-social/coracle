import type {CapacitorConfig} from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "social.coracle.app",
  appName: "Coracle",
  webDir: "dist",
  android: {
    adjustMarginsForEdgeToEdge: false,
  },
  // Use this for live reload https://capacitorjs.com/docs/guides/live-reload
  // server: {
  //   url: "http://192.168.1.115:5173",
  //   cleartext: true
  // },
}

export default config
