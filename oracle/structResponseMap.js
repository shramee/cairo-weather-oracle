import _abi from "./abi.json" assert { type: "json" };
export const structMembers = _abi[0].members.map( m => m.name );
export const abi = _abi;