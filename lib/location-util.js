import { City, State } from "country-state-city";
import { isValid } from "date-fns";

export function createLocationSlug(city, state) {
    if(!city || !state) return "";

   const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-');

    return `${citySlug}-${stateSlug}`;
}


export function parseLocationSlug(slug) {
    if(!slug || typeof slug !== "string"){
        return {city: null, state: null, isValid: false};
    }

    const parts = slug.split("-");

    //Must have atleast 2 parts (city and state)
    if(parts.length < 2) {
        return {city: null, state: null, isValid: false};
    }

    //Parse city
    const cityName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

    //Parse state
    const stateName = parts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

    //Get all indian states...
    const indianStates = State.getStatesOfCountry("IN");
    
    //Valid state name....
    const state = indianStates.find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase()
    )

    if(!state) {
        return {city: null, state: null, isValid: false};
    }

    //Check if city exists in that state
    const cities = City.getCitiesOfState("IN", state.isoCode);

    const cityexists = cities.some(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
    )

    if(!cityexists) {
        return {city: null, state: null, isValid: false};
    }

    return {city: cityName, state: stateName, isValid: true};
}