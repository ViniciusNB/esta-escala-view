import { useState } from "react";
import CalendarioMensal from "./components/CalendarioMensal";
import EscalasUnidade from "./components/EscalasUnidade";
import logo from "./assets/logo.png";
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { isDesktop, isMobile } from "react-device-detect";
import { TypeAnimation } from 'react-type-animation';

export default function App() {
  const [cpf, setCpf] = useState("");
  const [pesquisando, setPesquisando] = useState(false);
  const [unidadeBusca, setUnidadeBusca] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const somenteNumeros = input.replace(/\D/g, "");

  const handleSearch = () => {
    if (!input) {
      setCpf("");
      setUnidadeBusca(null);
      return;
    }

    if (somenteNumeros.length === 11) {
      // CPF válido
      setCpf(somenteNumeros);
      setUnidadeBusca(null);
    } else {
      // Unidade (garagem)
      setUnidadeBusca(input.toUpperCase());
      setCpf("");
    }
  };




  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center text-center px-2 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-between w-full px-4 overflow-hidden">
        {/* Logo */}
        <img src={logo} className="w-14 h-auto animate-slideDown" alt="Logo Estapar" />

        {/* Texto */}
        <div className="flex flex-col text-right leading-none space-y-0 p-0">
          <h1 className="text-[1.2em] font-semibold text-green-500 m-0 p-0 animate-slideRightDuration">ESTA</h1>
          <h1 className="text-[1.2em] font-semibold text-white opacity-80 m-0 p-0 animate-slideRightDuration">ESCALA</h1>
        </div>
      </div>

      {/* Blobs desfocados */}
      <div className="absolute top-20 left-40 w-24 h-24 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse-custom delay-[0] z-0"></div>
      <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse-custom delay-[200ms] z-0"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-900 rounded-full blur-3xl opacity-10 animate-pulse-custom z-0"></div>
      <div className="absolute bottom-0 right-60 w-72 h-36 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulsar z-0"></div>



      <div className={`p-4 max-w-5xl mx-auto flex flex-col items-center justify-center z-10`}>
        {!pesquisando && (
          <>
            <TypeAnimation
              className={`${isDesktop ? "top-40 py-5" : "top-60 mx-4 py-[1.4em]"} text-5xl max-w-[350px] text-3xl py-4 font-semibold backdrop-blur-sm text-center text-white opacity-80`}
              sequence={[
                500,
                'Veja a sua escala de trabalho mensal em tempo real!', // Text to type
                1000,            // Pause for 1 second
              ]}
              wrapper="h1"
              cursor={true}
              repeat={0} // Loop animation
            />
          </>
        )}
        <div className="text-center justify-center relative align-middle animate-escalaH">
          <SearchRoundedIcon className={`absolute mt-3 ml-3 ${pesquisando ? "text-green-500" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Buscar por CPF"
            className="border-2 border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 active:border-green-500 p-2 pl-10 mb-4 rounded-full bg-gray-900 text-gray-300 w-[300px]"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setPesquisando(true);
              if (e.target.value === "") setPesquisando(false);
            }}

            onBlur={handleSearch}
          />
        </div>
        {cpf && (<CalendarioMensal cpfBusca={cpf} pesquisando={pesquisando} />)}
        {unidadeBusca && (<EscalasUnidade unidadeId={unidadeBusca} />)}
      </div>
      <p className="mt-2 text-gray-500 text-[0.8em] text-center z-50">
        © {new Date().getFullYear()} Esta Escala. Todos os direitos reservados.
      </p>
    </div>
  );
}