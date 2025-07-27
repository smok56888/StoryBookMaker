import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToasterProvider } from "@/components/ui/toaster-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "绘本工坊 - AI绘本创作平台",
  description: "通过AI技术创造属于您的专属绘本故事",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  )
}
