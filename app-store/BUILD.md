# Build 4

Expo's free iOS build allowance was exhausted after the native build completed. The final change only gives crossword letters a full-width text container, fixing clipped narrow glyphs on iOS.

The Hermes bundle was rebuilt from source commit `8bd2da2` using Node 22 and `expo export:embed --entry-file index.ts --platform ios --dev false --bytecode`. It replaced `main.jsbundle` in the completed EAS production archive. The build number was changed to 4, and the archive was signed again using the existing distribution certificate and provisioning profile. The temporary signing keychain was removed afterward.

The same bundle was installed and tested in the completed simulator binary. Its SHA-256 matches the release bundle. Native libraries and assets are unchanged. Strict recursive code-signature verification passed; EAS Submit uploaded the archive to Apple. EAS's remote build number is 4 so the next normal build will increment to 5.

See `release-status.json` for build IDs and hashes, and `validation.json` for verification. Future releases can use the normal EAS build command once the account's quota resets.

# Build 5 — OpenCrossword

Source `d8404e4` renames the app to OpenCrossword and emphasizes “100% free. No ads. Just daily crosswords.” The production Hermes bundle and `CFBundleDisplayName` were updated using the same verified packaging process. The signed archive uses build number 5; EAS’s remote build number is also 5. Native libraries, dependencies, entitlements, and assets remain unchanged. Updated home screenshots were captured on iPhone and iPad.

# Build 6 — repository links

Source `212ba8c` updates the in-app support URL after the authorized repository rename to `for-real-labs/opencrossword`. The on-device name remains OpenCrossword; the App Store name is Crossword: No Ads. The release bundle was rebuilt and signed using the same process, with build number 6 also set in EAS. Six feature images combine real native captures with original fal.ai artwork. See release-status.json for the current Apple review state.

# Build 8 — full-size crosswords and Expo account

The 15×15 crossword update uses the new Expo project `58f0a11e-e3d9-4539-9549-69dd0fe8cc35` under `jjohnson5253`. The previous project remains under `jakesessiongalaxys-team`; this is a replacement build-service project, not a transfer of its history. The Apple bundle ID `com.forreallabs.dailycrossword`, Apple team, and App Store app `6826699052` are unchanged. Existing distribution credentials were reused with a new provisioning profile for this bundle.

Build 8 is a normal EAS production build. Build 7 was reserved during credentials setup but never uploaded. See `release-status.json` for the current build and Apple submission state. This app still requires native releases; OTA updates have not been enabled.
