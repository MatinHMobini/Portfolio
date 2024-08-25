import project1 from "../assets/projects/project-1.jpg";
import project2 from "../assets/projects/project-2.jpg";
import project3 from "../assets/projects/project-3.jpg";
import project4 from "../assets/projects/project-4.jpg";

export const HERO_CONTENT = `I am a passionate developer with a knack for Problem Solving and Team-Work. With 5+ years of  experience, I have honed my skills in Topics related to Artificial Intelligence, Web Development and Android Development.`;

export const ABOUT_TEXT = `
Greetings! I'm Matin Mobini, a Honours Computer Science student at the University of Ottawa with a GPA of 3.9 (4.0 scale). 
As a Website Developer at a upcoming startup called CrisperMe, I managed server maintenance and I also played a key role in frontend development, including the implementation of new features and enhancements to the company website, such as optimizing user interfaces, improving navigation menus, and integrating interactive components. Additionally, I contributed to the backend development such as data gathering/management with use of tools such as MySql.
Proficient in Java, Python, JavaScript, HTML, SQL, GoLang, Prolog, and Scheme. I've successfully applied these skills in projects like CrisperMe and various personal/university projects available on my GitHub.
My academic achievements include making the Dean's Honour List and receiving a Merit Scholarship, reflecting my commitment to excellence.
`;
 


//My versatility extends to roles at Shoppers Drug Mart, where I've served as a Supervisor with a focus on communication and teamwork.


export const EXPERIENCES = [
  {
    year: "2022 - 2023",
    role: "Website Developer",
    company: "Upcoming Startup: CrisperMe",
    description: `I oversaw server maintenance and I played a pivotal role in frontend development, implementing new features and enhancements to the company website, such as optimizing user interfaces, refining navigation menus, and integrating interactive components. Additionally, I also contributed to backend development, including data collection and management using MySQL.`,
    technologies: ["Java", "Pyton", "JavaScript", "Node.js", "HTML", "SQL", "TypeScript", "XAMPP", "MySQL", "GitLab/Github"],
  },
  {
    year: "2022 - Ongoing",
    role: "Retail Supervisor",
    company: "Shoppers Drug Mart",
    description: `
    • Customer Service & Assistance
    • Supervising
    • Restocking & Organization`,
    technologies: ["Communication", "Teamwork", "Customer Service", "Organization Skills"],
  },
];

export const PROJECTS = [
  {
    title: "E-Commerce Website",
    image: project1,
    description:
      "A fully functional e-commerce website with features like product listing, shopping cart, and user authentication.",
    technologies: ["HTML", "CSS", "React", "Node.js", "MongoDB"],
  },
  {
    title: "Task Management App",
    image: project2,
    description:
      "An application for managing tasks and projects, with features such as task creation, assignment, and progress tracking.",
    technologies: ["HTML", "CSS", "Angular", "Firebase"],
  },
  {
    title: "Portfolio Website",
    image: project3,
    description:
      "A personal portfolio website showcasing projects, skills, and contact information.",
    technologies: ["HTML", "CSS", "React", "Bootstrap"],
  },
  {
    title: "Blogging Platform",
    image: project4,
    description:
      "A platform for creating and publishing blog posts, with features like rich text editing, commenting, and user profiles.",
    technologies: ["HTML", "CSS", "Vue.js", "Express", "mySQL"],
  },
];

export const CONTACT = {
  address: "Ottawa, Canada ",
  phoneNo: "613-716-9175 ",
  email: "hmobinimatin@gmail.com",
};
