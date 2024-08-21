import aboutImg from "../assets/codergif.gif";
import { ABOUT_TEXT } from "../constants";
import { motion } from "framer-motion";

const About = () => {
  const lines = ABOUT_TEXT.trim().split('\n');
  const introduction = lines[0]; // First line
  const bulletPoints = lines.slice(1); // Remaining lines as bullet points

  return (
    <div className="border-b border-neutral-900 pb-4">
      <h2 className="my-20 text-center text-5xl font-semibold">
        About 
        <span className="text-neutral-500"> Me</span>
      </h2>
      <div className="flex flex-wrap">
        <motion.div 
          whileInView={{opacity: 1, x: 0}}
          initial={{opacity: 0, x: -100}}
          transition={{duration: 0.5, delay: 0.4}}
          className="w-full lg:w-1/2 lg:p-8"
        >
          <div className="flex items-center justify-center">
            <img className="rounded-2xl" src={aboutImg} alt="about" />
          </div>
        </motion.div>
        <motion.div 
        whileInView={{opacity:1, x: 0}}
        initial={{opacity: 0, x: 100}}
        transition={{duration:0.5, delay: 0.4}}
        className="w-full lg:w-1/2">
          <div className="flex flex-col justify-center lg:justify-start">
            <p className="my-2 max-w-xl py-6">{introduction}</p>
            <ul className="list-disc pl-6 space-y-2">
              {bulletPoints.map((line, index) => (
                <li key={index}>{line.trim()}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
