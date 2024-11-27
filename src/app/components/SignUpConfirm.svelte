<script lang="ts">
  import {onMount} from "svelte"
  import {postJson, sleep} from "@welshman/lib"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogInBurrow from "@app/components/LogInBurrow.svelte"
  import {pushModal} from "@app/modal"
  import {BURROW_URL} from "@app/state"

  export let email
  export let token

  const login = () => {
    pushModal(LogInBurrow, {email}, {path: "/"})
  }

  let error: string
  let loading = true

  onMount(async () => {
    const [res] = await Promise.all([
      postJson(BURROW_URL + "/user/confirm", {email, token}),
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
  <Button class="btn btn-primary" on:click={login} disabled={loading}>Continue to Login</Button>
</div>
