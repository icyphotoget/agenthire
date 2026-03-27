import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email already on waitlist' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully joined waitlist!' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
