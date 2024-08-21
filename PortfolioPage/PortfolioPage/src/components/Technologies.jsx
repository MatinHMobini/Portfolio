import React, { useState } from 'react';
import { RiReactjsLine } from "react-icons/ri";
import { IoLogoJavascript } from "react-icons/io5";
import { BiLogoPostgresql } from "react-icons/bi";
import { DiProlog } from "react-icons/di";
import { SiGo, SiVite, SiExpress, SiFirebase, SiTypescript, SiAndroidstudio, SiCplusplus, SiVisualstudiocode, SiGit, SiEclipseide, SiIntellijidea, SiRacket, SiUml } from "react-icons/si"; 
import { FaNode } from "react-icons/fa6";
import { FaJava, FaPython, FaHtml5, FaCss3Alt, FaFilePowerpoint, FaFileWord, FaFileExcel } from "react-icons/fa";
import { SiLibreoffice } from "react-icons/si";
import { SiJupyter } from "react-icons/si";
import { TbSql } from "react-icons/tb";
import './Technologies.css'; // Importing custom CSS file for animations
import { motion } from 'framer-motion';


const Technologies = () => {
  const [filter, setFilter] = useState('All');

  const allIcons = [
    { icon: <FaPython className="text-5xl text-yellow-400" />, label: "Python", category: "Languages" },
    { icon: <FaJava className="text-5xl text-red-600" />, label: "Java", category: "Languages" },
    { icon: <FaNode className="text-5xl text-green-500" />, label: "Node.js", category: "Other Tools" },
    { icon: <SiCplusplus className="text-5xl text-yellow-400" />, label: "C++", category: "Languages" },
    { icon: <RiReactjsLine className="text-5xl text-cyan-400" />, label: "React", category: "Other Tools" },
    { icon: <IoLogoJavascript className="text-5xl text-yellow-500" />, label: "JavaScript", category: "Languages" },
    { icon: <SiTypescript className="text-5xl text-blue-500" />, label: "TypeScript", category: "Languages" },
    { icon: <BiLogoPostgresql className="text-5xl text-blue-500" />, label: "PostgreSQL", category: "Other Tools" },
    { icon: <DiProlog className="text-5xl text-blue-600" />, label: "Prolog", category: "Languages" },
    { icon: <SiGo className="text-5xl text-teal-500" />, label: "Go", category: "Languages" },
    { icon: <FaHtml5 className="text-5xl text-orange-500" />, label: "HTML5", category: "Languages" },
    { icon: <FaCss3Alt className="text-5xl text-blue-600" />, label: "CSS3", category: "Languages" },
    { icon: <SiExpress className="text-5xl text-grey" />, label: "Express.js", category: "Other Tools" },
    { icon: <SiVite className="text-5xl text-purple-500" />, label: "Vite", category: "Other Tools" },
    { icon: <TbSql className="text-5xl text-blue-400" />, label: "SQL", category: "Languages" },
    { icon: <SiFirebase className="text-5xl text-yellow-600" />, label: "Firebase", category: "Other Tools" },
    { icon: <SiAndroidstudio className="text-5xl text-green-600" />, label: "Android Studio", category: "Other Tools" },
    { icon: <SiVisualstudiocode className="text-5xl text-blue-500" />, label: "VS Code", category: "Other Tools" },
    { icon: <SiGit className="text-5xl text-orange-600" />, label: "Git", category: "Other Tools" },
    { icon: <SiEclipseide className="text-5xl text-purple-700" />, label: "Eclipse IDE", category: "Other Tools" },
    { icon: <SiIntellijidea className="text-5xl text-blue-700" />, label: "IntelliJ IDEA", category: "Other Tools" },
    { icon: <SiRacket className="text-5xl text-red-400" />, label: "Racket", category: "Other Tools" },
    { icon: <SiJupyter className="text-5xl text-orange-400" />, label: "Jupyter Labs", category: "Other Tools" },
    { icon: <FaFilePowerpoint className="text-5xl text-red-700" />, label: "PowerPoint", category: "Other Tools" },
    { icon: <FaFileWord className="text-5xl text-blue-700" />, label: "Word", category: "Other Tools" },
    { icon: <FaFileExcel className="text-5xl text-green-700" />, label: "Excel", category: "Other Tools" },
    { icon: <SiLibreoffice className="text-5xl text-green-600" />, label: "LibreOffice", category: "Other Tools" },
    { icon: <SiUml className="text-5xl text-purple-600" />, label: "UML", category: "Other Tools" },
  ];

  const filteredIcons = filter === 'All' ? allIcons : allIcons.filter(icon => icon.category === filter);

  return (
    <div className="border-b border-neutral-800 pb-24">
      <motion.h2 
      whileInView={{opacity:1, y: 0}}
      initial={{opacity: 0, y: -100}}
      transition={{duration:0.5, delay: 0.4}}
      className="my-20 text-center text-4xl font-semibold">Technical Proficiencies</motion.h2>
      
      <motion.div 
      whileInView={{opacity:1, x: 0}}
      initial={{opacity: 0, x: -100}}
      transition={{duration:0.5, delay: 0.4}}
      className="flex justify-center mb-8">
        <button 
          className={`mx-2 px-4 py-2 border rounded ${filter === 'All' ? 'bg-blue-500 text-white' : 'bg-black text-white'}`}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        <button 
          className={`mx-2 px-4 py-2 border rounded ${filter === 'Languages' ? 'bg-blue-500 text-white' : 'bg-black text-white'}`}
          onClick={() => setFilter('Languages')}
        >
          Languages
        </button>
        <button 
          className={`mx-2 px-4 py-2 border rounded ${filter === 'Other Tools' ? 'bg-blue-500 text-white' : 'bg-black text-white'}`}
          onClick={() => setFilter('Other Tools')}
        >
          Other Tools
        </button>
      </motion.div>

      <motion.div 
      whileInView={{opacity:1, x: 0}}
      initial={{opacity: 0, x: -100}}
      transition={{duration:0.5, delay: 0.4}}
      className="flex flex-wrap items-center justify-center gap-4">
        {filteredIcons.map((iconItem, index) => (
          <div 
            key={index} 
            className={`group relative rounded-2xl border-4 border-neutral-800 p-4 transform transition-transform duration-200 ease-in-out hover:scale-110 hover:border-blue-500 ${index % 2 === 0 ? 'animate-jitter-up' : 'animate-jitter-down'}`}
          > 
            {iconItem.icon}
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[50%] opacity-0 group-hover:opacity-100 bg-black text-white text-sm px-2 py-1 rounded-lg">
              {iconItem.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Technologies;
