<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import Dialog from "@lib/components/Dialog.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import {PLATFORM_TERMS, PLATFORM_PRIVACY, PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"

  const logIn = () => pushModal(LogIn)

  const signUp = () => pushModal(SignUp)
</script>

<Dialog>
  <div class="column gap-4">
    <div class="py-2">
      <h1 class="heading">Welcome to {PLATFORM_NAME}!</h1>
      <p class="text-center">The chat app built for self-hosted communities.</p>
    </div>
    <Button onclick={logIn}>
      <CardButton class="!btn-primary">
        {#snippet icon()}
          <div><Icon icon="login-2" size={7} /></div>
        {/snippet}
        {#snippet title()}
          <div>Log in</div>
        {/snippet}
        {#snippet info()}
          <div>If you've been here before, you know the drill.</div>
        {/snippet}
      </CardButton>
    </Button>
    <Button onclick={signUp}>
      <CardButton>
        {#snippet icon()}
          <div><Icon icon="add-circle" size={7} /></div>
        {/snippet}
        {#snippet title()}
          <div>Create an account</div>
        {/snippet}
        {#snippet info()}
          <div>Just a few questions and you'll be on your way.</div>
        {/snippet}
      </CardButton>
    </Button>
    <p class="text-center text-xs opacity-75">
      By using {PLATFORM_NAME}, you consent to our
      <Link external class="link" href={PLATFORM_TERMS}>Terms of Service</Link> and
      <Link external class="link" href={PLATFORM_PRIVACY}>Privacy Policy</Link>.
    </p>
  </div>
</Dialog>
