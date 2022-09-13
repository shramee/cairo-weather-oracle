import _abi from "./abi.json" assert { type: "json" };
export const contract_address = '0x01f8fc9911dc05a2e60c07ddd91ff781c874606a54b350c11283ce1802a9ac3f';
export const structMembers = _abi[0].members.map( m => m.name );
export const abi = _abi;