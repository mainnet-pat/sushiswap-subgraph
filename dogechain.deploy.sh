#!/bin/bash

set -e

yarn
yarn prepare:dogechain

# "exchange" must preceed "masterchef"
for contract in "exchange" "masterchef" "bar" "blocks" "dexcandles" # "maker"  "timelock"
do
  pushd subgraphs/$contract
    rm -rf generated build
    yarn prepare:dogechain
    yarn codegen
    # yarn build
    if [[ $contract = "maker" ]]; then
      contract="sushi-maker"
    fi

    if [[ $contract = "masterchef" ]]; then
      contract="master-chef"
    fi

    graph remove --node http://localhost:8020/ dogmoneyswap/$contract
    graph create --node http://localhost:8020/ dogmoneyswap/$contract
    graph deploy --version-label v0.0.1 --node http://localhost:8020/ --ipfs http://localhost:5001 dogmoneyswap/$contract
  popd
done
