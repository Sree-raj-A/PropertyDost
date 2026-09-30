import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const salespersonName =
        String(body?.salespersonName ?? "").trim();

        const salespersonLocation =
        String(body?.salespersonLocation ?? "").trim();

        const salespersonPhone =
        String(body?.salespersonPhone ?? "").trim();

        if (!salespersonName) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Salesperson name is required.",
                },
                { status: 400 }
            );
        }

        const token =
        crypto.randomUUID();

        const origin =
        new URL(request.url).origin;

        const url =
        `${origin}/customer-intake?token=${encodeURIComponent(
            token
        )}&rep=${encodeURIComponent(
            salespersonName
        )}`;

        return NextResponse.json({
            success: true,
            url,
            token,
            salesperson: {
                name: salespersonName,
                location:
                salespersonLocation,
                phone: salespersonPhone,
            },
        });
    } catch (error) {
        console.error(
            "Create intake link error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                "Unable to create customer form link.",
            },
            { status: 500 }
        );
    }
}
