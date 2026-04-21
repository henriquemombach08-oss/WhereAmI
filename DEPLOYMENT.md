# Deployment Notes

This project is a mobile Expo app, so the recommended production path is **EAS Build** plus **EAS Submit**.

## Recommended Path

- Build Android and iOS binaries with `eas build`.
- Submit the binaries to Google Play or App Store with `eas submit`.
- Use TestFlight or internal Google Play tracks for pre-release testing.

## Why Not Vercel

- Vercel is only useful if you export the app as a web build.
- The core product here depends on mobile APIs such as background location, task manager, vibration, and audio.
- Those features are tied to native builds, not a Vercel-hosted web app.

## Useful Commands

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

## Web Option

- If you want a web preview, export it with `npx expo export --platform web`.
- Only use a web host if the web version is a real target for the app.
- The mobile experience will still be the primary product.
