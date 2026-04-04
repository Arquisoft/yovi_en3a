import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
 
import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;
 
// Check the status and then logins using users.csv, 120 users in total (2 per second in 60 seconds)
public class LoginSimulation extends Simulation {
 
    private final HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://localhost:8000")
        .acceptHeader("application/json")
        .contentTypeHeader("application/json")
        .userAgentHeader("Gatling/LoadTest");
 
    private final FeederBuilder<String> csvFeeder =
        csv("users.csv").random();
 
    private final ScenarioBuilder loginScenario = scenario("Login Scenario")
        .feed(csvFeeder)
 
        .exec(http("GET /status")
            .get("/status")
            .check(status().is(200))
        )
        .pause(1)
 
        .exec(http("POST login")
            .post("/api/users/login")
            .body(StringBody(
                "{"
                + "\"username\": \"#{username}\","
                + "\"password\": \"#{password}\""
                + "}"
            )).asJson()
            .check(status().in(200))
            .check(jsonPath("$.token").optional().saveAs("jwtToken"))
        );
 
    {
        setUp(
            loginScenario.injectOpen(
                constantUsersPerSec(2).during(60).randomized()
            )
        ).protocols(httpProtocol)
         .assertions(
            global().responseTime().max().lt(2000),
            global().successfulRequests().percent().gt(95.0)
         );
    }
}
 