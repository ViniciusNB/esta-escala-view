import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "../services/supabaseClient";
import { Modal, Box } from "@mui/material";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { isDesktop, isMobile } from "react-device-detect";

interface Escala {
  dia: string;
  tipo: "TRABALHAR" | "FOLGA" | "AFASTADO" | "FALTA" | "FÉRIAS" | "SERVIÇO EXTERNO";
  inicio?: string;
  fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
  motivo?: string;
}

interface Props {
  pesquisando: boolean;
}

export default function CalendarioMensal({ cpfBusca, pesquisando }: { cpfBusca: string; pesquisando: boolean }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [escalas, setEscalas] = useState<Escala[]>([]);

  const inicioMes = startOfMonth(dataAtual);
  const fimMes = endOfMonth(dataAtual);
  const dias = eachDayOfInterval({ start: inicioMes, end: fimMes });

  const mudarMes = (delta: number) => {
    const nova = new Date(dataAtual);
    nova.setMonth(dataAtual.getMonth() + delta);
    setDataAtual(nova);
  };

  const primeiroDiaSemana = getDay(inicioMes);
  const blanks = Array.from({ length: primeiroDiaSemana });
  const [nome, setNome] = useState("");
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false)

  const [diaSelecionado, setDiaSelecionado] = useState<Date | undefined>(undefined);
  const escalaDoDia = diaSelecionado
    ? escalas.find((e) => e.dia === format(diaSelecionado, "yyyy-MM-dd"))
    : undefined;


  const abrirModalComDia = (dia: Date) => {
    setDiaSelecionado(dia)
    setOpen(true)
  }

  const [funcionarioExiste, setFuncionarioExiste] = useState(false);

  useEffect(() => {
    const carregarEscalas = async () => {
      const { data: funcionario, error: funcionarioError } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("cpf", cpfBusca)
        .single();

      if (funcionarioError || !funcionario) {
        console.error("Funcionário não encontrado");
        setFuncionarioExiste(false);
        setEscalas([]);
        return;
      }

      setFuncionarioExiste(true);
      setNome(funcionario.nome);
      console.log("Funcionário encontrado:", funcionario.nome);

      const { data: escalasData, error: escalasError } = await supabase
        .from("escalas")
        .select("*, almoco_inicio, almoco_fim, inicio, fim, motivo")
        .eq("funcionario_id", funcionario.id);

      if (escalasError) {
        console.error("Erro ao buscar escalas:", escalasError);
        setEscalas([]);
      } else {
        setEscalas(escalasData || []);
      }
    };

    carregarEscalas();
  }, [cpfBusca, dataAtual]);

  return (
    <div>
      {funcionarioExiste ? pesquisando && (
        <>
          <h1 className="text-center font-semibold text-white">{nome}</h1>

          <div className="flex justify-between items-center mb-2 mt-5 ">
            <button
              className="px-2 py-2 text-white rounded-full justify-center align-center"
              onClick={() => mudarMes(-1)}
            >
              <ArrowBackIosNewRoundedIcon />
            </button>
            <h2 className="text-gray-300 text-xl font-light">
              {format(dataAtual, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </h2>
            <button
              className="px-2 py-2 rounded-full text-white justify-center align-center"
              onClick={() => mudarMes(1)}
            >
              <ArrowForwardIosRoundedIcon />
            </button>
          </div>

          <div className="text-gray-300 grid grid-cols-7 text-center font-semibold text-sm mb-1">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map((d) => (
              <div className={d === "SAB" ? `text-green-500` : d === "DOM" ? `text-green-500` : ""} key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 ">
            {blanks.map((_, i) => (
              <div key={`b${i}`} />
            ))}
            {dias.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const esc = escalas.find((e) => e.dia === iso);
              const tipo = esc?.tipo;
              const color =
                tipo === "FOLGA"
                  ? "bg-blue-200 text-blue-800"
                  : tipo === "TRABALHAR"
                    ? "bg-green-200 text-green-800"
                    : tipo === "FÉRIAS"
                      ? "bg-purple-300 text-purple-900"
                      : tipo === "FALTA"
                        ? "bg-red-300 text-red-900"
                        : tipo === "AFASTADO"
                          ? "bg-yellow-300 text-yellow-900"
                          : tipo === "SERVIÇO EXTERNO"
                            ? "bg-orange-300 text-orange-900"
                            : tipo === undefined
                              ? "bg-gray-900 text-white"
                              : "bg-white";

              return (
                <button
                  key={iso}
                  onClick={() => abrirModalComDia(d)}
                  className={`z-10  rounded p-1 flex flex-col items-center justify-center aspect-square ${color} transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-500`}
                >
                  <div className="text-xs sm:text-sm font-semibold">
                    {format(d, "d", { locale: ptBR })}
                  </div>
                  <div className="text-[0.6rem] sm:text-xs font-bold text-center">
                    {tipo === "FOLGA"
                      ? "FOLGA"
                      : tipo === "TRABALHAR"
                        ? "T"
                        : tipo === "AFASTADO"
                          ? "AFAST."
                          : tipo === "FALTA"
                            ? "FALTA"
                            : tipo === "FÉRIAS"
                              ? "FÉRIAS"
                              : tipo === "SERVIÇO EXTERNO"
                                ? "S/EXT."
                                : tipo === undefined
                                  ? "S/E"
                                  : ""}
                  </div>
                </button>
              );
            })}
          </div>
          <div className={isDesktop ? "absolute top-60 left-0 pl-10" : "left-0 pt-5"}>
            <div className="border-2 border-gray-400 p-3 pt-4 pb-8 rounded-lg bg-gray-800 backdrop-blur-lg bg-opacity-30">
              <h1 className="text-center text-[1.2em] font-bold text-white">LEGENDA</h1>
              <div className="border border-gray-400  mb-3" />

              <div className="grid justify-center text-center gap-4 text-sm text-white">
                {/* Linha 1 - 2 itens */}
                <div className="grid grid-cols-2 justify-center">
                  {/* Trabalhar */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-green-200 border border-green-800 flex items-center justify-center text-green-800">
                      <span className="text-[0.9em] font-semibold">T</span>
                    </div>
                    <span>Trabalhar</span>
                  </div>
                  {/* Afastado */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-yellow-300 border border-yellow-900 flex items-center justify-center text-yellow-800">
                      <span className="text-[0.9em] font-semibold">A</span>
                    </div>
                    <span>Afastado</span>
                  </div>
                </div>

                {/* Linha 2 - 3 itens */}
                <div className="grid grid-cols-3 justify-center">
                  {/* Férias */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-purple-300 border border-purple-900 flex items-center justify-center text-purple-800">
                      <span className="text-[0.9em] font-semibold">FÉ</span>
                    </div>
                    <span>Férias</span>
                  </div>
                  {/* Falta */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-red-300 border border-red-900 flex items-center justify-center text-red-800">
                      <span className="text-[0.9em] font-semibold">F</span>
                    </div>
                    <span>Falta</span>
                  </div>
                  {/* Folga */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-blue-200 border border-blue-800 flex items-center justify-center text-blue-800">
                      <span className="text-[0.9em] font-semibold">F</span>
                    </div>
                    <span>Folga</span>
                  </div>
                </div>

                {/* Linha 3 - 2 itens */}
                <div className="grid grid-cols-2 gap-4 justify-center">
                  {/* Serviço Externo */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-orange-300 border border-orange-900 flex items-center justify-center text-orange-800">
                      <span className="text-[0.8em] font-semibold">S.E</span>
                    </div>
                    <span>Serviço Externo</span>
                  </div>
                  {/* Sem Escala */}
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 rounded bg-gray-900 border border-gray-600 flex items-center justify-center text-gray-300">
                      <span className="text-[0.8em] font-semibold">S/E</span>
                    </div>
                    <span>Sem Escala</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        pesquisando ? (
          <p className="text-center font-semibold text-gray-500">Digite um CPF válido para buscar a escala.</p>
        ) : null
      )}


      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 350,
            bgcolor: 'rgba(255, 255, 255, 0.05)', // fundo semi-transparente
            backdropFilter: 'blur(10px)',        // aplica o blur
            WebkitBackdropFilter: 'blur(10px)',  // compatibilidade com Safari
            borderRadius: 6,
            boxShadow: 24,
            p: 4,
            border: '2px solid #a7a7a7ff',
          }}
        >

          <h1 className="text-[1.8em] font-semibold text-center text-green-500">
            {diaSelecionado
              ? format(diaSelecionado, "dd/MM/yyyy", { locale: ptBR })
              : ""}
          </h1>

          <p className="text-center mt-4 text-gray-200 font-semibold">
            {diaSelecionado
              ? escalas.find((e) => e.dia === format(diaSelecionado, "yyyy-MM-dd"))
                ? `${escalas.find((e) => e.dia === format(diaSelecionado, "yyyy-MM-dd"))
                  ?.tipo
                }`
                : "Sem escala registrada."
              : ""}
          </p>

          {escalaDoDia?.motivo && (
            <p className="text-center mt-2 italic font-semibold text-gray-200">Observação: {escalaDoDia.motivo}</p>
          )}

          {escalaDoDia?.tipo === "TRABALHAR" ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center text-gray-200">
                <h1>Entrada: {escalaDoDia?.inicio?.slice(0, 5).replace(":", "h") || "-"}</h1>
                <h1>Saída: {escalaDoDia?.fim?.slice(0, 5).replace(":", "h") || "-"}</h1>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-center text-gray-200">
                <h1>Almoço: {escalaDoDia?.almoco_inicio?.slice(0, 5).replace(":", "h") || "-"}</h1>
                <h1>Saída: {escalaDoDia?.almoco_fim?.slice(0, 5).replace(":", "h") || "-"}</h1>
              </div>
            </>
          ) : (
            <h1></h1>
          )}
        </Box>
      </Modal>

    </div>
  );
}