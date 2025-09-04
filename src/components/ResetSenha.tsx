import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pufggzonjpmgouopxgxk.supabase.co";
const supabaseAnonKey = "SEU_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetSenha() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const hash = window.location.hash; // pega #access_token=...
    const match = hash.match(/access_token=([^&]+)/);
    if (match) {
      setAccessToken(match[1]);
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
    if (!accessToken) {
      setMensagem("Token inválido ou expirado.");
      return;
    }

    try {
      // Cria um client temporário com o accessToken
      const supabaseRecuperacao = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const { error } = await supabaseRecuperacao.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        setMensagem(error.message);
      } else {
        setMensagem("Senha redefinida com sucesso! Volte ao app para entrar.");
        setNovaSenha("");
        setConfirmarSenha("");
      }
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao redefinir senha.");
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
