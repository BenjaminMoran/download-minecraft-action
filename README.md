# download-minecraft-action

This GitHub Action downloads Minecraft game JARs and Proguard deobfuscation maps
from Mojang servers. It can be used in GitHub workflows to run programs which
expect a Minecraft installation, for example, to test Minecraft mods or to run
scripts which extract data from the game files.

At this time, the action does not download libraries or assets used by
Minecraft, except those packaged in the game JARs. Sound and language files
comprise most of the absences.

> **Important**: Files downloaded by this action are the intellectual property
> of Mojang AB and its licensors. Use of these files is restricted by the
> [Minecraft End User License Agreement][eula]. In particular, the files must
> not be included in published artifacts.

## Usage

### Inputs

* **version** (_required_) – Minecraft version to download, e.g.
  `1.19.2`, `21w37a`, `1.17-pre1`. The full list of available versions is in the
  [version manifest].

* **files** (_required_) – Keys of the files to download, space-separated. The
  valid keys are `client`, `server`, `client_mappings` and `server_mappings`.
  Mappings are available only for releases since 1.14.4 and snapshots since
  21w37a. The action will fail if any key is unavailable for the chosen version.

* **destination** – Directory to download into. Defaults to.

### Outputs

* **output-paths** – Paths to the files downloaded, newline-separated, in an
  order corresponding to the input file keys. The paths will match
  `{destination}/{key}.{extension}`, where `extension` is `txt` for mappings and
  `jar` otherwise.

## Example workflow

```yaml
name: Log Minecraft size

on: workflow_dispatch

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Cache Minecraft
        id: cache-minecraft
        uses: actions/cache@v3
        with:
          path: minecraft
          key: minecraft-1.19.2-client

      - if: steps.cache-minecraft.outputs.cache-hit == 'false'
        uses: BenjaminMoran/download-minecraft-action@v1
        with:
          version: '1.19.2'
          files: client
          destination: minecraft

      - name: Log size
        run: wc -c minecraft/client.jar
```

[eula]: https://www.minecraft.net/en-us/eula
[version manifest]: https://piston-meta.mojang.com/mc/game/version_manifest_v2.json
