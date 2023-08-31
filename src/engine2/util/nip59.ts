export const now = (drift = 0) =>
  Math.round(Date.now() / 1000 - Math.random() * Math.pow(10, drift))

export const seal = (content, pubkey) => ({
  kind: 13,
  created_at: now(5),
  tags: [],
  content,
  pubkey,
})

export const wrap = (content, pubkey, recipient) => ({
  kind: 1059,
  created_at: now(5),
  tags: [["p", recipient]],
  content,
  pubkey,
})
