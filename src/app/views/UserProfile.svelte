<script lang="ts">
  import {pubkey, profilesByPubkey} from "@welshman/app"
  import Input from "src/partials/Input.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Footer from "src/partials/Footer.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Field from "src/partials/Field.svelte"
  import {publishProfile} from "src/engine"
  import {router} from "src/app/util/router"

  const nip05Url = "https://github.com/nostr-protocol/nips/blob/master/05.md"
  const lud16Url = "https://lightningaddress.com/"
  const pseudUrl =
    "https://www.coindesk.com/markets/2020/06/29/many-bitcoin-developers-are-choosing-to-use-pseudonyms-for-good-reason/"

  const submit = () => {
    publishProfile(values)
    showInfo("Your profile has been saved!")
    router.at("people").of($pubkey).replace()
  }

  const values = {...$profilesByPubkey.get($pubkey)}

  document.title = "Profile"
</script>

<form on:submit|preventDefault={submit} class="relative">
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>About You</Heading>
    <p>
      Give people a friendly way to recognize you. We recommend you do not use your real name or
      share your personal information. The future of the internet is
      <Anchor underline external href={pseudUrl}>pseudonymous</Anchor>.
    </p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label="Username">
      <Input type="text" name="name" class="flex-grow" bind:value={values.name}>
        <i slot="before" class="fa-solid fa-user-astronaut" />
      </Input>
      <div slot="info">In most clients, this image will be shown on your profile page.</div>
    </Field>
    <Field label="NIP-05 Identifier">
      <Input type="text" name="name" class="flex-grow" bind:value={values.nip05}>
        <i slot="before" class="fa-solid fa-user-check" />
      </Input>
      <div slot="info">
        Enter a <Anchor underline external href={nip05Url}>NIP-05</Anchor> address to verify your public
        key.
      </div>
    </Field>
    <Field label="Lightning address">
      <Input type="text" name="name" class="flex-grow" bind:value={values.lud16}>
        <i slot="before" class="fa-solid fa-bolt" />
      </Input>
      <div slot="info">
        Enter a <Anchor underline external href={lud16Url}>lightning address</Anchor> to enable sending
        and receiving bitcoin tips.
      </div>
    </Field>
    <Field label="Website">
      <Input type="text" name="name" class="flex-grow" bind:value={values.website}>
        <i slot="before" class="fa-solid fa-link" />
      </Input>
      <div slot="info">Enter any url where people can find out more about you.</div>
    </Field>
    <Field label="About you">
      <Textarea name="about" bind:value={values.about} />
      <div slot="info">Tell the world about yourself. This will be shown on your profile page.</div>
    </Field>
    <Field label="Profile Picture">
      <ImageInput
        bind:value={values.picture}
        icon="image-portrait"
        maxWidth={480}
        maxHeight={480} />
      <p slot="info">Please be mindful of others and only use small images.</p>
    </Field>
    <Field label="Profile Banner">
      <ImageInput bind:value={values.banner} icon="panorama" />
      <div slot="info">In most clients, this image will be shown on your profile page.</div>
    </Field>
  </div>
  <Footer>
    <Anchor grow button tag="button" type="submit">Save</Anchor>
  </Footer>
</form>
