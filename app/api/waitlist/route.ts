import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Nevazeci email' }, { status: 400 });
    }

    // getSupabase() je sync na clientu, async na serveru — koristimo bez await
    const supabaseAdmin = getSupabase();

    // Demo mod — vrati uspjeh bez Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Demo mod — čeka se Supabase konfiguracija',
      });
    }

    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email vec postoji' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Greska pri spremanju' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Uspjesno upisani!' });
  } catch {
    return NextResponse.json({ error: 'Server greska' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Metoda nije dozvoljena' }, { status: 405 });
}
