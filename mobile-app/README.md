# Photo & PDF Tools Pro Mobile

Android `26.1.0` MVP built with Expo Router, React Native, and TypeScript.

## Scripts
- `npm install`
- `npm run start`
- `npm run android`
- `npm run typecheck`

## APK Build
- Install EAS CLI: `npm install -g eas-cli`
- Login: `eas login`
- Build preview APK: `eas build --platform android --profile preview`
- Build dev APK: `eas build --platform android --profile development`

## MVP Scope
- Home
- Tools
- Recent Files
- Image to PDF
- Merge Images
- Compress Image

## Notes
- All processing stays on-device.
- The app uses a dark commercial-style UI.
- Recent files are stored locally with AsyncStorage metadata.
