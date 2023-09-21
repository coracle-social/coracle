<script lang="ts">
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import Input from "src/partials/Input.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Field from "src/partials/Field.svelte"
  import {pubkey, people, publishProfile} from "src/engine"
  import {routes} from "src/app/state"
  import {toastProgress} from "src/app/state"

  const nip05Url = "https://github.com/nostr-protocol/nips/blob/master/05.md"
  const lud16Url = "https://blog.getalby.com/create-your-lightning-address/"
  const pseudUrl =
    "https://www.coindesk.com/markets/2020/06/29/many-bitcoin-developers-are-choosing-to-use-pseudonyms-for-good-reason/"

  const submit = async () => {
    const pub = await publishProfile(values)

    pub.on("progress", toastProgress)

    navigate(routes.person($pubkey))
  }

  let values = people.key($pubkey).get()?.profile || {}

  document.title = "Profile"
</script>

<form on:submit|preventDefault={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>About You</Heading>
      <p>
        Give people a friendly way to recognize you. We recommend you do not use your real name or
        share your personal information. The future of the internet is
        <Anchor class="underline" external href={pseudUrl}>pseudonymous</Anchor>.
      </p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <Field label="Username">
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.name}>
          <i slot="before" class="fa-solid fa-user-astronaut" />
        </Input>
        <div slot="info">In most clients, this image will be shown on your profile page.</div>
      </Field>
      <Field label="NIP-05 Identifier">
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.nip05}>
          <i slot="before" class="fa-solid fa-user-check" />
        </Input>
        <div slot="info">
          Enter a <Anchor class="underline" external href={nip05Url}>NIP-05</Anchor> address to verify
          your public key.
        </div>
      </Field>
      <Field label="Lightning address">
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.lud16}>
          <i slot="before" class="fa-solid fa-bolt" />
        </Input>
        <div slot="info">
          Enter a <Anchor class="underline" external href={lud16Url}>LUD-16</Anchor> address to enable
          sending and receiving lightning tips (LUD-06 will also work).
        </div>
      </Field>
      <Field label="Website">
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.website}>
          <i slot="before" class="fa-solid fa-link" />
        </Input>
        <div slot="info">Enter any url where people can find out more about you.</div>
      </Field>
      <Field label="About you">
        <Textarea name="about" bind:value={values.about} />
        <div slot="info">
          Tell the world about yourself. This will be shown on your profile page.
        </div>
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
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
