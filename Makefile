
version=0.3.0
pkgs=lib cli cli-commonjs web-app

.PHONY: all audit license-check lint test ci i start format clean

start: all
	(cd web-app && npm run start)

clean:
	rm -f *.tgz
	rm -rf */dist
	rm -rf */node_modules

ci: opentdf-client-$(version).tgz
	for x in cli web-app; do (cd $$x && npm uninstall @opentdf/client && npm ci && npm i ../opentdf-client-$(version).tgz) || exit 1; done

i:
	(cd lib && npm i && npm pack --pack-destination ../)
	for x in cli cli-commonjs web-app; do (cd $$x && npm uninstall @opentdf/client && npm i && npm i ../opentdf-client-$(version).tgz) || exit 1; done

all: ci opentdf-client-$(version).tgz opentdf-cli-$(version).tgz opentdf-cli-commonjs-$(version).tgz opentdf-web-app-$(version).tgz

opentdf-cli-$(version).tgz: opentdf-client-$(version).tgz $(shell find cli -not -path '*/dist*' -and -not -path '*/coverage*' -and -not -path '*/node_modules*')
	(cd cli && npm ci ../opentdf-client-$(version).tgz && npm pack --pack-destination ../)

opentdf-cli-commonjs-$(version).tgz: opentdf-client-$(version).tgz $(shell find cli-commonjs -not -path '*/dist*' -and -not -path '*/coverage*' -and -not -path '*/node_modules*')
	(cd cli-commonjs && npm ci ../opentdf-client-$(version).tgz && npm pack --pack-destination ../)

opentdf-web-app-$(version).tgz: opentdf-client-$(version).tgz $(shell find web-app -not -path '*/dist*' -and -not -path '*/coverage*' -and -not -path '*/node_modules*')
	(cd web-app && npm ci ../opentdf-client-$(version).tgz && npm pack --pack-destination ../)

opentdf-client-$(version).tgz: $(shell find lib -not -path '*/dist*' -and -not -path '*/coverage*' -and -not -path '*/node_modules*')
	(cd lib && npm ci --including=dev && npm pack --pack-destination ../)

dist: $(shell find lib -not -path '*/dist*' -and -not -path '*/coverage*' -and -not -path '*/node_modules*')
	(cd lib && npm ci --including=dev && npm pack --pack-destination ../)

audit:
	for x in $(pkgs); do (cd $$x && npm audit) || exit 1; done

format license-check lint test: ci
	for x in $(pkgs); do (cd $$x && npm run $@) || exit 1; done

doc:
	cd lib && npm run doc
