import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/MatinMobiniProfile.png";


const Hero = () => {
  return (
  <div className="border-b border-neutral-900 pb-4 lg:mb-35"> 
    <div className="flex flex-wrap"> 
        <div className="w-full lg:w-1/2">
            <div className="flex flex-col item-center lg:items-start">
                <h1 className="pb-16 text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl">Matin Mobini</h1>
                <span className="bg-gradient-to-r from-pink-300 via-slate-200 to-purple-500 bg-clip-text text-3xl tracking-tight text-transparent">
                    Computer Scientist
                </span>
                <p className="my-2 max-w-xl py-6 font-light tracking-tighter">
                    {HERO_CONTENT}
                </p>
            </div>
        </div>
        <div className="w-full lg:w-1/2 lg:p-8">
            <div className="flex justify-center"> 
                <img src={profilePic} alt="Matin Mobini" className="w-64 h-64 lg:w-80 lg:h-80"/>
            </div>
        </div>
    </div>
  </div>
  );
};
export default Hero;
