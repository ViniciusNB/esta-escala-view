import { useState } from "react";
import CalendarioMensal from "./components/CalendarioMensal";
import logo from "./assets/logo.png";
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { isDesktop, isMobile } from "react-device-detect";

export default function App() {
  const [cpf, setCpf] = useState("");
  const [pesquisando, setPesquisando] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-center px-4 overflow-hidden">
      <div className="flex items-start justify-start h-14 w-full absolute top-0 left-0 p-4 z-20">
        <img src={logo} className="w-14 h-auto" alt="Logo Estapar" />
      </div>

      {/* Blobs desfocados */}
      <div className="absolute top-40 left-60 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse-custom delay-[0]"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse-custom delay-[200ms]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-900 rounded-full blur-3xl opacity-10 animate-pulse-custom "></div>
      <div className="absolute bottom-0 right-60 w-96 h-48 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulsar"></div>

      {!pesquisando && (
        <h1 className={`${isDesktop ? "top-40" : "top-60 mx-4"} max-w-[320px] absolute text-3xl font-semibold text-center text-white`}>Veja a sua escala de trabalho definida para o mês!</h1>
      )}
      <div className={`${isDesktop ? "" : "relative"} p-4 mb-15 max-w-5xl mx-auto`}>
        <div className="text-center justify-center relative align-middle">
          <SearchRoundedIcon className={`absolute mt-3 ml-3 ${pesquisando ? "text-green-500" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Buscar por CPF"
            className="border-2 border-green-500 focus:border-green-500 focus:ring focus:ring-green-500 active:border-green-500 p-2 pl-10 mb-4 rounded-full bg-gray-900 text-gray-300 w-[300px]"
            value={cpf}
            onChange={(e) => { setCpf(e.target.value); setPesquisando(true); if (e.target.value === "") setPesquisando(false); }}
          />
        </div>
        <CalendarioMensal cpfBusca={cpf} pesquisando={pesquisando} />
      </div>
      <p className="pb-2 absolute text-gray-500 text-[0.8em] bottom-0 text-center">© {new Date().getFullYear()} Esta Escala. Todos os direitos reservados.</p>
    </div>
  );
}