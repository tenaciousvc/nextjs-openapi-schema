import {NextRequest, NextResponse} from "next/server";
import {addMockDataEntry, getFilteredMockDataList, getMockDataList} from "@/app/mock";

export async function GET(request: NextRequest) {
    const filter = request.nextUrl.searchParams.get('title') || '';
    if(filter) {
        return NextResponse.json(
            {
                status: 200,
                filter: {
                    title: filter
                },
                data: getFilteredMockDataList(filter) },
            { status: 200 }
        )
    }

    return NextResponse.json(
        {
            status: 200,
            data: getMockDataList()
        },
        { status: 200 }
    )
}

export async function POST(_request: NextRequest, { body }: { body: Promise<{ title: string }> }) {
    const { title } = await body;

    const entry = addMockDataEntry({
        title,
        completed: false
    });

    return NextResponse.json(
        { status: 201, data: entry },
        { status: 201 }
    )
}