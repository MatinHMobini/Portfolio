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
    title: "Hotel Booking Service",
    image: project1,
    description:
      "Designed and implemented a comprehensive SQL database as the core component of a hotel booking system, with a supporting web application to provide users with efficient search, booking, and reservation management functionalities.",
    technologies: ["TypeScript", "JavaScript", "PostgresSQL", "React", "Vite", "Node.js","Bootstrap", "HTML", "CSS"],
  },
  {
    title: "Cycling Club Event Management App",
    image: project2,
    description:
      "This project is a Cycling Club Event Management application built using Java and Android Studio. The app is designed to manage different types of cycling events, user accounts, and associated interactions within a cycling community.",
    technologies: ["Java", "Android Studio", "Firebase", "UML"],
  },
  {
    title: "Portfolio Website",
    image: project3,
    description:
      "My personal portfolio website showcasing projects, skills, and contact information.",
    technologies: ["JavaScript", "React", "HTML", "CSS", "Vite", "Framer Motion"],
  },
  {
    title: "House prediction Model",
    image: project4,
    description:
      "",
    technologies: ["check imports of notebook", "", "", "", ""],
  },
];

export const CONTACT = {
  address: "Ottawa, Canada ",
  phoneNo: "613-716-9175 ",
  email: "hmobinimatin@gmail.com",
};
