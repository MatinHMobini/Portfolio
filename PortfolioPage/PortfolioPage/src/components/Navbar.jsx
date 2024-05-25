import logo from "../assets/MatinMobiniLogo.png";
import {FaLinkedin} from "react-icons/fa";
import {FaGithub} from "react-icons/fa";



const Navbar = () => {
    return <nav className="mb-20 flex items-center justify-bewteen py-6"> 
    <div className="flex flex-shrink-0 items-center">
        <img className="mx-2 w-12"src={logo} alt="logo"/>
    </div>
    <div className="m-8 flex justify-end gap-4 text-3xl w-full">
        <FaLinkedin />
        <FaGithub />   
    </div>

    
    </nav>
};
export default Navbar