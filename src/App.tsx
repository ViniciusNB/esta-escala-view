import { useState } from "react";
import CalendarioMensal from "./components/CalendarioMensal";
export default function App() {
  const [cpf, setCpf] = useState("");
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Escala Mensal</h1>

      <input
        type="text"
        placeholder="Buscar por CPF"
        className="border p-2 mb-4 w-full rounded-full"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
      />
        <CalendarioMensal cpfBusca={cpf} />
    </div>
  );
}