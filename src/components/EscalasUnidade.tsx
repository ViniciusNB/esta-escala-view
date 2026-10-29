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
  dia: string;
  tipo: string;
  inicio?: string;
  fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
  funcionario: {
    id: string;
    nome: string;
  };
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
  const [openDados, setOpenDados] = useState(false);

  const inicioMes = startOfMonth(dataAtual);
  const fimMes = endOfMonth(dataAtual);
  const diasMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
  const [temEscalas, setTemEscalas] = useState(true);

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
        const res = await fetch(`https://esta-escala.vercel.app/api/unidade?unidadeId=${unidadeId}&mes=${format(dataAtual, "yyyy-MM")}`)
        
        if (!res.ok) {
          console.error("Erro ao chamar backend:", res.statusText);
          setUnidadeEncontrada(false);
          return;
        }

        const data = await res.json();

        if (!data || !data.unidade) {
          setUnidadeEncontrada(false);
          setTemEscalas(false);
          return;
        }

        if (!data.escalas || data.escalas.length === 0) {
          setUnidadeEncontrada(true);
          setTemEscalas(false);
          setNomeUnidade(data.unidade.nome || "");
          return;
        }

        // extrai funcionários únicos a partir das escalas
        const funcionariosUnicos = Array.from(
          new Map<string, Funcionario>(
            (data.escalas || [])
              .filter((e: Escala) => !!e.funcionario && !!e.funcionario.id)
              .map((e: Escala) => [e.funcionario.id, e.funcionario] as [string, Funcionario])
          ).values()
        ).sort((a, b) => a.nome.localeCompare(b.nome));

        setTemEscalas(true);
        setFuncionarios(funcionariosUnicos);
        setEscalas(data.escalas || []);
        setNomeUnidade(data.unidade?.nome || "");
        setUnidadeEncontrada(true);
      } catch (err) {
        console.error("Erro ao buscar dados da unidade:", err);
        setUnidadeEncontrada(false);
        setTemEscalas(false);
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

  const funcionariosOrdenados = [...funcionarios].sort((a, b) => {
    const entradaA = escalas
      .filter(
        (e) => e.funcionario.id === a.id && e.tipo === "TRABALHAR" && e.inicio
      )
      .map((e) => e.inicio!.slice(0, 5))
      .sort()[0];

    const entradaB = escalas
      .filter(
        (e) => e.funcionario.id === b.id && e.tipo === "TRABALHAR" && e.inicio
      )
      .map((e) => e.inicio!.slice(0, 5))
      .sort()[0];

    if (!entradaA && !entradaB) {
      return a.nome.localeCompare(b.nome, "pt-BR");
    }

    if (!entradaA) return 1;
    if (!entradaB) return -1;

    return (
      entradaA.localeCompare(entradaB) ||
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  });


  return (
    <div className={`${isDesktop ? "w-[80em]" : "w-full"} z-40`}>
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

      {!unidadeEncontrada ? (
        <h1 className="text-gray-500 font-bold">Unidade não encontrada.</h1>
      ) : !temEscalas ? (
        <h1 className="text-gray-500 font-bold">
          Nenhuma escala encontrada para este mês.
        </h1>
      ) : (
        <>
          {unidadeEncontrada ? (
            <>
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
                          className={`px-3 py-2 border border-gray-700 text-center text-xs sm:text-sm font-medium whitespace-nowrap ${isWeekend(d) ? "bg-gray-800/30" : "bg-gray-800/10"
                            }`}
                        >
                          {format(d, "d", { locale: ptBR })}
                          <br />
                          <span
                            className={`text-[0.65rem] ${isWeekend(d) ? "text-green-500" : "text-gray-300"
                              }`}
                          >
                            {format(d, "EEE", { locale: ptBR }).toUpperCase()}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {funcionariosOrdenados.map((f, idx) => (
                      <tr
                        key={f.id}
                        className={`group ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"
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
                            (e) => e.funcionario.id === f.id && e.dia === iso
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


              {/* Legenda */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["TRABALHAR", "FOLGA", "FÉRIAS", "FALTA", "AFASTADO", "SERVIÇO EXTERNO"].map((tipo) => (
                  <div
                    key={tipo}
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${corTipo(tipo)}`}
                  >
                    {tipo}
                  </div>
                ))}
              </div>

              
              {/* Dados da escala — abaixo da tabela e da legenda */}
              <div className="relative z-0 mt-6 w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/80 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-800/80"
                  onClick={() => setOpenDados(!openDados)}
                  aria-expanded={openDados}
                >
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Dados da escala
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400">
                      {nomeUnidade} · {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-xl text-white">
                    {openDados ? "−" : "+"}
                  </span>
                </button>

                {openDados && (() => {
                  const escalasTrabalho = escalas.filter(
                    (e) => e.tipo === "TRABALHAR"
                  );

                  const funcionariosTrabalhando = new Set(
                    escalasTrabalho.map((e) => e.funcionario.id)
                  ).size;

                  const horarios = new Map<string, Set<string>>();

                  escalasTrabalho.forEach((e) => {
                    const hora = formatHora(e.inicio);

                    if (!horarios.has(hora)) {
                      horarios.set(hora, new Set());
                    }

                    horarios.get(hora)!.add(e.funcionario.id);
                  });

                  const turnos = new Map<string, Set<string>>();

                  escalasTrabalho.forEach((e) => {
                    const hora = Number(e.inicio?.slice(0, 2));

                    const turno =
                      hora < 12 ? "Manhã" : hora < 18 ? "Tarde" : "Noite";

                    const chave = `${e.dia}|${turno}`;

                    if (!turnos.has(chave)) {
                      turnos.set(chave, new Set());
                    }

                    turnos.get(chave)!.add(e.funcionario.id);
                  });

                  const quantidadePorDia = diasMes.map((dia) => {
                    const iso = format(dia, "yyyy-MM-dd");

                    const quantidade = new Set(
                      escalasTrabalho
                        .filter((e) => e.dia === iso)
                        .map((e) => e.funcionario.id)
                    ).size;

                    return {
                      data: iso,
                      dia: format(dia, "dd/MM (EEE)", { locale: ptBR }),
                      quantidade,
                    };
                  });

                  const totalDiasComTrabalho = quantidadePorDia.filter(
                    (d) => d.quantidade > 0
                  ).length;

                  return (
                    <div className="border-t border-gray-700 p-4 sm:p-6">
                      {/* Indicadores */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                          <p className="text-sm text-gray-400">
                            Funcionários escalados
                          </p>
                          <p className="mt-2 text-2xl font-bold text-white">
                            {funcionariosTrabalhando}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                          <p className="text-sm text-gray-400">
                            Registros de trabalho
                          </p>
                          <p className="mt-2 text-2xl font-bold text-white">
                            {escalasTrabalho.length}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                          <p className="text-sm text-gray-400">
                            Dias com funcionários trabalhando
                          </p>
                          <p className="mt-2 text-2xl font-bold text-white">
                            {totalDiasComTrabalho}
                            <span className="ml-1 text-sm font-normal text-gray-400">
                              de {diasMes.length} dias
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Horários de entrada */}
                      <section className="mt-6">
                        <h4 className="mb-3 text-base font-bold text-white">
                          Funcionários por horário de início
                        </h4>

                        {horarios.size > 0 ? (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {[...horarios.entries()]
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([hora, ids]) => (
                                <div
                                  key={hora}
                                  className="rounded-xl border border-gray-700 bg-gray-800/50 p-4"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="font-bold text-green-400">
                                      {hora}
                                    </span>

                                    <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-200">
                                      {ids.size} {ids.size === 1 ? "funcionário" : "funcionários"}
                                    </span>
                                  </div>

                                  <p className="break-words text-sm leading-relaxed text-gray-300">
                                    {[...ids]
                                      .map((id) =>
                                        funcionarios.find((f) => f.id === id)?.nome
                                      )
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="rounded-xl bg-gray-800/50 p-4 text-sm text-gray-400">
                            Nenhum funcionário trabalhando neste mês.
                          </p>
                        )}
                      </section>

                      
                      {/* Quantidade por turno — visão compacta por dia */}
                      <section className="mt-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-base font-bold text-white">
                              Quantidade por turno
                            </h4>
                            <p className="mt-1 text-xs text-gray-400">
                              Distribuição diária de funcionários por período
                            </p>
                          </div>

                          <div className="flex gap-2 text-xs">
                            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-300">
                              Manhã
                            </span>
                            <span className="rounded-full bg-sky-500/15 px-2 py-1 text-sky-300">
                              Tarde
                            </span>
                            <span className="rounded-full bg-violet-500/15 px-2 py-1 text-violet-300">
                              Noite
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {diasMes.map((dia) => {
                            const iso = format(dia, "yyyy-MM-dd");

                            const quantidadeTurno = (turno: string) =>
                              turnos.get(`${iso}|${turno}`)?.size ?? 0;

                            const manha = quantidadeTurno("Manhã");
                            const tarde = quantidadeTurno("Tarde");
                            const noite = quantidadeTurno("Noite");

                            const total = manha + tarde + noite;

                            return (
                              <div
                                key={iso}
                                className="rounded-xl border border-gray-700 bg-gray-800/60 p-3 transition hover:border-gray-500 hover:bg-gray-800"
                              >
                                {/* Cabeçalho do dia */}
                                <div className="mb-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-bold capitalize text-white">
                                      {format(dia, "EEEE", { locale: ptBR })}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {format(dia, "dd/MM/yyyy")}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-lg font-bold text-white">
                                      {total}
                                    </span>
                                    <p className="text-[10px] text-gray-400">
                                      por turno*
                                    </p>
                                  </div>
                                </div>

                                {/* Quantidades por período */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-center">
                                    <p className="text-[10px] font-semibold uppercase text-amber-300">
                                      Manhã
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-amber-200">
                                      {manha}
                                    </p>
                                  </div>

                                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2 text-center">
                                    <p className="text-[10px] font-semibold uppercase text-sky-300">
                                      Tarde
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-sky-200">
                                      {tarde}
                                    </p>
                                  </div>

                                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-2 text-center">
                                    <p className="text-[10px] font-semibold uppercase text-violet-300">
                                      Noite
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-violet-200">
                                      {noite}
                                    </p>
                                  </div>
                                </div>

                                {/* Indicador visual da distribuição */}
                                {total > 0 && (
                                  <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-gray-700">
                                    {manha > 0 && (
                                      <div
                                        className="bg-amber-400"
                                        style={{ width: `${(manha / total) * 100}%` }}
                                      />
                                    )}
                                    {tarde > 0 && (
                                      <div
                                        className="bg-sky-400"
                                        style={{ width: `${(tarde / total) * 100}%` }}
                                      />
                                    )}
                                    {noite > 0 && (
                                      <div
                                        className="bg-violet-400"
                                        style={{ width: `${(noite / total) * 100}%` }}
                                      />
                                    )}
                                  </div>
                                )}

                                {total === 0 && (
                                  <p className="mt-2 text-center text-xs text-gray-500">
                                    Nenhum funcionário escalado
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                          * Soma das quantidades dos três turnos. Um mesmo funcionário pode
                          aparecer em mais de um turno no mesmo dia.
                        </p>
                      </section>
                      

                      {/* Quantidade por dia */}
                      <section className="mt-6">
                        <h4 className="mb-3 text-base font-bold text-white">
                          Funcionários trabalhando por dia
                        </h4>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                          {quantidadePorDia.map((item) => (
                            <div
                              key={item.data}
                              className={`rounded-lg border p-3 ${
                                item.quantidade > 0
                                  ? "border-gray-700 bg-gray-800/70"
                                  : "border-gray-800 bg-gray-900/50"
                              }`}
                            >
                              <p className="text-xs capitalize text-gray-400">
                                {item.dia}
                              </p>

                              <p
                                className={`mt-2 text-xl font-bold ${
                                  item.quantidade > 0
                                    ? "text-green-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {item.quantidade}
                              </p>

                              <p className="text-xs text-gray-500">
                                {item.quantidade === 1
                                  ? "funcionário"
                                  : "funcionários"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  );
                })()}
              </div>

            </>
          ) : (
            <h1 className="text-gray-500 font-bold">Unidade não encontrada.</h1>
          )}
        </>
      )}
    </div>
  );
}
