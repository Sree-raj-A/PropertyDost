"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    location: string;
    title?: string;
};

declare global {
    interface Window {
        google?: any;
    }
}

const GOOGLE_MAPS_KEY =
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function LeadLocationMap({
    location,
    title = "Customer Location",
}: Props) {
    const mapRef =
    useRef<HTMLDivElement | null>(null);

    const [mapError, setMapError] =
    useState(false);

    useEffect(() => {
        if (
            !mapRef.current ||
            !location.trim()
        ) {
            return;
        }

        let cancelled = false;

        const initializeMap = () => {
            if (
                cancelled ||
                !window.google?.maps ||
                !mapRef.current
            ) {
                return;
            }

            const geocoder =
            new window.google.maps.Geocoder();

            geocoder.geocode(
                {
                    address: location,
                },
                (
                    results: any[],
                 status: string
                ) => {
                    if (
                        cancelled ||
                        status !== "OK" ||
                        !results?.[0]
                    ) {
                        setMapError(true);
                        return;
                    }

                    const position =
                    results[0].geometry.location;

                    const map =
                    new window.google.maps.Map(
                        mapRef.current,
                        {
                            center: position,
                            zoom: 13,
                            disableDefaultUI: true,
                            zoomControl: true,
                            fullscreenControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            clickableIcons: false,
                        }
                    );

                    new window.google.maps.Marker({
                        map,
                        position,
                        title,
                    });
                }
            );
        };

        if (
            window.google?.maps
        ) {
            initializeMap();

            return () => {
                cancelled = true;
            };
        }

        if (!GOOGLE_MAPS_KEY) {
            setMapError(true);

            return () => {
                cancelled = true;
            };
        }

        const existingScript =
        document.querySelector(
            'script[data-masal-google-maps="true"]'
        );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                initializeMap
            );

            return () => {
                cancelled = true;

                existingScript.removeEventListener(
                    "load",
                    initializeMap
                );
            };
        }

        const script =
        document.createElement(
            "script"
        );

        script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
            GOOGLE_MAPS_KEY
        )}&libraries=places`;

        script.async = true;
        script.defer = true;
        script.dataset.masalGoogleMaps =
        "true";

    script.addEventListener(
        "load",
        initializeMap
    );

    script.addEventListener(
        "error",
        () => {
            setMapError(true);
        }
    );

    document.head.appendChild(
        script
    );

    return () => {
        cancelled = true;

        script.removeEventListener(
            "load",
            initializeMap
        );
    };
    }, [location, title]);

    return (
        <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
        <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Location
        </h4>

        <p className="mt-0.5 text-[11px] text-zinc-400">
        {location}
        </p>
        </div>

        <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            location
        )}`}
        target="_blank"
        rel="noreferrer"
        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
        Open Maps
        </a>
        </div>

        <div
        ref={mapRef}
        className="relative h-56 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
        >
        {mapError && (
            <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
            <div className="text-sm font-semibold text-zinc-600">
            {location}
            </div>

            <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                location
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs font-medium text-indigo-600"
            >
            View location on Google Maps
            </a>
            </div>
            </div>
        )}
        </div>
        </section>
    );
}
