import _abi from "./abi.json" assert { type: "json" };
export const contract_address = '0x016b1ddf92f9fe1d7af97f2d3bd7c8c4f5d31f7492819bb65dac29bd1ff6da0a';
export const structMembers = _abi[0].members.map( m => m.name );
export const abi = _abi;