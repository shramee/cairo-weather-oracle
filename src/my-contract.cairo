// Declare this file as a StarkNet contract.
%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin

// metric units wherever applicable
struct Weather {
    LocationKey: felt, // Accuweather location key
    Temperature_mC: felt, // microCelsius (1000mC = 1C)
    WeatherIcon: felt, // Accuweather icon ID (for classification)
    Humidty: felt,
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
func _weather( locationKey: felt ) -> Weather {
}

// Increases the balance by the given amount.
@external
func set_weather{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(weather: Weather) {
    _weather.write( weather.LocationKey, weather );
    return ();
}

// Returns the current balance.
@view
func get_weather{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(LocationKey: felt) -> Weather {
    return _weather.read(LocationKey);
}