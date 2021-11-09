#!/bin/bash

set -e

yarn
yarn prepare:smartbch

for contract in "masterchef" "bar" "exchange" "dexcandles" "maker"  "timelock"
do
  pushd subgraphs/$contract
    rm -rf generated build
    yarn prepare:smartbch
    yarn codegen
    yarn build
    if [[ $contract = "maker" ]]; then
      contract="sushi-maker"
    fi

    if [[ $contract = "masterchef" ]]; then
      contract="master-chef"
    fi

    graph create --node http://localhost:8020/ mistswap/$contract
    graph deploy --version-label v0.0.1 --node http://localhost:8020/ --ipfs http://localhost:5001 mistswap/$contract
  popd
done