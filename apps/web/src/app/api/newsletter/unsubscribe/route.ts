import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: false })
      .eq('unsubscribe_token', token);

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    // Redirect to confirmation page
    const url = request.nextUrl.clone();
    url.pathname = '/es/unsubscribe';
    url.searchParams.delete('token');
    url.searchParams.set('success', 'true');
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Exception unsubscribing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
