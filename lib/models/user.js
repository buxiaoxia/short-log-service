/// <reference path="../../typings/tsd.d.ts"/>
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BaseModel = require("./base_model");
var config = require('../../config');



var UserSchema = new Schema({
  username: { type: String },
  loginname: { type: String },
  password: { type: String },
  email: { type: String },
  url: { type: String },
  profile_image_url: { type: String },
  location: { type: String },
  signature: { type: String },
  profile: { type: String },
  weibo: { type: String },
  avatar: { type: String },

  is_block: {type: Boolean, default: false},

  score: { type: Number, default: 0 },
  topic_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },
  follower_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  collect_tag_count: { type: Number, default: 0 },
  collect_topic_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_star: { type: Boolean },
  level: { type: String },
  active: { type: Boolean, default: true },
  accessToken: { type: String },
});

UserSchema.plugin(BaseModel);

mongoose.model('User', UserSchema)
