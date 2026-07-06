// career
export type CareerItemType = {
    company: string
    title: string
    image?: string
    logo: string
    start: string
    end: string
  }
  
export const careerList: Array<CareerItemType> = [
    {
      company: 'Immersive Intelligence Summer Camp at UIUC',
      title: 'Co-founder & Curriculum Lead',
      logo: 'college',
      start: '2025.8',
      end: 'Present'
    },
    {
      company: 'Carle Illinois College of Medicine',
      title: 'XR Developer',
      logo: 'labtop',
      start: '2024.8',
      end: 'Present'
    },
    {
      company: 'University of Illinois at Urbana-Champaign',
      title: 'CS124 Course Assistant',
      logo: 'college',
      start: '2024.1',
      end: '2024.12'
    },
    {
      company: 'Atlas Copco Group',
      title: 'Data Analyst Intern',
      logo: 'labtop',
      start: '2024.5',
      end: '2024.8'
    },
    {
      company: 'WVGL',
      title: 'Software Development Intern',
      logo: 'labtop',
      start: '2021.10',
      end: '2022.12'
    }
  ]