
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
    let openHouseN = JSON.parse(JSON.stringify(openHouse));
    try {
        openHouseN.forEach(h => {
            h.startTime = get12HoursTime(h.startTime);
            h.endTime = get12HoursTime(h.endTime);

            if (h.date) {
                h.date = h.date.slice(0, 10);

                // Detect if original endTime was 24:xx:xx
                const was24HourEndTime = typeof h.endTime === "string" && h.endTime.startsWith("24:");

                const adjustTime = (timeStr) => {
                    if (typeof timeStr === "string" && timeStr.startsWith("24:")) {
                        return "00:" + timeStr.slice(3);
                    }
                    return timeStr;
                };

                h.startTime = adjustTime(h.startTime);
                h.endTime = adjustTime(h.endTime);

                if (h.startTime && h.startTime.length === 8) {
                    h.startTime = `${h.date}T${h.startTime}.000-00:00`;
                }

                if (h.endTime && h.endTime.length === 8) {
                    let endDateStr = h.date;
                    if (was24HourEndTime) {
                        let endDate = new Date(h.date);
                        endDate.setDate(endDate.getDate() + 1);
                        endDateStr = endDate.toISOString().slice(0, 10);
                    }
                    h.endTime = `${endDateStr}T${h.endTime}.000-00:00`;
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
        });
        return openHouseN;
    } catch (e) {
        console.log(e);
    }
    return openHouse;
};

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

function flattenRawArrayOfObjects(array, prefix) {
  const result  = {};

  array.forEach((unit, index) => {
    for (const [key, value] of Object.entries(unit)) {
      result[`${prefix}_${index}_${key}`] = value;
    }
  });

  return result;
}

function unflattenRawArrayOfObjects(flatObject, prefix) {
    if (!flatObject || typeof flatObject !== 'object') {
        return;
    }

    const prefixPattern = prefix + '_';
    const result = [];

    for (const key in flatObject) {
        if (!key.startsWith(prefixPattern)) continue;

        const parts = key.split('_');
        if (parts.length < 3) continue;

        const index = parseInt(parts[1], 10);
        if (isNaN(index) || index < 0) continue; // Skip invalid indices

        const field = parts.slice(2).join('_');

        if (!result[index]) {
            result[index] = {};
        }
        result[index][field] = flatObject[key];
        delete flatObject[key];
    }

    // Filter out undefined elements and assign
    if(!result.length){ return; }
    flatObject[prefix] = result.filter(item => item !== undefined);
    return flatObject;
}

module.exports = {
    mapListingsV2: mapListingsV2,
    flattenRawArrayOfObjects: flattenRawArrayOfObjects,
    unflattenRawArrayOfObjects: unflattenRawArrayOfObjects,
}

const t = {
    "mlsNumber": "NWM2232648",
    "resource": "Property:6999",
    "status": "A",
    "class": "CondoProperty",
    "type": "Sale",
    "listPrice": 390000,
    "listDate": "2024-07-06T00:00:00.000-00:00",
    "lastStatus": "New",
    "soldPrice": null,
    "soldDate": null,
    "originalPrice": 395000,
    "assignment": null,
    "address": {
        "area": "Island",
        "city": "Oak Harbor",
        "country": "US",
        "district": null,
        "majorIntersection": null,
        "neighborhood": "Oak Harbor",
        "streetDirection": null,
        "streetName": "Nunan",
        "streetNumber": "187",
        "streetSuffix": "Loop",
        "unitNumber": "2",
        "zip": "98277",
        "state": "WA",
        "communityCode": null,
        "streetDirectionPrefix": "NE",
        "addressKey": "2187nunanloopoakharbor"
    },
    "map": {
        "latitude": 48.299521,
        "longitude": -122.641205,
        "point": "POINT (-122.641205 48.299521)"
    },
    "permissions": {
        "displayAddressOnInternet": "Y",
        "displayPublic": "Y",
        "displayInternetEntireListing": "Y",
        "displayOnMap": "Y"
    },
    "images": [
        "nwmls/IMG-NWM2232648_0.jpg",
        "nwmls/IMG-NWM2232648_1.jpg",
        "nwmls/IMG-NWM2232648_2.jpg",
        "nwmls/IMG-NWM2232648_3.jpg",
        "nwmls/IMG-NWM2232648_4.jpg",
        "nwmls/IMG-NWM2232648_5.jpg",
        "nwmls/IMG-NWM2232648_6.jpg",
        "nwmls/IMG-NWM2232648_7.jpg",
        "nwmls/IMG-NWM2232648_8.jpg",
        "nwmls/IMG-NWM2232648_9.jpg",
        "nwmls/IMG-NWM2232648_10.jpg",
        "nwmls/IMG-NWM2232648_11.jpg",
        "nwmls/IMG-NWM2232648_12.jpg",
        "nwmls/IMG-NWM2232648_13.jpg",
        "nwmls/IMG-NWM2232648_14.jpg",
        "nwmls/IMG-NWM2232648_15.jpg",
        "nwmls/IMG-NWM2232648_16.jpg",
        "nwmls/IMG-NWM2232648_17.jpg",
        "nwmls/IMG-NWM2232648_18.jpg",
        "nwmls/IMG-NWM2232648_19.jpg",
        "nwmls/IMG-NWM2232648_20.jpg",
        "nwmls/IMG-NWM2232648_21.jpg",
        "nwmls/IMG-NWM2232648_22.jpg",
        "nwmls/IMG-NWM2232648_23.jpg",
        "nwmls/IMG-NWM2232648_24.jpg",
        "nwmls/IMG-NWM2232648_25.jpg",
        "nwmls/IMG-NWM2232648_26.jpg",
        "nwmls/IMG-NWM2232648_27.jpg",
        "nwmls/IMG-NWM2232648_28.jpg",
        "nwmls/IMG-NWM2232648_29.jpg",
        "nwmls/IMG-NWM2232648_30.jpg",
        "nwmls/IMG-NWM2232648_31.jpg",
        "nwmls/IMG-NWM2232648_32.jpg",
        "nwmls/IMG-NWM2232648_33.jpg",
        "nwmls/IMG-NWM2232648_34.jpg",
        "nwmls/IMG-NWM2232648_35.jpg",
        "nwmls/IMG-NWM2232648_36.jpg",
        "nwmls/IMG-NWM2232648_37.jpg",
        "nwmls/IMG-NWM2232648_38.jpg"
    ],
    "photoCount": 39,
    "details": {
        "airConditioning": "None",
        "basement1": null,
        "basement2": null,
        "centralVac": null,
        "den": null,
        "description": "Welcome home to Colonial Court, where your turn-key townhouse awaits! With 1333 sq ft, 3 bedrooms with primary on the main, & a full bathroom on each floor, there is plenty of room to call your own. Kitchen has all stainless steel appliances including new refrigerator, microwave & dishwasher, vaulted ceilings with a skylight, & counter eating space in addition to attached dining nook. Living room is spacious with cozy fireplace, sliding glass door to sunroom to patio & backyard, & french doors to primary, for easy access to rest. New carpet in living room, bedrooms, & stairway, & new laminate in upstairs bathroom. HOA mows front & backyard, with you to focus on your garden. One car garage for parking & hobby projects. Make this home yours!",
        "elevator": null,
        "exteriorConstruction1": "Wood",
        "exteriorConstruction2": null,
        "extras": null,
        "furnished": null,
        "garage": null,
        "heating": "Baseboard",
        "numBathrooms": 2,
        "numBathroomsPlus": null,
        "numBedrooms": 3,
        "numBedroomsPlus": 0,
        "numFireplaces": "1",
        "numGarageSpaces": 1,
        "numParkingSpaces": null,
        "numRooms": null,
        "numRoomsPlus": null,
        "patio": null,
        "propertyType": "Condominium",
        "sqft": "1333",
        "style": "Townhouse",
        "swimmingPool": null,
        "virtualTourUrl": "https://virtualtours.intrepidmedia360.com/s/187-NE-Nunan-Loop-Oak-Harbor-WA-98277",
        "yearBuilt": "1988",
        "landAccessType": null,
        "landSewer": null,
        "viewType": "Territorial",
        "zoningDescription": null,
        "analyticsClick": null,
        "moreInformationLink": null,
        "alternateURLVideoLink": null,
        "flooringType": "Carpet",
        "foundationType": null,
        "landscapeFeatures": null,
        "fireProtection": null,
        "roofMaterial": "Composition",
        "farmType": null,
        "zoningType": null,
        "businessType": null,
        "businessSubType": null,
        "landDisposition": null,
        "storageType": null,
        "constructionStyleSplitLevel": null,
        "constructionStatus": null,
        "loadingType": null,
        "ceilingType": null,
        "liveStreamEventURL": null,
        "energuideRating": "Insulated Windows",
        "amperage": null,
        "sewer": null,
        "familyRoom": null,
        "zoning": null,
        "driveway": null,
        "leaseTerms": null,
        "centralAirConditioning": null,
        "certificationLevel": null,
        "energyCertification": null,
        "parkCostMonthly": null,
        "commonElementsIncluded": null,
        "greenPropertyInformationStatement": null,
        "handicappedEquipped": null,
        "laundryLevel": null,
        "balcony": null,
        "numKitchens": null,
        "numKitchensPlus": null,
        "sqftRange": null,
        "numDrivewaySpaces": null,
        "HOAFee": "350",
        "HOAFee2": null,
        "HOAFee3": null,
        "waterSource": null,
        "livingAreaMeasurement": "Square Feet",
        "waterfront": null,
        "bathrooms": [],
        "numBathroomsHalf": null
    },
    "daysOnMarket": 329,
    "occupancy": null,
    "updatedOn": "2025-06-01T00:57:10.000-00:00",
    "condominium": {
        "buildingInsurance": null,
        "condoCorp": null,
        "condoCorpNum": null,
        "exposure": null,
        "lockerNumber": null,
        "locker": null,
        "parkingType": "Individual Garage, Off Street",
        "pets": "See Remarks",
        "propertyMgr": null,
        "stories": "2",
        "fees": {
            "cableInlc": null,
            "heatIncl": null,
            "hydroIncl": null,
            "maintenance": 350,
            "parkingIncl": null,
            "taxesIncl": null,
            "waterIncl": null
        },
        "lockerUnitNumber": null,
        "ensuiteLaundry": null,
        "sharesPercentage": null,
        "lockerLevel": null,
        "unitNumber": null,
        "amenities": []
    },
    "coopCompensation": "2.5",
    "lot": {
        "acres": 0.1,
        "depth": null,
        "irregular": null,
        "legalDescription": null,
        "measurement": "Square Feet",
        "width": null,
        "size": "4356",
        "source": "ICAO",
        "dimensionsSource": null,
        "dimensions": null,
        "squareFeet": 4356,
        "features": "Paved, Sidewalk",
        "taxLot": null
    },
    "nearby": {
        "amenities": [
            "Cable TV",
            "Garden Space",
            "High Speed Internet"
        ]
    },
    "office": {
        "brokerageName": "Acorn Properties, Inc"
    },
    "openHouse": [
        {
            "date": "2024-07-07",
            "startTime": "2024-07-07T21:30:00.000-00:00",
            "endTime": "2024-07-07T23:30:00.000-00:00",
            "type": "Public Open House",
            "status": null
        },
        {
            "date": "2024-09-08",
            "startTime": "2024-09-08T21:30:00.000-00:00",
            "endTime": "2024-09-08T23:00:00.000-00:00",
            "type": "Public",
            "status": null
        },
        {
            "date": "2025-01-12",
            "startTime": "2025-01-12T22:30:00.000-00:00",
            "endTime": "2025-01-12T24:30:00.000-00:00",
            "type": "Public",
            "status": null
        },
        {
            "date": "2025-05-04",
            "startTime": "2025-05-04T20:00:00.000-00:00",
            "endTime": "2025-05-04T23:00:00.000-00:00",
            "type": "Public",
            "status": null
        },
        {
            "date": "2025-05-17",
            "startTime": "2025-05-17T21:30:00.000-00:00",
            "endTime": "2025-05-17T23:30:00.000-00:00",
            "type": "Public",
            "status": null
        }
    ],
    "rooms": [
        {
            "description": "Entry Hall",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Bathroom Full",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Kitchen With Eating Space",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Living Room",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Bathroom Full",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": null
        },
        {
            "description": "Primary Bedroom",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Bedroom",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": null
        },
        {
            "description": "Bedroom",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": null
        },
        {
            "description": "Dining Room",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        },
        {
            "description": "Extra Fin Rm",
            "features": null,
            "features2": null,
            "features3": null,
            "length": null,
            "width": null,
            "level": "Main"
        }
    ],
    "taxes": {
        "annualAmount": 3166,
        "assessmentYear": "2024"
    },
    "timestamps": {
        "idxUpdated": "2025-06-01T00:57:10.000-00:00",
        "listingUpdated": "2025-06-01T00:57:10.000-00:00",
        "photosUpdated": "2025-04-25T00:51:09.000-00:00",
        "conditionalExpiryDate": null,
        "terminatedDate": null,
        "suspendedDate": null,
        "listingEntryDate": null,
        "closedDate": null,
        "unavailableDate": null,
        "expiryDate": null,
        "extensionEntryDate": null,
        "possessionDate": null,
        "repliersUpdatedOn": "2025-06-01T01:20:46.409Z"
    },
    "agents": [
        {
            "agentId": "NWM115558083",
            "boardAgentId": "NWM133509",
            "officeId": "NWM1001682",
            "updatedOn": null,
            "name": "Erin Paiz Neilon",
            "board": null,
            "boardOfficeId": "NWM9139",
            "position": null,
            "phones": [
                "360-679-4585"
            ],
            "social": [],
            "website": null,
            "photo": {
                "small": null,
                "large": null,
                "updatedOn": null
            },
            "brokerage": {
                "name": "Acorn Properties, Inc",
                "address": {
                    "address1": null,
                    "address2": null,
                    "city": null,
                    "state": null,
                    "postal": null,
                    "country": null
                }
            }
        },
        {
            "agentId": "NWM1202654",
            "boardAgentId": "NWM33858",
            "officeId": "NWM1001682",
            "updatedOn": null,
            "name": "Terri Neilon",
            "board": null,
            "boardOfficeId": "NWM9139",
            "position": null,
            "phones": [
                "360-679-4585"
            ],
            "social": [],
            "website": null,
            "photo": {
                "small": null,
                "large": null,
                "updatedOn": null
            },
            "brokerage": {
                "name": "Acorn Properties, Inc",
                "address": {
                    "address1": null,
                    "address2": null,
                    "city": null,
                    "state": null,
                    "postal": null,
                    "country": null
                }
            }
        }
    ],
    "boardId": 62,
    "simpleDaysOnMarket": 337,
    "standardStatus": "Active"
}
mapListingsV2([t])