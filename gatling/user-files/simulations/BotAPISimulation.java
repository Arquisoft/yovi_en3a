import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * In parallel:
 * - 5 users per second over 60 seconds with the random bot in a size 5 board
 * - 5 users per second over 60 seconds with the begginer bot in a size 7 board
 * - 3 users per second over 60 seconds with the medium bot in a size 7 board
 */
public class BotAPISimulation extends Simulation {

    private final HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://localhost:8000")
        .acceptHeader("application/json")
        .contentTypeHeader("application/json");

    private static final String BOARD_5_EARLY =
        "{\"botId\":\"#{botId}\","
        + "\"size\":5,"
        + "\"turn\":0,"
        + "\"players\":[\"B\",\"R\"],"
        + "\"layout\":\"..B../..../.R.../..../.....\"}";

    private static final String BOARD_7_MID =
        "{\"botId\":\"#{botId}\","
        + "\"size\":7,"
        + "\"turn\":1,"
        + "\"players\":[\"B\",\"R\"],"
        + "\"layout\":\"B.B..../RBB..../..RR.../...B.../....R../....../.......\"}";

    private static final String BOARD_7_LATE =
        "{\"botId\":\"#{botId}\","
        + "\"size\":7,"
        + "\"turn\":0,"
        + "\"players\":[\"B\",\"R\"],"
        + "\"layout\":\"BBBRRBB/RRBBBR./BBRRRBB/RRBBBR./BBRRR.B/RRBBBR./BBBRRB.\"}";


    private final ScenarioBuilder randomBotScenario = scenario("random_bot")
        .exec(session -> session.set("botId", "random_bot"))
        .exec(http("POST /api/gamey/play [random_bot 5 early]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_5_EARLY)).asJson()
            .check(status().is(200))
        )
        .pause(1)
        .exec(http("POST /api/gamey/play [random_bot 7 mid]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_7_MID)).asJson()
            .check(status().is(200))
        );

    private final ScenarioBuilder beginnerBotScenario = scenario("beginner_bot")
        .exec(session -> session.set("botId", "beginner_bot"))
        .exec(http("POST /api/gamey/play [beginner_bot 5 early]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_5_EARLY)).asJson()
            .check(status().is(200))
        )
        .pause(1)
        .exec(http("POST /api/gamey/play [beginner_bot 7 late]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_7_LATE)).asJson()
            .check(status().is(200))
        );

    private final ScenarioBuilder mediumBotScenario = scenario("medium_bot")
        .exec(session -> session.set("botId", "medium_bot"))
        .exec(http("POST /api/gamey/play [medium_bot 5 early]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_5_EARLY)).asJson()
            .check(status().is(200))
        )
        .pause(1)
        .exec(http("POST /api/gamey/play [medium_bot 7 mid]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_7_MID)).asJson()
            .check(status().is(200))
        )
        .pause(1)
        .exec(http("POST /api/gamey/play [medium_bot 7 late]")
            .post("/api/gamey/play")
            .body(StringBody(BOARD_7_LATE)).asJson()
            .check(status().is(200))
        );

    {
        setUp(
            randomBotScenario.injectOpen(
                constantUsersPerSec(5).during(60)
            ),
            beginnerBotScenario.injectOpen(
                constantUsersPerSec(5).during(60)
            ),
            mediumBotScenario.injectOpen(
                constantUsersPerSec(3).during(60)
            )
        ).protocols(httpProtocol)
         .assertions(
             forAll().responseTime().percentile(95).lt(1000),
             global().successfulRequests().percent().gt(99.0)
         );
    }
}