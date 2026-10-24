# Build 4

Expo's free iOS build allowance was exhausted after the native build completed. The final change only gives crossword letters a full-width text container, fixing clipped narrow glyphs on iOS.

The Hermes bundle was rebuilt from source commit `8bd2da2` using Node 22 and `expo export:embed --entry-file index.ts --platform ios --dev false --bytecode`. It replaced `main.jsbundle` in the completed EAS production archive. The build number was changed to 4, and the archive was signed again using the existing distribution certificate and provisioning profile. The temporary signing keychain was removed afterward.

The same bundle was installed and tested in the completed simulator binary. Its SHA-256 matches the release bundle. Native libraries and assets are unchanged. Strict recursive code-signature verification passed; EAS Submit uploaded the archive to Apple. EAS's remote build number is 4 so the next normal build will increment to 5.

See `release-status.json` for build IDs and hashes, and `validation.json` for verification. Future releases can use the normal EAS build command once the account's quota resets.
