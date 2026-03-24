export default function LocalizacaoPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Localização</h2>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-stone-800 mb-1">Endereço</h3>
        <p className="text-sm text-stone-600">
          São Bento do Sapucaí — SP
        </p>
        <p className="text-xs text-stone-400 mt-1">
          22°39&apos;48.2&quot;S 45°39&apos;48.1&quot;W
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3664.2!2d-45.663358!3d-22.663377!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjLCsDM5JzQ4LjIiUyA0NcKwMzknNDguMSJX!5e0!3m2!1spt-BR!2sbr!4v1"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização da Casinha"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-stone-800 mb-2">Como chegar</h3>
        <div className="space-y-2 text-sm text-stone-600">
          <p>
            <span className="font-medium text-stone-700">De São Paulo:</span>{" "}
            Aproximadamente 180 km pela Rodovia Presidente Dutra (BR-116) até
            São José dos Campos, depois SP-50 sentido Campos do Jordão e
            SP-171 até São Bento do Sapucaí.
          </p>
          <p>
            <span className="font-medium text-stone-700">Tempo estimado:</span>{" "}
            ~2h30 de carro.
          </p>
        </div>
      </div>
    </div>
  );
}
