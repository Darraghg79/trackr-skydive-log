import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Toaster } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'TrackR Skydive Log',
  description: 'Track your skydiving jumps, gear, and invoices',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TrackR',
    startupImage: [
      // ── iPhones ──────────────────────────────────────────────────────────────
      // iPhone SE 1st gen / iPod touch 5th gen (4") — 320×568 @2x
      { url: '/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png', media: '(device-width: 568px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPhone 8 / 7 / 6s / 6 / 4.7" SE — 375×667 @2x
      { url: '/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png', media: '(device-width: 667px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPhone 8 Plus / 7 Plus / 6s Plus / 6 Plus — 414×736 @3x
      { url: '/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png', media: '(device-width: 736px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone X / XS / 11 Pro / 12 mini / 13 mini — 375×812 @3x
      { url: '/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png', media: '(device-width: 812px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone XR / 11 — 414×896 @2x
      { url: '/splash_screens/iPhone_11__iPhone_XR_portrait.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_11__iPhone_XR_landscape.png', media: '(device-width: 896px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPhone XS Max / 11 Pro Max — 414×896 @3x
      { url: '/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png', media: '(device-width: 896px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 12 / 12 Pro / 13 / 13 Pro / 14 / 16e / 17e — 390×844 @3x
      { url: '/splash_screens/iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png', media: '(device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 12 Pro Max / 13 Pro Max / 14 Plus — 428×926 @3x
      { url: '/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png', media: '(device-width: 926px) and (device-height: 428px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 14 Pro / 15 / 15 Pro / 16 — 393×852 @3x
      { url: '/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png', media: '(device-width: 852px) and (device-height: 393px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus — 430×932 @3x
      { url: '/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png', media: '(device-width: 932px) and (device-height: 430px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 16 Pro / 17 / 17 Pro — 402×874 @3x
      { url: '/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_landscape.png', media: '(device-width: 874px) and (device-height: 402px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone 16 Pro Max / 17 Pro Max — 440×956 @3x
      { url: '/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape.png', media: '(device-width: 956px) and (device-height: 440px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // iPhone Air — 402×874 @3x
      { url: '/splash_screens/iPhone_Air_portrait.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash_screens/iPhone_Air_landscape.png', media: '(device-width: 874px) and (device-height: 402px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      // ── iPads ─────────────────────────────────────────────────────────────────
      // iPad Mini 8.3" — 744×1133 @2x
      { url: '/splash_screens/8.3__iPad_Mini_portrait.png', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/8.3__iPad_Mini_landscape.png', media: '(device-width: 1133px) and (device-height: 744px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad 9.7" / iPad Air 9.7" / iPad Pro 9.7" / iPad mini 7.9" — 768×1024 @2x
      { url: '/splash_screens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape.png', media: '(device-width: 1024px) and (device-height: 768px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad 10.2" — 810×1080 @2x
      { url: '/splash_screens/10.2__iPad_portrait.png', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/10.2__iPad_landscape.png', media: '(device-width: 1080px) and (device-height: 810px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Air 10.5" — 834×1112 @2x
      { url: '/splash_screens/10.5__iPad_Air_portrait.png', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/10.5__iPad_Air_landscape.png', media: '(device-width: 1112px) and (device-height: 834px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Air 10.9" — 820×1180 @2x
      { url: '/splash_screens/10.9__iPad_Air_portrait.png', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/10.9__iPad_Air_landscape.png', media: '(device-width: 1180px) and (device-height: 820px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Pro 11" / 10.5" Pro — 834×1194 @2x
      { url: '/splash_screens/11__iPad_Pro__10.5__iPad_Pro_portrait.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/11__iPad_Pro__10.5__iPad_Pro_landscape.png', media: '(device-width: 1194px) and (device-height: 834px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Pro 11" M4 — 834×1210 @2x
      { url: '/splash_screens/11__iPad_Pro_M4_portrait.png', media: '(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/11__iPad_Pro_M4_landscape.png', media: '(device-width: 1210px) and (device-height: 834px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Pro 12.9" — 1024×1366 @2x
      { url: '/splash_screens/12.9__iPad_Pro_portrait.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/12.9__iPad_Pro_landscape.png', media: '(device-width: 1366px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      // iPad Pro 13" M4 — 1032×1376 @2x
      { url: '/splash_screens/13__iPad_Pro_M4_portrait.png', media: '(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash_screens/13__iPad_Pro_M4_landscape.png', media: '(device-width: 1376px) and (device-height: 1032px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
