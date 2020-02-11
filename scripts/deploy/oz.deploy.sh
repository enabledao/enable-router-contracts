#!/bin/bash
set -x
set -eu
# set -euxo pipefail

npx truffle compile --all
npm run oz:push -- $@
npm run oz:publish -- $@
npm run oz:create -- Router --no-interactive $@
