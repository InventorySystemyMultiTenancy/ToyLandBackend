const { Empresa } = require("../models");

class BillingService {
  /**
   * Renova a data de expiração do plano da empresa
   * @param {Object} opts
   * @param {string} opts.email - Email do cliente (opcional)
   * @param {string} opts.externalId - ID externo do gateway (opcional)
   * @param {Date} opts.novaDataExpiracao - Nova data de expiração
   */
  static async renovarPlano({ email, externalId, novaDataExpiracao }) {
    let empresa;
    if (externalId) {
      empresa = await Empresa.findOne({ where: { externalId } });
    } else if (email) {
      empresa = await Empresa.findOne({ where: { email } });
    }
    if (!empresa) throw new Error("Empresa não encontrada");
    empresa.dataExpiracao = novaDataExpiracao;
    empresa.ativo = true;
    await empresa.save();
    return empresa;
  }

  /**
   * Desativa a empresa (pagamento atrasado/cancelado)
   * @param {Object} opts
   * @param {string} opts.email - Email do cliente (opcional)
   * @param {string} opts.externalId - ID externo do gateway (opcional)
   */
  static async desativarEmpresa({ email, externalId }) {
    let empresa;
    if (externalId) {
      empresa = await Empresa.findOne({ where: { externalId } });
    } else if (email) {
      empresa = await Empresa.findOne({ where: { email } });
    }
    if (!empresa) throw new Error("Empresa não encontrada");
    empresa.ativo = false;
    await empresa.save();
    return empresa;
  }
}

module.exports = BillingService;
