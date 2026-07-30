# Steam Game Tracker

The Game Tracker shelf is generated from Jerry's real Steam activity. The
browser never receives a Steam Web API key. Syncing merges the owned-game list
from Steam's Web API with the signed-in Steam client's local play history, so
played Family Library titles are included too. The visible shelf only includes
games with recorded playtime.

## Local sync

1. Create a key at <https://steamcommunity.com/dev/apikey>.
2. Create `.env.local` in the repository root:

   ```env
   STEAM_API_KEY=your_private_key
   STEAM_ID=76561198413462584
   STEAM_PROFILE_URL=https://steamcommunity.com/id/super_jerry001/
   ```

3. Run:

   ```bash
   npm run sync:steam
   ```

The command updates
`src/os/components/gametracker/steam-games.generated.json`. When a local Steam
client is available, it also refreshes
`src/os/components/gametracker/steam-local-games.generated.json` from
`localconfig.vdf`. That committed local snapshot preserves Family Library
history when the GitHub workflow later refreshes owned games. Without an API
key, the command uses public profile highlights plus the latest local snapshot.

Set `STEAM_LOCAL_CONFIG` only if Steam's `localconfig.vdf` is stored outside its
standard macOS, Windows, or Linux location.

## Automatic weekly sync

Add `STEAM_API_KEY` under the GitHub repository's **Settings → Secrets and
variables → Actions**. The `Sync Steam library` workflow runs every Monday and
can also be started manually from the Actions tab.

## Local library manager

Run `npm run dev` and open Game Tracker from `http://localhost:5173/os/`. The
local-only **Manage** button opens a GUI for searching the full Steam catalog,
hiding or restoring played games, and adding personal notes. **Sync Steam**
merges the Web API library and local Steam play history without opening a
terminal. **Save** writes the changes to
`src/os/components/gametracker/game-overrides.json`.

The manager and its write endpoint are disabled for non-local visitors.
Generated Steam data should not be edited by hand.
