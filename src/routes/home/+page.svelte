<script lang="ts">
  import {goto} from "$app/navigation"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import {pushModal} from "@app/modal"

  const createSpace = () => pushModal(SpaceCreateExternal)

  const browseSpaces = () => goto("/discover")

  const leaveFeedback = () =>
    goto("/home/97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322")

  const donate = () => window.open("https://geyser.fund/project/flotilla")
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content">
    <div class="column content gap-4">
      <h1 class="text-center text-5xl">Welcome to</h1>
      <h1 class="mb-4 text-center text-5xl font-bold uppercase">Flotilla</h1>
      <div class="grid gap-3 lg:grid-cols-2">
        <Button on:click={createSpace}>
          <CardButton>
            <div slot="icon"><Icon icon="add-circle" size={7} /></div>
            <div slot="title">Create a space</div>
            <div slot="info">Invite all your friends, do life together.</div>
          </CardButton>
        </Button>
        <Button on:click={browseSpaces}>
          <CardButton>
            <div slot="icon"><Icon icon="compass" size={7} /></div>
            <div slot="title">Discover spaces</div>
            <div slot="info">Find a community based on your hobbies or interests.</div>
          </CardButton>
        </Button>
        <Button on:click={leaveFeedback}>
          <CardButton>
            <div slot="icon"><Icon icon="plain" size={7} /></div>
            <div slot="title">Leave feedback</div>
            <div slot="info">Let us know how we can improve by giving us feedback.</div>
          </CardButton>
        </Button>
        <Button on:click={donate}>
          <CardButton>
            <div slot="icon"><Icon icon="hand-pills" size={7} /></div>
            <div slot="title">Donate to Flotilla</div>
            <div slot="info">Support the project by donating to the developer.</div>
          </CardButton>
        </Button>
      </div>
    </div>
  </div>
</div>
