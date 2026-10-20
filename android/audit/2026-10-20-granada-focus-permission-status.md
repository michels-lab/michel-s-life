# GRANADA — Native Android Focus permission truth

Date: 2026-10-20 (America/Monterrey)
Repository: michels-lab/michel-s-life
Base: cf912ca9569cc1ab0f1390a397ffb65df7001c6b
Branch: granada/focus-permission-truth-20261020
Related issue: #53 (Android Focus background alarms); distinct from #134 Developer Twin and #146 merged browser bridge QA.

## Confirmed problem

The native Focus status API returned `backgroundDelivery: true` unconditionally, including when Android 13+ `POST_NOTIFICATIONS` permission was denied, app-wide notifications were disabled, or the specific OS Focus-completion channel had importance NONE. That can mislead consumers even when AlarmManager accepted a **battery-optimized inexact** alarm. `scheduled` means an OS alarm request is registered, **not** that the user can see a notification.

## Isolated functional correction

In `NativeFocusAlarm.status(context)`:
- Preserve existing `notificationsGranted` meaning (runtime permission plus app-wide notification setting), `ongoingCountdownSupported`, `activeDeadlineAt` and `precision` for compatibility.
- Independently inspect API 26+ OS completion and running channels; a user-disabled channel blocks delivery for that channel even if the app-wide notification switch is on.
- Report `backgroundDelivery` as whether the user currently permits actual Focus completion notification display, not a constant `true`.
- Report `ongoingCountdownAvailable`, `backgroundDeliveryGuaranteed: false`, and `deliveryReason` with explicit `notification-permission-disabled`, `focus-completion-channel-disabled`, or `inexact-alarm-may-be-delayed-by-battery`.
- Do not change canonical timer state, alarm scheduling, requested notification permission, mission/XP or release signature. An existing pending inexact Android alarm may remain scheduled even when delivery is blocked; caller must not interpret scheduled as delivered.

## QA limits and noninterference

Existing Android Gradle build workflow must compile this native source on the PR exact head; native Android16 install and actual OS channel/permission UI behavior are separate fail-closed gates. No device credentials are accessed, no synthetic source-only check counts as a real notification. Real signed Galaxy permission denial/channel disabling, Doze, reboot and lockscreen remain open #53. The #134 Developer Twin owns AndroidBridge.kt, Android app manifest and Gradle; none touched. #135 owns Calendar source; #138 owns native XP probe; #150 owns weekly Premium browser test. Windows native/installer/MSIX remain owner-paused; no release publication.
