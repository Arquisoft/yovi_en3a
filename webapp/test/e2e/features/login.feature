Feature: Login
  Validate the login form

  Scenario: Successful login
    Given a registered user exists
    And the login page is open
    When I fill in the login form with valid credentials
    Then I should be redirected to the menu
  
  Scenario: Failed login with wrong credentials
    Given the login page is open
    When I fill in the login form with wrong credentials
    Then I should see a login error message