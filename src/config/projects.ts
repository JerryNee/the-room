// Types
export type ProjectItemType = {
  name: string
  description: string
  link: { href: string; label: string }
  tags: string[]
  image?: string
}

export type ActivityItemType = {
  name: string
  description: string
  date: string
  location: string
  link?: string
}

// Awards
export const awardsHeadLine = "Awards & Honors"
export const awardsIntro = "Recognition for academic and professional achievements."

export const awards: Array<ActivityItemType> = [
  {
    name: 'Franz Hohn and JP Nash Scholarship',
    description: 'This award was established in 1997 by the late Gene Golub (BS Math \'53, MA Stats \'54, PhD Math \'59, Hon. DSc \'91), the Fletcher Jones Professor of CS at Stanford University. Golub established this scholarship in honor of two Illinois professors who influenced his life: Franz Hohn and John Purcell “Jack” Nash, pioneers in the field of applied and computational mathematics.',
    date: '2025',
    location: 'Champaign, IL',
  },
  {
    name: 'Dean\'s List recognition',
    description: 'Students must have successfully completed at least twelve (12) credit hours for traditional letter grades and have been within the top 20% of iSchool undergraduate students to earn this honor.',
    date: '2024-2025',
    location: 'Champaign, IL',
  },
  {
    name: 'USACO Gold Division',
    description: 'The USACO holds web-based algorithmic programming contests during the academic year, usually four total, from December through early spring, one per month.',
    date: '2021',
    location: 'US',
  },
]

// Research & Projects
export const projectHeadLine = "Projects"
export const projectIntro = "Technical projects I've worked on."

export const projects: Array<ProjectItemType> = [
  {
    name: 'Lumbar Puncture Virtual Trainer',
    description: 'This Vision Pro app offers an immersive tutorial for performing lumbar punctures, combining 3D anatomical guidance, hand tracking, and an AI instructor to simulate the procedure step by step. Designed to make primary care training more accessible and efficient.',
    link: { href: 'https://youtu.be/5bFLbc3EMJY', label: 'GitHub Cards' },
    tags: ['Xcode', 'VisionOS', 'AWS', 'Medical Training'],
    image: '/images/icon/LPVT.png'
  },
  {
    name: 'Virtual Pet',
    description: 'The heart of this experience is the Language Learning Model (LLM) that drives the intelligent interactions of the virtual companion. This technology empowers the virtual companion to engage in dynamic, meaningful conversations, learn from interactions, and offer a sense of presence and responsiveness unparalleled by conventional digital companions.',
    link: { href: 'https://www.youtube.com/watch?v=HwGdsb7OvtI&ab_channel=DuoWang', label: 'GitHub Cards' },
    tags: ['Quest3', 'Mixed Reality', 'Unity'],
    image: '/images/icon/Virtual_Pet.jpg'
  },
  {
    name: 'Empathy VR',
    description: 'Empathy VR is a Meta Quest 3 training simulation built in Unreal Engine 5 to help Police Training Institute (PTI) officers practice empathy-based de-escalation. Featuring an emotionally responsive digital human, the experience simulates high-stakes crises with adaptive dialogue and facial animations, developed in collaboration with psychologists and trainers.',
    link: { href: 'https://youtu.be/k70PPH1M1C4', label: 'GitHub Cards' },
    tags: ['Quest3', "Virtual Reality", "Unreal Engine"],
    image: '/images/icon/empathy_vr.png'
  },
  // {
  //   name: 'Place Holder',
  //   description: 'xxx',
  //   link: { href: '', label: 'GitHub Cards' },
  //   tags: ['xxx']
  // },
]

// Hobbies & Volunteer
export const activitiesHeadLine = "Hobbies & Volunteer"
export const activitiesIntro = "Personal interests and community contributions."

export const activities: Array<ActivityItemType> = [
  {
    name: 'Python Workshop',
    description:
      'Teaching basic Python programming concepts to beginners. Covering variables, control flow, and functions.',
    date: '2024-02-24',
    location: 'Shanghai',
    link: 'https://example.com/python-workshop',
  },
  {
    name: 'AI Ethics Discussion',
    description:
      'A group discussion about the ethical implications of AI development and its impact on society.',
    date: '2024-03-01',
    location: 'Shanghai',
    link: 'https://example.com/ai-ethics',
  },
  {
    name: 'Code Review Session',
    description:
      'Helping students improve their coding skills through peer code review and best practices sharing.',
    date: '2024-03-15',
    location: 'Shanghai',
  },
]
