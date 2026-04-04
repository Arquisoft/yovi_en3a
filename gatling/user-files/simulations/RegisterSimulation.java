import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
 
import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

// Registers 20 users during 30 seconds checking correct registrations and duplicates
public class RegisterSimulation extends Simulation {
 
    private final HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://localhost:8000")
        .acceptHeader("application/json")
        .contentTypeHeader("application/json");
 
    private final ScenarioBuilder registerScenario = scenario("Register Scenario")
 
        .exec(session -> session
            .set("username", "regI" + session.userId() + "I" + System.currentTimeMillis() % 100000)
            .set("email",    "regI" + session.userId() + "I" + System.currentTimeMillis() % 100000 + "@test.es")
            .set("password", "Password1")
        )
 
        // Register operation, first time
        .exec(http("POST register")
            .post("/api/users/register")
            .body(StringBody(
                "{"
                + "\"username\": \"#{username}\","
                + "\"email\": \"#{email}\","
                + "\"password\": \"#{password}\","
                + "\"age\": 33,"
                + "\"country\": \"Spain\""
                + "}"
            )).asJson()
            .check(status().in(201, 409))
        )
        .pause(1)
 
        // Register operation, second time. Same credentials, should not be allowed
        .exec(http("POST register duplicate")
            .post("/api/users/register")
            .body(StringBody(
                "{"
                + "\"username\": \"#{username}\","
                + "\"email\": \"#{email}\","
                + "\"password\": \"#{password}\""
                + "}"
            )).asJson()
            .check(status().is(409)) // All should yield 409 
        );
 
    {
        setUp(
            registerScenario.injectOpen(rampUsers(20).during(30))
        ).protocols(httpProtocol)
         .assertions(
            global().responseTime().percentile(95).lt(2000),
            global().successfulRequests().percent().gt(99.0)
        );
    }
}