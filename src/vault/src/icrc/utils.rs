use candid::Principal;

use crate::Account;
use crate::Subaccount;

/// function is used for transforming an Account with subaccount None to an Account with default value for subaccount
pub fn account_transformer(account: Account) -> Account{
    if let Some(_) = account.subaccount{
        return account
    }
    Account { owner: account.owner, subaccount: Some([0; 32]) }
}

pub fn principal_to_subaccount(principal_id: &Principal) -> Subaccount {
    let mut subaccount = [0; std::mem::size_of::<Subaccount>()];
    let principal_id = principal_id.as_slice();
    subaccount[0] = principal_id.len().try_into().unwrap();
    subaccount[1..1 + principal_id.len()].copy_from_slice(principal_id);

    subaccount
}