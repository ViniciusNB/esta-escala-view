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
import { supabase } from "../services/supabaseClient";
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
  unidade_id?: string;
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
    return w === 0 || w === 6;
  };

  const formatHora = (hora?: string | null) => (hora ? hora.slice(0, 5) : "--");

  useEffect(() => {
    const carregar = async () => {
      try {
        // 🔹 Nome da unidade
        const { data: unidadeData, error: unidadeError } = await supabase
          .from("unidades")
          .select("nome")
          .eq("id", unidadeId)
          .maybeSingle();

        if (unidadeError) console.warn("Erro ao buscar unidade:", unidadeError);
        if (unidadeData?.nome) {
          setNomeUnidade(unidadeData.nome);
          setUnidadeEncontrada(true);
        } else {
          setUnidadeEncontrada(false);
        }

        // 🔹 Funcionários
        const { data: funcData, error: funcError } = await supabase
          .from("funcionarios_unidades")
          .select("*, funcionarios(id,nome)")
          .eq("unidade_id", unidadeId);

        if (funcError) console.warn("Erro ao buscar funcionários:", funcError);

        const ordenado = (funcData || [])
          .filter((r) => r.funcionarios)
          .sort((a, b) => a.funcionarios.nome.localeCompare(b.funcionarios.nome));

        setFuncionarios(ordenado.map((r) => r.funcionarios));

        // 🔹 Escalas do mês
        const inicioStr = format(inicioMes, "yyyy-MM-dd");
        const fimStr = format(fimMes, "yyyy-MM-dd");

        const { data: es, error: escalaError } = await supabase
          .from("escalas")
          .select("*, unidade:unidades(id,nome)")
          .eq("unidade_id", unidadeId)
          .gte("dia", inicioStr)
          .lte("dia", fimStr);

        if (escalaError) console.warn("Erro ao buscar escalas:", escalaError);
        console.log("Escalas retornadas:", es);

        setEscalas((es as Escala[]) || []);
      } catch (err) {
        console.error("Erro ao carregar escalas/unidade:", err);
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
                : "bg-gray-100 text-gray-800";

  return (
    <div className={`${isDesktop ? "w-[80em]" : "w-full"} z-40`}>
      {unidadeEncontrada ? (
        <>
          <h1 className="text-center text-2xl font-bold text-green-500 mb-4">
            {nomeUnidade}
          </h1>

          {/* Navegação de mês */}
          <div className="flex justify-between items-center mb-2">
            <button className="px-2 py-2 text-white rounded-full" onClick={() => mudarMes(-1)}>
              <ArrowBackIosNewRoundedIcon />
            </button>
            <h2 className="text-gray-300 text-xl font-light">
              {format(dataAtual, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </h2>
            <button className="px-2 py-2 text-white rounded-full" onClick={() => mudarMes(1)}>
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
                      className={`px-3 py-2 border border-gray-700 text-center text-xs sm:text-sm font-medium whitespace-nowrap ${isWeekend(d) ? "bg-gray-800/30" : "bg-gray-800/10"}`}
                    >
                      {format(d, "d", { locale: ptBR })}
                      <br />
                      <span className={`text-[0.65rem] ${isWeekend(d) ? "text-green-500" : "text-gray-300"}`}>
                        {format(d, "EEE", { locale: ptBR }).toUpperCase()}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {funcionarios.length === 0 && (
                  <tr>
                    <td colSpan={diasMes.length + 1} className="text-center py-4 text-gray-500">
                      Sem funcionários
                    </td>
                  </tr>
                )}

                {funcionarios.map((f, idx) => (
                  <tr key={f.id} className={`group ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} transition-colors`}>
                    <td className="sticky left-0 z-20 bg-white border border-gray-600 px-1 py-2 font-semibold max-w-[140px] truncate" title={f.nome}>
                      {f.nome}
                    </td>

                    {diasMes.map((d) => {
                      const iso = format(d, "yyyy-MM-dd");

                      const escala = escalas.find((e) => {
                        if (!e.dia) return false;
                        const diaEscala = format(new Date(e.dia), "yyyy-MM-dd");
                        return e.funcionario_id === f.id && diaEscala === iso;
                      });

                      const tipo = escala?.tipo;
                      const cor = corTipo(tipo);

                      return (
                        <td key={iso} className={`px-2 py-2 text-center border border-gray-600 transition group-hover:brightness-75 ${cor}`}>
                          {escala ? (
                            <div className="flex flex-col text-[0.7rem] sm:text-[0.85rem] leading-tight">
                              <span className="font-bold">{tipo}</span>
                              {escala.inicio && escala.fim && (
                                <span className="text-[0.65rem] italic">
                                  {formatHora(escala.inicio)} - {formatHora(escala.fim)}
                                </span>
                              )}
                              {escala.almoco_inicio && escala.almoco_fim && (
                                <span className="text-[0.6rem] italic text-gray-700">
                                  {formatHora(escala.almoco_inicio)} - {formatHora(escala.almoco_fim)}
                                </span>
                              )}
                              {escala.unidade && escala.unidade.id !== unidadeId && (
                                <span className="mt-1 text-[0.6rem] text-red-600 font-semibold">
                                  {escala.unidade.nome}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[0.7rem] sm:text-[0.85rem] font-bold">N/A</span>
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
