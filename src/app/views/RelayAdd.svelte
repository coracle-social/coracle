<script>
  import {fly} from "svelte/transition"
  import {toast, modal, appName} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import user from "src/agent/user"
  import {loadAppData} from "src/app/state"

  export let url

  const submit = async e => {
    e.preventDefault()
    url = url.trim()

    if (!url.includes("://")) {
      url = "wss://" + url
    }

    try {
      new URL(url)
    } catch (e) {
      return toast.show("error", "That isn't a valid url")
    }

    if (!url.match("^wss?://")) {
      return toast.show("error", "That isn't a valid websocket url")
    }

    modal.pop()

    await user.addRelay(url)

    if (!user.getProfile()?.kind0) {
      loadAppData(user.getPubkey())
    }
  }
</script>

<form on:submit={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>Add a relay</Heading>
      <p>
        {appName} automatically discovers relays as you browse the network. Adding more relays will generally
        make things quicker to load, at the expense of higher data usage.
      </p>
    </div>
    <RelaySearch />
  </Content>
</form>
