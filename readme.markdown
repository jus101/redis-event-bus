# redis-event-bus

A simple wrapper around Redis pubsub that allows you to subscribe and publish events.

# example

``` js
var bus = require("redis-event-bus").createBus({
  url: "redis://192.168.99.100"
});

bus.on("subscribe", function(channel){
  console.log("subscribed to %s", channel);
  if(channel === "door-events") {
    setTimeout(function(){
      console.log("Sending door event");
      bus.publish("door-events", {type: "door-open", data: {door_id: "123ABC"}})
        .then(function(ok){
          console.log("Published event to door-events", ok);
        }, function(err){
          console.error("Error publishing event to door-events", err);
        });
    }, 1000);
  } else {
    setTimeout(function() {
      console.log("Sending test channel event");
      bus.publish("test-channel", {data: [1,2,3]});
    }, 2000);
  }
});

bus.subscribe("door-events");
bus.subscribe("test-channel");

bus.on("door-open", function(event){
  console.log("Door %s opened", event.data.door_id);
});

bus.on("event", function(channel, event){
  console.log("Received event from channel %s", channel, event.data);
  setTimeout(function(){
    bus.disconnect();
  }, 1000);
});

bus.on("error", function(err){
  console.error(err);
});
```

# install

With [npm](https://npmjs.org) do:

```
npm install redis-event-bus
```

# license

MIT
