import fetch from "node-fetch";
import fs from 'fs';
import dummyWeather from "./weather.json" assert {type: 'json'};
import { structMembers, contract_address } from './contract-data.js';
import { exec } from 'child_process';

class WeatherManager {
	// Config
	locations = [226396, 90909];
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
		return value * multiplier;
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

	processLocations() {
		this.locations.forEach(async (location) => {
			await this.processLocation(location);
		});
	}

	async processLocation(location) {
		console.log( 'Doing location ' + location )
		return;
		this.processingLocation = location;
		const weather = dummyWeather || (await this.getLocationWeather(location));
		const structArgs = this.locationMakeWeatherStruct(weather);
		console.log('Ready to deploy, ', structArgs);
		exec(
			'starknet invoke ' +
			'--address ' + contract_address + ' ' +
			'--abi abi.json ' +
			'--function setWeather ' +
			'--inputs ' + structArgs.join(' '),
			(err, stdout, stderr) => {
				if (err) {
					console.log(err)
				} else {
					console.log(`The stdout Buffer from shell: \n ${stdout.toString()}`)
				}
			}
		);
	}

	/**
	 * Gets numeric metric value from accuweather API response data point
	 * @param {string|object} value 
	 * @param {string} unit 
	 */
	getWeatherDataValue(weatherOb, keyDotNot, unit) {
		let value = keyDotNot.split('.').reduce((o, i) => o[i], weatherOb);

		if ('LocationKey' === keyDotNot) {
			return this.processingLocation;
		}
		if (value && value.Metric) {
			//{ Value: 29, Unit: 'C', UnitType: 17 } mC
			const valueData = value.Metric;
			value = this.convertUnits(valueData.Value, valueData.Unit, unit);
		}
		return value || 0;
	}

	locationMakeWeatherStruct(weather) {
		if (weather.length) {
			weather = weather[0]
		}

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
