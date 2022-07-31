import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  FACTORY_ADDRESS, // mist factory
  SUSHISWAP_WETH_USDT_PAIR_ADDRESS, // wbch/flexusd
  SUSHI_TOKEN_ADDRESS, // mist
  SUSHI_USDT_PAIR_ADDRESS, // mist/flexusd
  UNISWAP_SUSHI_ETH_PAIR_FIRST_LIQUDITY_BLOCK, // mist/wbch
  USDT_ADDRESS, // flexusd
  WETH_ADDRESS, // wbch
  MISTSWAP_WBCH_BCUSDT_FIRST_LIQUIDITY_BLOCK,
  MISTSWAP_WBCH_BCUSDT_PAIR_ADDRESS,
  MISTSWAP_WBCH_FLEXUSD_PAIR_ADDRESS
} from "const";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { Factory as FactoryContract } from "exchange/generated/Factory/Factory";
import { Pair as PairContract } from "exchange/generated/Factory/Pair";

export function getUSDRate(token: Address, block: ethereum.Block): BigDecimal {
  const address = block.number.lt(MISTSWAP_WBCH_BCUSDT_FIRST_LIQUIDITY_BLOCK) ?
    MISTSWAP_WBCH_FLEXUSD_PAIR_ADDRESS :
    MISTSWAP_WBCH_BCUSDT_PAIR_ADDRESS;

  const tokenPriceETH = getEthRate(token, block);

  const pair = PairContract.bind(address);

  const reserves = pair.getReserves();

  const reserve0 = reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18);

  const reserve1 = reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18);

  const ethPriceUSD = reserve1
    .div(reserve0);

  return ethPriceUSD.times(tokenPriceETH);
}

export function getEthRate(token: Address, block: ethereum.Block): BigDecimal {
  let eth = BIG_DECIMAL_ONE;

  if (token != WETH_ADDRESS) {
    const factory = FactoryContract.bind(
      FACTORY_ADDRESS
    );

    const address = factory.getPair(token, WETH_ADDRESS);

    if (address == ADDRESS_ZERO) {
      log.info("Adress ZERO...", []);
      return BIG_DECIMAL_ZERO;
    }

    const pair = PairContract.bind(address);

    const reserves = pair.getReserves();

    eth =
      pair.token0() == WETH_ADDRESS
        ? reserves.value0
            .toBigDecimal()
            .times(BIG_DECIMAL_1E18)
            .div(reserves.value1.toBigDecimal())
        : reserves.value1
            .toBigDecimal()
            .times(BIG_DECIMAL_1E18)
            .div(reserves.value0.toBigDecimal());

    return eth.div(BIG_DECIMAL_1E18);
  }

  return eth;
}

export function getSushiPrice(block: ethereum.Block): BigDecimal {
  if (block.number.lt(UNISWAP_SUSHI_ETH_PAIR_FIRST_LIQUDITY_BLOCK)) {
    // If before uniswap sushi-eth pair creation and liquidity added, return zero
    return BIG_DECIMAL_ZERO;
  } else if (block.number.lt(BigInt.fromI32(989687))) {
    // Else if before uniswap sushi-usdt (mist-flexusd) pair creation (get price from eth sushi-eth pair above)
    return getUSDRate(SUSHI_TOKEN_ADDRESS, block);
  } else {
    // Else get price from sushi usdt (mist - flexusd) pair depending on space-time
    const pair = PairContract.bind(
      SUSHI_USDT_PAIR_ADDRESS // (mist - flexusd pair)
    );
    const reserves = pair.getReserves();
    return reserves.value1
      .toBigDecimal()
      .div(reserves.value0.toBigDecimal());
  }
}
