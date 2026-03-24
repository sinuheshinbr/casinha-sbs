export default function RegrasPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-stone-800">
        Estatuto Casinha São Bento
      </h2>

      {/* 1. Contas e Caixa */}
      <Section title="1. Contas e Caixa">
        <p>
          As contas mensais são compostas por aluguel e Internet, valores
          constantes. Luz e gás, quando atingem a cota mínima ou é necessário,
          respectivamente. São divididas para todos no rateio e devem ser pagas
          até dia 08.
        </p>
        <p>
          As contas mensais podem ter redução com a contribuição de visitantes
          do mês anterior.
        </p>
        <p>
          O caixa deve ter ao menos o valor de um aluguel (R$1.800, atualmente)
          antes de haver débito das contas mensais pela contribuição de
          visitantes.
        </p>
        <p>
          Em finais de semana onde não houver uso de nenhum membro da casa, a
          casa pode ser posta para aluguel em plataformas online (Airbnb,
          Booking, etc.) com o objetivo de recuperar ou formar caixa para fins
          específicos.
        </p>
      </Section>

      {/* 2. Limpeza */}
      <Section title="2. Limpeza">
        <p>
          Manter a casa limpa e em ordem para a utilização do próximo. Não é
          obrigatório chamar faxineira, desde que haja bom senso. Uma limpeza
          mínima contém:
        </p>
        <ul className="list-disc list-inside space-y-1 text-stone-600">
          <li>
            Varrer e passar pano no chão de todas as partes utilizadas da casa.
          </li>
          <li>
            Deixar louça limpa, seca e guardada no seu devido lugar.
          </li>
          <li>
            Passar pano nos móveis das áreas comuns e utilizadas.
          </li>
          <li>Lavar banheiro.</li>
          <li>
            Tirar todo lixo da casa e colocar novas sacolas nos cestos.
          </li>
        </ul>
        <div className="bg-stone-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-stone-700">Faxina (Teresinha)</p>
          <p className="text-stone-500">
            Tel: (12) 99604-7029 — R$100 ou R$130 com roupa de cama lavada
          </p>
        </div>
        <p>
          Não deixar alimentos na geladeira ou no armário, perecíveis ou não,
          evitando acúmulo.
        </p>
      </Section>

      {/* 3. Organização e Manutenção */}
      <Section title="3. Organização e Manutenção">
        <p>
          Qualquer material quebrado deverá ser o mais rápido possível reposto
          ou reparado, e caso não seja possível, deverá ser imediatamente
          avisado ao grupo.
        </p>
        <p>
          Qualquer dano de material por mau uso ou negligência fica por
          responsabilidade do sócio em gozo da casa.
        </p>
        <p>
          Manutenções e melhorias pertinentes de uso comum podem ser
          solicitadas ao caixa da casa.
        </p>
        <p>
          Não deixar móveis, objetos decorativos ou outros pertences na casa
          sem prévia conversa. Não modificar móveis e objetos decorativos já
          existentes.
        </p>
      </Section>

      {/* 4. Pets */}
      <Section title="4. Pets">
        <p>
          São bem-vindos no terreno da casa, mas não dentro dela.
        </p>
        <p>
          Existem 3 cachorros da vizinhança que circulam a casa e são
          bem-vindos.
        </p>
      </Section>

      {/* 5. Visitantes e Uso da Casa */}
      <Section title="5. Visitantes e Uso da Casa">
        <p>O uso da casa é prioridade de quem pertence ao rateio.</p>
        <p>
          Os membros podem levar visitantes conforme disponibilidade.
        </p>
        <p>
          O valor de contribuição dos visitantes é{" "}
          <strong>R$25/noite/pessoa</strong> para o caixa, podendo ser abatido
          das contas do mês seguinte.
        </p>
        <p>
          Em situações especiais, a casa pode ser solicitada ao grupo para uso
          particular, podendo ou não ser autorizado em coletivo.
        </p>
        <p>
          Atualmente a organização acontece de forma orgânica. Uma agenda pode
          ser estipulada caso haja a necessidade.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-stone-800 mb-3">{title}</h3>
      <div className="space-y-2 text-sm text-stone-600">{children}</div>
    </div>
  );
}
