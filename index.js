
const moment = require("moment");

function isObjectEmpty(obj) {
    for (const key in obj) {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== "") {
            return false;
        }
    }
    return true;
}
function replaceEmptyStringsWithNull(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = replaceEmptyStringsWithNull(obj[i]);
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = replaceEmptyStringsWithNull(obj[key]);
            }
        }
    } else if (obj === '') {
        return null;
    }
    return obj;
}
const toDateTimeString = (str) => {
    if (str) {
        return str.slice(0, 23) + "-00:00"
    }
    return str;
}

//return Number|null|undefined
const toNumber = (str) => {
    if (str === undefined) {
        return undefined;
    }
    if (str !== null && str !== "" && !isNaN(str)) {
        return Number(str);
    }
    return null
}
const get12HoursTime = (str) => {
    if (!str) {
        return str;
    }
    if (str && str.length === 4) {
        return str.slice(0, 2) + ":" + str.slice(2, 4) + ":00";

    }
    const hours12pattern = /(AM|PM)/i;
    if (hours12pattern.test(str)) {
        return moment(str, "hh:mm A").format("HH:mm");
    }
    const dateTimePattern = /^(\d{4}-\d{2}-\d{2}T)(\d{2}:\d{2}).*$/;
    const match = str.match(dateTimePattern);
    if (match) {
        return match[2];
    }
    return str
}
const normalizeOpenHouse = (openHouse) => {
    let openHouseN = JSON.parse(JSON.stringify(openHouse))
    try {
        openHouseN.forEach(h => {

            h.startTime = get12HoursTime(h.startTime);
            h.endTime = get12HoursTime(h.endTime);
            if (h.date) {
                h.date = h.date.slice(0, 10);
                if (h.startTime && h.startTime.length === 8) {
                    h.startTime = `${h.date}T${h.startTime}.000-00:00`
                }
                if (h.endTime && h.endTime.length === 8) {
                    h.endTime = `${h.date}T${h.endTime}.000-00:00`
                }
                if (h.startTime && h.endTime) {
                    const start = new Date(h.startTime);
                    let end = new Date(h.endTime);
                    if (end <= start) {
                        end.setDate(end.getDate() + 1);
                        h.endTime = end.toISOString().replace("Z", "-00:00");
                    }
                }
            }

        })
        return openHouseN;
    } catch (e) {
        console.log(e);
    }
    return openHouse;
}

function isDefinedAndNotNull(value) {
    return value !== undefined && value !== null;
}
const mapListingsV2 = (listing) => {
    let newList = []
    listing.forEach(listing => {
        let newListing = listing;
        if (listing.rooms) {
            const rooms = listing.rooms;
            newListing.rooms = []
            for (const key in rooms) {
                if (!isObjectEmpty(rooms[key])) {
                    newListing.rooms.push(rooms[key])
                }
            }
        }
        if (listing.openHouse) {
            const openHouse = listing.openHouse;
            newListing.openHouse = []
            for (const key in openHouse) {
                if (!isObjectEmpty(openHouse[key])) {
                    newListing.openHouse.push(openHouse[key])
                }
            }
            newListing.openHouse = normalizeOpenHouse(newListing.openHouse);
        }

        if (listing.details?.bathrooms) {
            const bathrooms = listing.details.bathrooms;
            newListing.details.bathrooms = []
            for (const key in bathrooms) {
                if (!isObjectEmpty(bathrooms[key])) {
                    newListing.details.bathrooms.push(bathrooms[key])
                }
            }
        }
        if (newListing.class === 'CondoProperty') {
            if (newListing.condominium) {
                if (newListing.condominium.ammenities) {
                    newListing.condominium.amenities = newListing.condominium.ammenities.filter(a => a);
                    delete newListing.condominium?.ammenities
                }
                if (newListing.condominium.fees) {
                    newListing.condominium.fees.maintenance = toNumber(newListing.condominium.fees.maintenance);
                }
            }
        } else {
            delete newListing.condominium
        }
        if (newListing.nearby?.ammenities) {

            newListing.nearby.amenities = newListing.nearby.ammenities.filter(a => a);
            delete newListing.nearby?.ammenities;
        }
        if (newListing.originalPrice !== undefined) {
            newListing.originalPrice = toNumber(newListing.originalPrice);
        }
        if (newListing.listPrice !== undefined) {
            newListing.listPrice = toNumber(newListing.listPrice);
        }
        if (newListing.soldPrice !== undefined) {
            newListing.soldPrice = toNumber(newListing.soldPrice);
        }
        if (newListing.details) {

            if (isDefinedAndNotNull(newListing.details.numBedrooms)) {
                newListing.details.numBedrooms = toNumber(newListing.details.numBedrooms);
            }
            if (isDefinedAndNotNull(newListing.details.numBathrooms)) {
                newListing.details.numBathrooms = toNumber(newListing.details.numBathrooms);
            }
            if (isDefinedAndNotNull(newListing.details.numKitchens)) {
                newListing.details.numKitchens = toNumber(newListing.details.numKitchens);
            }
            if (isDefinedAndNotNull(newListing.details.numKitchensPlus)) {
                newListing.details.numKitchensPlus = toNumber(newListing.details.numKitchensPlus);
            }
            if (isDefinedAndNotNull(newListing.details.numRooms)) {
                newListing.details.numRooms = toNumber(newListing.details.numRooms);
            }
            if (isDefinedAndNotNull(newListing.details.numGarageSpaces)) {
                newListing.details.numGarageSpaces = toNumber(newListing.details.numGarageSpaces);
            }
            if (isDefinedAndNotNull(newListing.details.numBathroomsPlus)) {
                newListing.details.numBathroomsPlus = toNumber(newListing.details.numBathroomsPlus);
            }
            if (isDefinedAndNotNull(newListing.details.numBedroomsPlus)) {
                newListing.details.numBedroomsPlus = toNumber(newListing.details.numBedroomsPlus);
            }
            if (isDefinedAndNotNull(newListing.details.numRoomsPlus)) {
                newListing.details.numRoomsPlus = toNumber(newListing.details.numRoomsPlus);
            }
            if (isDefinedAndNotNull(newListing.details.numParkingSpaces)) {
                newListing.details.numParkingSpaces = toNumber(newListing.details.numParkingSpaces);
            }
            if (isDefinedAndNotNull(newListing.details.numBathroomsHalf)) {
                newListing.details.numBathroomsHalf = toNumber(newListing.details.numBathroomsHalf);
            }
            if (isDefinedAndNotNull(newListing.details.numDrivewaySpaces)) {
                newListing.details.numDrivewaySpaces = toNumber(newListing.details.numDrivewaySpaces);
            }

        }
        if (newListing.taxes?.annualAmount != undefined) {
            newListing.taxes.annualAmount = toNumber(newListing.taxes.annualAmount);
        }
        if (newListing.map) {
            if (newListing.map.latitude) {
                newListing.map.latitude = toNumber(newListing.map.latitude);
            }
            if (newListing.map.longitude) {
                newListing.map.longitude = toNumber(newListing.map.longitude);
            }
        }
        if (newListing.daysOnMarket !== undefined) {
            newListing.daysOnMarket = toNumber(newListing.daysOnMarket);
        }

        if (newListing.comparables) {
            newListing.comparables = mapListingsV2(newListing.comparables);
        }
        if (newListing.history) {
            newListing.history = mapListingsV2(newListing.history);
        }
        if (newListing.timestamps) {
            for (let key in newListing.timestamps) {
                if (key !== "repliersUpdatedOn") {
                    newListing.timestamps[key] = toDateTimeString(newListing.timestamps[key])
                }
            }
        }
        if (newListing.listDate) {
            newListing.listDate = toDateTimeString(newListing.listDate);
        }
        if (newListing.soldDate) {
            newListing.soldDate = toDateTimeString(newListing.soldDate);
        }
        if (newListing.updatedOn) {
            newListing.updatedOn = toDateTimeString(newListing.updatedOn);
        }
        newList.push(replaceEmptyStringsWithNull(newListing));

    });
    return newList;
}

module.exports = {
    mapListingsV2: mapListingsV2
}