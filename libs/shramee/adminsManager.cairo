%lang starknet

from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.bool import TRUE

@storage_var
func _authorizedUsers( account_address: felt, role: felt ) -> (is_authorized: felt) {
}

@external
func addAccountToRole{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
}( account_address: felt, role: felt ) {
    authManager.assertRole( 'admin' );
    return authManager._addRole( account_address, role );
}

@constructor
func constructor{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(owner_address: felt) {
    authManager._addRole( owner_address, 'admin' );
    return ();
}

namespace authManager {

    func _addRole{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
    }( account_address: felt, role: felt ) {
        return _authorizedUsers.write( account_address, role, 1 );
    }

    func _hasRole{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
    }( account_address: felt, role: felt ) -> (authorized: felt) {
        let (is_authorized) = _authorizedUsers.read( account_address, role );
        return (authorized=is_authorized);
    }

    func assertRole{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
    } (role: felt) {
        let (caller_address) = get_caller_address();
        let (authorized) = _hasRole(caller_address, role);
        with_attr error_message("AccessControl: caller is missing role {role}") {
            assert authorized = TRUE;
        }
        return ();
    }
}