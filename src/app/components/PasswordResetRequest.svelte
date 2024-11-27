<script lang="ts">
  import {postJson, sleep} from "@welshman/lib"
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

  export let email: string

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

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Reset your password</div>
  </ModalHeader>
  <FieldInline disabled={loading}>
    <p slot="label">Email Address</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="user-rounded" />
      <input bind:value={email} class="grow" />
    </label>
    <p slot="info">You'll be sent an email with a password reset link.</p>
  </FieldInline>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Request password reset link</Spinner>
    </Button>
  </ModalFooter>
</form>
