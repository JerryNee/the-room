
// education 
export type EducationItemType = {
    school: string
    major: string
    image?: string
    logo: string
    start: string
    end: string
  }
  
  
  
  export const educationList: Array<EducationItemType> = [
    {
      school: 'University of Illinois at Urbana-Champaign',
      major: 'Computer Science & Statistics',
      logo: 'college',
      start: '2023',
      end: '2027'
    },
  ]