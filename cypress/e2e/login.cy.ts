describe("authenticated usage", () => {
  beforeEach(() => {
    cy.login()
  })

  it("works", () => {
    cy.visit("/")
    cy.get("svg.logo").click()
    cy.get(".card").contains("Profile").click()
    cy.get(".cy-person-name").contains("test account 12938740")
  })
})
