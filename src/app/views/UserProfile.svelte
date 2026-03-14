<script lang="ts">
  import {_} from "svelte-i18n"
  import {pubkey, profilesByPubkey, setProfile} from "@welshman/app"
  import Input from "src/partials/Input.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Button from "src/partials/Button.svelte"
  import Footer from "src/partials/Footer.svelte"
  import {showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Field from "src/partials/Field.svelte"
  import {router} from "src/app/util/router"

  const submit = () => {
    setProfile(values)
    showInfo($_("profile.saved"))
    router.at("people").of($pubkey).replace()
  }

  const values = {...$profilesByPubkey.get($pubkey)}

  document.title = $_("profile.title")
</script>

<form on:submit|preventDefault={submit} class="relative">
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>{$_("profile.heading")}</Heading>
    <p>
      {$_("profile.description")}
    </p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label={$_("profile.username")}>
      <Input type="text" name="name" class="flex-grow" bind:value={values.name}>
        <i slot="before" class="fa-solid fa-user-astronaut" />
      </Input>
      <div slot="info">{$_("profile.usernameInfo")}</div>
    </Field>
    <Field label={$_("profile.nip05")}>
      <Input type="text" name="name" class="flex-grow" bind:value={values.nip05}>
        <i slot="before" class="fa-solid fa-user-check" />
      </Input>
      <div slot="info">
        {$_("profile.nip05Info")}
      </div>
    </Field>
    <Field label={$_("profile.lightningAddress")}>
      <Input type="text" name="name" class="flex-grow" bind:value={values.lud16}>
        <i slot="before" class="fa-solid fa-bolt" />
      </Input>
      <div slot="info">
        {$_("profile.lightningAddressInfo")}
      </div>
    </Field>
    <Field label={$_("profile.website")}>
      <Input type="text" name="name" class="flex-grow" bind:value={values.website}>
        <i slot="before" class="fa-solid fa-link" />
      </Input>
      <div slot="info">{$_("profile.websiteInfo")}</div>
    </Field>
    <Field label={$_("profile.aboutYou")}>
      <Textarea name="about" bind:value={values.about} />
      <div slot="info">{$_("profile.aboutYouInfo")}</div>
    </Field>
    <Field label={$_("profile.profilePicture")}>
      <ImageInput
        bind:value={values.picture}
        icon="image-portrait"
        opts={{quality: 0.7, maxWidth: 480, maxHeight: 480}} />
      <p slot="info">{$_("profile.profilePictureInfo")}</p>
    </Field>
  </div>
  <Footer>
    <Button class="btn flex-grow" type="submit">Save</Button>
  </Footer>
</form>
