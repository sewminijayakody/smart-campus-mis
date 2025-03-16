import { IconType } from "react-icons";
import { FaQuestionCircle } from "react-icons/fa";

type ButtonTypes = {
  text: string;
};

const Button = ({ text }: ButtonTypes) => {
  return (
    <button className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition">
      <FaQuestionCircle className="text-sm" />
      <span className="text-xs font-medium">{text}</span>
    </button>
  );
};

export default Button;
