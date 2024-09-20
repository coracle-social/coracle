import {App} from "@capacitor/app"
import {Nip55Service} from "./Nip55"

export function initializeDeepLinkHandler() {
  App.addListener("appUrlOpen", (data: {url: string}) => {
    console.log("Deep link opened", data.url)

    if (data.url.startsWith("nostr+")) {
      Nip55Service.handleNip55Intent(data.url)
    } else {
      // Handle other types of deep links if necessary
    }
  })
}
