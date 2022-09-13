import { Contract, Provider, Account, ec } from "starknet";
import accounts from "../.starknet_accounts/starknet_open_zeppelin_accounts.json" assert { type: "json" };
import abi from "./abi.json" assert { type: "json" };

const weather_contract_address =
  "0x016b1ddf92f9fe1d7af97f2d3bd7c8c4f5d31f7492819bb65dac29bd1ff6da0a";

const pk = accounts["alpha-goerli"].__default__.private_key;

export const provider = new Provider({
  sequencer: {
    network: "goerli-alpha", // or 'goerli-alpha'
  },
});

export const account = new Account(
  provider,
  process.env.ADDRESS,
  ec.getKeyPair(pk)
);

export const contract = new Contract(abi, weather_contract_address, account);
