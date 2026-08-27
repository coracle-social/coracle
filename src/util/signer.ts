import {get} from "svelte/store"
import {signer} from "src/app/util"
import {showWarning} from "src/partials/Toast.svelte"

const isPermissionDenied = (error: Error): boolean => {
  const message = error?.message?.toLowerCase() || ""
  return (
    message.includes("permission") ||
    message.includes("denied") ||
    message.includes("user rejected") ||
    message.includes("user denied")
  )
}

export const safeNip04Decrypt = async (pubkey: string, content: string) => {
  try {
    const $signer = get(signer)
    if (!$signer?.nip04?.decrypt) {
      showWarning("Signer not available for decryption")
      return null
    }
    return await $signer.nip04.decrypt(pubkey, content)
  } catch (error) {
    if (isPermissionDenied(error)) {
      showWarning("Permission denied for decryption")
    } else {
      showWarning("Failed to decrypt message")
    }
    return null
  }
}

export const safeNip04Encrypt = async (pubkey: string, plaintext: string) => {
  try {
    const $signer = get(signer)
    if (!$signer?.nip04?.encrypt) {
      showWarning("Signer not available for encryption")
      return null
    }
    return await $signer.nip04.encrypt(pubkey, plaintext)
  } catch (error) {
    if (isPermissionDenied(error)) {
      showWarning("Permission denied for encryption")
    } else {
      showWarning("Failed to encrypt message")
    }
    return null
  }
}

export const safeNip44Decrypt = async (pubkey: string, payload: string) => {
  try {
    const $signer = get(signer)
    if (!$signer?.nip44?.decrypt) {
      showWarning("Signer not available for decryption")
      return null
    }
    return await $signer.nip44.decrypt(pubkey, payload)
  } catch (error) {
    if (isPermissionDenied(error)) {
      showWarning("Permission denied for decryption")
    } else {
      showWarning("Failed to decrypt message")
    }
    return null
  }
}

export const safeNip44Encrypt = async (pubkey: string, plaintext: string) => {
  try {
    const $signer = get(signer)
    if (!$signer?.nip44?.encrypt) {
      showWarning("Signer not available for encryption")
      return null
    }
    return await $signer.nip44.encrypt(pubkey, plaintext)
  } catch (error) {
    if (isPermissionDenied(error)) {
      showWarning("Permission denied for encryption")
    } else {
      showWarning("Failed to encrypt message")
    }
    return null
  }
}

export const safeSignerNip04Decrypt = async (signerObj: any, pubkey: string, content: string) => {
  try {
    if (!signerObj?.nip04?.decrypt) {
      return null
    }
    return await signerObj.nip04.decrypt(pubkey, content)
  } catch (error) {
    if (isPermissionDenied(error)) {
      showWarning("Permission denied for decryption")
    } else {
      showWarning("Failed to decrypt message")
    }
    return null
  }
}
