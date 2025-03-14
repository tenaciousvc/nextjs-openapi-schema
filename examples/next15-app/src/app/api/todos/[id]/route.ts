import {NextRequest, NextResponse} from "next/server";
import {deleteMockDataEntry, getMockDataEntryById, TodoEntry} from "@/app/mock";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const entry = getMockDataEntryById(id);
    if(!entry) {
        return NextResponse.json(
            { status: 404 },
            { status: 404 }
        )
    }

    return NextResponse.json(
        { status: 200, data: entry },
        { status: 200 }
    )
}

export async function PUT(_request: NextRequest, { params, body }: { params: Promise<{ id: string }>, body: Promise<Partial<Omit<TodoEntry, 'id'>>> }) {
    const { id } = await params;
    const { title, completed } = await body;

    const entry = getMockDataEntryById(id);
    if(!entry) {
        return NextResponse.json(
            { status: 404 },
            { status: 404 }
        )
    }

    if(title) entry.title = title;
    if(typeof completed === 'boolean') entry.completed = completed;

    return NextResponse.json(
        { status: 200, data: entry },
        { status: 200 }
    )
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const entry = deleteMockDataEntry(id);
    if(!entry) {
        return NextResponse.json(
            { status: 404 },
            { status: 404 }
        )
    }

    return NextResponse.json(
        { status: 200 },
        { status: 200 }
    )
}