import fetch from "node-fetch";
import fs from 'fs';
import dummyWeather from "./weather.json" assert {type: 'json'};
import { structMembers, contract_address } from './contract-data.js';
import { exec } from 'child_process';
import { number } from 'starknet';
import StarknetBulkInvoke from './starknet-bulk-invoker.js';

function asciiToFelt(str) {
	if (typeof str === 'number') return str;
	var arr1 = [];
	arr1.push("0x");
	for (var n = 0, l = str.length; n < l; n++) {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return number.toFelt(arr1.join(""));
}

class WeatherManager {
	// Config
	locations = [
		'2349_poi', // Bora Bora, French polynesia
		226396, // Tokyo, Japan
		242937, // - Walvis Bay, Namibia
		328533, // - Cannich, UK
		56861, // - Destruction Bay, Canada
	];
	contractAddress = "";

	lastApikeyIndex = 0;

	apikeys;

	/** @var {string} processingLocation Location key processing currently */
	processingLocation;


	convertUnits(value, from, to) {
		/**
		 * Contains multipliers for unit conversion
		 * Strucuture: unitToConvertTo: { inputUnit: multiplier }
		 */
		const _unitConversionMultiplier = {
			mC: {
				'C': 1000,
			},
			m_h: {
				'km/h': 1000,
			},
			um: {
				'cm': 10000,
				'mm': 1000,
			},
			m: {
				'km': 1000,
			},
		};

		const multiplier = (_unitConversionMultiplier[to] && _unitConversionMultiplier[to][from]) || 1
		return Math.round(value * multiplier);
	}

	constructor(apikeys) {
		this.apikeys = apikeys.split("|"); // Cycles through API keys separated by a | (pipe)
		this.processLocations();
		setInterval(() => this.processLocations(), 60 * 60 * 4 * 1000);
	}

	getApiKey() {
		const key = this.apikeys[this.lastApikeyIndex];

		this.lastApikeyIndex++;
		if (this.lastApikeyIndex >= this.apikeys.length - 1) {
			this.lastApikeyIndex = 0;
		}

		return key;
	}

	_apiCall(endpoint, params) {
		const url = `http://dataservice.accuweather.com/${endpoint}?apikey=${this.getApiKey()}&${params}`;
		return fetch(url)
			.then((r) => r.json())
			// .then( r => fs.writeFileSync('weather.json', JSON.stringify(r)) )
			.catch((e) => console.log(e));
	}

	async processLocations() {
		const invokeCommands = [];

		for (let i = 0; i < this.locations.length; i++) {
			const location = this.locations[i];
			invokeCommands.push( await this.processLocation(location) );
		}

		new StarknetBulkInvoke( invokeCommands );
	}

	async processLocation(location) {
		this.processingLocation = location;
		let weather = await this.getLocationWeather(location);

		if (!weather) {
			return console.error(`Couldn't find data for location ${location}`);
		}

		if (weather.length) {
			weather = weather[0]
		}

		if (!weather.WeatherText) {
			return console.error(`Unrecognised data for location ${location}`, weather);
		}

		console.log(`Processing location ${location} - ${asciiToFelt(location)}`);

		const structArgs = this.locationMakeWeatherStruct(weather);

		const contract_func_args = `--address ${contract_address} --abi abi.json --function setWeather`;

		return `starknet invoke ${contract_func_args} --inputs ${structArgs.join(' ')}`;
	}

	/**
	 * Gets numeric metric value from accuweather API response data point
	 * @param {string|object} value 
	 * @param {string} unit 
	 */
	getWeatherDataValue(weatherOb, keyDotNot, unit) {
		let value = keyDotNot.split('.').reduce((o, i) => o[i], weatherOb);

		if ('LocationKey' === keyDotNot) {
			return asciiToFelt(this.processingLocation);
		}
		if (value && value.Metric) {
			//{ Value: 29, Unit: 'C', UnitType: 17 } mC
			const valueData = value.Metric;
			value = this.convertUnits(valueData.Value, valueData.Unit, unit);
		}
		return value || 0;
	}

	locationMakeWeatherStruct(weather) {
		const structDataArray = [];

		const structKeyMaps = {
			Humidity: 'RelativeHumidity',
			Humidty: 'RelativeHumidity',
			WindDirection: 'Wind.Direction.Degrees',
			WindSpeed: 'Wind.Speed',
		}

		structMembers.forEach(m => {
			// We only wanna split by first underscore
			const [key, unit] = m.replace('_', '|').split('|');
			const value = this.getWeatherDataValue(weather, structKeyMaps[key] || key, unit);
			structDataArray.push(value);
		});

		return structDataArray;
	}

	getLocationWeather(location) {
		return this._apiCall("currentconditions/v1/" + location, "details=true");
	}
}

const weatherMan = new WeatherManager(
	process.env.accuweather_apikey || "CTUI1gMAe0U9XNAXGEJRzGVFhqAAsj8M"
);
