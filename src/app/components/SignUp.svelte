<script lang="ts">
  import {postJson} from "@welshman/lib"
  import {isMobile, preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import SignUpSuccess from "@app/components/SignUpSuccess.svelte"
  import {pushModal} from "@app/modal"
  import {BURROW_URL, PLATFORM_NAME} from "@app/state"
  import {pushToast} from "@app/toast"

  const ac = window.location.origin

  const at = isMobile ? "android" : "web"

  const nstart = `https://start.njump.me/?an=Flotilla&at=${at}&ac=${ac}`

  const login = () => pushModal(LogIn)

  const signupPassword = async () => {
    loading = true

    try {
      const res = await postJson(BURROW_URL + "/user", {email, password})

      if (res.error) {
        pushToast({message: res.error, theme: "error"})
      } else {
        pushModal(SignUpSuccess, {email}, {replaceState: true})
      }
    } finally {
      loading = false
    }
  }

  const signup = () => {
    if (BURROW_URL) {
      signupPassword()
    }
  }

  let email = $state("")
  let password = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(signup)}>
  <h1 class="heading">Sign up with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    {PLATFORM_NAME} is built using the
    <Button class="link" onclick={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
  {#if BURROW_URL}
    <FieldInline>
      {#snippet label()}
        <p>Email</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <Icon icon="user-rounded" />
          <input bind:value={email} />
        </label>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Password</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <Icon icon="key" />
          <input bind:value={password} type="password" />
        </label>
      {/snippet}
    </FieldInline>
    <Button type="submit" class="btn btn-primary" disabled={loading || !email || !password}>
      <Spinner {loading}>Sign Up</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
    <p class="text-sm opacity-75">
      Note that your email and password will only work to log in to {PLATFORM_NAME}. To use your key
      on other nostr applications, you can create a nostr key yourself, or export your key from {PLATFORM_NAME}
      later.
    </p>
    <Divider>Or</Divider>
  {/if}
  <a href={nstart} class="btn {email || password ? 'btn-neutral' : 'btn-primary'}">
    <Icon icon="square-share-line" />
    Get going on nstart
  </a>
  <div class="text-sm">
    Already have an account?
    <Button class="link" onclick={login}>Log in instead</Button>
  </div>
</form>
