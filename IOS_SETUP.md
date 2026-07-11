# iOS Build & App Store Setup (no Mac required)

This folder is the iOS version of the Cyber Security Assessment app. It is a
Capacitor wrapper around the same HTML/JS used by the Android app, and it
uploads submissions to the same Google Drive connector. Building and signing
happens in the cloud on Codemagic (free tier: 500 Mac build minutes/month).

## What is already done

- Capacitor iOS project generated (`ios/` folder, bundle ID
  `com.pcssolutions.complianceapp`, app name "Cyber Security Assessment")
- App icons and splash screens generated from the brand shield logo
- Submissions upload directly from the app via HTTPS to the Google Apps
  Script connector (verified working), with an offline retry queue
- `codemagic.yaml` build pipeline that produces a signed IPA and submits it
  to TestFlight automatically

## One-time setup (your part, ~30 minutes)

### 1. Put this folder on GitHub
- Create a free account at https://github.com if you don't have one
- Create a new **private** repository named e.g. `cyber-security-assessment-ios`
- Push this folder to it (Claude can do this for you if you sign in with
  `gh auth login` in a terminal, or use GitHub Desktop app - drag the folder in)

### 2. App Store Connect: create the app record
- Go to https://appstoreconnect.apple.com -> My Apps -> "+" -> New App
- Platform: iOS - Name: **Cyber Security Assessment**
- Bundle ID: register/select **com.pcssolutions.complianceapp**
  (register it first at https://developer.apple.com/account/resources/identifiers if not listed)
- SKU: anything, e.g. `csa-001`

### 3. App Store Connect: create an API key (lets Codemagic sign & upload)
- App Store Connect -> Users and Access -> Integrations -> App Store Connect API
- Click "+", Name: `Codemagic`, Access: **App Manager**
- Download the `.p8` key file (only downloadable once - keep it safe)
- Note the **Key ID** and **Issuer ID** shown on that page

### 4. Codemagic: connect and build
- Sign up at https://codemagic.io (log in with GitHub)
- Add your repository
- Teams -> Personal Team -> Integrations -> Developer Portal -> connect,
  name the key **PCS_ASC_KEY** (must match codemagic.yaml), upload the `.p8`,
  enter Key ID + Issuer ID
- Start a build with the `ios-release` workflow
- When it finishes, the build appears in **TestFlight** in App Store Connect

### 5. Test and submit
- Install the TestFlight app on any iPhone, add yourself as tester, verify the app
- In App Store Connect fill the listing (description, screenshots, privacy
  policy URL - same one as Android) and submit for review

## Updating the app later

The web app files live in `www/`. After any change:
1. Commit + push to GitHub
2. Run the Codemagic workflow again (bump `CFBundleShortVersionString` /
   build number in `ios/App/App.xcodeproj` via the Codemagic build arguments,
   or ask Claude to bump it)

## Apple review note

Apple is stricter than Google about simple WebView apps ("minimum
functionality", guideline 4.2). This app has a native shell, offline retry,
and a clear business purpose, which helps - but if the review is rejected,
the usual remedy is adding small native touches (e.g. haptics, share sheet)
or distributing via TestFlight / Apple Business Manager instead. Claude can
help with either if it comes up.
