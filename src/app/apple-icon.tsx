import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#3B82F6',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
        }}
      >
        {/* Parachute icon */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="35" rx="30" ry="15" fill="white" opacity="0.9" />
          <path
            d="M 20 35 Q 20 45 35 50 Q 45 55 50 55 Q 55 55 65 50 Q 80 45 80 35"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <line x1="20" y1="35" x2="45" y2="65" stroke="white" strokeWidth="1.5" />
          <line x1="35" y1="35" x2="48" y2="65" stroke="white" strokeWidth="1.5" />
          <line x1="50" y1="35" x2="50" y2="65" stroke="white" strokeWidth="1.5" />
          <line x1="65" y1="35" x2="52" y2="65" stroke="white" strokeWidth="1.5" />
          <line x1="80" y1="35" x2="55" y2="65" stroke="white" strokeWidth="1.5" />
          <circle cx="50" cy="67" r="4" fill="white" />
          <line x1="50" y1="71" x2="50" y2="82" stroke="white" strokeWidth="3" />
          <line x1="50" y1="75" x2="43" y2="80" stroke="white" strokeWidth="2.5" />
          <line x1="50" y1="75" x2="57" y2="80" stroke="white" strokeWidth="2.5" />
          <line x1="50" y1="82" x2="45" y2="90" stroke="white" strokeWidth="2.5" />
          <line x1="50" y1="82" x2="55" y2="90" stroke="white" strokeWidth="2.5" />
        </svg>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 10,
            fontFamily: 'sans-serif',
          }}
        >
          TrackR
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
