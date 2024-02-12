"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var speech_1 = require("@google-cloud/speech");
var express_1 = require("express");
var app = (0, express_1.default)();
var port = 3000;
var client = new speech_1.SpeechClient();
app.get('/', function (req, res) {
    res.send("Hello, World!");
});
app.get('/recognize', function (req, res) {
    var config = {
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-IN'
        },
        interimResults: true
    };
    var stream = client
        .streamingRecognize(config)
        .on('error', console.error)
        .on('data', function (data) {
        process.stdout.write(data.results[0] && data.results[0].alternatives[0]
            ? "Transcript: ".concat(data.results[0].alternatives[0].transcript)
            : '\n\nReached transcription time limit. Press Ctrl+C to exit.');
    });
});
app.listen(port, function () {
    console.log("express server listening on port ".concat(port));
});
