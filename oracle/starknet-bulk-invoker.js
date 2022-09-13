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
		const resp = await execPromise(cmd);
		if (resp.indexOf('Invoke transaction was sent.') > -1) {
			const txHash = resp
				.split('\n')
				.filter(l => l.includes('Transaction hash:'))
				.join('')
				.split(/: ?/)[1];
			this.checkInvokeTxnStatus(invokeCommands, txHash, index = 0)
		} else {
			console.log(cmd);
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

	updatingLog(msg) {
		readline.clearLine(process.stdout, 0)
		readline.cursorTo(process.stdout, 0, null)
		process.stdout.write(msg);
	}

	async checkInvokeTxnStatus(invokeCommands, txHash, index) {
		const cmd = invokeCommands[index];
		let timesChecked = 1;
		let status = await this.txStatus(txHash);
		while (status.indexOf('RECEIVED')) {
			this.updatingLog(`Checked ${timesChecked++}... `)
			await this.sleep(60);
			status = await this.txStatus(txHash);
		}
		this.updatingLog(`Checked ${timesChecked}...\n`)
		const { tx_status, tx_failure_reason } = JSON.parse(status);
		console.log(`Waiting for ${txHash}.`);

		if (tx_failure_reason) {
			this.results.push({ tx_Hash, tx_status, tx_failure_reason, cmd, });
		} else {
			this.results.push({ tx_Hash, tx_status, cmd, });
		}
		index++;
		if (index < invokeCommands.length) {
			this.processInvoke(invokeCommands, index)
		} else {
			console.table(this.results);
		}
	}
}
