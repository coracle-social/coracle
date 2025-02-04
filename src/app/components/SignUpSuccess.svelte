<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import LogInPassword from "@app/components/LogInPassword.svelte"
  import {pushModal} from "@app/modal"

  const {email} = $props()

  const login = () => pushModal(LogInPassword)
</script>

<div class="column gap-4">
  <h1 class="heading">Success!</h1>
  <p class="m-auto max-w-sm text-center">
    A confirmation email has been sent to {email}.
  </p>
  <p>Once you've confirmed your account you'll be redirected to the login page.</p>
  <Button class="btn btn-primary" onclick={login}>Back to Login</Button>
</div>
