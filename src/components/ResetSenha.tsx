import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pufggzonjpmgouopxgxk.supabase.co";
const supabaseAnonKey = "SUA_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(false);

  // Checa se o usuário já está autenticado via token do link
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession(); // pega sessão atual
      if (data.session) {
        setUsuarioLogado(true);
      }
    }
    checkSession();
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
      setMensagem(
        "Senha redefinida com sucesso! Você já pode entrar com a nova senha."
      );
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
