#!/bin/bash
set -x
set -eu
# set -euxo pipefail

npx truffle compile --all
npx oz push $@
npx oz publish $@
