#!/bin/bash

set -e

yarn

for contract in "bar" # "dexcandles" "exchange" "lockup" "maker" "masterchef" "timelock" 
do
  pushd subgraphs/$contract
    yarn prepare:smartbch
    yarn codegen
    # yarn build
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