<script lang="ts">
  import {onMount} from "svelte"
  import {postJson, sleep} from "@welshman/lib"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogInPassword from "@app/components/LogInPassword.svelte"
  import {pushModal} from "@app/modal"
  import {BURROW_URL} from "@app/state"

  const {email, confirm_token} = $props()

  const login = () => {
    pushModal(LogInPassword, {email}, {path: "/"})
  }

  let error = $state("")
  let loading = $state(true)

  onMount(async () => {
    const [res] = await Promise.all([
      postJson(BURROW_URL + "/user/confirm-email", {email, confirm_token}),
      sleep(2000),
    ])

    error = res.error
    loading = false
  })
</script>

<div class="column gap-4">
  <h1 class="heading">
    {#if loading}
      Just a second...
    {:else if error}
      Oops!
    {:else}
      Success!
    {/if}
  </h1>
  <p class="m-auto max-w-sm text-center">
    <Spinner {loading}>
      {#if loading}
        Hang tight, we're checking your confirmation link.
      {:else if error}
        Looks like something went wrong. {error}
      {:else}
        You're all set - click below to log in.
      {/if}
    </Spinner>
  </p>
  <Button class="btn btn-primary" onclick={login} disabled={loading}>Continue to Login</Button>
</div>
