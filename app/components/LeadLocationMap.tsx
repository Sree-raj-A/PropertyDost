"use client";

type Props = {
    location: string;
    title?: string;
};

type Coordinates = {
    lat: number;
    lon: number;
    zoom: number;
};

/*
 * Demo-friendly coordinates for the locations used by the CRM.
 * These are only used to position the map.
 */
const LOCATION_COORDINATES: Record<
string,
Coordinates
> = {
    indiranagar: {
        lat: 12.9719,
        lon: 77.6412,
        zoom: 14,
    },

    koramangala: {
        lat: 12.9352,
        lon: 77.6245,
        zoom: 14,
    },

    "hsr layout": {
        lat: 12.9116,
        lon: 77.6389,
        zoom: 14,
    },

    whitefield: {
        lat: 12.9698,
        lon: 77.75,
        zoom: 13,
    },

    bellandur: {
        lat: 12.925,
        lon: 77.6762,
        zoom: 14,
    },

    hebbal: {
        lat: 13.0358,
        lon: 77.597,
        zoom: 14,
    },

    thrissur: {
        lat: 10.5276,
        lon: 76.2144,
        zoom: 13,
    },

    punkunnam: {
        lat: 10.535,
        lon: 76.2005,
        zoom: 14,
    },

    ayyanthole: {
        lat: 10.5158,
        lon: 76.1907,
        zoom: 14,
    },

    kochi: {
        lat: 9.9312,
        lon: 76.2673,
        zoom: 12,
    },

    kakkanad: {
        lat: 10.0159,
        lon: 76.3419,
        zoom: 14,
    },

    "new delhi": {
        lat: 28.6139,
        lon: 77.209,
        zoom: 12,
    },

    mumbai: {
        lat: 19.076,
        lon: 72.8777,
        zoom: 12,
    },

    hyderabad: {
        lat: 17.385,
        lon: 78.4867,
        zoom: 12,
    },

    chennai: {
        lat: 13.0827,
        lon: 80.2707,
        zoom: 12,
    },

    pune: {
        lat: 18.5204,
        lon: 73.8567,
        zoom: 12,
    },
};

function normalize(
    value: string
) {
    return value
    .toLowerCase()
    .replace(
        /[^a-z0-9\s]/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();
}

function getCoordinates(
    location: string
): Coordinates {
    const normalized =
    normalize(
        location
    );

    /*
     * Exact / substring match.
     */
    const match =
    Object.entries(
        LOCATION_COORDINATES
    ).find(
        ([name]) =>
        normalized ===
        name ||
        normalized.includes(
            name
        ) ||
        name.includes(
            normalized
        )
    );

    if (match) {
        return match[1];
    }

    /*
     * Bengaluru fallback.
     */
    if (
        normalized.includes(
            "bengaluru"
        ) ||
        normalized.includes(
            "bangalore"
        )
    ) {
        return {
            lat: 12.9716,
            lon: 77.5946,
            zoom: 12,
        };
    }

    /*
     * Kerala fallback.
     */
    if (
        normalized.includes(
            "kerala"
        )
    ) {
        return {
            lat: 10.8505,
            lon: 76.2711,
            zoom: 8,
        };
    }

    /*
     * Generic India fallback.
     */
    return {
        lat: 20.5937,
        lon: 78.9629,
        zoom: 5,
    };
}

export default function LeadLocationMap({
    location,
    title = "Customer Location",
}: Props) {
    const cleanLocation =
    location?.trim() ||
    "Bengaluru";

    const {
        lat,
        lon,
        zoom,
    } =
    getCoordinates(
        cleanLocation
    );

    /*
     * Small bounding box around the selected point.
     * This gives OpenStreetMap a useful initial viewport.
     */
    const delta =
    zoom >= 14
    ? 0.045
    : zoom >= 12
    ? 0.12
    : 0.7;

    const left =
    lon - delta;

    const right =
    lon + delta;

    const bottom =
    lat - delta;

    const top =
    lat + delta;

    const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?` +
    `bbox=${encodeURIComponent(
        `${left},${bottom},${right},${top}`
    )}` +
    `&layer=mapnik` +
    `&marker=${encodeURIComponent(
        `${lat},${lon}`
    )}`;

    const openMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        cleanLocation
    )}`;

    return (
        <section className="mt-5">
        {/* HEADER */}

        <div className="mb-2 flex items-center justify-between">
        <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Location
        </h4>

        <p className="mt-0.5 text-[11px] text-zinc-400">
        {cleanLocation}
        </p>
        </div>

        <a
        href={openMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
        Open Maps
        </a>
        </div>

        {/* MAP */}

        <div className="relative h-56 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

        <iframe
        title={`${title} location map`}
        src={mapUrl}
        width="100%"
        height="100%"
        loading="lazy"
        style={{
            border: 0,
        }}
        referrerPolicy="strict-origin-when-cross-origin"
        />

        {/* Location badge */}

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-white/80 bg-white/90 px-3 py-2 shadow-md backdrop-blur">

        <div className="text-[9px] font-bold uppercase tracking-wide text-indigo-600">
        Customer Location
        </div>

        <div className="mt-0.5 text-xs font-semibold text-zinc-800">
        {cleanLocation}
        </div>
        </div>
        </div>

        <p className="mt-1.5 text-[9px] text-zinc-400">
        Map data © OpenStreetMap contributors
        </p>
        </section>
    );
}
