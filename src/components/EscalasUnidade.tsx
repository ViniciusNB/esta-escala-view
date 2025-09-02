import { useState, useEffect } from "react";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    addMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "../services/supabaseClient";

interface Escala {
    funcionario_id: string;
    dia: string;
    tipo: string;
    inicio?: string;
    fim?: string;
    almoco_inicio?: string;
    almoco_fim?: string;
}

interface Funcionario {
    id: string;
    nome: string;
}

export default function EscalasUnidade({ unidadeId }: { unidadeId: string }) {
    const [dataAtual, setDataAtual] = useState(new Date());
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [escalas, setEscalas] = useState<Escala[]>([]);

    const inicioMes = startOfMonth(dataAtual);
    const fimMes = endOfMonth(dataAtual);
    const diasMes = eachDayOfInterval({ start: inicioMes, end: fimMes });

    const mudarMes = (delta: number) => {
        setDataAtual(addMonths(dataAtual, delta));
    };

    // 🔹 Função para formatar horários sem segundos
    function formatHora(hora: string | null | undefined): string {
        if (!hora) return "--";
        return hora.slice(0, 5); // pega só HH:mm
    }

    useEffect(() => {
        const carregar = async () => {
            type FuncionarioUnidade = {
                funcionario: Funcionario;
            };

            const { data: fu } = await supabase
                .from("funcionarios_unidades")
                .select("funcionario:funcionarios(id, nome)")
                .eq("unidade_id", unidadeId);

            const ordenado = (fu as FuncionarioUnidade[] | null)?.sort((a, b) =>
                a.funcionario.nome.localeCompare(b.funcionario.nome)
            );

            setFuncionarios((ordenado || []).map((r) => r.funcionario));


            const { data: es } = await supabase
                .from("escalas")
                .select("*")
                .gte("dia", format(inicioMes, "yyyy-MM-dd"))
                .lte("dia", format(fimMes, "yyyy-MM-dd"));

            setEscalas(es || []);
        };

        carregar();
    }, [unidadeId, dataAtual]);

    const corTipo = (tipo?: string) =>
        tipo === "FOLGA"
            ? "bg-blue-100 text-blue-700"
            : tipo === "TRABALHAR"
                ? "bg-green-100 text-green-800"
                : "bg-white";

    return (
        <div className="w-full z-40">
            {/* Navegação de mês */}
            <div className="flex justify-between items-center mb-3">
                <button
                    className="px-3 py-1 bg-gray-200 rounded z-40"
                    onClick={() => mudarMes(-1)}
                >
                    ←
                </button>
                <h2 className="text-lg font-bold text-white">
                    {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => mudarMes(1)}
                >
                    →
                </button>
            </div>

            <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-max border-collapse border text-[0.65rem] sm:text-sm">
                    <thead>
                        <tr>
                            <th className="border p-2 bg-gray-100 sticky left-0 z-10 whitespace-nowrap text-xs sm:text-sm">
                                Funcionário
                            </th>
                            {diasMes.map((d) => (
                                <th
                                    key={d.toISOString()}
                                    className="border px-2 py-1 sm:px-3 sm:py-2 bg-gray-50 text-[0.65rem] sm:text-xs min-w-[55px] sm:min-w-[75px] whitespace-nowrap"
                                >
                                    {format(d, "d", { locale: ptBR })}
                                    <br />
                                    {format(d, "EEE", { locale: ptBR })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {funcionarios.map((f) => (
                            <tr key={f.id}>
                                <td
                                    className="border p-2 font-semibold sticky left-0 bg-white z-10 max-w-[80px] sm:max-w-[160px] truncate"
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
                                            className={`border px-1 py-1 sm:px-2 sm:py-2 text-center align-top ${corTipo(
                                                tipo
                                            )}`}
                                        >
                                            {tipo === "TRABALHAR" ? (
                                                <div className="flex flex-col text-[0.55rem] sm:text-[0.75rem] leading-tight">
                                                    <span className="font-medium">
                                                        {formatHora(escala?.inicio)} - {formatHora(escala?.fim)}
                                                    </span>
                                                    <span className="italic text-gray-600 text-[0.5rem] sm:text-[0.7rem]">
                                                        {formatHora(escala?.almoco_inicio)} - {formatHora(escala?.almoco_fim)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[0.55rem] sm:text-[0.75rem] font-bold">
                                                    {tipo || "-"}
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
        </div>
    );
}
