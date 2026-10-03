# Michel's Life Privacy Policy — draft

**Draft date:** 2026-10-03  
**App:** Michel's Life  
**Developer:** Michel's Lab / Michel Duarte  
**Contact:** realmichelduarte@gmail.com

> Release note: this is a source draft, not yet the final public Play Store privacy-policy URL. Review it against the final Android build and Google Play Data safety answers before publication.

## 1. Overview

Michel's Life is a personal productivity and progress application. Most app data is stored locally on the user's device. Android users may optionally connect a Google account to synchronize Michel's Life data through Google Drive.

Michel's Life does not require a Michel's Life developer-hosted user account to use its core local features.

## 2. Information the Android app may process

### Local app information

Michel's Life may store information created or configured by the user, including items such as missions, goals, routines, progress, journal/reflection content, settings, statistics, achievements, planning information, and other Michel's Life state.

This information is used to provide the app's productivity, progress-tracking, planning, and personalization features.

### Google account information

If the user chooses to connect Google Drive synchronization, Michel's Life requests Google authorization scopes for:
- OpenID;
- the user's Google account email address;
- the Google Drive application-data folder.

The app may read the authorized Google account email address so it can identify the connected sync account in the interface and local sync metadata.

### Optional Google Drive sync data

When Google Drive sync is enabled, Michel's Life may send the user's Michel's Life backup/state data to the private Google Drive `appDataFolder` associated with that Google account.

Sync metadata may include:
- a randomly generated Michel's Life device identifier;
- device manufacturer/model-derived device name;
- app version;
- synchronization timestamps;
- synchronization action/status;
- content hashes used for change/conflict detection.

Michel's Life may also maintain a limited history of cloud backups to support conflict handling and recovery. The current Android implementation keeps up to 10 Michel's Life history backups in the app-data area.

## 3. How information is used

Information is processed only to provide Michel's Life features such as:
- storing and displaying the user's personal app state;
- tracking progress and app history;
- restoring app state;
- synchronizing state across supported Michel's Life devices when the user enables Google Drive sync;
- detecting sync changes and conflicts;
- identifying the Google account and device participating in optional synchronization.

## 4. Third-party services

The Android app uses Google services for optional account authorization and cloud synchronization, including Google Identity Services and the Google Drive API.

When the user enables these features, relevant data is transmitted to Google under the user's Google account and is also subject to Google's applicable terms and privacy practices.

The Android client also uses standard software libraries such as AndroidX WebView and OkHttp to provide the app and network functionality.

## 5. Advertising and sale of data

The current Michel's Life Android build does not include an advertising SDK in its Android dependencies.

Michel's Life does not sell user data.

If advertising, analytics, or additional third-party SDKs are added in a future version, this policy and the Google Play Data safety declaration must be reviewed and updated before that version is released.

## 6. Permissions

The current Android manifest requests:
- Internet access;
- network-state access.

The current manifest does not request location, contacts, SMS, call-log, camera, microphone, or external-storage permissions.

## 7. Data storage and retention

Local Michel's Life data remains on the device until it is changed, reset, removed through app functionality, or deleted by clearing/uninstalling the app as applicable.

When optional Google Drive synchronization is enabled, Michel's Life state and sync metadata may remain in the user's Google Drive application-data storage. Disconnecting Google authorization stops the app from using the connected account but does not by itself guarantee deletion of previously synchronized Google Drive app-data files.

Michel's Life currently limits its own cloud history-backup set to 10 history backups, deleting older Michel's Life history backups as newer ones are created. Other Michel's Life sync files may remain until they are replaced or removed through the relevant Google/app data controls.

## 8. Security

Michel's Life communicates with Google APIs over HTTPS. Google account authorization uses Google Identity Services rather than embedding a Google account password in Michel's Life.

No system can guarantee absolute security. Users should protect access to their device and Google account.

## 9. User choices

Users can use core Michel's Life features without enabling Google Drive synchronization.

Users may choose whether to authorize Google Drive synchronization. Google account access can also be reviewed or revoked through the user's Google account controls.

Before the production Play Store release, the app's final privacy-policy link and any in-app disconnect/data-management controls should be reviewed together so that the published policy accurately describes the exact release behavior.

## 10. Children's privacy

Michel's Life is a general productivity application and is not specifically designed or marketed as a children's app. The final Google Play target-audience declaration must match the intended audience and store-listing presentation.

## 11. Changes to this policy

This policy may be updated when Michel's Life changes its features, data practices, third-party services, or legal/compliance requirements. The effective date should be updated when a revised policy is published.

## 12. Contact

Questions about this privacy policy or Michel's Life data practices can be sent to:

**Michel's Lab / Michel Duarte**  
**Email:** realmichelduarte@gmail.com
