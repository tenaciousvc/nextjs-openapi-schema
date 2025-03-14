import { NextRequest, NextResponse } from 'next/server'
import NextCors from 'nextjs-cors';

export default async function middleware(req: NextRequest, res: NextResponse) {
    await NextCors(req, res, {
        // Options
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    });
    return NextResponse.next()
}