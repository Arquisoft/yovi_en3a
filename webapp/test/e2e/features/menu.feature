Feature: Menu
  Validate the menu options

  Scenario: View how to play
    Given I am logged in
    When I click on How to Play
    Then I should see the how to play page

  Scenario: Logout
    Given I am logged in
    When I click on Log Out
    Then I should be redirected to the landing page