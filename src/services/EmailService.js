const { Empresa } = require("../models");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const DEFAULT_LOGO_URL =
  process.env.DEFAULT_LOGO_URL || "https://yourdomain.com/default-logo.png";
const DEFAULT_COR_PRINCIPAL = process.env.DEFAULT_COR_PRINCIPAL || "#007bff";

class EmailService {
  static async enviarEmail({
    empresaId,
    empresaObj,
    to,
    subject,
    templatePath,
    templateVars,
  }) {
    let empresa = empresaObj;
    if (!empresa && empresaId) {
      empresa = await Empresa.findByPk(empresaId);
    }
    if (!empresa) throw new Error("Empresa não encontrada");
    const config = empresa.configuracoes || {};
    const logoUrl = config.logoUrl || DEFAULT_LOGO_URL;
    const corPrincipal = config.corPrimaria || DEFAULT_COR_PRINCIPAL;
    const nomeEmpresa = empresa.nome;

    // Carregar template HTML
    const templateSource = fs.readFileSync(path.resolve(templatePath), "utf8");
    const template = handlebars.compile(templateSource);
    const html = template({
      ...templateVars,
      logoUrl,
      corPrincipal,
      nomeEmpresa,
    });

    // Configurar transporte (exemplo: SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `${nomeEmpresa} <${
        process.env.SMTP_FROM || process.env.SMTP_USER
      }>`,
      to,
      subject,
      html,
    });
  }
}

module.exports = EmailService;
