L10N_FILES = l10n/archaeodox.csv
PLUGIN_NAME = archaeodox
INSTALL_FILES = \
	$(WEB)/l10n/cultures.json \
	$(WEB)/l10n/de-DE.json \
	$(WEB)/l10n/en-US.json \

all: build

include easydb-library/tools/base-plugins.make

build: code

code: $(L10N)

clean: clean-base
