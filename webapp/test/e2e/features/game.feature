Feature: Game
  Validate the game flow

  Scenario: Create and play a game
    Given I am logged in
    And I am on the menu page
    When I click on Play vs Bot
    And I select Standard mode
    Then I should see the game board

  Scenario: Exit a game
    Given I am logged in and in a game
    When I click resign
    Then I should be redirected to the game selection menu