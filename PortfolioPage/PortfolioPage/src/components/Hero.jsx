import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/MatinMobiniProfile.png";
import { motion } from "framer-motion";

const container = (delay) => ({
    hidden: {x: -100, opacity:0},
    visible: {
        x: 0,
        opacity: 1,
        transition: {duration:0.5, delay},
    },
});

const Hero = () => {
  return (
  <div className="border-b border-neutral-900 pb-4 lg:mb-35"> 
    <div className="flex flex-wrap"> 
        <div className="w-full lg:w-1/2">
            <div className="flex flex-col item-center lg:items-start">
                <motion.h1 
                variants={container(0.2)}
                initial="hidden"
                animate="visible"
                className="pb-16 text-6xl font-semibold tracking-tight lg:mt-16 lg:text-8xl">Matin Mobini</motion.h1>
                <motion.span 
                variants={container(0.5)}
                initial="hidden"
                animate="visible"
                className="bg-gradient-to-r from-pink-300 via-slate-200 to-purple-500 bg-clip-text text-3xl tracking-tight text-transparent">
                Artificial Intelligence / Web Development / Android Development
                </motion.span>
                <motion.p 
                variants={container(1)}
                initial="hidden"
                animate="visible"
                className="my-2 max-w-xl py-6 font-light tracking-tighter">
                    {HERO_CONTENT}
                </motion.p>
            </div>
        </div>
        <div className="w-full lg:w-1/2 lg:p-8">
            <div className="flex justify-center"> 
                <motion.img 
                initial={{ x:100, opacity: 0}}
                animate={{ x:0, opacity:1 }}
                transition={{ duration: 1, delay: 1.2}}
                src={profilePic} alt="Matin Mobini" className="w-64 h-64 lg:w-80 lg:h-80"/>
            </div>
        </div>
    </div>
  </div>
  );
};
export default Hero;
