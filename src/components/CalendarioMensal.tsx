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

interface Escala {
  dia: string;
  tipo: "TRABALHAR" | "FOLGA" | "AFASTADO" | "FALTA" | "FÉRIAS" | "SERVIÇO EXTERNO";
  inicio?: string;
  fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
  motivo?: string;
}

export default function CalendarioMensal({ cpfBusca }: { cpfBusca: string }) {
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



  useEffect(() => {
    const carregarEscalas = async () => {
      const { data: funcionario, error: funcionarioError } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("cpf", cpfBusca)
        .single();

      if (funcionarioError || !funcionario) {
        console.error("Funcionário não encontrado");
        setEscalas([]);
        return;
      }

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
      {nome ? (
        <>
          <h1 className="text-left my-4 font-bold">Funcionário: {nome}</h1>

          <div className="flex justify-between items-center mb-3 mt-10 ">
            <button
              className="px-2 py-1 bg-green-400 text-white rounded-full"
              onClick={() => mudarMes(-1)}
            >
              ←
            </button>
            <h2 className="text-xl font-bold">
              {format(dataAtual, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </h2>
            <button
              className="px-2 py-1 bg-green-400 rounded-full text-white"
              onClick={() => mudarMes(1)}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 text-center font-semibold text-sm mb-1">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map((d) => (
              <div key={d}>{d}</div>
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
                            : "bg-white";

              return (
                <button
                  key={iso}
                  onClick={() => abrirModalComDia(d)}
                  className={` border rounded p-1 flex flex-col items-center justify-center aspect-square ${color}`}
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
                          ? "A"
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
          
          <h1 className="text-center text-[1.2em] my-6 underline font-bold">LEGENDA</h1>
          <div className={`flex mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-200 border border-green-800 text-center justify-center flex text-green-800">
                <span className="text-[0.8em]">T</span>
              </div>
              <span>Trabalhar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-200 border border-blue-800 text-center justify-center flex text-blue-800">
                <span className="text-[0.8em]">F</span>
              </div>
              <span>Folga</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-purple-300 border border-purple-900 text-center justify-center flex text-purple-800">
                <span className="text-[0.8em]">FÉ</span>
              </div>
              <span>Férias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-300 border border-red-900 text-center justify-center flex text-red-800">
                <span className="text-[0.8em]">F</span>
              </div>
              <span>Falta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-300 border border-yellow-900 text-center justify-center flex text-yellow-800">
                <span className="text-[0.8em]">A</span>
              </div>
              <span>Afastado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-orange-300 border border-orange-900 text-center justify-center flex text-orange-800">
                <span className="text-[0.8em]">S.E</span>
              </div>
              <span>Serviço Externo</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">Digite um CPF para buscar a escala.</p>
      )}


      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 350,
            bgcolor: 'background.paper',
            borderRadius: 6,
            boxShadow: 24,
            p: 4,
          }}
        >
          <h1 className="text-[1.5em] font-bold text-center">
            {diaSelecionado
              ? format(diaSelecionado, "dd/MM/yyyy", { locale: ptBR })
              : ""}
          </h1>

          <p className="text-center mt-2">
            {diaSelecionado
              ? escalas.find((e) => e.dia === format(diaSelecionado, "yyyy-MM-dd"))
                ? `Escala: ${escalas.find((e) => e.dia === format(diaSelecionado, "yyyy-MM-dd"))
                  ?.tipo
                }`
                : "Sem escala registrada."
              : ""}
          </p>

          {escalaDoDia?.motivo && (
            <p className="text-center mt-2 italic">Observação: {escalaDoDia.motivo}</p>
          )}

          {escalaDoDia?.tipo === "TRABALHAR" ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <h1>Entrada: {escalaDoDia?.inicio?.slice(0, 5).replace(":", "h") || "-"}</h1>
                <h1>Saída: {escalaDoDia?.fim?.slice(0, 5).replace(":", "h") || "-"}</h1>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
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