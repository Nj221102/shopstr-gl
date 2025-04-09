import { NextResponse } from 'next/server';

interface CreateUsernameRequest {
  username: string;
  bolt12Offer: string;
}

export async function POST(request: Request) {
  try {
    const { username, bolt12Offer } = await request.json() as CreateUsernameRequest;

    if (!username || !bolt12Offer) {
      return NextResponse.json(
        { success: false, message: 'Username and BOLT12 offer are required' },
        { status: 400 }
      );
    }

    // Format the hostname according to BIP 353
    const hostname = `${username}.user._bitcoin-payment`;
    const domain = process.env.DOMAIN!;
    
    const url = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`;
    
    // Format the content according to BIP 353
    const formattedContent = `"bitcoin:?lno=${bolt12Offer}"`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'TXT',
        name: `${hostname}.${domain}`,
        content: formattedContent,
        ttl: 3600,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.errors?.[0]?.message || 'Failed to create DNS record' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Username created successfully',
      data: {
        username: `${username}@${domain}`,
        dnsRecord: {
          id: data.result.id,
          name: data.result.name,
          type: data.result.type,
          ttl: data.result.ttl,
          created_on: data.result.created_on,
        },
      },
    });
  } catch (error) {
    console.error('Error creating username:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 