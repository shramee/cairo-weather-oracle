// Declare this file as a StarkNet contract.
%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from shramee.adminsManager import authManager, constructor, addAccountToRole

// metric units wherever applicable
struct Weather {
    LocationKey: felt, // Accuweather location key
    EpochTime: felt,
    Temperature_mC: felt, // microCelsius (1000mC = 1C)
    WeatherIcon: felt, // Accuweather icon ID (for classification)
    Humidity: felt,
    WindDirection_deg: felt, // degrees
    WindSpeed_m_h: felt, // meter/hour ( 1000m/h = 1km/h )
    CloudCover: felt,
    PrecipitationType: felt, // Rain, Snow, Ice, Mixed or empty
    Precip1hr_um: felt, // micrometer ( 1000um = 1mm )
    Ceiling: felt, // Cloud ceiling distance
    Visibility_m: felt, // meter (1000m = 1km)
}

// Define a storage variable.
@storage_var
func _weather( locationKey: felt ) -> ( weather: Weather ) {
}

// Increases the balance by the given amount.
@external
func setWeather{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(weather: Weather) {
    authManager.assertRole( 'admin' );
    _weather.write( weather.LocationKey, weather );
    return ();
}

// Returns the current balance.
@view
func getWeather{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(LocationKey: felt) -> ( weather: Weather ) {
    return _weather.read(LocationKey);
}