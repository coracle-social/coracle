<script lang="ts">
  import {_} from "svelte-i18n"
  import {tagZapSplit} from "@welshman/app"
  import Popover from "src/partials/Popover.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router, zap} from "src/app/util"
  import {loadPubkeys, env} from "src/engine"

  const hash = import.meta.env.VITE_BUILD_HASH
  const hodlbodPubkey = "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322"
  const startZap = () => zap({splits: [tagZapSplit(env.PLATFORM_PUBKEY)]})

  loadPubkeys([env.PLATFORM_PUBKEY])

  document.title = $_("about.title")
</script>

<FlexColumn class="gap-8">
  <div class="flex flex-col items-center justify-center">
    <Heading>Coracle</Heading>
    <h2 class="m-auto text-center">{$_("about.subtitle")}</h2>
    {#if hash}
      <p class="mt-1 text-xs">{$_("about.runningBuild", {values: {hash: hash.slice(0, 8)}})}</p>
    {/if}
  </div>
  <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
    <Card>
      <FlexColumn class="py-6 text-center">
        <h3 class="text-xl sm:h-12">{$_("about.supportDev")}</h3>
        <p class="sm:h-20">{$_("about.supportDevDescription")}</p>
        <div class="flex justify-center">
          <Button class="btn btn-accent" on:click={startZap}>{$_("about.zapDeveloper")}</Button>
        </div>
      </FlexColumn>
    </Card>
    <Card>
      <FlexColumn class="py-6 text-center">
        <h3 class="text-xl sm:h-12">{$_("about.getInTouch")}</h3>
        <p class="sm:h-20">{$_("about.getInTouchDescription")}</p>
        <div class="flex justify-center">
          <Link
            class="btn btn-accent"
            external
            href="https://github.com/coracle-social/coracle/issues/new">
            {$_("about.openIssue")}
          </Link>
        </div>
      </FlexColumn>
    </Card>
  </div>
  <div class="flex flex-col gap-4">
    <p class="text-center">
      {$_("about.builtBy")}<Link
        modal
        class="underline"
        href={router.at("people").of(hodlbodPubkey).toString()}>hodlbod</Link>
    </p>
    <p class="flex justify-center gap-4">
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Link external href="https://github.com/coracle-social/coracle"
            ><i class="fa fa-code-branch" /></Link>
        </div>
        <div slot="tooltip">{$_("about.sourceCode")}</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Link external href="https://info.coracle.social">
            <i class="fa fa-earth-americas" />
          </Link>
        </div>
        <div slot="tooltip">{$_("about.website")}</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Link external href="https://hodlbod.npub.pro/"><i class="fa fa-pen-clip" /></Link>
        </div>
        <div slot="tooltip">{$_("about.devBlog")}</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Link external href="https://fountain.fm/show/vnmoRQQ50siLFRE8k061">
            <i class="fa fa-rss" />
          </Link>
        </div>
        <div slot="tooltip">{$_("about.podcast")}</div>
      </Popover>
    </p>
  </div>
</FlexColumn>
