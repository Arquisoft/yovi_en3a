Feature: Stats and Ranking
  Validate the stats and ranking views

  Scenario: View personal stats
    Given I am logged in
    When I click on History and Stats
    Then I should see the stats page

  Scenario: View global ranking
    Given I am logged in
    When I click on Global Ranking
    Then I should see the ranking page