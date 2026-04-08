Feature: Security
  Validate that unauthenticated users cannot access protected routes

  Scenario: Unauthenticated user cannot access menu
    Given the user is not logged in
    When the user tries to access the menu page
    Then the user should be redirected to login

  Scenario: Unauthenticated user cannot access select game
    Given the user is not logged in
    When the user tries to access the select game page
    Then the user should be redirected to login

  Scenario: Unauthenticated user cannot access stats
    Given the user is not logged in
    When the user tries to access the stats page
    Then the user should be redirected to login

  Scenario: Unauthenticated user cannot access ranking
    Given the user is not logged in
    When the user tries to access the ranking page
    Then the user should be redirected to login