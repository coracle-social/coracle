const nsec = "nsec1er8narhat3xjypf46pksxlr6k4jrmv2e9psazjk0adynly0l4ltsepvmy5"

Cypress.Commands.add("login", () => {
  cy.session(
    nsec,
    () => {
      cy.visit("/login/privkey")
      cy.get("input[type=password]").type(nsec, {log: false})
      cy.get(".cy-login-submit").click()
      cy.get(".modal", {timeout: 10_000}).should("not.exist")
      cy.contains("Don't have an account?").should("not.exist")
    },
    {
      validate: () => {
        let pubkey

        cy.window()
          .then(w => {
            pubkey = w.pubkey.get()
          })
          .then(() => {
            expect(pubkey).to.equal(
              "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
            )
          })
      },
    }
  )
})
