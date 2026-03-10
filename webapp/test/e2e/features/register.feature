Feature: Register
  Validate the register form

  Scenario: Successful registration
    Given the register page is open
    When I fill in the registration form with valid data
    Then I should see a success message