<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Dialog from "@lib/components/Dialog.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import {pushModal} from "@app/modal"

  const logIn = () => pushModal(LogIn)

  const signUp = () => pushModal(SignUp)
</script>

<Dialog>
  <div class="column gap-4">
    <div class="py-2">
      <h1 class="heading">Welcome to Flotilla!</h1>
      <p class="text-center">The chat app built for sovereign communities.</p>
    </div>
    <Button on:click={logIn}>
      <CardButton>
        <div slot="icon"><Icon icon="login-2" size={7} /></div>
        <div slot="title">Log in</div>
        <div slot="info">If you've been here before, you know the drill.</div>
      </CardButton>
    </Button>
    <Button on:click={signUp}>
      <CardButton>
        <div slot="icon"><Icon icon="add-circle" size={7} /></div>
        <div slot="title">Create an account</div>
        <div slot="info">Just a few questions and you'll be on your way.</div>
      </CardButton>
    </Button>
  </div>
</Dialog>
