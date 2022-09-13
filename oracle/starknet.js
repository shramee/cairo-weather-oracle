import fs from "fs";
import {
  Account,
  Contract,
  defaultProvider,
  ec,
  json,
  number,
} from "starknet";

import compiledContract from './account-contract.json' assert {type: 'json'};
import accounts from "../.starknet_accounts/starknet_open_zeppelin_accounts.json" assert { type: "json" };
import { abi, structMembers } from './structResponseMap.js';

const weather_contract_address = '0x016b1ddf92f9fe1d7af97f2d3bd7c8c4f5d31f7492819bb65dac29bd1ff6da0a';

const account_creds = accounts["alpha-goerli"].__default__;

console.log(`Using account ${account_creds.address}`);

const starkKeyPair = ec.genKeyPair(account_creds.private_key);
const starkKeyPub = ec.getStarkKey(starkKeyPair);

console.log( starkKeyPub, account_creds );

export const account = new Account(
	defaultProvider,
	account_creds.address,
	starkKeyPair
);

export const contract = new Contract(abi, weather_contract_address, account);


export { abi, structMembers };