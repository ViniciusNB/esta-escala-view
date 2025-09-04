import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Configure o Supabase
const supabaseUrl = "https://pufggzonjpmgouopxgxk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1Zmdnem9uanBtZ291b3B4Z3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4ODMxNTgsImV4cCI6MjA2MzQ1OTE1OH0.Huy4QPbYovrRli_FYLZHOY56PuMaHm1m5p9Ihj6oZUA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetSenha() {
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Pega o token da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get("token");
    if (tokenUrl) setToken(tokenUrl);
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
    if (!token) {
      setMensagem("Token inválido ou expirado.");
      return;
    }

    try {
      // Atualiza a senha com token de recuperação
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        setMensagem(error.message);
      } else {
        setMensagem("Senha redefinida com sucesso!");
      }
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao redefinir senha.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 z-8">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md z-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h2>

        {mensagem && (
          <div className="mb-4 text-center text-red-500">{mensagem}</div>
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