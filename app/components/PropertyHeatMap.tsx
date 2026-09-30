"use client";

import { useMemo } from "react";

type Props = {
    location?: string;
    budget?: string;
};

type Area = {
    name: string;
    price: number;
    intensity: number;
    x: number;
    y: number;
};

const CITY_AREA_PRESETS: Record<
string,
string[]
> = {
    thrissur: [
        "Punkunnam",
        "Ayyanthole",
        "Poothole",
        "Kuriachira",
        "Ollur",
        "West Fort",
    ],

    kochi: [
        "Kakkanad",
        "Edappally",
        "Vyttila",
        "Kaloor",
        "Panampilly Nagar",
        "Kadavanthra",
    ],

    bengaluru: [
        "Indiranagar",
        "Koramangala",
        "HSR Layout",
        "Whitefield",
        "Bellandur",
        "Hebbal",
    ],

    bangalore: [
        "Indiranagar",
        "Koramangala",
        "HSR Layout",
        "Whitefield",
        "Bellandur",
        "Hebbal",
    ],

    mumbai: [
        "Andheri",
        "Bandra",
        "Powai",
        "Worli",
        "Thane",
        "Chembur",
    ],

    delhi: [
        "Dwarka",
        "Vasant Kunj",
        "Saket",
        "Rohini",
        "Greater Kailash",
        "Noida",
    ],

    hyderabad: [
        "Gachibowli",
        "Madhapur",
        "Kondapur",
        "Jubilee Hills",
        "Kukatpally",
        "Manikonda",
    ],

    chennai: [
        "Adyar",
        "OMR",
        "Velachery",
        "Anna Nagar",
        "Porur",
        "Guindy",
    ],

    pune: [
        "Kothrud",
        "Baner",
        "Wakad",
        "Hinjewadi",
        "Viman Nagar",
        "Kharadi",
    ],
};

function normalizeCity(
    location: string
) {
    return location
    .toLowerCase()
    .replace(
        /[^a-z\s]/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();
}

function getAreaNames(
    location: string
) {
    const normalized =
    normalizeCity(
        location
    );

    const match =
    Object.keys(
        CITY_AREA_PRESETS
    ).find(
        (city) =>
        normalized.includes(
            city
        )
    );

    if (match) {
        return CITY_AREA_PRESETS[
            match
        ];
    }

    const base =
    location
    .split(",")[0]
    ?.trim() ||
    "Local Market";

    return [
        `${base} Central`,
        `${base} East`,
        `${base} West`,
        `${base} North`,
        `${base} South`,
        `${base} Outer`,
    ];
}

function parseBudget(
    value?: string
) {
    if (!value) {
        return 75_00_000;
    }

    const clean =
    value
    .toLowerCase()
    .replace(
        /,/g,
        ""
    )
    .replace(
        /₹/g,
        ""
    )
    .trim();

    const number =
    parseFloat(
        clean
    );

    if (
        !Number.isFinite(
            number
        )
    ) {
        return 75_00_000;
    }

    if (
        clean.includes(
            "cr"
        ) ||
        clean.includes(
            "crore"
        )
    ) {
        return (
            number *
            1_00_00_000
        );
    }

    if (
        clean.includes(
            "lakh"
        ) ||
        clean.includes(
            "lac"
        )
    ) {
        return (
            number *
            1_00_000
        );
    }

    return number;
}

function seededNumber(
    seed: number
) {
    const x =
    Math.sin(
        seed *
        12.9898
    ) *
    43758.5453;

    return (
        x -
        Math.floor(x)
    );
}

function generateAreas(
    location: string,
    budget?: string
): Area[] {
    const names =
    getAreaNames(
        location
    );

    const budgetValue =
    parseBudget(
        budget
    );

    const seedBase =
    [...location]
    .reduce(
        (sum, char) =>
        sum +
        char.charCodeAt(
            0
        ),
        0
    );

    const positions = [
        [24, 28],
        [52, 18],
        [76, 32],
        [34, 57],
        [63, 62],
        [82, 76],
    ];

    return names.map(
        (name, index) => {
            const variation =
            0.75 +
            seededNumber(
                seedBase +
                index *
                31
            ) *
            0.5;

            const intensity =
            Math.min(
                0.97,
                Math.max(
                    0.32,
                    (
                        0.48 +
                        seededNumber(
                            seedBase +
                            index *
                            17
                        ) *
                        0.42
                    )
                )
            );

            /*
             * The lead's budget anchors the visual price range.
             * The actual value is intentionally varied by area.
             */
            const estimatedPrice =
            Math.max(
                2500,
                Math.round(
                    (
                        4500 +
                        Math.sqrt(
                            budgetValue
                        ) /
                        175
                    ) *
                    variation
                )
            );

            return {
                name,
                price:
                estimatedPrice,
                intensity,
                x:
                positions[
                    index
                ][0],
                y:
                positions[
                    index
                ][1],
            };
        }
    );
}

function formatPrice(
    price: number
) {
    return `₹${(
        price / 1000
    ).toFixed(
        1
    )}k/sq.ft`;
}

export default function PropertyHeatMap({
    location = "Bengaluru",
    budget = "",
}: Props) {
    const areas =
    useMemo(
        () =>
        generateAreas(
            location,
            budget
        ),
        [
            location,
            budget,
        ]
    );

    return (
        <section className="mt-5 pb-6">
        <div className="mb-2 flex items-end justify-between">
        <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Property Price Heat Map
        </h4>

        <p className="mt-0.5 text-[11px] text-zinc-400">
        {location}
        </p>
        </div>
        </div>

        <div className="relative h-64 overflow-hidden rounded-xl border border-zinc-200 bg-[#edf2f5]">

        {/* MAP GRID */}

        <div className="absolute inset-0 opacity-50">
        <div className="absolute left-[4%] top-[22%] h-px w-[92%] rotate-[12deg] bg-white" />

        <div className="absolute left-[6%] top-[52%] h-px w-[88%] -rotate-[8deg] bg-white" />

        <div className="absolute left-[12%] top-[76%] h-px w-[75%] rotate-[17deg] bg-white" />

        <div className="absolute left-[28%] top-[0%] h-full w-px rotate-[15deg] bg-white" />

        <div className="absolute left-[60%] top-[0%] h-full w-px -rotate-[14deg] bg-white" />

        <div className="absolute left-[81%] top-[3%] h-[96%] w-px rotate-[7deg] bg-white" />

        <div className="absolute left-[8%] top-[42%] h-20 w-32 rounded-[50%] border border-white" />

        <div className="absolute left-[57%] top-[25%] h-28 w-44 rounded-[50%] border border-white" />
        </div>

        {/* HEAT */}

        {areas.map(
            (area) => {
                const heatColor =
                area.intensity >=
                0.78
                ? "rgba(239,68,68,.72)"
                : area.intensity >=
                0.60
                ? "rgba(249,115,22,.68)"
                : "rgba(250,204,21,.62)";

                return (
                    <div
                    key={
                        area.name
                    }
                    className="absolute"
                    style={{
                        left: `${area.x}%`,
                        top: `${area.y}%`,
                    }}
                    >
                    <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                    style={{
                        width:
                        82 +
                        area.intensity *
                        30,

                        height:
                        82 +
                        area.intensity *
                        30,

                        opacity:
                        0.45 +
                        area.intensity *
                        0.35,

                        background:
                        heatColor,
                    }}
                    />

                    <div className="relative -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/70 bg-white/85 px-1.5 py-1 shadow-sm backdrop-blur">
                    <div className="text-[9px] font-bold text-zinc-700">
                    {
                        area.name
                    }
                    </div>

                    <div className="text-[9px] text-zinc-500">
                    {formatPrice(
                        area.price
                    )}
                    </div>
                    </div>
                    </div>
                );
            }
        )}

        {/* CURRENT LEAD AREA */}

        <div className="absolute bottom-3 left-3 rounded-lg border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <div className="text-[9px] font-bold uppercase tracking-wide text-indigo-500">
        Lead Location
        </div>

        <div className="text-xs font-semibold text-zinc-800">
        {location}
        </div>

        {budget && (
            <div className="text-[10px] text-zinc-500">
            Budget: {budget}
            </div>
        )}
        </div>

        {/* LEGEND */}

        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[9px] text-zinc-500 shadow-sm backdrop-blur">
        <span>
        Lower
        </span>

        <div
        className="h-2 w-20 rounded-full"
        style={{
            background:
            "linear-gradient(to right, #fde047, #fb923c, #ef4444)",
        }}
        />

        <span>
        Higher
        </span>
        </div>
        </div>
        </section>
    );
}
