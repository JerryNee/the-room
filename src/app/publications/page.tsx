import { Metadata } from 'next'
import { SimpleLayout } from '@/components/layout/SimpleLayout'
import { publications } from '@/config/infoConfig'

export const metadata: Metadata = {
  title: 'Publications',
  description: 'Selected peer-reviewed work on human-computer interaction, mixed reality, and AI.',
}

export default function PublicationsPage() {
  return (
    <SimpleLayout
      title="Publications"
      intro="Selected peer-reviewed work on human-computer interaction, mixed reality, and AI."
    >
      <div className="flex flex-col gap-10 text-sm leading-relaxed">
        {publications.map((pub, index) => (
          <div key={index}>
            <p className="text-muted-foreground">
              <span className="font-medium">{index + 1}. {pub.authors}</span> ({pub.year}).
            </p>
            <p className="font-semibold">{pub.title}</p>
            <p className="italic text-muted-foreground">{pub.venue}</p>
          </div>
        ))}
      </div>
    </SimpleLayout>
  )
}
