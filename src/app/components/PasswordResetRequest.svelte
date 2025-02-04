<script lang="ts">
  import {postJson, sleep} from "@welshman/lib"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import LogInPassword from "@app/components/LogInPassword.svelte"
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {BURROW_URL} from "@app/state"

  interface Props {
    email: string
  }

  let {email = $bindable()}: Props = $props()

  const back = () => history.back()

  const onSubmit = async () => {
    loading = true

    try {
      const [res] = await Promise.all([
        postJson(BURROW_URL + "/user/request-reset", {email}),
        sleep(1000),
      ])

      if (res.error) {
        pushToast({message: res.error, theme: "error"})
      } else {
        pushToast({message: `Password reset email has been sent!`})
        pushModal(LogInPassword, {email}, {path: "/"})
      }
    } finally {
      loading = false
    }
  }

  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Reset your password</div>
    {/snippet}
  </ModalHeader>
  <FieldInline disabled={loading}>
    {#snippet label()}
      <p>Email Address</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="user-rounded" />
        <input bind:value={email} class="grow" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>You'll be sent an email with a password reset link.</p>
    {/snippet}
  </FieldInline>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Request password reset link</Spinner>
    </Button>
  </ModalFooter>
</form>
