<script lang="ts">
  import {postJson, sleep} from "@welshman/lib"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import LogInPassword from "@app/components/LogInPassword.svelte"
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {BURROW_URL} from "@app/state"

  export let email
  export let reset_token

  const onSubmit = async () => {
    loading = true

    try {
      const [res] = await Promise.all([
        postJson(BURROW_URL + "/user/confirm-reset", {email, password, reset_token}),
        sleep(1000),
      ])

      if (res.error) {
        pushToast({message: res.error, theme: "error"})
      } else {
        pushToast({message: "Password reset successfully!"})
        pushModal(LogInPassword, {email}, {path: "/"})
      }
    } finally {
      loading = false
    }
  }

  let loading = false
  let password = ""
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Reset your password</div>
  </ModalHeader>
  <FieldInline disabled={loading}>
    <p slot="label">Email Address</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="user-rounded" />
      <input readonly value={email} class="grow" />
    </label>
  </FieldInline>
  <FieldInline disabled={loading}>
    <p slot="label">New Password</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="key" />
      <input bind:value={password} class="grow" type="password" />
    </label>
  </FieldInline>
  <Button type="submit" class="btn btn-primary" disabled={loading}>
    <Spinner {loading}>Reset password</Spinner>
  </Button>
</form>
