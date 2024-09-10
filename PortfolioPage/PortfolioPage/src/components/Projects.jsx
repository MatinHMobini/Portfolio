import { PROJECTS } from "../constants";
import { motion } from "framer-motion";

const Projects = () => {
  return (
    <div className="border-b border-neutral-900 pb-4">
      <motion.h2 
        whileInView={{opacity:1, y: 0}}
        initial={{opacity: 0, y: 100}}
        transition={{duration:0.5, delay: 0.4}}
        className="my-20 text-center text-4xl font-semibold"
      >
        Projects
      </motion.h2>
      <div>
        {PROJECTS.map((project, index) => (
          <div key={index} className="mb-8 flex flex-wrap lg:justify-center"> 
            <motion.div 
              whileInView={{opacity:1, x: 0}}
              initial={{opacity: 0, x: -100}}
              transition={{duration:0.5, delay: 0.4}}
              className="w-full lg:w-1/4"
            > 
              <img 
                src={project.image} 
                alt={project.title} 
                className="mb-6 rounded object-cover w-full h-full max-w-[200px] max-h-[100px]"
              />
            </motion.div>
            <motion.div 
              whileInView={{opacity:1, x: 0}}
              initial={{opacity: 0, x: 100}}
              transition={{duration:0.5, delay: 0.4}}
              className="w-full max-w-xl lg:w-3/4"
            >
              <h6 className="mb-2 font-semibold">{project.title}</h6>
              <p className="mb-4 text-neutral-400">{project.description}</p>

              {project.technologies.map((tech, index) => (
                <span key={index} className="mr-2 rounded bg-neutral-900 px-2 py-1 text-sm font-medium text-purple-700">
                  {tech}
                </span>
              ))}

              {project.link && (
                <p className="mt-4">
                  <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 no-underline hover:underline"
                    style={{ textDecoration: 'none' }} 
                  >
                    View Project
                  </a>
                </p>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
