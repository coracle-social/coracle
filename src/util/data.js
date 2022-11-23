const fees = {
  items: [
    {amount: 10, type: "content/rich"},
    {amount: 100, type: "content/image"},
    {amount: 1000, type: "content/video"},
    {amount: 1, type: "vote/create"},
  ],
}

export const servers = [
  {
    name: "Test Relay",
    url: "http://localhost:8485",
    description: "My local relay",
    fees,
  },
  {
    name: "Bitcoin Hackers",
    url: "http://localhost:3001",
    description: "Dudes who build software on and around the soundest money on earth.",
    fees,
  },
  {
    name: "Moscow Kirk",
    url: "http://localhost:3002",
    description: "The Moscow, ID Church Community.",
    fees,
  },
  {
    name: "Dogwood Meta",
    url: "http://localhost:3003",
    description: "A place to talk about the network itself.",
    fees,
  },
]
