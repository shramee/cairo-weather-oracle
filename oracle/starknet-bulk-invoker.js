import * as readline from 'readline';

/**
 * Calls bulk invoke commands
 */
import { exec } from 'child_process';

function execPromise(command) {
	return new Promise((res, rej) => {
		exec(
			command,
			(err, stdout, stderr) => {
				console.error(err);
				err ?
					rej(err) :
					res(stderr ? stderr : stdout)
			});
	});
}

/**
 * 
 */
export default class StarknetBulkInvoke {
	results = [];
	/**
	 * Calls all command in the array with a predicted nonce.
	 * @param {string[]} commands
	 * @param {string?} accountAddress
	 * @param {string?} accountAddress
	 */
	constructor(commands) {
		this.processInvoke(commands);
	}

	/**
	 * Gets account contract address
	 * @param {string?} account Account name
	 * @param {string} network Starknet network
	 * @returns 
	 */
	async getAccountAddress(account = '__default__', network = 'alpha-goerli') {
		const accs = await execPromise('cat ~/.starknet_accounts/starknet_open_zeppelin_accounts.json');
		if (accs) {
			const json = JSON.parse(accs);
			if (json[network] || json[network][account]) {
				// Found what we were looking for, return address
				return json[network][account].address;
			}
		}
		// Nothing found :(
		console.error(`Account details not found for account: ${account} for ${network}`);
		return '';
	}

	/**
	 * Gets nonce for the account
	 * @param {string} accountAddress 
	 * @returns {number} Nonce
	 */
	async getNonce(accountAddress) {
		return await execPromise(`starknet get_nonce --contract ${accountAddress}`);
	}

	async processInvoke(invokeCommands, index = 0) {
		const cmd = invokeCommands[index];
		console.log(`\n\nProcessing invoke ${index + 1} of ${invokeCommands.length}.`);
		let resp;
		try {
			resp = await execPromise(cmd);
		} catch(e ) {
			
		}
		if (resp.indexOf('Invoke transaction was sent.') > -1) {
			const txHash = resp
				.split('\n')
				.filter(l => l.includes('Transaction hash:'))
				.join('')
				.split(/: ?/)[1];
			this.checkInvokeTxnStatus(invokeCommands, txHash, index)
		} else {
			console.log(resp);
			index++;
			if (index < invokeCommands.length) {
				this.processInvoke(invokeCommands, index)
			}
		}
	}

	async txStatus(txHash) {
		return await execPromise(`starknet tx_status --hash ${txHash}`);
	}

	sleep(seconds) {
		return new Promise(resolve => setTimeout(resolve, seconds * 1000));
	}

	async checkInvokeTxnStatus(invokeCommands, txHash, index) {
		const cmd = invokeCommands[index];
		let timesChecked = 1;
		console.log(`Transaction hash: ${txHash}, awaiting resolve...`);
		let status = await this.txStatus(txHash);
		while (status.indexOf('"tx_status": "RECEIVED"') > -1) {
			await this.sleep(60);
			status = await this.txStatus(txHash);
		}
		console.log(status);
		const { tx_status, tx_failure_reason } = JSON.parse(status);

		if (tx_failure_reason) {
			this.results.push({ txHash, tx_status, tx_failure_reason, cmd, });
		} else {
			this.results.push({ txHash, tx_status, cmd, });
		}
		index++;
		console.log(invokeCommands.length, index);
		if (index < invokeCommands.length) {
			this.processInvoke(invokeCommands, index)
		} else {
			console.log(this.results);
		}
	}
}
