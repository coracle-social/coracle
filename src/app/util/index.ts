export * from "src/app/util/feeds"
export * from "src/app/util/router"

import {App} from "@capacitor/app"

// ... existing code ...

// Listen for deep links
App.addListener("appUrlOpen", (data: {url: string}) => {
  console.log("Deep link opened", data.url)
  // Handle the deep link here
  // You'll need to parse the URL and take appropriate action
})
