import { Account } from 'web3-core';

export class InheritanceFundService {
	constructor(public ownerAccount: Account, public throwawayAccount: Account) {}
}
