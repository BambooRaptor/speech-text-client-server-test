# Skeleton Server for Google Speech To Text Service

## Server
1. Navigate to server root in `ts-server/test-speech-server`
2. `npm i`
3. `npm run dev`

## Flutter Client
1. Navigate to client root in `flutter-client`
2. `flutter pub get`
3. `flutter run` and select the target device (you can select the simulator from here itself)
ALTERNATIVELY
3. Use VSCode Run section to launch the app to the desired platform

NOTE: make sure the target Websocket URL in the flutter client matches the local address of the server machine, and the port matches the server port

To get the server address,
Windows: `ipconfig`
Mac: `ipconfig getifaddr en0`

