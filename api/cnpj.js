module.exports = async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj) {
    return res.status(400).json({ error: 'CNPJ obrigatório' });
  }

  const limpo = cnpj.replace(/\D/g, '');

  if (limpo.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido' });
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);

    if (!response.ok) {
      return res.status(404).json({ error: 'CNPJ não encontrado' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};