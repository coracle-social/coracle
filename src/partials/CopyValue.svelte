<script lang="ts">
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {router} from "src/app/util/router"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import {encrypt} from "nostr-tools/nip49"
  import {hexToBytes} from "@welshman/lib"
  import Button from "src/partials/Button.svelte"

  export let value
  export let label
  export let encode = null
  export let hasEncryptPrompt = false
  export let isPassword = false

  let willShowEncryptModal = false
  let showEncoded = true
  let displayValue = ""

  $: password = ""
  $: confirmedPassword = ""
  $: passwordIsValid = password && password === confirmedPassword
  $: displayValue = showEncoded && encode ? encode(value) : value

  const showEncryptModal = () => {
    willShowEncryptModal = true
  }

  const closeEncryptModal = () => {
    willShowEncryptModal = false
    password = ""
    confirmedPassword = ""
  }

  const onCopy = () => {
    if (showEncoded && hasEncryptPrompt) {
      return showEncryptModal()
    }

    copyToClipboard(displayValue)
    showInfo(`${label || "Contents"} copied to clipboard!`)
  }

  const copyEncoded = () => {
    copyToClipboard(encode(value))
    closeEncryptModal()
    showInfo(`Copied nsec to clipboard!`)
  }

  const copyEncrypted = () => {
    copyToClipboard(encrypt(hexToBytes(value), password))
    closeEncryptModal()
    showInfo(`Copied ncryptsec to clipboard!`)
  }

  const share = () => router.at("qrcode").at(displayValue).open()
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <strong class="flex-grow">
      <slot name="label">
        {label}
      </slot>
    </strong>
    {#if encode}
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Toggle bind:value={showEncoded} />
        </div>
        <span slot="tooltip">Show {showEncoded ? "raw" : "encoded"} version</span>
      </Popover>
    {/if}
  </div>
  <div class="flex min-w-0 gap-4 font-mono text-sm">
    <div class="flex gap-4 p-1">
      <i class="fa-solid fa-copy cursor-pointer" on:click={onCopy} />
      {#if !isPassword}
        <i class="fa-solid fa-qrcode cursor-pointer" on:click={share} />
      {/if}
    </div>
    <p class="min-w-0 overflow-hidden text-ellipsis">
      {isPassword ? displayValue.toString().replace(/./g, "•") : displayValue}
    </p>
  </div>
</div>

{#if willShowEncryptModal}
  <Modal onEscape={closeEncryptModal}>
    <Subheading>Encrypt your private key</Subheading>
    <p>
      For additional security, you can encrypt your private key with a password. This key starts
      with <strong>ncryptsec1</strong> and can't be used without your password.
    </p>
    <Field label="Password">
      <Input type="password" bind:value={password} />
    </Field>
    <Field label="Confirm Password">
      <Input type="password" bind:value={confirmedPassword} />
    </Field>
    <div class="flex justify-between gap-2">
      <Button class="btn" on:click={closeEncryptModal}>Cancel</Button>
      <div class="flex gap-2">
        <Button class="btn" on:click={copyEncoded}>Copy plaintext</Button>
        <Button class="btn btn-accent" on:click={copyEncrypted} disabled={!passwordIsValid}>
          Copy encrypted
        </Button>
      </div>
    </div>
  </Modal>
{/if}
