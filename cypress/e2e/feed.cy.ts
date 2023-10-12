describe("feed interaction", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("clicking a card works", () => {
    cy.get(".cy-note-click-target:first").click()
    cy.get(".modal .fa-heart")
    cy.get(".modal .cy-modal-close").click()

    cy.get(".modal").should("not.exist")
  })

  it("feed controls works", () => {
    cy.get(".fa-sliders").click()
    cy.get(".modal .cy-chip:first .fa-times").click()
    cy.get(".modal").contains("Apply Filters").click()
    cy.contains("Kinds 30023,")
    cy.get(".card", {timeout: 30000})
  })
})
