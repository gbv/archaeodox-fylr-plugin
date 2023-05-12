# archaeoDox Fylr plugin

This plugin is part of the archaeoDox system and allows notifying an external [servicer instance](https://github.com/gbv/archaeodox-servicer) about newly created objects.

# Installation

1. Go to the Fylr plugin directory and clone this repository.

2. Load the submodule [easydb-library](https://github.com/programmfabrik/easydb-library):

```
git submodule update --init --recursive
```

3. Create translation files:

```
make
```

4. Restart Fylr
