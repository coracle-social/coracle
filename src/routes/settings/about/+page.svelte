<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"

  const hash = import.meta.env.VITE_BUILD_HASH

  const pubkey = "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322"

  const openProfile = () => pushModal(ProfileDetail, {pubkey})
</script>

<div class="mt-8 min-h-screen bg-base-200 sm:hero">
  <div class="hero-content">
    <div class="column content gap-6">
      <p class="text-center text-2xl">Thanks for using</p>
      <h1 class="mb-4 text-center text-5xl font-bold uppercase">{PLATFORM_NAME}</h1>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="card2 bg-alt flex flex-col gap-2 text-center shadow-2xl">
          <h3 class="text-2xl sm:h-12">Donate</h3>
          <p class="sm:h-16">Funds will be used to support development.</p>
          <Link external href="https://geyser.fund/project/flotilla" class="btn btn-primary">
            Support the Developer
          </Link>
        </div>
        <div class="card2 bg-alt flex flex-col gap-2 text-center shadow-2xl">
          <h3 class="text-2xl sm:h-12">Get in touch</h3>
          <p class="sm:h-16">Having problems? Let us know.</p>
          <Link
            class="btn btn-primary"
            href="/chat/97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322">
            Chat with the Developer
          </Link>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <div class="col-2 items-center text-center">
          <p class="text-sm">
            Built with 💜 by
            <span class="text-primary">
              @<Button onclick={openProfile} class="link">hodlbod</Button>
            </span>
          </p>
          <p class="text-xs">
            Icons by <Link
              external
              class="link"
              href="https://www.figma.com/community/file/1166831539721848736">480 Design</Link>
          </p>
          {#if hash}
            <p class="text-xs">Running build {hash.slice(0, 8)}</p>
          {/if}
        </div>
        <div class="flex justify-center gap-4">
          <div class="tooltip" data-tip="Source Code">
            <Link external href="https://github.com/coracle-social/flotilla">
              <Icon icon="code-2" />
            </Link>
          </div>
          <div class="tooltip" data-tip="About the Developer">
            <Link external href="https://coracle.tools">
              <Icon icon="earth" />
            </Link>
          </div>
          <div class="tooltip" data-tip="Dev Blog">
            <Link external href="https://hodlbod.npub.pro/">
              <Icon icon="pen" />
            </Link>
          </div>
          <div class="tooltip" data-tip="Podcast">
            <Link external href="https://fountain.fm/show/vnmoRQQ50siLFRE8k061">
              <Icon icon="headphones-round" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
