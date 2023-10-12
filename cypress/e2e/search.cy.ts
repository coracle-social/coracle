describe("search", () => {
  it("works", () => {
    cy.visit("/")
    cy.get(".cy-top-nav .fa-search").click()
    cy.get(".cy-top-nav input").type("hodlbod")
    cy.get(".modal").contains("hodlbod").click()
    cy.get(".modal").contains("following")
    cy.get(".modal").contains("followers")
  })
})
