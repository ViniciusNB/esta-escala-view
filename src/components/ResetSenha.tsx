import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pufggzonjpmgouopxgxk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1Zmdnem9uanBtZ291b3B4Z3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4ODMxNTgsImV4cCI6MjA2MzQ1OTE1OH0.Huy4QPbYovrRli_FYLZHOY56PuMaHm1m5p9Ihj6oZUA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetSenha() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Pega o token e o email da URL
  useEffect(() => {
    const hash = window.location.hash; // #access_token=...
    const search = window.location.search; // ?email=...
    const paramsHash = new URLSearchParams(hash.replace("#", "?"));
    const paramsSearch = new URLSearchParams(search);

    const tokenUrl = paramsHash.get("access_token");
    const emailUrl = paramsSearch.get("email");

    if (tokenUrl) setAccessToken(tokenUrl);
    if (emailUrl) setEmail(emailUrl);
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
    if (!accessToken || !email) {
      setMensagem("Token ou email inválido.");
      return;
    }

    try {
      // Verifica token de recuperação
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: accessToken,
        type: "recovery",
      });

      if (verifyError) {
        setMensagem("Token inválido ou expirado.");
        return;
      }

      // Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        setMensagem(updateError.message);
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
