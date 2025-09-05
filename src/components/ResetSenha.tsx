// SITE RESET SENHA
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import logo from "../assets/logo.png"

export default function ResetSenha() {
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [usuarioLogado, setUsuarioLogado] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    // Pegar token da URL e abrir sessão
    useEffect(() => {
        const hash = window.location.hash.replace("#", "?");
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
            supabase.auth
                .setSession({
                    access_token,
                    refresh_token,
                })
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Erro ao abrir sessão:", error.message);
                    } else if (data.session) {
                        console.log("Sessão aberta com sucesso:", data.session);
                        setUsuarioLogado(true);
                    }
                });
        }
    }, []);

    const handleReset = async () => {
        if (!novaSenha || !confirmarSenha) {
            setMensagem("Preencha todos os campos.");
            return;
        }
        if (novaSenha !== confirmarSenha) {
            setMensagem("As senhas não coincidem.");
            return;
        }
        if (!usuarioLogado) {
            setMensagem("O token não é válido ou expirou.");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: novaSenha,
        });

        if (error) {
            setMensagem(error.message);
        } else {
            setMensagem("Senha redefinida com sucesso! Agora você pode entrar no app.");
            setNovaSenha("");
            setConfirmarSenha("");
            setSucesso(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800">
            {/* Logo */}
            <div className="flex items-center justify-between w-full px-4 absolute top-4">
                <img src={logo} className="w-14 h-auto animate-slideDown" alt="Logo Estapar" />
                <div className="flex flex-col text-right leading-none">
                    <h1 className="text-[1.2em] font-semibold text-green-500 animate-slideRightDuration">ESTA</h1>
                    <h1 className="text-[1.2em] font-semibold text-white opacity-80 animate-slideRightDuration">ESCALA</h1>
                </div>
            </div>

            {/* Card central */}
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md mt-20 animate-escalaV">
                <h2 className="text-2xl font-bold text-center mb-2">Redefinir Senha</h2>
                <div className="border border-green-400 mb-6 animate-escalaHorizontal" />
                {mensagem && (
                    <div
                        className={`mb-4 text-center ${mensagem.includes("sucesso") ? "text-green-500" : "text-red-500"
                            }`}
                    >
                        {mensagem}
                    </div>
                )}

                {!sucesso && (
                    <>
                        <input
                            type="password"
                            placeholder="Nova senha"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            className="w-full p-3 mb-4 border-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="password"
                            placeholder="Confirmar nova senha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className="w-full p-3 mb-4 border-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={handleReset}
                            className="w-full bg-green-500 text-white p-3 rounded-full font-semibold hover:bg-green-600 transition"
                        >
                            Redefinir Senha
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
