import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return NextResponse.json({
      allowed: true
    })
  } catch {
    return NextResponse.json({
      allowed: true
    })
  }
}
