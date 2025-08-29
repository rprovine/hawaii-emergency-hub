import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Fetch the image from the external camera URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HawaiiEmergencyHub/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch camera image: ${response.status}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Camera proxy error:', error);
    
    // Return a placeholder image on error
    const placeholderUrl = 'https://via.placeholder.com/640x480/1e40af/ffffff?text=Camera+Unavailable';
    const placeholderResponse = await fetch(placeholderUrl);
    const placeholderBuffer = await placeholderResponse.arrayBuffer();
    
    return new NextResponse(placeholderBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  }
}