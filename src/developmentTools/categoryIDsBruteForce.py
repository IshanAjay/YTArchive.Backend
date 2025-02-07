import requests
import os
import json

CONTAININGDIR = os.path.dirname(os.path.realpath(__file__))

if os.path.exists(f"{CONTAININGDIR}/../data/categoryIDs.json.lock"):
    print("Lock active and spotted at beginning! Aborting...")
    exit(0)

ytCountries = [
    "US",
    "AD",
    "AE",
    "AF",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AQ",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BT",
    "BV",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CK",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "EH",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FK",
    "FM",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GF",
    "GG",
    "GH",
    "GI",
    "GL",
    "GM",
    "GN",
    "GP",
    "GQ",
    "GR",
    "GS",
    "GT",
    "GU",
    "GW",
    "GY",
    "HK",
    "HM",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IM",
    "IN",
    "IO",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JE",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KY",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MF",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MP",
    "MQ",
    "MR",
    "MS",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NC",
    "NE",
    "NF",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NU",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PF",
    "PG",
    "PH",
    "PK",
    "PL",
    "PM",
    "PN",
    "PR",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SX",
    "SY",
    "SZ",
    "TC",
    "TD",
    "TF",
    "TG",
    "TH",
    "TJ",
    "TK",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "UM",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VG",
    "VI",
    "VN",
    "VU",
    "WF",
    "WS",
    "YE",
    "YT",
    "ZA",
    "ZM",
    "ZW",
]

dictionary = {}
categories = []

"""
def serialize(value):
    try:
        return json.dumps(value, sort_keys=True)
    except TypeError:
        raise ValueError("Value cannot be serialized")

def remove_duplicate_values(d):
    seen_values = set()
    result = {}
    
    for key, value in d.items():
        serialized_value = serialize(value)
        if serialized_value not in seen_values:
            result[key] = value
            seen_values.add(serialized_value)
    
    return result
"""

for cc in ytCountries:
    QRYURL = "https://www.googleapis.com/youtube/v3/videoCategories?key=AIzaSyCrBCOiYLOW4qxfQHavOGNxBwjRwB85Vxs&part=snippet"
    RQ = requests.get(QRYURL + "&regionCode=" + cc)
    assert RQ.ok, "RQ SC: " + RQ.status_code + "\n\n" + RQ.text
    dictionary[cc] = RQ.json()

CATLISTFULL = [
    {
        "kind": "youtube#videoCategory",
        "etag": "grPOPYEUUZN3ltuDUGEWlrTR90U",
        "id": "1",
        "snippet": {
            "title": "Film & Animation",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Q0xgUf8BFM8rW3W0R9wNq809xyA",
        "id": "2",
        "snippet": {
            "title": "Autos & Vehicles",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "qnpwjh5QlWM5hrnZCvHisquztC4",
        "id": "10",
        "snippet": {
            "title": "Music",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "HyFIixS5BZaoBdkQdLzPdoXWipg",
        "id": "15",
        "snippet": {
            "title": "Pets & Animals",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "PNU8SwXhjsF90fmkilVohofOi4I",
        "id": "17",
        "snippet": {
            "title": "Sports",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "5kFljz9YJ4lEgSfVwHWi5kTAwAs",
        "id": "18",
        "snippet": {
            "title": "Short Movies",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "ANnLQyzEA_9m3bMyJXMhKTCOiyg",
        "id": "19",
        "snippet": {
            "title": "Travel & Events",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "0Hh6gbZ9zWjnV3sfdZjKB5LQr6E",
        "id": "20",
        "snippet": {
            "title": "Gaming",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "q8Cp4pUfCD8Fuh8VJ_yl5cBCVNw",
        "id": "21",
        "snippet": {
            "title": "Videoblogging",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "cHDaaqPDZsJT1FPr1-MwtyIhR28",
        "id": "22",
        "snippet": {
            "title": "People & Blogs",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "3Uz364xBbKY50a2s0XQlv-gXJds",
        "id": "23",
        "snippet": {
            "title": "Comedy",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "0srcLUqQzO7-NGLF7QnhdVzJQmY",
        "id": "24",
        "snippet": {
            "title": "Entertainment",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "bQlQMjmYX7DyFkX4w3kT0osJyIc",
        "id": "25",
        "snippet": {
            "title": "News & Politics",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Y06N41HP_WlZmeREZvkGF0HW5pg",
        "id": "26",
        "snippet": {
            "title": "Howto & Style",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "yBaNkLx4sX9NcDmFgAmxQcV4Y30",
        "id": "27",
        "snippet": {
            "title": "Education",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Mxy3A-SkmnR7MhJDZRS4DuAIbQA",
        "id": "28",
        "snippet": {
            "title": "Science & Technology",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "p3lEirEJApyEkuWpaGEHoF-m-aA",
        "id": "29",
        "snippet": {
            "title": "Nonprofits & Activism",
            "assignable": True,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "4pIHL_AdN2kO7btAGAP1TvPucNk",
        "id": "30",
        "snippet": {
            "title": "Movies",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Iqol1myDwh2AuOnxjtn2AfYwJTU",
        "id": "31",
        "snippet": {
            "title": "Anime/Animation",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "tzhBKCBcYWZLPai5INY4id91ss8",
        "id": "32",
        "snippet": {
            "title": "Action/Adventure",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "ii8nBGYpKyl6FyzP3cmBCevdrbs",
        "id": "33",
        "snippet": {
            "title": "Classics",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Y0u9UAQCCGp60G11Arac5Mp46z4",
        "id": "34",
        "snippet": {
            "title": "Comedy",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "_YDnyT205AMuX8etu8loOiQjbD4",
        "id": "35",
        "snippet": {
            "title": "Documentary",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "eAl2b-uqIGRDgnlMa0EsGZjXmWg",
        "id": "36",
        "snippet": {
            "title": "Drama",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "HDAW2HFOt3SqeDI00X-eL7OELfY",
        "id": "37",
        "snippet": {
            "title": "Family",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "QHiWh3niw5hjDrim85M8IGF45eE",
        "id": "38",
        "snippet": {
            "title": "Foreign",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "ztKcSS7GpH9uEyZk9nQCdNujvGg",
        "id": "39",
        "snippet": {
            "title": "Horror",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "Ids1sm8QFeSo_cDlpcUNrnEBYWA",
        "id": "40",
        "snippet": {
            "title": "Sci-Fi/Fantasy",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "qhfgS7MzzZHIy_UZ1dlawl1GbnY",
        "id": "41",
        "snippet": {
            "title": "Thriller",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "TxVSfGoUyT7CJ7h7ebjg4vhIt6g",
        "id": "42",
        "snippet": {
            "title": "Shorts",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "o9w6eNqzjHPnNbKDujnQd8pklXM",
        "id": "43",
        "snippet": {
            "title": "Shows",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
    {
        "kind": "youtube#videoCategory",
        "etag": "mLdyKd0VgXKDI6GevTLBAcvRlIU",
        "id": "44",
        "snippet": {
            "title": "Trailers",
            "assignable": False,
            "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        },
    },
]
del CATLISTFULL

for cc, regionCategoryData in dictionary.items():
    for categoryData in regionCategoryData["items"]:
        categories.append(
            {
                "id": categoryData["id"],
                "title": categoryData["snippet"]["title"],
                "assignable": categoryData["snippet"]["assignable"],
                "channelID": categoryData["snippet"]["channelId"],
                "kind": categoryData["kind"],
                "etag": categoryData["etag"],
            }
        )

categories = [i for n, i in enumerate(categories) if i not in categories[:n]]

try:
    with open(f"{CONTAININGDIR}/../data/categoryIDs.json.lock", "wt") as f:
        f.write(
            "This file is a lock. While it is being written to, this file will make sure nothing can access it."
        )
except FileExistsError:
    print("Lock active and spotted before write! Aborting...")
    exit(0)

with open(f"{CONTAININGDIR}/../data/categoryIDs.json", "wt") as f:
    f.write(json.dumps({"content": categories}))

try:
    os.remove(f"{CONTAININGDIR}/../data/categoryIDs.json.lock")
except FileNotFoundError:
    pass
