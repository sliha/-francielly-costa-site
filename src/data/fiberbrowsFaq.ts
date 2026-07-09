// FAQ da FiberBROWS — partilhado entre a página de detalhe (acordeão visual) e o
// JSON-LD FAQPage renderizado no servidor (rich results no Google). Manter as duas
// fontes sincronizadas a partir daqui.

export interface FiberBrowsFaqItem {
  q: string
  a: string
}

export const fiberbrowsFaq: FiberBrowsFaqItem[] = [
  {
    q: 'A FiberBROWS já está disponível em Braga?',
    a: 'Sim. A Francielly Costa já realiza a FiberBROWS no atelier em Braga e as marcações estão abertas. Pode agendar online, escolhendo a data e a hora, ou falar diretamente connosco pelo WhatsApp ou Instagram.',
  },
  {
    q: 'A FiberBROWS é permanente?',
    a: 'Não. O resultado é temporário, com duração de aproximadamente 6 meses. Pode ser renovada quando a cliente desejar, mantendo sempre um resultado natural e adaptado à evolução do rosto.',
  },
  {
    q: 'A FiberBROWS é um procedimento cirúrgico?',
    a: 'Não. É uma técnica estética sem fins terapêuticos, com finalidade exclusiva de embelezamento facial. Não requer prescrição clínica, não envolve extração de folículos e não atinge estruturas profundas da pele.',
  },
  {
    q: 'O fio utilizado é seguro?',
    a: 'Sim. Trata-se de um fio estético biocompatível, produzido em laboratório com alto grau de purificação, dermatologicamente testado e com tecnologia internacional segura. É não absorvível, atóxico, estéril e de uso individual.',
  },
  {
    q: 'É possível reverter?',
    a: 'Sim. É possível fazer a reversão ou retirada do material aplicado, tranquilamente. O resultado é temporário, com duração de até 6 meses.',
  },
  {
    q: 'Dói muito?',
    a: 'O desconforto é muito inferior ao da micropigmentação ou microagulhamento. A maioria das clientes descreve o procedimento como muito suportável. Embora seja superficial, é aplicado um anestésico tópico para maior conforto.',
  },
  {
    q: 'É seguro?',
    a: 'Sim, quando executado com protocolo técnico rigoroso. O fio é estético e biocompatível com a grande maioria dos tipos de pele. Existe uma margem natural de 3–5% de sensibilidade, como acontece com qualquer material de uso estético.',
  },
  {
    q: 'Posso usar henna nas sobrancelhas depois?',
    a: 'Sim. O fio tem acabamento selado e não absorve corantes. A henna ou qualquer coloração só pigmenta os fios naturais — o adorno aplicado mantém sempre a cor original.',
  },
  {
    q: 'Quem não pode fazer?',
    a: 'Está contraindicado para pessoas com alergia conhecida a níquel ou materiais de uso estético. Recomendamos testes de tolerância prévios para clientes com histórico alérgico, gravidez, amamentação, doenças autoimunes ativas ou uso de isotretinoína.',
  },
  {
    q: 'Qual a diferença para o transplante capilar?',
    a: 'A FiberBROWS não tem fins cirúrgicos, não envolve extração de folículos, não requer anestesia geral, tem profundidade máxima de 2mm (sem agressão profunda à pele) e custa uma fração do preço dos transplantes, que variam entre €7.000 e €30.000. Não é transplante — é uma técnica estética sem finalidade terapêutica, ideal para quem quer resultado temporário.',
  },
  {
    q: 'Precisa ser médico para aplicar?',
    a: 'Não. Profissionais da estética capacitados e certificados pelo método podem aplicar. Só quem faz a formação completa recebe o selo oficial com número de registo que autoriza a aplicação.',
  },
  {
    q: 'Existe parecer jurídico sobre a técnica?',
    a: 'Sim. A técnica FiberBROWS 360º conta com um parecer jurídico assinado por especialista reconhecido, que valida a sua prática como estética e segura.',
  },
  {
    q: 'A FiberBROWS 360º é um procedimento médico?',
    a: 'Não. A FiberBROWS 360º é uma técnica de embelezamento facial, sem fins terapêuticos ou médicos. Não requer prescrição clínica e não tem finalidade terapêutica.',
  },
  {
    q: 'O que são as microfibras utilizadas?',
    a: 'São microfibras biocompatíveis de uso estético, não absorvíveis, atóxicas, estéreis e de uso individual. São aplicadas com uma nanoagulha de calibre extremamente fino, semelhante ao calibre de insulina — não é agulha cirúrgica.',
  },
  {
    q: 'O que pode reduzir a duração do resultado?',
    a: 'Pele inflamada, profundidade incorreta na aplicação e o estilo de vida da cliente podem influenciar a duração, que é de até 6 meses.',
  },
]
