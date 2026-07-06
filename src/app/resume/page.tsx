// app/resume/page.tsx
'use client'

import { Container } from '@/components/layout/Container'

export default function ResumePage() {
  return (
    <Container className="mt-12 mb-20">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 text-center dark:text-zinc-50">
        Resume
      </h1>
      <div className="w-full max-w-5xl mx-auto">
        <iframe
          src="/resume.pdf"
          title="Resume PDF"
          className="w-full h-[1200px] border rounded-lg shadow"
        />
      </div>
    </Container>
  )
}
