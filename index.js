var redis = require("redis");
var EventEmitter = require("events").EventEmitter;
var Promise = require("bluebird");

var Bus = function(config) {
  EventEmitter.call(this);

  this.config = config;
  this.subscriber = redis.createClient(config.url, config.subscriber_options);
  this.publisher = redis.createClient(config.url, config.publisher_options);
  this.subscriptions = [];

  this.subscriber.on("message", this.onMessage.bind(this));
  this.subscriber.on("subscribe", this.subscriber_onSubscribe.bind(this));
  this.subscriber.on("error", this.subscriber_onError.bind(this));
  this.publisher.on("error", this.publisher_onError.bind(this));
}

Bus.prototype = Object.create(EventEmitter.prototype);

Bus.prototype.subscribe = function(channel) {
  if(this.subscriptions.indexOf(channel) == -1) {
    return this.subscriber.subscribe(channel);
  }
  return false;
}

Bus.prototype.unsubscribe = function(channel) {
  if(this.subscriptions.indexOf(channel) !== -1) {
    return this.subscriber.unsubscribe(channel);
  }
  return false;
}

Bus.prototype.publish = function(channel, event) {
  var message = {};

  if(!channel || typeof(channel) !== "string") {
    return Promise.reject(new Error("Channel is required to publish"));
  }

  if(event.type) { message.type = event.type.toString(); }
  message.data = event.data || {};

  return new Promise(function(resolve, reject){
    this.publisher.publish(channel, JSON.stringify(message), function(err){
      if(err) { return reject(err); }
      return resolve(true);
    });
  }.bind(this));
}

Bus.prototype.onMessage = function(channel, message) {
  try {
    event = JSON.parse(message);
  } catch(e) {
    return this.subscriber_onError({err: new Error("JSON parse message error"), message: message});
  }

  if(event && event.type) {
    this.emit(event.type, {channel: channel, data: event.data});
  } else {
    this.emit("event", channel, {data: event.data});
  }
}

Bus.prototype.subscriber_onSubscribe = function(channel) {
  this.emit("subscribe", channel);
}

Bus.prototype.subscriber_onError = function(err) {
  this.emit("error", {subscriber: true, error: err});
}

Bus.prototype.publisher_onError = function(err) {
  this.emit("error", {publisher: true, error: err});
}

Bus.prototype.disconnect = function() {
  this.subscriber.quit();
  this.publisher.quit();
}

module.exports.EventBus = Bus;
module.exports.createBus = function(config) {
  return new Bus(config || {});
}
