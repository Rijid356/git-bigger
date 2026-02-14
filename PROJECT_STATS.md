# Project Stats

## Overview
- **Project:** git-bigger
- **Started:** 2026-02-09
- **Last Active:** 2026-02-12
- **Tech Stack:** JavaScript, React Native, Expo SDK 54, Playwright
- **Key Dependencies:** expo-camera, expo-av, expo-file-system, expo-sharing, expo-media-library, expo-image-picker, expo-document-picker, jszip, @react-navigation/native, @react-navigation/native-stack, @react-native-async-storage/async-storage, @playwright/test

## Activity Log

| Date | Summary | Files Changed | Commits | Lines (+/-) |
|------|---------|--------------|---------|-------------|
| 2026-02-09 | Built all 6 remaining screens (AddChild, ChildProfile, Interview, InterviewReview, YearCompare, Settings), wired navigation, added header buttons, upgraded SDK 52→54, added .gitignore | 13 | 1 | +10812/-24 |
| 2026-02-09 | Auto-format birthday input (slash insertion for number-pad), added Playwright E2E test infrastructure with 9 tests, updated CLAUDE.md | 8 | 1 | +582/-79 |
| 2026-02-10 | Removed answer entry phase (video-only interviews), added 2 new questions (20→22), renamed app to Berfdayy, fixed expo-file-system SDK 54 deprecation, backward-compat for old interviews | 14 | 1 | +276/-461 |
| 2026-02-11 | Video features: flip camera icon, question timestamp tracking, playback overlay, save/share buttons, platform-specific native-modules (.web.js), fixed web build (FileSystem crash), 5 new E2E tests | 9 | 1 | +346/-32 |
| 2026-02-12 | Android build setup (expo prebuild, Gradle config, wireless ADB install to Pixel 9), transcription/enrichment components, editable answers, UI enhancements, lessons learned | 19 | 1 | +1438/-80 |
| 2026-02-12 | Friendly video filenames for share/save — ordinal formatting, temp-copy helpers, updated InterviewReviewScreen handlers | 2 | 1 | +58/-3 |
| 2026-02-12 | Profile pictures with emoji fallback + full backup with videos (zip export/import with progress UI, file picker, jszip) | 7 | 1 | +706/-15 |
| 2026-02-12 | Birthday media upload — new gallery screen with year-grouped grid, full-screen viewer, ImagePicker multi-select, storage CRUD, backup integration, profile preview strip, settings stat | 5 | 1 | +658/-2 |
| 2026-02-12 | Year-based profile restructure — replaced flat category sections with year cards, new YearDetailScreen with per-year content, getYearSummariesForChild aggregation, E2E verified | 5 | 1 | +739/-312 |

## Totals
- **Total Sessions:** 9
- **Total Commits:** 9
- **Total Files Changed:** 82
- **Total Lines Added:** 15615
- **Total Lines Removed:** 1008
