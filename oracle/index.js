import fetch from "node-fetch";
import dummyWeather from "./weather.js";
import { contract } from "./starknet.js";

const env = "test"; // test or live

class WeatherManager {
  // Config
  locations = [226396, 90909];
  contractAddress = "";

  lastApikeyIndex = 0;

  apikeys;

  constructor(apikeys) {
    this.apikeys = apikeys.split("|"); // Cycles through API keys separated by a | (pipe)
    switch (env) {
      case "test":
        this.processLocation(this.locations[0]);
        break;
      default:
        setInterval(() => this.processLocations(), 4 * 60 * 60 * 1000);
    }
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
      .catch((e) => console.log(e));
  }

  processLocations() {
    this.locations.forEach(async (location) => {
      this.processLocation(location);
    });
  }

  async processLocation(location) {
    const weather = dummyWeather || (await this.getLocationWeather(location));
    // const weather = dummyWeather;
    this.locationMakeWeatherStruct(weather);
  }

  locationMakeWeatherStruct(weather) {
    console.log(weather);
    return {};
  }

  getLocationWeather(location) {
    return this._apiCall("currentconditions/v1/" + location, "details=true");
  }
}

const weatherMan = new WeatherManager(
  process.env.accuweather_apikey || "CTUI1gMAe0U9XNAXGEJRzGVFhqAAsj8M"
);

// http://dataservice.accuweather.com/currentconditions/v1/226396?apikey=CTUI1gMAe0U9XNAXGEJRzGVFhqAAsj8M&details=true"
