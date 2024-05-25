import { RiReactjsLine } from "react-icons/ri";
import { IoLogoJavascript } from "react-icons/io5";
import { BiLogoPostgresql } from "react-icons/bi";
import { DiProlog } from "react-icons/di";
import { SiGo } from "react-icons/si"; 
import { FaNode } from "react-icons/fa6";
import { FaJava, FaPython, FaHtml5, FaCss3Alt } from "react-icons/fa";

const Technologies = () => {
  return (
    <div className="border-b border-neutral-800 pb-24">
      <h2 className="my-20 text-center text-4xl">Technologies / Languages</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <FaPython className="text-5xl text-yellow-400"/> {/* Python yellow */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <FaJava className="text-5xl text-red-600"/> {/* Java Red */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <FaNode className="text-5xl text-green-500"/> {/* Node.js Green */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <RiReactjsLine className="text-5xl text-cyan-400"/> {/* React Cyan */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <IoLogoJavascript className="text-5xl text-yellow-500"/> {/* JavaScript Yellow */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <BiLogoPostgresql className="text-5xl text-blue-500"/> {/* PostgreSQL Blue */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <DiProlog className="text-5xl text-blue-600"/> {/* Prolog Blue */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <SiGo className="text-5xl text-teal-500"/> {/* Go Teal */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <FaHtml5 className="text-5xl text-orange-500"/> {/* HTML5 Orange */}
        </div>
        <div className="rounded-2xl border-4 border-neutral-800 p-4"> 
          <FaCss3Alt className="text-5xl text-blue-600"/> {/* CSS3 Blue */}
        </div>
      </div>
    </div>
  );
};

export default Technologies;


