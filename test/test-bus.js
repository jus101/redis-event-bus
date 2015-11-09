var bus = require("../lib/event-bus");
var config = require("config");
var test = require("tape");

var eb = bus.createBus(config.event_bus);

test("it can subscribe to a channel and receive events", function(t){
  t.plan(3);

  eb.subscribe("test-channel");
  eb.once("subscribe", function(channel){
    t.equals("test-channel", channel);

    eb.publish("test-channel", "test-event", {message: "123"})
      .then(function(result){
        t.ok(result, "Sent message to bus");
      }, function(err){
        t.fail(err);
      });
  });

  eb.once("test-event", function(e){
    console.log(e);
    t.equals(e.data.message, "123", "Received message from bus");
  });

  eb.once("error", function(e){
    t.fail(JSON.stringify(e));
  });
});
