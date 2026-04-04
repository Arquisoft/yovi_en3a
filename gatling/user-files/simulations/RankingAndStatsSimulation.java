import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
 
import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * In parrallel:
 * - 3 consecutives users per second over 60 seconds checking the ranking
 * - 2 consecutives users per second over 60 seconds checking their personal stats
 */
public class RankingAndStatsSimulation extends Simulation {

    private final HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://localhost:8000")
        .acceptHeader("application/json")
        .contentTypeHeader("application/json");

    private final FeederBuilder<String> csvFeeder =
        csv("users.csv").circular();

    private final ScenarioBuilder rankingScenario = scenario("Ranking Scenario")
        .feed(csvFeeder)

        .exec(http("POST login")
            .post("/api/users/login")
            .body(StringBody(
                "{"
                + "\"username\": \"#{username}\","
                + "\"password\": \"#{password}\""
                + "}"
            )).asJson()
            .check(status().is(200))
            .check(jsonPath("$.token").saveAs("jwtToken"))
        )
        .pause(1)

        .exec(http("GET ranking by wins")
            .get("/api/users/stats/ranking")
            .queryParam("sortBy", "wins")
            .header("Authorization", "Bearer #{jwtToken}")
            .check(status().is(200))
        )
        .pause(1)

        .exec(http("GET ranking by winRate")
            .get("/api/users/stats/ranking")
            .queryParam("sortBy", "winRate")
            .header("Authorization", "Bearer #{jwtToken}")
            .check(status().is(200))
        );

    private final ScenarioBuilder myStatsScenario = scenario("Personal Stats Scenario")
        .feed(csvFeeder)

        .exec(http("POST login")
            .post("/api/users/login")
            .body(StringBody(
                "{"
                + "\"username\": \"#{username}\","
                + "\"password\": \"#{password}\""
                + "}"
            )).asJson()
            .check(status().is(200))
            .check(jsonPath("$.token").saveAs("jwtToken"))
            .check(jsonPath("$.userId").saveAs("userId"))
        )
        .pause(1)

        .exec(http("GET personal stats")
            .get("/api/users/stats/#{userId}")
            .header("Authorization", "Bearer #{jwtToken}")
            .check(status().in(200, 404))
        )
        .pause(1)

        .exec(http("GET game history")
            .get("/api/users/history/#{userId}")
            .header("Authorization", "Bearer #{jwtToken}")
            .check(status().in(200, 404))
        );

    {
        setUp(
            rankingScenario.injectOpen(
                constantUsersPerSec(3).during(60)
            ),
            myStatsScenario.injectOpen(
                constantUsersPerSec(2).during(60)
            )
        ).protocols(httpProtocol)
         .assertions(
             global().responseTime().percentile(95).lt(2000),
             global().successfulRequests().percent().gt(95.0)
         );
    }
}