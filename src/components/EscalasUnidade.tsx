import { useState, useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  addDays,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { isDesktop } from "react-device-detect";

interface Escala {
  dia: string;
  tipo: string;
  inicio?: string | null;
  fim?: string | null;
  almoco_inicio?: string | null;
  almoco_fim?: string | null;
  funcionario: { id: string; nome: string };
  unidade?: { id: string; nome: string } | null;
  unidade_id?: string | null;
}
interface Funcionario {
  id: string;
  nome: string;
}
interface RespostaAPI {
  unidade?: { id: string; nome: string } | null;
  funcionarios?: Funcionario[];
  escalas?: Escala[];
}

const formatHora = (hora?: string | null) => hora?.slice(0, 5) || "--";
const corTipo = (tipo?: string) => {
  switch (tipo) {
    case "FOLGA":
      return "bg-blue-200 text-blue-800";
    case "TRABALHAR":
      return "bg-green-200 text-green-800";
    case "FÉRIAS":
      return "bg-purple-300 text-purple-900";
    case "FALTA":
      return "bg-red-300 text-red-900";
    case "AFASTADO":
      return "bg-yellow-300 text-yellow-900";
    case "SERVIÇO EXTERNO":
      return "bg-orange-300 text-orange-900";
    default:
      return "bg-white text-gray-800";
  }
};
const idUnidade = (e: Escala) => e.unidade?.id ?? e.unidade_id ?? null;

export default function EscalasUnidade({ unidadeId }: { unidadeId: string }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [unidadeEncontrada, setUnidadeEncontrada] = useState(false);
  const [nomeUnidade, setNomeUnidade] = useState("");
  const [openDados, setOpenDados] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dataEscalaDiaria, setDataEscalaDiaria] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const mes = format(dataAtual, "yyyy-MM");
  const diasMes = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(dataAtual),
        end: endOfMonth(dataAtual),
      }),
    [mes],
  );
  const mudarMes = (delta: number) =>
    setDataAtual((atual) => addMonths(atual, delta));
  const isWeekend = (d: Date) => [0, 6].includes(getDay(d));

  // Atualiza a data selecionada sempre que o mês mudar.
  useEffect(() => {
    const hoje = format(new Date(), "yyyy-MM-dd");

    const primeiraData = format(diasMes[0], "yyyy-MM-dd");
    const ultimaData = format(diasMes[diasMes.length - 1], "yyyy-MM-dd");

    setDataEscalaDiaria(
      hoje >= primeiraData && hoje <= ultimaData ? hoje : primeiraData,
    );
  }, [mes]);

  // Carrega os dados da unidade e também a jornada do último dia do mês anterior.
  useEffect(() => {
    const controller = new AbortController();

    const carregar = async () => {
      setCarregando(true);
      setErro(null);
      setEscalas([]);
      setFuncionarios([]);
      setUnidadeEncontrada(false);
      setNomeUnidade("");

      try {
        const params = new URLSearchParams({ unidadeId, mes });

        const res = await fetch(
          `https://esta-escala.vercel.app/api/unidade?${params}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          throw new Error(`Erro ao consultar a unidade (HTTP ${res.status}).`);
        }

        const data: RespostaAPI = await res.json();

        if (!data?.unidade) {
          throw new Error("Unidade não encontrada.");
        }

        const recebidas = Array.isArray(data.escalas) ? data.escalas : [];

        const validas = recebidas.filter((e) => e?.funcionario?.id && e?.dia);

        // Busca o último dia do mês anterior.
        const primeiroDiaMes = startOfMonth(dataAtual);
        const dataAnteriorMes = format(
          addDays(primeiroDiaMes, -1),
          "yyyy-MM-dd",
        );
        const mesAnterior = format(addDays(primeiroDiaMes, -1), "yyyy-MM");

        let registrosDiaAnterior: Escala[] = [];

        try {
          const paramsAnterior = new URLSearchParams({
            unidadeId,
            mes: mesAnterior,
          });

          const resAnterior = await fetch(
            `https://esta-escala.vercel.app/api/unidade?${paramsAnterior}`,
            { signal: controller.signal },
          );

          if (resAnterior.ok) {
            const dataAnterior: RespostaAPI = await resAnterior.json();

            registrosDiaAnterior = (
              Array.isArray(dataAnterior.escalas) ? dataAnterior.escalas : []
            ).filter((e) => e?.funcionario?.id && e?.dia === dataAnteriorMes);
          }
        } catch (erroAnterior) {
          if (controller.signal.aborted) return;

          console.warn(
            "Não foi possível carregar o último dia do mês anterior:",
            erroAnterior,
          );
        }

        if (controller.signal.aborted) return;

        // Mantém os registros do mês atual e acrescenta somente
        // os registros do dia anterior ao início do mês.
        const todasEscalas = [...validas, ...registrosDiaAnterior];

        const mapa = new Map<string, Funcionario>();

        for (const f of data.funcionarios || []) {
          if (f?.id) mapa.set(f.id, f);
        }

        for (const e of todasEscalas) {
          mapa.set(e.funcionario.id, e.funcionario);
        }

        setFuncionarios(
          [...mapa.values()].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR"),
          ),
        );

        setEscalas(todasEscalas);
        setNomeUnidade(data.unidade.nome || "");
        setUnidadeEncontrada(true);
      } catch (e) {
        if (controller.signal.aborted) return;

        console.error("Erro ao buscar dados da unidade:", e);

        setErro(e instanceof Error ? e.message : "Erro ao carregar escalas.");
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    };

    void carregar();

    return () => controller.abort();
  }, [unidadeId, mes]);

  const escalasPorDia = useMemo(() => {
    const mapa = new Map<string, Escala[]>();
    for (const e of escalas) {
      const chave = `${e.funcionario.id}|${e.dia}`;
      const lista = mapa.get(chave) || [];
      lista.push(e);
      mapa.set(chave, lista);
    }
    return mapa;
  }, [escalas]);

  const funcionariosOrdenados = useMemo(() => {
    return [...funcionarios].sort((a, b) => {
      const escalaA = escalas.find(
        (e) => e.funcionario.id === a.id && e.dia === dataEscalaDiaria,
      );

      const escalaB = escalas.find(
        (e) => e.funcionario.id === b.id && e.dia === dataEscalaDiaria,
      );

      const trabalhaA =
        escalaA?.tipo === "TRABALHAR" || escalaA?.tipo === "SERVIÇO EXTERNO";

      const trabalhaB =
        escalaB?.tipo === "TRABALHAR" || escalaB?.tipo === "SERVIÇO EXTERNO";

      // Trabalhadores sempre aparecem primeiro.
      if (trabalhaA !== trabalhaB) {
        return trabalhaA ? -1 : 1;
      }

      // Entre trabalhadores, ordenar pelo horário de entrada.
      if (trabalhaA && trabalhaB) {
        const inicioA = escalaA?.inicio || "23:59";
        const inicioB = escalaB?.inicio || "23:59";

        const comparacaoHorario = inicioA.localeCompare(inicioB);

        if (comparacaoHorario !== 0) {
          return comparacaoHorario;
        }
      }

      // Desempate pelo nome.
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [funcionarios, escalas, dataEscalaDiaria]);

  const escalasTrabalho = useMemo(
    () =>
      escalas.filter(
        (e) => e.tipo === "TRABALHAR" && idUnidade(e) === unidadeId,
      ),
    [escalas, unidadeId],
  );

  // Converte HH:mm em minutos desde 00:00.
  const horaEmMinutos = (hora?: string | null): number | null => {
    if (!hora) return null;

    const partes = hora.slice(0, 5).split(":");
    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);

    if (
      !Number.isFinite(horas) ||
      !Number.isFinite(minutos) ||
      horas < 0 ||
      horas > 23 ||
      minutos < 0 ||
      minutos > 59
    ) {
      return null;
    }

    return horas * 60 + minutos;
  };

  const mudarDiaEscala = (delta: number) => {
    const dataAtualDiaria = new Date(`${dataEscalaDiaria}T12:00:00`);
    const novaData = addDays(dataAtualDiaria, delta);
    const novaDataFormatada = format(novaData, "yyyy-MM-dd");

    const primeiraData = format(diasMes[0], "yyyy-MM-dd");
    const ultimaData = format(diasMes[diasMes.length - 1], "yyyy-MM-dd");

    if (novaDataFormatada >= primeiraData && novaDataFormatada <= ultimaData) {
      setDataEscalaDiaria(novaDataFormatada);
    }
  };

  // Gera as 96 posições de 15 minutos do dia.
  const horariosDiarios = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => ({
        minutos: index * 15,
        hora: Math.floor(index / 4),
        minuto: (index % 4) * 15,
      })),
    [],
  );

  // Seleciona o registro que será utilizado na linha de cada funcionário.
  const funcionariosEscalaDiaria = useMemo(() => {
    const dataAnterior = format(
      addDays(new Date(`${dataEscalaDiaria}T12:00:00`), -1),
      "yyyy-MM-dd",
    );

    return funcionariosOrdenados.map((funcionario) => {
      const registrosHoje =
        escalasPorDia.get(`${funcionario.id}|${dataEscalaDiaria}`) || [];

      const registrosOntem =
        escalasPorDia.get(`${funcionario.id}|${dataAnterior}`) || [];

      // Mantém a prioridade da unidade selecionada.
      const escalaHoje =
        registrosHoje.find((e) => idUnidade(e) === unidadeId) ??
        registrosHoje.find((e) => e.tipo === "TRABALHAR") ??
        registrosHoje[0];

      // Verifica se existe uma jornada iniciada ontem
      // que continua durante a madrugada de hoje.
      const jornadasAnteriores = registrosOntem.filter((e) => {
        if (e.tipo !== "TRABALHAR" || !e.inicio || !e.fim) {
          return false;
        }

        const inicio = horaEmMinutos(e.inicio);
        const fim = horaEmMinutos(e.fim);

        return inicio !== null && fim !== null && fim <= inicio;
      });

      // Prioriza a jornada da unidade selecionada.
      const escalaAnterior =
        jornadasAnteriores.find((e) => idUnidade(e) === unidadeId) ??
        jornadasAnteriores[0];

      return {
        funcionario,
        escala: escalaHoje,
        escalaAnterior,
        outraUnidade:
          escalaHoje?.tipo === "TRABALHAR" &&
          Boolean(idUnidade(escalaHoje)) &&
          idUnidade(escalaHoje) !== unidadeId,
      };
    });
  }, [funcionariosOrdenados, escalasPorDia, dataEscalaDiaria, unidadeId]);

  // Verifica se o funcionário está trabalhando em determinado intervalo.
  const funcionarioTrabalhaNoHorario = (
    escala: Escala | undefined,
    minuto: number,
    considerarMadrugada = false,
  ) => {
    if (!escala || escala.tipo !== "TRABALHAR") return false;

    const inicio = horaEmMinutos(escala.inicio);
    const fim = horaEmMinutos(escala.fim);

    if (inicio === null || fim === null) return false;

    // Jornada que atravessa a meia-noite.
    if (fim <= inicio) {
      if (considerarMadrugada) {
        return minuto < fim;
      }

      return minuto >= inicio;
    }

    if (minuto < inicio || minuto >= fim) return false;

    return true;
  };

  // Verifica se o intervalo corresponde ao horário de almoço.
  const funcionarioAlmocando = (escala: Escala | undefined, minuto: number) => {
    if (!escala || escala.tipo !== "TRABALHAR") return false;

    const inicioAlmoco = horaEmMinutos(escala.almoco_inicio);
    const fimAlmoco = horaEmMinutos(escala.almoco_fim);

    if (inicioAlmoco === null || fimAlmoco === null) return false;

    return minuto >= inicioAlmoco && minuto < fimAlmoco;
  };

  // Verifica se existe trabalho no intervalo de 15 minutos.
  const temTrabalhoNoIntervalo = (
    escala: Escala | undefined,
    minuto: number,
    considerarMadrugada = false,
  ) => {
    const pontoMedio = minuto + 7.5;

    const trabalha = funcionarioTrabalhaNoHorario(
      escala,
      pontoMedio,
      considerarMadrugada,
    );

    if (!trabalha) return false;

    // Não marca os intervalos de almoço.
    return !funcionarioAlmocando(escala, pontoMedio);
  };

  const totalTrabalhandoDia = funcionariosEscalaDiaria.filter(
    ({ escala, escalaAnterior }) =>
      escala?.tipo === "TRABALHAR" || Boolean(escalaAnterior),
  ).length;

  const dados = useMemo(() => {
    const funcionariosTrabalhando = new Set(
      escalasTrabalho.map((e) => e.funcionario.id),
    ).size;
    const horarios = new Map<string, Set<string>>();
    const turnos = new Map<string, Set<string>>();
    for (const e of escalasTrabalho) {
      const hora = formatHora(e.inicio);
      if (!horarios.has(hora)) horarios.set(hora, new Set());
      horarios.get(hora)!.add(e.funcionario.id);
      const inicioMinutos = e.inicio
        ? Number(e.inicio.slice(0, 2)) * 60 + Number(e.inicio.slice(3, 5))
        : null;

      const fimMinutos = e.fim
        ? Number(e.fim.slice(0, 2)) * 60 + Number(e.fim.slice(3, 5))
        : null;

      let turno = "Indefinido";

      if (
        inicioMinutos !== null &&
        fimMinutos !== null &&
        Number.isFinite(inicioMinutos) &&
        Number.isFinite(fimMinutos)
      ) {
        if (fimMinutos <= inicioMinutos) {
          // Jornada que ultrapassa a meia-noite.
          turno = "Noite";
        } else if (fimMinutos <= 18 * 60) {
          turno = "Manhã";
        } else {
          turno = "Tarde";
        }
      }
      const chave = `${e.dia}|${turno}`;
      if (!turnos.has(chave)) turnos.set(chave, new Set());
      turnos.get(chave)!.add(e.funcionario.id);
    }
    const quantidadePorDia = diasMes.map((dia) => {
      const iso = format(dia, "yyyy-MM-dd");
      return {
        data: iso,
        dia: format(dia, "dd/MM (EEE)", { locale: ptBR }),
        quantidade: new Set(
          escalasTrabalho
            .filter((e) => e.dia === iso)
            .map((e) => e.funcionario.id),
        ).size,
      };
    });
    return {
      funcionariosTrabalhando,
      horarios,
      turnos,
      quantidadePorDia,
      totalDiasComTrabalho: quantidadePorDia.filter((d) => d.quantidade > 0)
        .length,
    };
  }, [escalasTrabalho, diasMes]);

  return (
    <div className={`${isDesktop ? "w-[80em]" : "w-full"} z-40`}>
      <h1 className="text-center text-2xl font-bold text-green-500 mb-4">
        {nomeUnidade}
      </h1>
      <div className="flex justify-between items-center mb-2">
        <button
          className="px-2 py-2 text-white rounded-full"
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
        >
          <ArrowBackIosNewRoundedIcon />
        </button>
        <h2 className="text-gray-300 text-xl font-light">
          {format(dataAtual, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
        </h2>
        <button
          className="px-2 py-2 text-white rounded-full"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
        >
          <ArrowForwardIosRoundedIcon />
        </button>
      </div>

      {carregando ? (
        <p className="text-gray-400 font-semibold">Carregando escalas...</p>
      ) : erro ? (
        <p className="text-red-400 font-semibold">{erro}</p>
      ) : !unidadeEncontrada ? (
        <p className="text-gray-500 font-bold">Unidade não encontrada.</p>
      ) : escalas.length === 0 ? (
        <p className="text-gray-500 font-bold">
          Nenhuma escala encontrada para este mês.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto shadow-lg rounded-xl border-2 border-gray-500 animate-escalaV">
            <table className="min-w-max border-collapse w-full text-[0.75rem] sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                  <th className="sticky left-0 z-20 border-r border-gray-600 px-3 py-2 text-center text-xs sm:text-sm font-semibold bg-gray-800">
                    FUNCIONÁRIO
                  </th>
                  {diasMes.map((d) => (
                    <th
                      key={format(d, "yyyy-MM-dd")}
                      className={`px-3 py-2 border border-gray-700 text-center text-xs sm:text-sm font-medium whitespace-nowrap ${isWeekend(d) ? "bg-gray-800/30" : "bg-gray-800/10"}`}
                    >
                      {format(d, "d", { locale: ptBR })}
                      <br />
                      <span
                        className={`text-[0.65rem] ${isWeekend(d) ? "text-green-500" : "text-gray-300"}`}
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
                    className={`group ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} transition-colors`}
                  >
                    <td
                      className="sticky left-0 z-20 bg-white border border-gray-600 px-1 py-2 font-semibold max-w-[120px] sm:max-w-[140px] truncate transition group-hover:brightness-75"
                      title={f.nome}
                    >
                      {f.nome}
                    </td>
                    {diasMes.map((d) => {
                      const iso = format(d, "yyyy-MM-dd");

                      const registros =
                        escalasPorDia.get(`${f.id}|${iso}`) || [];

                      // Prioriza a escala da unidade pesquisada.
                      const escala =
                        registros.find((e) => idUnidade(e) === unidadeId) ??
                        registros[0];

                      const tipo = escala?.tipo;

                      // Só considera outra unidade quando o funcionário estiver trabalhando nela.
                      const outraUnidade =
                        tipo === "TRABALHAR" &&
                        Boolean(
                          escala &&
                          idUnidade(escala) &&
                          idUnidade(escala) !== unidadeId,
                        );

                      const nomeOutraUnidade =
                        escala?.unidade?.nome || "Outra unidade";

                      return (
                        <td
                          key={iso}
                          className={`px-2 py-2 text-center border border-gray-600 transition group-hover:brightness-75 ${
                            outraUnidade
                              ? "bg-orange-100 text-orange-900"
                              : corTipo(tipo)
                          }`}
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

                              {outraUnidade && (
                                <span className="mt-1 text-[0.6rem] text-orange-700 font-bold">
                                  {nomeOutraUnidade}
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

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              "TRABALHAR",
              "FOLGA",
              "FÉRIAS",
              "FALTA",
              "AFASTADO",
              "SERVIÇO EXTERNO",
            ].map((tipo) => (
              <div
                key={tipo}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${corTipo(tipo)}`}
              >
                {tipo}
              </div>
            ))}
            <div className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-orange-100 text-orange-900">
              OUTRA UNIDADE
            </div>
          </div>

          <div className="relative z-0 mt-6 w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/80 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-800/80"
              onClick={() => setOpenDados((v) => !v)}
              aria-expanded={openDados}
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Dados da escala
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  {nomeUnidade} ·{" "}
                  {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-xl text-white">
                {openDados ? "−" : "+"}
              </span>
            </button>

            {openDados && (
              <div className="border-t border-gray-700 p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                    <p className="text-sm text-gray-400">
                      Funcionários escalados
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {dados.funcionariosTrabalhando}
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
                      {dados.totalDiasComTrabalho}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        de {diasMes.length} dias
                      </span>
                    </p>
                  </div>
                </div>

                <section className="mt-6">
                  <h4 className="mb-3 text-base font-bold text-white">
                    Funcionários por horário de início
                  </h4>
                  {dados.horarios.size > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[...dados.horarios.entries()]
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
                                {ids.size}{" "}
                                {ids.size === 1
                                  ? "funcionário"
                                  : "funcionários"}
                              </span>
                            </div>
                            <p className="break-words text-sm leading-relaxed text-gray-300">
                              {[...ids]
                                .map(
                                  (id) =>
                                    funcionarios.find((f) => f.id === id)?.nome,
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
                        dados.turnos.get(`${iso}|${turno}`)?.size ?? 0;
                      const manha = quantidadeTurno("Manhã");
                      const tarde = quantidadeTurno("Tarde");
                      const noite = quantidadeTurno("Noite");
                      const indefinido = quantidadeTurno("Indefinido");
                      const total = manha + tarde + noite;
                      return (
                        <div
                          key={iso}
                          className="rounded-xl border border-gray-700 bg-gray-800/60 p-3 transition hover:border-gray-500 hover:bg-gray-800"
                        >
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
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                ["Manhã", manha, "amber"],
                                ["Tarde", tarde, "sky"],
                                ["Noite", noite, "violet"],
                              ] as const
                            ).map(([nome, quantidade, cor]) => {
                              const classes = {
                                amber: [
                                  "border-amber-500/20 bg-amber-500/10",
                                  "text-amber-300",
                                  "text-amber-200",
                                ],
                                sky: [
                                  "border-sky-500/20 bg-sky-500/10",
                                  "text-sky-300",
                                  "text-sky-200",
                                ],
                                violet: [
                                  "border-violet-500/20 bg-violet-500/10",
                                  "text-violet-300",
                                  "text-violet-200",
                                ],
                              }[cor];
                              return (
                                <div
                                  key={nome}
                                  className={`rounded-lg border p-2 text-center ${classes[0]}`}
                                >
                                  <p
                                    className={`text-[10px] font-semibold uppercase ${classes[1]}`}
                                  >
                                    {nome}
                                  </p>
                                  <p
                                    className={`mt-1 text-xl font-bold ${classes[2]}`}
                                  >
                                    {quantidade}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
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
                              Nenhum funcionário escalado com turno definido
                            </p>
                          )}
                          {indefinido > 0 && (
                            <p className="mt-2 text-center text-xs text-yellow-300">
                              {indefinido} registro(s) sem horário de início
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    * Soma das quantidades dos três turnos. Um mesmo funcionário
                    pode aparecer em mais de um turno no mesmo dia.
                  </p>
                </section>

                <section className="mt-6">
                  <h4 className="mb-3 text-base font-bold text-white">
                    Funcionários trabalhando por dia
                  </h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                    {dados.quantidadePorDia.map((item) => (
                      <div
                        key={item.data}
                        className={`rounded-lg border p-3 ${item.quantidade > 0 ? "border-gray-700 bg-gray-800/70" : "border-gray-800 bg-gray-900/50"}`}
                      >
                        <p className="text-xs capitalize text-gray-400">
                          {item.dia}
                        </p>
                        <p
                          className={`mt-2 text-xl font-bold ${item.quantidade > 0 ? "text-green-400" : "text-gray-500"}`}
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
            )}
          </div>
          {/* ESCALA DIÁRIA POR HORÁRIO */}
          <section className="relative z-0 mt-6 w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/80 shadow-lg">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Escala diária por horário
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Visualização da jornada dos funcionários em intervalos de 15
                  minutos
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2">
                <button
                  type="button"
                  onClick={() => mudarDiaEscala(-1)}
                  disabled={
                    dataEscalaDiaria === format(diasMes[0], "yyyy-MM-dd")
                  }
                  className="text-gray-300 transition hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Dia anterior"
                >
                  <ArrowBackIosNewRoundedIcon fontSize="small" />
                </button>

                <div className="min-w-[125px] text-center">
                  <p className="text-sm font-bold capitalize text-white">
                    {format(new Date(`${dataEscalaDiaria}T12:00:00`), "EEEE", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(
                      new Date(`${dataEscalaDiaria}T12:00:00`),
                      "dd/MM/yyyy",
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => mudarDiaEscala(1)}
                  disabled={
                    dataEscalaDiaria ===
                    format(diasMes[diasMes.length - 1], "yyyy-MM-dd")
                  }
                  className="text-gray-300 transition hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Próximo dia"
                >
                  <ArrowForwardIosRoundedIcon fontSize="small" />
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div className="flex flex-wrap items-center gap-4 border-b border-gray-700 bg-gray-800/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-300">
                  {totalTrabalhandoDia} funcionários trabalhando
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-green-200 text-[10px] font-bold text-green-900">
                  T
                </span>
                <span className="text-xs text-gray-300">
                  Em horário de trabalho
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-white" />
                <span className="text-xs text-gray-300">
                  Fora da jornada ou intervalo
                </span>
              </div>
            </div>

            {/* Tabela com rolagem horizontal */}
            <div className="w-full overflow-x-auto shadow-inner">
              <table className="w-max min-w-full border-collapse text-[10px] sm:text-xs">
                <thead>
                  {/* Cabeçalho das horas */}
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-30 min-w-[125px] border-b border-r border-gray-600 bg-gray-800 px-2 py-3 text-left font-semibold sm:min-w-[160px] sm:px-3"
                    >
                      FUNCIONÁRIO
                    </th>

                    {Array.from({ length: 24 }, (_, hora) => (
                      <th
                        key={hora}
                        colSpan={4}
                        className="min-w-[136px] border-b border-r border-gray-600 bg-gray-800 px-1 py-2 text-center font-bold"
                      >
                        {String(hora).padStart(2, "0")}h
                      </th>
                    ))}
                  </tr>

                  {/* Cabeçalho dos minutos */}
                  <tr className="bg-gray-700 text-gray-300">
                    {horariosDiarios.map((horario) => (
                      <th
                        key={horario.minutos}
                        className="w-[34px] min-w-[34px] border-b border-r border-gray-600 py-2 text-center font-medium"
                      >
                        {String(horario.minuto).padStart(2, "0")}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {funcionariosEscalaDiaria.map(
                    (
                      { funcionario, escala, escalaAnterior, outraUnidade },
                      idx,
                    ) => {
                      const trabalhandoHoje = escala?.tipo === "TRABALHAR";

                      const status = escala?.tipo || "N/A";

                      return (
                        <tr
                          key={funcionario.id}
                          className={`group ${
                            idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          {/* Funcionário fixo */}
                          <td
                            className="sticky left-0 z-20 min-w-[125px] max-w-[125px] border border-gray-600 bg-white px-2 py-2 transition group-hover:brightness-90 sm:min-w-[160px] sm:max-w-[160px] sm:px-3"
                            title={funcionario.nome}
                          >
                            <div className="flex flex-col">
                              <span className="truncate text-[10px] font-bold text-gray-800 sm:text-xs">
                                {funcionario.nome}
                              </span>

                              {trabalhandoHoje ? (
                                <span
                                  className={`mt-1 w-fit rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                    outraUnidade
                                      ? "bg-orange-200 text-orange-900"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {outraUnidade
                                    ? escala?.unidade?.nome || "OUTRA UNIDADE"
                                    : "TRABALHANDO"}
                                </span>
                              ) : (
                                <span
                                  className={`mt-1 w-fit rounded px-1.5 py-0.5 text-[9px] font-bold ${corTipo(status)}`}
                                >
                                  {status}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Intervalos de 15 minutos */}
                          {horariosDiarios.map((horario) => {
                            const minuto = horario.minutos;

                            const trabalhaHoje = temTrabalhoNoIntervalo(
                              escala,
                              minuto,
                            );

                            const trabalhaOntem = temTrabalhoNoIntervalo(
                              escalaAnterior,
                              minuto,
                              true,
                            );

                            const trabalhando = trabalhaHoje || trabalhaOntem;

                            const outraUnidadeAnterior =
                              trabalhaOntem &&
                              Boolean(idUnidade(escalaAnterior!)) &&
                              idUnidade(escalaAnterior!) !== unidadeId;

                            const outraUnidadeAtual =
                              trabalhaHoje && outraUnidade;

                            const corCelula = !trabalhando
                              ? "bg-white"
                              : outraUnidadeAtual || outraUnidadeAnterior
                                ? "bg-orange-200 text-orange-900"
                                : "bg-green-200 text-green-900";

                            return (
                              <td
                                key={horario.minutos}
                                className={`h-9 w-[34px] min-w-[34px] border border-gray-300 p-0 text-center align-middle transition group-hover:brightness-95 ${corCelula}`}
                                title={`${String(horario.hora).padStart(2, "0")}:${String(horario.minuto).padStart(2, "0")}`}
                              >
                                {trabalhando && (
                                  <span className="text-[10px] font-extrabold sm:text-xs">
                                    T
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-700 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-green-300 bg-green-200 text-[10px] font-bold text-green-900">
                  T
                </span>
                <span className="text-xs text-gray-300">
                  Trabalho na unidade
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-orange-300 bg-orange-200 text-[10px] font-bold text-orange-900">
                  T
                </span>
                <span className="text-xs text-gray-300">
                  Trabalho em outra unidade
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded border border-gray-300 bg-white" />
                <span className="text-xs text-gray-300">Sem expediente</span>
              </div>

              <p className="ml-auto text-[10px] text-gray-500">
                Cada coluna representa 15 minutos
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
