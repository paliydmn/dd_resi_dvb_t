import json

data = {
    "instance": "dd",
    "streams": [{
        "input": [
            "dvb://a0bz#pnr=54"
        ],
        "type": "spts",
        "name": "Genius exklusiv",
        "id": "a0c1",
        "enable": False
    },
        {
        "input": [
            "dvb://a0bz#pnr=61"
        ],
        "type": "spts",
        "name": "NICKELODEON AT",
        "id": "a0c3",
        "enable": False
    },
        {
        "type": "mpts",
        "provider": "test",
        "network_id": "5555",
        "sdt": [
            {
                "type": "1",
                "lcn": "6",
                "name": "DMAX Austria",
                "pnr": "73"
            },
            {
                "type": "1",
                "lcn": "7",
                "name": "tagesschau24 HD",
                "pnr": "10375"
            },
            {
                "type": "1",
                "lcn": "8",
                "name": "ProSieben",
                "pnr": "17501"
            }
        ],
        "name": "0_114_RESI DVB-C",
        "country": "GER",
        "pat_version": 26,
        "nit_actual": {
            "type": "C",
            "frequency": "114",
            "symbolrate": "6900"
        },
        "enable": False,
        "sdt_version": 26,
        "id": "a0dk",
        "input": [
            "dvb://a0bz#pnr=73",
            "dvb://a0c8#pnr=17501",
            "dvb://a0c5#pnr=10375"
        ],
        "nit_version": 26,
        "nit_other": [
            "a0db"
        ],
        "network_name": "test",
                        "offset": "+100",
                        "output": [
                            "resi://#adapter=0&device=0&frequency=114&symbolrate=6900&attenuator=0&modulation=QAM256"
        ],
        "cat_version": 26
    },
        {
        "input": [
            "dvb://a0fj#pnr=61300&cam"
        ],
        "type": "spts",
        "name": "SAT.1 HD",
        "id": "a0gr",
        "enable": False
    },
        {
        "input": [
            "dvb://a0e2#pnr=5503&cam"
        ],
        "type": "spts",
        "name": "Deluxe Music CI",
        "id": "a0gx",
        "enable": False
    },
        {
        "input": [
            "dvb://a0e2#pnr=61304&cam"
        ],
        "type": "spts",
        "name": "Pro7 MAXX HD CI",
        "id": "a0gy",
        "enable": False
    },
        {
        "input": [
            "dvb://a0fj#pnr=61304&cam"
        ],
        "type": "spts",
        "name": "Pro7 MAXX HD",
        "id": "a0gt",
        "enable": False
    },
        {
        "service_name": "rbb Berlin HD",
                        "type": "spts",
                        "id": "a0ev",
                        "service_provider": "DD",
                        "input": [
                                "dvb://a0eu#pnr=10351"
                        ],
        "name": "rbb Berlin HD",
        "service_type": "1",
                        "output": [
                            "udp://192.168.0.20:1254"
                        ],
        "enable": True
    },
        {
        "type": "mpts",
        "provider": "DD",
        "network_id": "11",
        "sdt": [
            {
                "type": "1",
                "lcn": "1",
                "name": "MDR Sachsen HD",
                "pnr": "10352"
            },
            {
                "type": "1",
                "lcn": "2",
                "name": "hr-fernsehen HD",
                "pnr": "10355"
            },
            {
                "type": "1",
                "lcn": "3",
                "name": "DMAX Austria",
                "pnr": "73"
            },
            {
                "type": "1",
                "lcn": "4",
                "name": "Nick/Comedy Central Austria",
                "pnr": "61"
            },
            {
                "type": "1",
                "lcn": "5",
                "name": "DELUXE MUSIC",
                "pnr": "65"
            }
        ],
        "name": "00 dvb-t",
        "country": "DEU",
        "pat_version": 29,
        "network_name": "DD",
                        "enable": True,
                        "sdt_version": 29,
                        "id": "a0ga",
                        "input": [
                            "dvb://a0eu#pnr=10352",
                            "dvb://a0eu#pnr=10355",
                            "dvb://a0bz#pnr=73",
            "dvb://a0bz#pnr=61",
            "dvb://a0bz#pnr=65"
        ],
        "nit_version": 29,
        "nit_other": [

        ],
        "cat_version": 29,
        "output": [
                            "udp://192.168.0.20:12340"
        ],
        "offset": "+120"
    },
        {
        "sdt_version": 30,
        "type": "mpts",
        "cat_version": 30,
        "nit_version": 30,
        "id": "a0gz",
        "provider": "DD",
        "output": [
            "udp://192.168.0.20:12360"
        ],
        "network_id": "11",
        "input": [
            "dvb://a0eu#pnr=10352",
            "dvb://a0eu#pnr=10355",
            "dvb://a0bz#pnr=73"
        ],
        "sdt": [
            {
                "type": "1",
                "lcn": "1",
                "name": "MDR Sachsen HD",
                "pnr": "10352"
            },
            {
                "type": "1",
                "lcn": "2",
                "name": "hr-fernsehen HD",
                "pnr": "10355"
            },
            {
                "type": "1",
                "lcn": "3",
                "name": "DMAX Austria",
                "pnr": "73"
            }
        ],
        "name": "01 dvb-t (clone)",
        "offset": "+120",
        "country": "DEU",
        "pat_version": 30,
        "network_name": "DD",
                        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=73"
        ],
        "type": "spts",
        "name": "DMAX Austria",
        "id": "a0gg",
        "output": [
            "udp://192.168.0.20:1260"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0eu#pnr=10355"
        ],
        "type": "spts",
        "name": "hr-fernsehen HD",
        "service_name": "hr-fernsehen HD",
                        "id": "a0ew",
                        "output": [
            "udp://192.168.0.20:1270"
        ],
        "service_type": "1",
                        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=61"
        ],
        "type": "spts",
        "name": "Nick/Comedy Central Austria",
        "service_name": "Nick/Comedy Central Austria",
                        "id": "a0h0",
                        "service_provider": "DD",
                        "output": [
            "udp://192.168.0.20:1280"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=769"
        ],
        "type": "spts",
        "name": "Channel21",
        "id": "a0gh",
        "output": [
            "udp://192.168.0.20:1290"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=774"
        ],
        "type": "spts",
        "name": "FOLX MUSIC TELEVISION",
        "id": "a0gi",
        "output": [
            "udp://192.168.0.20:1300"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=54"
        ],
        "type": "spts",
        "name": "Genius exklusiv",
        "id": "a0gc",
        "output": [
            "udp://192.168.0.20:1310"
        ],
        "enable": True
    },
        {
        "service_name": "MDR Sachsen HD",
                        "type": "spts",
                        "id": "a0h4",
                        "service_provider": "DD",
                        "input": [
                                "dvb://a0eu#pnr=10352"
                        ],
        "name": "MDR Sachsen HD",
        "service_type": "1",
                        "output": [
                            "udp://192.168.0.20:1250",
                            "udp://192.168.0.20:1249"
                        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17509"
        ],
        "type": "spts",
        "name": "kabel eins Doku",
        "id": "a0cd",
        "output": [
            "udp://192.168.0.20:1320"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17501"
        ],
        "type": "spts",
        "name": "ProSieben",
        "epg_export": "file://tmp/pros.xml",
        "id": "a0ca",
        "output": [
            "udp://192.168.0.20:1340"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17500"
        ],
        "type": "spts",
        "name": "SAT.1",
        "id": "a0c9",
        "output": [
            "udp://192.168.0.20:1350"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17505"
        ],
        "type": "spts",
        "name": "Pro7 MAXX",
        "epg_export": "file://tmp/prosiben.xml",
        "id": "a0cc",
        "_output": [
            "file:///home/dd/ts/pro7Max.ts"
        ],
        "output": [
            "udp://192.168.0.20:1330"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=73"
        ],
        "type": "spts",
        "name": "DMAX Austria",
        "id": "a0gg",
        "output": [
            "udp://192.168.0.20:1260"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0eu#pnr=10355"
        ],
        "type": "spts",
        "name": "hr-fernsehen HD",
        "service_name": "hr-fernsehen HD",
                        "id": "a0ew",
                        "output": [
            "udp://192.168.0.20:1270"
        ],
        "service_type": "1",
                        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=61"
        ],
        "type": "spts",
        "name": "Nick/Comedy Central Austria",
        "service_name": "Nick/Comedy Central Austria",
                        "id": "a0h0",
                        "service_provider": "DD",
                        "output": [
            "udp://192.168.0.20:1280"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=769"
        ],
        "type": "spts",
        "name": "Channel21",
        "id": "a0gh",
        "output": [
            "udp://192.168.0.20:1290"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=774"
        ],
        "type": "spts",
        "name": "FOLX MUSIC TELEVISION",
        "id": "a0gi",
        "output": [
            "udp://192.168.0.20:1300"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0bz#pnr=54"
        ],
        "type": "spts",
        "name": "Genius exklusiv",
        "id": "a0gc",
        "output": [
            "udp://192.168.0.20:1310"
        ],
        "enable": True
    },
        {
        "service_name": "MDR Sachsen HD",
                        "type": "spts",
                        "id": "a0h4",
                        "service_provider": "DD",
                        "input": [
                                "dvb://a0eu#pnr=10352"
                        ],
        "name": "MDR Sachsen HD",
        "service_type": "1",
                        "output": [
                            "udp://192.168.0.20:1250",
                            "udp://192.168.0.20:1249"
                        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17509"
        ],
        "type": "spts",
        "name": "kabel eins Doku",
        "id": "a0cd",
        "output": [
            "udp://192.168.0.20:1320"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17501"
        ],
        "type": "spts",
        "name": "ProSieben",
        "epg_export": "file://tmp/pros.xml",
        "id": "a0ca",
        "output": [
            "udp://192.168.0.20:1340"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17500"
        ],
        "type": "spts",
        "name": "SAT.1",
        "id": "a0c9",
        "output": [
            "udp://192.168.0.20:1350"
        ],
        "enable": True
    },
        {
        "input": [
            "dvb://a0c8#pnr=17505"
        ],
        "type": "spts",
        "name": "Pro7 MAXX",
        "epg_export": "file://tmp/prosiben.xml",
        "id": "a0cc",
        "_output": [
            "file:///home/dd/ts/pro7Max.ts"
        ],
        "output": [
            "udp://192.168.0.20:1330"
        ],
        "enable": True
    }
]}  # Add your full JSON structure here


def filter_spts_streams():
    filtered_streams = []

    for stream in data["streams"]:
        # Check if the stream type is "spts" and is enabled
        if stream.get("type") == "spts" and stream.get("enable") is True:
            # Check if there is at least one UDP URL in the output
            outputs = stream.get("output", [])
            udp_outputs = [url for url in outputs if url.startswith("udp://")]

            if udp_outputs:
                filtered_streams.append({
                    "programName": stream.get("name"),
                    "id": stream.get("id"),
                    "input": stream.get("input"),
                    "udpUrl": udp_outputs[0]
                })

                        # return [{"id": stream["id"], "program_name": stream["programName"], "udp_url": stream["udpUrl"]} for stream in data]


    return filtered_streams


# # Parse the JSON and filter streams
# filtered = filter_spts_streams(data)

# # Print filtered streams
# print(json.dumps(filtered, indent=4))
