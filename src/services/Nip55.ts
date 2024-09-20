import {App} from "@capacitor/app"
import {Browser} from "@capacitor/browser"

export class Nip55Service {
  static async openNip55Link(url: string): Promise<void> {
    await Browser.open({url})
  }

  static parseNip55Url(url: string): {action: string; params: Record<string, string>} {
    const parsedUrl = new URL(url)
    const action = parsedUrl.hostname
    const params: Record<string, string> = {}

    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value
    })

    return {action, params}
  }

  static async handleNip55Intent(url: string): Promise<void> {
    const {action, params} = this.parseNip55Url(url)

    switch (action) {
      case "walletconnect":
        await this.handleWalletConnect(params)
        break
      case "sign":
        await this.handleSign(params)
        break
      case "encrypt":
        await this.handleEncrypt(params)
        break
      case "decrypt":
        await this.handleDecrypt(params)
        break
      default:
        console.warn(`Unhandled NIP-55 action: ${action}`)
    }
  }

  private static async handleWalletConnect(params: Record<string, string>): Promise<void> {
    // Implement wallet connect logic
    console.log("Handling wallet connect", params)
    // You might want to trigger a state update or navigate to a specific screen here
  }

  private static async handleSign(params: Record<string, string>): Promise<void> {
    // Implement signing logic
    console.log("Handling sign request", params)
    // You might want to show a confirmation dialog to the user before signing
  }

  private static async handleEncrypt(params: Record<string, string>): Promise<void> {
    // Implement encryption logic
    console.log("Handling encrypt request", params)
  }

  private static async handleDecrypt(params: Record<string, string>): Promise<void> {
    // Implement decryption logic
    console.log("Handling decrypt request", params)
  }
}

// Set up the deep link listener
App.addListener("appUrlOpen", async (data: {url: string}) => {
  if (data.url.startsWith("nostr+")) {
    await Nip55Service.handleNip55Intent(data.url)
  }
})
