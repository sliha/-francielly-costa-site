import 'server-only'
import { sendEmail, saudacao, paragrafo, botao, cartaoDetalhes } from '@/lib/emailTemplate'
import { CONSENTIMENTO } from '@/data/anamneseFiber'

const SITE = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Email com o link para retomar a anamnese onde ficou. */
export async function sendLinkContinuarAnamnese(params: {
  to: string
  nome?: string
  token: string
}): Promise<void> {
  const link = `${SITE}/anamnese/${params.token}`
  const nome = params.nome?.trim() ? escapeHtml(params.nome.trim().split(' ')[0]) : 'Olá'
  const bodyHtml = `
    ${saudacao(nome)}
    ${paragrafo('Guardámos a sua ficha de anamnese do <strong>FiberBROWS</strong>. Pode continuar quando quiser, exatamente de onde ficou.')}
    ${botao('Continuar a minha ficha', link)}
    ${paragrafo('Este link é pessoal. Se não foi você a iniciar a ficha, ignore este email.')}
  `
  await sendEmail({
    to: params.to,
    subject: 'A sua ficha FiberBROWS ficou guardada',
    preheader: 'Continue a sua anamnese quando quiser, de onde ficou.',
    bodyHtml,
  })
}

/** Cópia/confirmação enviada à cliente após submeter a anamnese assinada. */
export async function sendCopiaAnamnese(params: {
  to: string
  nome?: string
  dataSubmissao: string
  versao: string
  autorizacaoImagem?: string
}): Promise<void> {
  const nome = params.nome?.trim() ? escapeHtml(params.nome.trim().split(' ')[0]) : 'Olá'
  const dataFmt = new Date(params.dataSubmissao).toLocaleString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const autMap: Record<string, string> = {
    local: 'Apenas o local do procedimento',
    rosto: 'Rosto inteiro',
    nao: 'Não autorizado',
  }

  const declaracoes = CONSENTIMENTO.declaracoes.map((d) => `<li style="margin:0 0 6px;">${escapeHtml(d)}</li>`).join('')

  const bodyHtml = `
    ${saudacao(nome)}
    ${paragrafo('Recebemos a sua ficha de anamnese e o consentimento informado do <strong>FiberBROWS</strong>. Ficou tudo registado. Este email serve de comprovativo.')}
    ${cartaoDetalhes([
      { label: 'Documento', valor: escapeHtml(params.versao) },
      { label: 'Submetido em', valor: escapeHtml(dataFmt) },
      { label: 'Autorização de imagem', valor: escapeHtml(autMap[params.autorizacaoImagem || ''] || 'Não indicado') },
    ])}
    ${paragrafo('Ao assinar, declarou que:')}
    <ul style="margin:0 0 14px;padding-left:20px;color:#555555;font-size:14px;line-height:1.7;">${declaracoes}</ul>
    ${paragrafo(escapeHtml(CONSENTIMENTO.procedimento))}
    ${paragrafo('<strong>Cuidados pós-procedimento:</strong> ' + CONSENTIMENTO.cuidados.map((c) => escapeHtml(c)).join('; ') + '.')}
    ${paragrafo('Se alguma informação mudar até ao dia do procedimento, avise-nos. Qualquer dúvida, é só responder a este email.')}
  `
  await sendEmail({
    to: params.to,
    subject: 'Comprovativo da sua anamnese FiberBROWS',
    preheader: 'A sua ficha e consentimento ficaram registados.',
    bodyHtml,
  })
}
