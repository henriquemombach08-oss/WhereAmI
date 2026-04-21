# Field Test Checklist

Use this checklist when you can leave home and validate the alarm end-to-end on a real device.

## Before Leaving

- Confirm `.env` is present and the app starts with `npm start`.
- Enable location permissions for foreground and background access.
- Save at least one favorite destination in `Perfil`.
- Verify the alarm settings screen accepts a radius greater than `0`.
- Use `Testar alarme agora` once at home to confirm audio and vibration work.

## On The Move

- Open `Explorar` and search a full address with street number.
- Confirm the search suggestions update while typing.
- Select the correct result and verify the map recenters on it.
- Tap the favorite destination flow and confirm the target and radius are restored.
- Start proximity monitoring and confirm the dashboard shows an active state.

## Trigger Check

- Walk or drive toward the chosen location.
- Confirm the alarm triggers when entering the configured radius.
- Stop the alarm and verify the app returns to idle cleanly.
- Repeat once with fixed-time mode if you want to validate time-based triggering.
- If you are testing with an iPhone, keep the app in a state that still allows background location updates before you leave.

## Failure Signals

- Search results ignore the street number.
- The app does not react to background location updates.
- The alarm triggers repeatedly without stopping.
- The favorites list fails to load or save.
