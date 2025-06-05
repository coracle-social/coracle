<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {formatTimestamp} from "@welshman/lib"

  interface Props {
    url: string
  }

  const {url}: Props = $props()

  // Mock conversation data similar to Slack's threads view
  const mockConversations = [
    {
      id: "conv1",
      starter: {
        pubkey: "npub1xyz123",
        content:
          "What's everyone's thoughts on the new relay implementation? I'm seeing some interesting performance improvements...",
        timestamp: Date.now() - 3600000, // 1 hour ago
      },
      room: "general",
      replyCount: 12,
      lastActivity: Date.now() - 900000, // 15 minutes ago
      participants: ["npub1abc", "npub1def", "npub1ghi", "npub1jkl"],
      latestReply: {
        pubkey: "npub1abc",
        content: "The latency improvements are definitely noticeable in my tests",
      },
    },
    {
      id: "conv2",
      starter: {
        pubkey: "npub2abc456",
        content:
          "Has anyone tried the new calendar integration? Looking for feedback before we roll it out to more spaces",
        timestamp: Date.now() - 7200000, // 2 hours ago
      },
      room: "development",
      replyCount: 8,
      lastActivity: Date.now() - 1800000, // 30 minutes ago
      participants: ["npub2def", "npub2ghi", "npub2jkl"],
      latestReply: {
        pubkey: "npub2def",
        content: "Works great on mobile, had one small sync issue but figured it out",
      },
    },
    {
      id: "conv3",
      starter: {
        pubkey: "npub3def789",
        content:
          "Quick question about zap splitting - should we implement this at the relay level or client level?",
        timestamp: Date.now() - 10800000, // 3 hours ago
      },
      room: "random",
      replyCount: 5,
      lastActivity: Date.now() - 3600000, // 1 hour ago
      participants: ["npub3abc", "npub3ghi"],
      latestReply: {
        pubkey: "npub3abc",
        content: "I think client level makes more sense for privacy",
      },
    },
  ]
</script>

<div class="card2 bg-alt">
  <div class="flex flex-col gap-4">
    <h3 class="flex items-center gap-2 text-lg font-semibold">
      <Icon icon="chat-round" />
      Recent Conversations
    </h3>
    <div class="flex flex-col gap-4">
      {#each mockConversations as conversation (conversation.id)}
        <div class="card2 bg-alt">
          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <ProfileCircle pubkey={conversation.starter.pubkey} size={10} />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 text-sm opacity-70">
                  <span class="font-medium text-blue-400">#{conversation.room}</span>
                  <span class="opacity-50">•</span>
                  <span>{formatTimestamp(conversation.starter.timestamp)}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <p class="text-base leading-relaxed">{conversation.starter.content}</p>
                </div>
              </div>
            </div>
            <div class="ml-13 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-2 text-sm opacity-70">
                  <Icon icon="alt-arrow-left" size={4} />
                  {conversation.replyCount} replies
                </span>
                <div class="flex -space-x-2">
                  <ProfileCircles pubkeys={conversation.participants} size={6} />
                </div>
              </div>
              <span class="text-sm opacity-50">
                {formatTimestamp(conversation.lastActivity)}
              </span>
            </div>
            {#if conversation.latestReply}
              <div class="card2 bg-alt">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2 text-sm opacity-70">
                    <ProfileCircle pubkey={conversation.latestReply.pubkey} size={5} />
                    <span class="font-medium">Latest reply:</span>
                  </div>
                  <p class="text-sm leading-relaxed opacity-90">
                    {conversation.latestReply.content}
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      <Button class="btn btn-primary btn-sm">View all conversations →</Button>
    </div>
  </div>
</div>
