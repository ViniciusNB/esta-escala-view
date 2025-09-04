import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pufggzonjpmgouopxgxk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1Zmdnem9uanBtZ291b3B4Z3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4ODMxNTgsImV4cCI6MjA2MzQ1OTE1OH0.Huy4QPbYovrRli_FYLZHOY56PuMaHm1m5p9Ihj6oZUA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(false);

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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h2>
        {mensagem && (
          <div
            className={`mb-4 text-center ${
              mensagem.includes("sucesso") ? "text-green-500" : "text-red-500"
            }`}
          >
            {mensagem}
          </div>
        )}
        <input
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleReset}
          className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600 transition"
        >
          Redefinir Senha
        </button>
      </div>
    </div>
  );
}
