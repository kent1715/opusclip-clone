# Task ID: 2 - Bug Fixes for OpusClip Clone

## Agent: Main Agent
## Task: Fix 5 bugs in the OpusClip clone project

### Work Log:

- **Fix 1: Social Login Password Mismatch (AuthModal.tsx)**
  - Changed email from timestamp-based (`${provider.toLowerCase()}_user_${Date.now()}@opusclip.app`) to deterministic format (`${provider.toLowerCase()}_user@opusclip.app`)
  - Changed password from `social_${Date.now()}` to `social_${provider.toLowerCase()}_login`
  - Extracted `socialPassword` variable for consistent use in both register and login fallback
  - Fixed `localStorage.setItem` to use `loggedInUser` instead of `data.user` (which was undefined when login fallback was used)

- **Fix 2: Pro Plan clipsLimit Inconsistency**
  - Updated `api/auth/update/route.ts` planLimits: `pro: 50` → `pro: 200`, `business: 200` → `business: 999`
  - Updated `SettingsSection.tsx` PLANS array: Pro `clipsLimit: 50` → `200`, features "50 clips per month" → "200 clips per month"
  - Updated `SettingsSection.tsx` PLANS array: Business `clipsLimit: 200` → `999`, features "200 clips per month" → "Unlimited clips"

- **Fix 3: Remove dead "process" view from AppView type (store.ts)**
  - Removed `"process"` from the AppView union type

- **Fix 4: Remove ChevronDown from Features nav link (Navbar.tsx)**
  - Removed conditional ChevronDown rendering block
  - Removed ChevronDown from lucide-react imports

- **Fix 5: Remove test credentials hint (HeroSection.tsx)**
  - Replaced admin credentials badge with simple spacer div

- Ran `bun run lint` — passed with no errors
- Dev server running and serving requests successfully

### Stage Summary:
- Social login now works on repeat visits (deterministic email + password)
- Plan limits now consistent across landing page, API, and settings (Pro=200, Business=999/Unlimited)
- Type system cleaned up (removed unused "process" view)
- Navbar Features link no longer shows misleading dropdown chevron
- Test admin credentials no longer exposed on landing page
