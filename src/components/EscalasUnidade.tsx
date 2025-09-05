import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { isDesktop } from "react-device-detect";

interface Escala {
  funcionario_id: string;
  dia: string;
  tipo: string;
  inicio?: string;
  fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
  unidade?: {
    id: string;
    nome: string;
  };
}

interface Funcionario {
  id: string;
  nome: string;
}

export default function EscalasUnidade({ unidadeId }: { unidadeId: string }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [unidadeEncontrada, setUnidadeEncontrada] = useState(false);
  const [nomeUnidade, setNomeUnidade] = useState<string>("");

  const inicioMes = startOfMonth(dataAtual);
  const fimMes = endOfMonth(dataAtual);
  const diasMes = eachDayOfInterval({ start: inicioMes, end: fimMes });

  const mudarMes = (delta: number) => setDataAtual(addMonths(dataAtual, delta));

  const isWeekend = (d: Date) => {
    const w = getDay(d);
    return w === 0 || w === 6; // domingo (0) ou sábado (6)
  };

  function formatHora(hora: string | null | undefined): string {
    if (!hora) return "--";
    return hora.slice(0, 5);
  }

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch(
          `/api/unidade?unidadeId=${unidadeId}&mes=${format(dataAtual, "yyyy-MM")}`
        );

        if (!res.ok) {
          console.error("Erro ao chamar backend:", res.statusText);
          setUnidadeEncontrada(false);
          return;
        }

        const data = await res.json();

        if (!data || !data.funcionarios || data.funcionarios.length === 0) {
          setUnidadeEncontrada(false);
          return;
        }

        setFuncionarios(data.funcionarios || []);
        setEscalas(data.escalas || []);
        setNomeUnidade(data.unidade?.nome || "");
        setUnidadeEncontrada(true);
      } catch (err) {
        console.error("Erro ao buscar dados da unidade:", err);
        setUnidadeEncontrada(false);
      }
    };

    carregar();
  }, [unidadeId, dataAtual]);

  const corTipo = (tipo?: string) =>
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
      : "bg-white text-gray-800";

  return (
    <div className={`${isDesktop ? "w-[80em]" : "w-full"} z-40`}>
      {unidadeEncontrada ? (
        <>
          {/* Nome da unidade pesquisada */}
          <h1 className="text-center text-2xl font-bold text-green-500 mb-4">
            {nomeUnidade}
          </h1>

          {/* Navegação de mês */}
          <div className="flex justify-between items-center mb-2">
            <button
              className="px-2 py-2 text-white rounded-full"
              onClick={() => mudarMes(-1)}
            >
              <ArrowBackIosNewRoundedIcon />
            </button>
            <h2 className="text-gray-300 text-xl font-light">
              {format(dataAtual, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </h2>
            <button
              className="px-2 py-2 text-white rounded-full"
              onClick={() => mudarMes(1)}
            >
              <ArrowForwardIosRoundedIcon />
            </button>
          </div>

          {/* Escalas */}
          <div className="overflow-x-auto shadow-lg rounded-xl border-2 border-gray-500 animate-escalaV">
            <table className="min-w-max border-collapse w-full text-[0.75rem] sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                  <th className="sticky left-0 z-20 border-r border-gray-600 px-3 py-2 text-center text-xs sm:text-sm font-semibold bg-gray-800">
                    FUNCIONÁRIO
                  </th>
                  {diasMes.map((d) => (
                    <th
                      key={d.toISOString()}
                      className={`px-3 py-2 border border-gray-700 text-center text-xs sm:text-sm font-medium whitespace-nowrap ${
                        isWeekend(d) ? "bg-gray-800/30" : "bg-gray-800/10"
                      }`}
                    >
                      {format(d, "d", { locale: ptBR })}
                      <br />
                      <span
                        className={`text-[0.65rem] ${
                          isWeekend(d) ? "text-green-500" : "text-gray-300"
                        }`}
                      >
                        {format(d, "EEE", { locale: ptBR }).toUpperCase()}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {funcionarios.map((f, idx) => (
                  <tr
                    key={f.id}
                    className={`group ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } transition-colors`}
                  >
                    <td
                      className="sticky left-0 z-20 bg-white border border-gray-600 px-1 py-2 font-semibold max-w-[120px] sm:max-w-[140px] truncate transition group-hover:brightness-75"
                      title={f.nome}
                    >
                      {f.nome}
                    </td>

                    {diasMes.map((d) => {
                      const iso = format(d, "yyyy-MM-dd");
                      const escala = escalas.find(
                        (e) => e.funcionario_id === f.id && e.dia === iso
                      );
                      const tipo = escala?.tipo;

                      return (
                        <td
                          key={iso}
                          className={`px-2 py-2 text-center border border-gray-600 transition group-hover:brightness-75 ${corTipo(
                            tipo
                          )}`}
                        >
                          {tipo === "TRABALHAR" ? (
                            <div className="flex flex-col text-[0.7rem] sm:text-[0.85rem] leading-tight">
                              <span className="font-medium">
                                {formatHora(escala?.inicio)} -{" "}
                                {formatHora(escala?.fim)}
                              </span>
                              <span className="italic text-gray-700 text-[0.6rem] sm:text-[0.75rem]">
                                {formatHora(escala?.almoco_inicio)} -{" "}
                                {formatHora(escala?.almoco_fim)}
                              </span>

                              {/* Unidade diferente da pesquisada */}
                              {escala?.unidade &&
                                escala.unidade.id !== unidadeId && (
                                  <span className="mt-1 text-[0.6rem] text-red-600 font-semibold">
                                    {escala.unidade.nome}
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-[0.7rem] sm:text-[0.85rem] font-bold">
                              {tipo || "N/A"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <h1 className="text-gray-500 font-bold">Unidade não encontrada.</h1>
      )}
    </div>
  );
}
