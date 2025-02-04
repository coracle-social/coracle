<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {postJson, stripProtocol} from "@welshman/lib"
  import {Nip46Broker, makeSecret} from "@welshman/signer"
  import {normalizeRelayUrl} from "@welshman/util"
  import {addSession} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import PasswordResetRequest from "@app/components/PasswordResetRequest.svelte"
  import {loadUserData} from "@app/commands"
  import {clearModals, pushModal} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {pushToast} from "@app/toast"
  import {NIP46_PERMS, BURROW_URL, PLATFORM_URL, PLATFORM_NAME, PLATFORM_LOGO} from "@app/state"

  interface Props {
    email?: string
  }

  let {email = $bindable("")}: Props = $props()

  const clientSecret = makeSecret()

  const startReset = () => pushModal(PasswordResetRequest, {email})

  const abortController = new AbortController()

  const relays = BURROW_URL.startsWith("http://")
    ? [normalizeRelayUrl("ws://" + stripProtocol(BURROW_URL))]
    : [normalizeRelayUrl(BURROW_URL)]

  const broker = Nip46Broker.get({clientSecret, relays})

  const back = () => history.back()

  const onSubmit = async () => {
    loading = true

    try {
      const res = await postJson(BURROW_URL + "/session", {email, password, nostrconnect: url})

      if (res.error) {
        pushToast({message: res.error, theme: "error"})
        loading = false
      }
    } catch (e) {
      pushToast({message: "Something went wrong, please try again!", theme: "error"})
      loading = false
    }
  }

  let url = ""
  let password = $state("")
  let loading = $state(false)

  onMount(async () => {
    url = await broker.makeNostrconnectUrl({
      perms: NIP46_PERMS,
      url: PLATFORM_URL,
      name: PLATFORM_NAME,
      image: PLATFORM_LOGO,
    })

    let response
    try {
      response = await broker.waitForNostrconnect(url, abortController)
    } catch (errorResponse: any) {
      if (errorResponse?.error) {
        pushToast({
          theme: "error",
          message: `Received error from signer: ${errorResponse.error}`,
        })
      } else if (errorResponse) {
        console.error(errorResponse)
      }
    }

    if (response) {
      loading = true

      const userPubkey = await broker.getPublicKey()

      await loadUserData(userPubkey)

      addSession({
        email,
        method: "nip46",
        pubkey: userPubkey,
        secret: clientSecret,
        handler: {pubkey: response.event.pubkey, relays},
      })

      setChecked("*")
      clearModals()
    }
  })

  onDestroy(() => {
    abortController.abort()
  })
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Log In</div>
    {/snippet}
    {#snippet info()}
      <div>Log in using your email and password</div>
    {/snippet}
  </ModalHeader>
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
  <p class="text-sm">
    Your email and password only work to log in to {PLATFORM_NAME}. To use your key on other nostr
    applications, visit your settings page. <Button class="link" onclick={startReset}
      >Forgot your password?</Button>
  </p>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} disabled={loading}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading || !email || !password}>
      <Spinner {loading}>Next</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
