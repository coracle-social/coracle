describe("signup", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("works", () => {
    cy.get(".cy-top-nav").contains("Log In").click()
    cy.get(".modal").contains("Sign Up").click()
    cy.get(".modal").contains("Let's go!").click()
    cy.get(".modal [name=name]").type("9sd2j3e0sd")
    cy.get(".modal").contains("Continue").click()
    cy.get(".modal").contains("Got it").click()
    cy.get(".modal").contains("Continue").click()
    cy.get(".modal").contains("Continue").click()
    cy.wait(1000)
    cy.get(".modal").contains("Skip and see your feed").click()
    cy.get(".modal").should("not.exist")
    cy.contains("From follows")
    cy.get("svg.logo").click()
    cy.get(".card").contains("Profile").click()
    cy.get(".cy-person-name").contains("9sd2j3e0sd")
  })
})
