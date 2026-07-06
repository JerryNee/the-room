import { Container } from '@/components/layout/Container'
import Newsletter from '@/components/home/Newsletter'
import Career from '@/components/home/Career'
import Education from '@/components/home/Education'
import SocialLinks from '@/components/home/SocialLinks'
import { headline, introduction } from '@/config/infoConfig'
import { publications } from '@/config/infoConfig'
import { getAllBlogs, type BlogType } from '@/lib/blogs'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ActivityCard } from '@/components/home/ActivityCard'
import { projectHeadLine, projectIntro, projects, publicationHeadLine, publicationIntro, techIcons } from '@/config/infoConfig'
import { awards, awardsHeadLine, awardsIntro, activities, activitiesHeadLine, activitiesIntro } from '@/config/projects'
import IconCloud from "@/components/ui/icon-cloud"
import { Award, Briefcase, Heart, FileText } from 'lucide-react'

export default async function Home() {
  let blogList = (await getAllBlogs()).slice(0, 4)

  return (
    <>
      <Container className="mt-9">
        <div className="mt-[clamp(6rem,15vh,20rem)]" />
        {/* personal info */}
        <div className="mt-8 md:mt-24 flex flex-col md:flex-row items-center gap-6">
          <div className='md:col-span-5 mt-6 md:mt-12'>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl opacity-80">
              {headline}
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              {introduction}
            </p>
            <SocialLinks className='md:mt-24'/>
          </div>
          <div className="md:col-span-7 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[420px] md:h-[420px]">
              <IconCloud iconSlugs={techIcons} />
            </div>
          </div>
        </div>

        {/* Awards */}
        <div className="mx-auto flex flex-col max-w-xl gap-6 lg:max-w-none my-4 py-8 border-t border-muted">
          <h2 className="flex flex-row items-center justify-start gap-2 text-xl font-semibold tracking-tight md:text-3xl opacity-80 mb-4">
            <Award size={28}/>
            {awardsHeadLine}
          </h2>
          <ul
            role="list"
            className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-3"
          >
            {awards.map((award) => (
              <ActivityCard key={award.name} activity={award} titleAs='h3'/>
            ))}
          </ul>
        </div>

        {/* Research & Projects */}
        <div className="mx-auto flex flex-col max-w-xl gap-6 lg:max-w-none my-4 py-8 border-t border-muted">
          <h2 className="flex flex-row items-center justify-start gap-2 text-xl font-semibold tracking-tight md:text-3xl opacity-80 mb-4">
            <Briefcase size={28}/>
            {projectHeadLine}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mb-8">
            {projectIntro}
          </p>
          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12"
          >
            {projects.map((project) => (
              <ProjectCard key={project.name} project={project} titleAs='h3'/>
            ))}
          </ul>
        </div>

        {/* Hobbies & Volunteer */}
        {/* <div className="mx-auto flex flex-col max-w-xl gap-6 lg:max-w-none my-4 py-8 border-t border-muted">
          <h2 className="flex flex-row items-center justify-start gap-2 text-xl font-semibold tracking-tight md:text-3xl opacity-80 mb-4">
            <Heart size={28}/>
            {activitiesHeadLine}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mb-8">
            {activitiesIntro}
          </p>
          <ul
            role="list"
            className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-3"
          >
            {activities.map((activity) => (
              <ActivityCard key={activity.name} activity={activity} titleAs='h3'/>
            ))}
          </ul>
        </div> */}

        {/* Publications Section */}
        <div className="mx-auto flex flex-col max-w-xl gap-6 py-8 my-8 lg:max-w-none border-t border-muted">
          <h2 className="flex flex-row items-center justify-start gap-2 text-xl font-semibold tracking-tight md:text-3xl opacity-80 mb-4">
            <FileText size={28}/>
            Publications
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mb-8">
            Selected academic conference presentations and peer-reviewed papers.
          </p>
        </div>

        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          {/* left column - Publications */}
          <div className="flex flex-col gap-8 text-sm leading-relaxed">
            {publications.map((pub, index) => (
              <div key={index}>
                <p
                  className="text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: `<span class="font-medium">${pub.authors.replace(
                      'Ni, J.',
                      '<strong>Ni, J.</strong>'
                    )}</span> (${pub.year}).`,
                  }}
                />
                <p className="font-semibold">{pub.title}</p>
                <p className="italic text-muted-foreground">{pub.venue}</p>
              </div>
            ))}
          </div>

          {/* right column */}
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            <Career />
            <Education />
          </div>
        </div>

      </Container>
    </>
  )
}
