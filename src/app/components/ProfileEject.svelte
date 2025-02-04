<script lang="ts">
  import {postJson} from "@welshman/lib"
  import {session} from "@welshman/app"
  import {slideAndFade} from "@lib/transition"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Field from "@lib/components/Field.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {PLATFORM_NAME, BURROW_URL} from "@app/state"
  import {pushToast} from "@app/toast"
  import {logout} from "@app/commands"

  const email = $session?.email

  const back = () => history.back()

  const confirm = async () => {
    loading = true

    try {
      const payload = {email, password, eject: true}
      const res = await postJson(BURROW_URL + "/user", payload, {method: "delete"})

      if (res.error) {
        return pushToast({message: res.error, theme: "error"})
      }

      success = true
      pushToast({message: "Success! Please check your inbox and continue when you're ready."})

      await logout()
    } finally {
      loading = false
    }
  }

  const reload = () => {
    loading = true
    window.location.href = "/"
  }

  let password = $state("")
  let success = $state(false)
  let loading = $state(false)
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>Export your keys</div>
    {/snippet}
  </ModalHeader>
  <p>Here's what the process looks like:</p>
  <ul class="flex list-inside list-decimal flex-col gap-4">
    <li>When you're ready, enter your account password below to continue.</li>
    <li>
      {PLATFORM_NAME} will send an email to "{email}" with your encrypted private key in it.
    </li>
    <li>
      Store your "ncryptsec" in a password manager like
      <Link class="link" external href="https://bitwarden.com/">Bitwarden</Link>. This is the key to
      your social identity; keep it safe and secret.
    </li>
    <li>
      Choose a <Link class="link" href="https://nostrapps.com/#signers">signer app</Link> and import
      your private key into it. Don't forget your account password; you'll need it to decrypt your key.
    </li>
  </ul>
  <p>
    Once you export your key, you'll be <strong>logged out</strong> and won't be able to log in using
    your email and password any more. Going forward, you'll need to use your signer app instead.
  </p>
  {#if !success}
    <div out:slideAndFade>
      <Field>
        {#snippet label()}
          <p>To confirm, please enter your password below:</p>
        {/snippet}
        {#snippet input()}
          <label class="input input-bordered flex w-full items-center gap-2">
            <Icon icon="key" />
            <input type="password" disabled={loading} bind:value={password} class="grow" />
          </label>
        {/snippet}
      </Field>
    </div>
  {/if}
  <ModalFooter>
    <Button class="btn btn-link" disabled={loading || success} onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    {#if success}
      <Button class="btn btn-primary" disabled={loading} onclick={reload}>
        <Icon icon="check-circle" />
        <Spinner {loading}>Refresh the page</Spinner>
      </Button>
    {:else}
      <Button class="btn btn-error" disabled={loading} onclick={confirm}>
        <Icon icon="check-circle" />
        <Spinner {loading}>I understand, send me my private key</Spinner>
      </Button>
    {/if}
  </ModalFooter>
</div>
