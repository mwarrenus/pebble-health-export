/*
 * Copyright (c) 2016, Natacha Porté
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var cfg_endpoint = null;
var cfg_data_field = null;

var to_send = [];
var sender = new XMLHttpRequest();

function sendHead() {
   if (to_send.length < 1) return;
   var line = to_send.shift();
   var data = new FormData();
   data.append(cfg_data_field, line);
   sender.open("POST", cfg_endpoint, true);
   sender.send(data);
}

function enqueue(key, line) {
   to_send.push(line);
   if (to_send.length === 1) sendHead();
}

function uploadError() { console.log(this.statusText); }

sender.addEventListener("load", sendHead);
sender.addEventListener("error", uploadError);

Pebble.addEventListener("ready", function() {
   console.log("Health Export PebbleKit JS ready!");

   cfg_endpoint = localStorage.getItem("cfgEndpoint");
   cfg_data_field = localStorage.getItem("cfgDataField");

   if (cfg_endpoint && cfg_data_field) {
      Pebble.sendAppMessage({ "lastSent": 0 });
   } else {
      Pebble.sendAppMessage({ "modalMessage": "Not configured" });
   }
});

Pebble.addEventListener("appmessage", function(e) {
   console.log('Received message: ' + JSON.stringify(e.payload));
   if (e.payload.dataKey && e.payload.dataLine) {
      enqueue(e.payload.dataKey, e.payload.dataLine);
   }
});

Pebble.addEventListener("showConfiguration", function() {
   var settings = "?v=1.0";

   if (cfg_endpoint) {
      settings += "&url=" + encodeURIComponent(cfg_endpoint);
   }
   if (cfg_data_field) {
      settings += "&data_field=" + encodeURIComponent(cfg_data_field);
   }

   Pebble.openURL("https://cdn.rawgit.com/faelys/pebble-health-export/v1.0/config.html" + settings);
});

Pebble.addEventListener("webviewclosed", function(e) {
   var configData = JSON.parse(decodeURIComponent(e.response));
   var wasConfigured = (cfg_endpoint && cfg_data_field);

   if (configData.url) {
      cfg_endpoint = configData.url;
      localStorage.setItem("cfgEndpoint", cfg_endpoint);
   }

   if (configData.dataField) {
      cfg_data_field = configData.dataField;
      localStorage.setItem("cfgDataField", cfg_data_field);
   }

   if (!wasConfigured && cfg_endpoint && cfg_data_field) {
      Pebble.sendAppMessage({ "lastSent": 0 });
   }
});
