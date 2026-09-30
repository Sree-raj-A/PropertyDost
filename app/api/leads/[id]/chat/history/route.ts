import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET(
    _req: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await params;

        const { data, error } =
        await supabaseAdmin
        .from("lead_messages")
        .select("id, role, content, created_at")
        .eq("lead_id", Number(id))
        .order("created_at", {
            ascending: true,
        });

        if (error) {
            return Response.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            messages: data ?? [],
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Failed to load history.",
            },
            { status: 500 }
        );
    }
}
