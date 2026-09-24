import { Associazione, Persona, Anno, Tesserato, Gruppo, GruppoTesserato, Quota, Pagamento, Utente, SpesaPrevisionale } from '../types';

export const INITIAL_ASSOCIAZIONE: Associazione = {
  denominazione: 'A.S.D. Pattinaggio Artistico Aurora',
  disciplina: 'Pattinaggio Artistico a Rotelle',
  codice_fiscale: '97854120584',
  partita_iva: '04859620581',
  indirizzo: 'Via dello Sport, 24',
  cap: '00153',
  comune: 'Roma',
  provincia: 'RM',
  legale_rappresentante: 'Alessandro Bianchi',
  telefono: '06 5894123',
  email: 'segreteria@pattinaggioaurora.it',
  pec: 'pattinaggioaurora@pec.it',
  codice_affiliazione: 'FISR n. 3942 • UISP • AICS',
  codice_affiliazione_fisr: 'FISR n. 3942',
  registro_rasd: 'RASD-RM-048291',
  enti_affiliati: [
    {
      id: 'fsn-fisr',
      tipo: 'FSN',
      sigla: 'FISR',
      denominazione_estesa: 'Federazione Italiana Sport Rotellistici',
      codice_societa: '3942',
      attivo: true
    },
    {
      id: 'eps-uisp',
      tipo: 'EPS',
      sigla: 'UISP',
      denominazione_estesa: 'Unione Italiana Sport Per tutti - Settore Pattinaggio',
      codice_societa: 'UISP-RM-8492',
      attivo: true
    },
    {
      id: 'eps-aics',
      tipo: 'EPS',
      sigla: 'AICS',
      denominazione_estesa: 'Associazione Italiana Cultura Sport - Pattinaggio',
      codice_societa: 'AICS-99321',
      attivo: true
    },
    {
      id: 'eps-csen',
      tipo: 'EPS',
      sigla: 'CSEN',
      denominazione_estesa: 'Centro Sportivo Educativo Nazionale',
      codice_societa: 'CSEN-45892',
      attivo: true
    }
  ],
  specialita: [
    'Singolo Maschile e Femminile',
    'Solo Dance Internazionale & Divisione Nazionale',
    'Coppia Artistico & Danza',
    'Gruppi Show, Quartetti & Precision',
    'Avviamento Primi Passi su Rotelle'
  ],
  iban: 'IT60X0542811101000000123456'
};

export const INITIAL_ANNI: Anno[] = [
  {
    id: 1,
    anno: '2024/2025',
    data_inizio: '2024-09-01',
    data_fine: '2025-06-30',
    attivo: true,
  },
  {
    id: 2,
    anno: '2023/2024',
    data_inizio: '2023-09-01',
    data_fine: '2024-06-30',
    attivo: false,
  }
];

export const INITIAL_PERSONE: Persona[] = [
  {
    id: 1,
    nome: 'Marco',
    cognome: 'Rossi',
    codice_fiscale: 'RSSMRC12M15H501Z',
    data_nascita: '2012-08-15', // 12 anni - MINORENNE
    luogo_nascita: 'Roma',
    indirizzo: 'Via Garibaldi 14',
    citta: 'Roma',
    telefono: '3481234567',
    email: 'famiglia.rossi@email.it',
    is_minorenne: true,
    tutore_nome: 'Giuseppe',
    tutore_cognome: 'Rossi',
    tutore_cf: 'RSSGPP78A12H501W',
    tutore_telefono: '3481234567',
    tutore_email: 'giuseppe.rossi@email.it',
    tutore_relazione: 'Padre',
    note: 'Allergia alle graminacee, autorizzato rientro autonomo.',
    data_creazione: '2024-09-02'
  },
  {
    id: 2,
    nome: 'Sofia',
    cognome: 'Bianchi',
    codice_fiscale: 'BNCSFA14D52F205K',
    data_nascita: '2014-04-12', // 10 anni - MINORENNE
    luogo_nascita: 'Milano',
    indirizzo: 'Corso Buenos Aires 88',
    citta: 'Milano',
    telefono: '3399876543',
    email: 'elena.verdi@email.it',
    is_minorenne: true,
    tutore_nome: 'Elena',
    tutore_cognome: 'Verdi',
    tutore_cf: 'VRDLNE82E45F205R',
    tutore_telefono: '3399876543',
    tutore_email: 'elena.verdi@email.it',
    tutore_relazione: 'Madre',
    note: 'Fratellino iscritto al minivolley.',
    data_creazione: '2024-09-05'
  },
  {
    id: 3,
    nome: 'Leonardo',
    cognome: 'Ferrari',
    codice_fiscale: 'FRRLND10T20L219P',
    data_nascita: '2010-12-20', // 14 anni - MINORENNE
    luogo_nascita: 'Torino',
    indirizzo: 'Via Po 32',
    citta: 'Torino',
    telefono: '3405544332',
    email: 'roberto.ferrari@email.it',
    is_minorenne: true,
    tutore_nome: 'Roberto',
    tutore_cognome: 'Ferrari',
    tutore_cf: 'FRRRBT75H10L219X',
    tutore_telefono: '3405544332',
    tutore_email: 'roberto.ferrari@email.it',
    tutore_relazione: 'Padre',
    note: 'Visita agonistica effettuata.',
    data_creazione: '2024-09-08'
  },
  {
    id: 4,
    nome: 'Giulia',
    cognome: 'Romano',
    codice_fiscale: 'RMNGII16A45F839Z',
    data_nascita: '2016-01-05', // 8 anni - MINORENNE
    luogo_nascita: 'Napoli',
    indirizzo: 'Via Toledo 105',
    citta: 'Napoli',
    telefono: '3331122334',
    email: 'chiara.esposito@email.it',
    is_minorenne: true,
    tutore_nome: 'Chiara',
    tutore_cognome: 'Esposito',
    tutore_cf: 'SPSCHR85C42F839K',
    tutore_telefono: '3331122334',
    tutore_email: 'chiara.esposito@email.it',
    tutore_relazione: 'Madre',
    note: 'Prima esperienza sportiva.',
    data_creazione: '2024-09-12'
  },
  {
    id: 5,
    nome: 'Matteo',
    cognome: 'Colombo',
    codice_fiscale: 'CLBMTT02C10F205T',
    data_nascita: '2002-03-10', // Maggiorenne (22 anni)
    luogo_nascita: 'Milano',
    indirizzo: 'Viale Monza 45',
    citta: 'Milano',
    telefono: '3456789012',
    email: 'matteo.colombo@gmail.com',
    is_minorenne: false,
    note: 'Atleta senior e aiuto allenatore.',
    data_creazione: '2024-09-01'
  }
];

export const INITIAL_TESSERATI: Tesserato[] = [
  {
    id: 1,
    persona_id: 1, // Marco Rossi
    anno_id: 1,
    numero_tessera: 'TESS-2024-001',
    data_tesseramento: '2024-09-03',
    tipo_tesseramento: 'Agonista',
    certificato_medico_scadenza: '2025-05-20',
    stato: 'Attivo'
  },
  {
    id: 2,
    persona_id: 2, // Sofia Bianchi
    anno_id: 1,
    numero_tessera: 'TESS-2024-002',
    data_tesseramento: '2024-09-06',
    tipo_tesseramento: 'Non Agonista',
    certificato_medico_scadenza: '2025-04-15',
    stato: 'Attivo'
  },
  {
    id: 3,
    persona_id: 3, // Leonardo Ferrari
    anno_id: 1,
    numero_tessera: 'TESS-2024-003',
    data_tesseramento: '2024-09-10',
    tipo_tesseramento: 'Agonista',
    certificato_medico_scadenza: '2024-11-10', // Certificato scaduto o in scadenza!
    stato: 'Attivo'
  },
  {
    id: 4,
    persona_id: 4, // Giulia Romano
    anno_id: 1,
    numero_tessera: 'TESS-2024-004',
    data_tesseramento: '2024-09-15',
    tipo_tesseramento: 'Promozionale',
    certificato_medico_scadenza: '2025-09-01',
    stato: 'Attivo'
  },
  {
    id: 5,
    persona_id: 5, // Matteo Colombo
    anno_id: 1,
    numero_tessera: 'TESS-2024-005',
    data_tesseramento: '2024-09-01',
    tipo_tesseramento: 'Agonista',
    certificato_medico_scadenza: '2025-06-30',
    stato: 'Attivo'
  }
];

export const INITIAL_GRUPPI: Gruppo[] = [
  {
    id: 1,
    anno_id: 1,
    nome_gruppo: 'Avviamento Pattinaggio (Primi Passi / Cuccioli)',
    descrizione: 'Corso base avviamento su rotelle: impostazione, equilibrio e primi fili',
    categoria: 'Avviamento Pattinaggio',
    quota_mensile: 50.00,
    giorno_scadenza_mensile: 10,
    data_inizio: '2024-09-01',
    data_fine: '2025-05-31',
    istruttore: 'Maestra Elena Riva'
  },
  {
    id: 2,
    anno_id: 1,
    nome_gruppo: 'Solo Dance FISR / World Skate',
    descrizione: 'Allenamenti tecnici Solo Dance: danze obbligatorie, style dance e libero',
    categoria: 'Agonismo FISR / EPS',
    quota_mensile: 75.00,
    giorno_scadenza_mensile: 10,
    data_inizio: '2024-09-01',
    data_fine: '2025-05-31',
    istruttore: 'Tecnico Federale FISR Roberto Conti'
  },
  {
    id: 3,
    anno_id: 1,
    nome_gruppo: 'Agonismo Singolo FISR (Salti e Trottole)',
    descrizione: 'Preparazione gare provinciali, regionali e Campionati Italiani FISR',
    categoria: 'Agonismo Federale',
    quota_mensile: 80.00,
    giorno_scadenza_mensile: 10,
    data_inizio: '2024-09-01',
    data_fine: '2025-05-31',
    istruttore: 'Coach Silvia Moretti (FISR Livello 3)'
  },
  {
    id: 4,
    anno_id: 1,
    nome_gruppo: 'Gruppo Show & Precision (Spettacolo)',
    descrizione: 'Coreografie di gruppo sincronizzato per trofei promozionali e rassegne FISR/UISP',
    categoria: 'Gruppi Spettacolo',
    quota_mensile: 65.00,
    giorno_scadenza_mensile: 15,
    data_inizio: '2024-09-15',
    data_fine: '2025-06-15',
    istruttore: 'Coreografa Laura Bellini'
  }
];

export const INITIAL_GRUPPI_TESSERATI: GruppoTesserato[] = [
  { id: 1, gruppo_id: 3, tesserato_id: 1, data_iscrizione: '2024-09-03' }, // Marco Rossi in Agonismo Singolo
  { id: 2, gruppo_id: 1, tesserato_id: 2, data_iscrizione: '2024-09-06' }, // Sofia Bianchi in Avviamento
  { id: 3, gruppo_id: 2, tesserato_id: 3, data_iscrizione: '2024-09-10' }, // Leonardo Ferrari in Solo Dance
  { id: 4, gruppo_id: 4, tesserato_id: 4, data_iscrizione: '2024-09-15' }, // Giulia Romano in Gruppo Show
  { id: 5, gruppo_id: 2, tesserato_id: 5, data_iscrizione: '2024-09-01' }  // Matteo Colombo in Solo Dance
];

export const INITIAL_QUOTE: Quota[] = [
  // Marco Rossi (Tesserato 1 - Agonismo Singolo FISR, 80€/mese)
  {
    id: 1,
    tesserato_id: 1,
    gruppo_id: 3,
    causale: 'Quota Settembre 2024 - Agonismo Singolo FISR',
    importo: 80.00,
    importo_pagato: 80.00,
    data_scadenza: '2024-09-10',
    stato: 'pagata',
    mese_riferimento: '2024-09'
  },
  {
    id: 2,
    tesserato_id: 1,
    gruppo_id: 3,
    causale: 'Quota Ottobre 2024 - Agonismo Singolo FISR',
    importo: 80.00,
    importo_pagato: 80.00,
    data_scadenza: '2024-10-10',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 3,
    tesserato_id: 1,
    gruppo_id: 3,
    causale: 'Quota Novembre 2024 - Agonismo Singolo FISR',
    importo: 80.00,
    importo_pagato: 40.00,
    data_scadenza: '2024-11-10',
    stato: 'parziale',
    mese_riferimento: '2024-11'
  },
  {
    id: 4,
    tesserato_id: 1,
    gruppo_id: 3,
    causale: 'Quota Dicembre 2024 - Agonismo Singolo FISR',
    importo: 80.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-12'
  },

  // Sofia Bianchi (Tesserato 2 - Avviamento Pattinaggio, 50€/mese)
  {
    id: 5,
    tesserato_id: 2,
    gruppo_id: 1,
    causale: 'Quota Ottobre 2024 - Avviamento Pattinaggio',
    importo: 50.00,
    importo_pagato: 50.00,
    data_scadenza: '2024-10-10',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 6,
    tesserato_id: 2,
    gruppo_id: 1,
    causale: 'Quota Novembre 2024 - Avviamento Pattinaggio',
    importo: 50.00,
    importo_pagato: 50.00,
    data_scadenza: '2024-11-10',
    stato: 'pagata',
    mese_riferimento: '2024-11'
  },
  {
    id: 7,
    tesserato_id: 2,
    gruppo_id: 1,
    causale: 'Quota Dicembre 2024 - Avviamento Pattinaggio',
    importo: 50.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-12'
  },

  // Leonardo Ferrari (Tesserato 3 - Solo Dance FISR, 75€/mese)
  {
    id: 8,
    tesserato_id: 3,
    gruppo_id: 2,
    causale: 'Quota Settembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 75.00,
    data_scadenza: '2024-09-10',
    stato: 'pagata',
    mese_riferimento: '2024-09'
  },
  {
    id: 9,
    tesserato_id: 3,
    gruppo_id: 2,
    causale: 'Quota Ottobre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-10-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-10'
  },
  {
    id: 10,
    tesserato_id: 3,
    gruppo_id: 2,
    causale: 'Quota Novembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-11-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-11'
  },
  {
    id: 11,
    tesserato_id: 3,
    gruppo_id: 2,
    causale: 'Quota Dicembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-12'
  },

  // Giulia Romano (Tesserato 4 - Gruppo Show, 65€/mese)
  {
    id: 12,
    tesserato_id: 4,
    gruppo_id: 4,
    causale: 'Quota Ottobre 2024 - Gruppo Show & Precision',
    importo: 65.00,
    importo_pagato: 65.00,
    data_scadenza: '2024-10-15',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 13,
    tesserato_id: 4,
    gruppo_id: 4,
    causale: 'Quota Novembre 2024 - Gruppo Show & Precision',
    importo: 65.00,
    importo_pagato: 65.00,
    data_scadenza: '2024-11-15',
    stato: 'pagata',
    mese_riferimento: '2024-11'
  },
  {
    id: 14,
    tesserato_id: 4,
    gruppo_id: 4,
    causale: 'Quota Dicembre 2024 - Gruppo Show & Precision',
    importo: 65.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-15',
    stato: 'da_pagare',
    mese_riferimento: '2024-12'
  },

  // Matteo Colombo (Tesserato 5 - Solo Dance FISR, 75€/mese)
  {
    id: 15,
    tesserato_id: 5,
    gruppo_id: 2,
    causale: 'Quota Settembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 75.00,
    data_scadenza: '2024-09-10',
    stato: 'pagata',
    mese_riferimento: '2024-09'
  },
  {
    id: 16,
    tesserato_id: 5,
    gruppo_id: 2,
    causale: 'Quota Ottobre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 75.00,
    data_scadenza: '2024-10-10',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 17,
    tesserato_id: 5,
    gruppo_id: 2,
    causale: 'Quota Novembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-11-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-11'
  },
  {
    id: 18,
    tesserato_id: 5,
    gruppo_id: 2,
    causale: 'Quota Dicembre 2024 - Solo Dance FISR',
    importo: 75.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-12'
  },

  // Quote Future 2025 (Gennaio - Maggio) per Previsioni Annuali
  // Gennaio 2025
  { id: 19, tesserato_id: 1, gruppo_id: 3, causale: 'Quota Gennaio 2025 - Agonismo Singolo FISR', importo: 80.00, importo_pagato: 0, data_scadenza: '2025-01-10', stato: 'da_pagare', mese_riferimento: '2025-01' },
  { id: 20, tesserato_id: 2, gruppo_id: 1, causale: 'Quota Gennaio 2025 - Avviamento Pattinaggio', importo: 50.00, importo_pagato: 0, data_scadenza: '2025-01-10', stato: 'da_pagare', mese_riferimento: '2025-01' },
  { id: 21, tesserato_id: 3, gruppo_id: 2, causale: 'Quota Gennaio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-01-10', stato: 'da_pagare', mese_riferimento: '2025-01' },
  { id: 22, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Gennaio 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-01-15', stato: 'da_pagare', mese_riferimento: '2025-01' },
  { id: 23, tesserato_id: 5, gruppo_id: 2, causale: 'Quota Gennaio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-01-10', stato: 'da_pagare', mese_riferimento: '2025-01' },

  // Febbraio 2025
  { id: 24, tesserato_id: 1, gruppo_id: 3, causale: 'Quota Febbraio 2025 - Agonismo Singolo FISR', importo: 80.00, importo_pagato: 0, data_scadenza: '2025-02-10', stato: 'da_pagare', mese_riferimento: '2025-02' },
  { id: 25, tesserato_id: 2, gruppo_id: 1, causale: 'Quota Febbraio 2025 - Avviamento Pattinaggio', importo: 50.00, importo_pagato: 0, data_scadenza: '2025-02-10', stato: 'da_pagare', mese_riferimento: '2025-02' },
  { id: 26, tesserato_id: 3, gruppo_id: 2, causale: 'Quota Febbraio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-02-10', stato: 'da_pagare', mese_riferimento: '2025-02' },
  { id: 27, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Febbraio 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-02-15', stato: 'da_pagare', mese_riferimento: '2025-02' },
  { id: 28, tesserato_id: 5, gruppo_id: 2, causale: 'Quota Febbraio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-02-10', stato: 'da_pagare', mese_riferimento: '2025-02' },

  // Marzo 2025
  { id: 29, tesserato_id: 1, gruppo_id: 3, causale: 'Quota Marzo 2025 - Agonismo Singolo FISR', importo: 80.00, importo_pagato: 0, data_scadenza: '2025-03-10', stato: 'da_pagare', mese_riferimento: '2025-03' },
  { id: 30, tesserato_id: 2, gruppo_id: 1, causale: 'Quota Marzo 2025 - Avviamento Pattinaggio', importo: 50.00, importo_pagato: 0, data_scadenza: '2025-03-10', stato: 'da_pagare', mese_riferimento: '2025-03' },
  { id: 31, tesserato_id: 3, gruppo_id: 2, causale: 'Quota Marzo 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-03-10', stato: 'da_pagare', mese_riferimento: '2025-03' },
  { id: 32, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Marzo 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-03-15', stato: 'da_pagare', mese_riferimento: '2025-03' },
  { id: 33, tesserato_id: 5, gruppo_id: 2, causale: 'Quota Marzo 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-03-10', stato: 'da_pagare', mese_riferimento: '2025-03' },

  // Aprile 2025
  { id: 34, tesserato_id: 1, gruppo_id: 3, causale: 'Quota Aprile 2025 - Agonismo Singolo FISR', importo: 80.00, importo_pagato: 0, data_scadenza: '2025-04-10', stato: 'da_pagare', mese_riferimento: '2025-04' },
  { id: 35, tesserato_id: 2, gruppo_id: 1, causale: 'Quota Aprile 2025 - Avviamento Pattinaggio', importo: 50.00, importo_pagato: 0, data_scadenza: '2025-04-10', stato: 'da_pagare', mese_riferimento: '2025-04' },
  { id: 36, tesserato_id: 3, gruppo_id: 2, causale: 'Quota Aprile 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-04-10', stato: 'da_pagare', mese_riferimento: '2025-04' },
  { id: 37, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Aprile 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-04-15', stato: 'da_pagare', mese_riferimento: '2025-04' },
  { id: 38, tesserato_id: 5, gruppo_id: 2, causale: 'Quota Aprile 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-04-10', stato: 'da_pagare', mese_riferimento: '2025-04' },

  // Maggio 2025
  { id: 39, tesserato_id: 1, gruppo_id: 3, causale: 'Quota Maggio 2025 - Agonismo Singolo FISR', importo: 80.00, importo_pagato: 0, data_scadenza: '2025-05-10', stato: 'da_pagare', mese_riferimento: '2025-05' },
  { id: 40, tesserato_id: 2, gruppo_id: 1, causale: 'Quota Maggio 2025 - Avviamento Pattinaggio', importo: 50.00, importo_pagato: 0, data_scadenza: '2025-05-10', stato: 'da_pagare', mese_riferimento: '2025-05' },
  { id: 41, tesserato_id: 3, gruppo_id: 2, causale: 'Quota Maggio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-05-10', stato: 'da_pagare', mese_riferimento: '2025-05' },
  { id: 42, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Maggio 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-05-15', stato: 'da_pagare', mese_riferimento: '2025-05' },
  { id: 43, tesserato_id: 5, gruppo_id: 2, causale: 'Quota Maggio 2025 - Solo Dance FISR', importo: 75.00, importo_pagato: 0, data_scadenza: '2025-05-10', stato: 'da_pagare', mese_riferimento: '2025-05' },

  // Giugno 2025 (Solo Gruppo Show fino al 15/06)
  { id: 44, tesserato_id: 4, gruppo_id: 4, causale: 'Quota Giugno 2025 - Gruppo Show & Precision', importo: 65.00, importo_pagato: 0, data_scadenza: '2025-06-15', stato: 'da_pagare', mese_riferimento: '2025-06' }
];

export const INITIAL_PAGAMENTI: Pagamento[] = [
  // Pagamento legato a Quota 1 (Marco Rossi Settembre)
  {
    id: 1,
    tesserato_id: 1,
    quota_id: 1,
    importo: 80.00,
    data_pagamento: '2024-09-08 17:45',
    metodo_pagamento: 'pos',
    causale: 'Saldo Quota Settembre 2024 - Agonismo Singolo FISR',
    ricevuta_numero: 'RIC-2024-0012',
    note: 'Pagato dal papà Giuseppe con bancomat al desk'
  },
  // Pagamento legato a Quota 2 (Marco Rossi Ottobre)
  {
    id: 2,
    tesserato_id: 1,
    quota_id: 2,
    importo: 80.00,
    data_pagamento: '2024-10-05 18:10',
    metodo_pagamento: 'contanti',
    causale: 'Saldo Quota Ottobre 2024 - Agonismo Singolo FISR',
    ricevuta_numero: 'RIC-2024-0045',
    note: 'Contanti precisi'
  },
  // Acconto per Quota 3 (Marco Rossi Novembre)
  {
    id: 3,
    tesserato_id: 1,
    quota_id: 3,
    importo: 40.00,
    data_pagamento: '2024-11-12 16:30',
    metodo_pagamento: 'satispay',
    causale: 'Acconto Quota Novembre 2024 - Agonismo Singolo FISR',
    ricevuta_numero: 'RIC-2024-0078',
    note: 'Rimangono 40€ da saldare'
  },
  // Pagamento NON riconducibile a quota (es. Kit gara societario / borsa)
  {
    id: 4,
    tesserato_id: 1,
    quota_id: null,
    importo: 50.00,
    data_pagamento: '2024-09-15 11:20',
    metodo_pagamento: 'pos',
    causale: 'Quota Tesseramento Federale FISR 2024/2025 e Assicurazione Agonistica',
    ricevuta_numero: 'RIC-2024-0023',
    note: 'Tesserino federale FISR emesso'
  },
  // Pagamento legato a Quota 5 (Sofia Bianchi)
  {
    id: 5,
    tesserato_id: 2,
    quota_id: 5,
    importo: 50.00,
    data_pagamento: '2024-10-02 16:50',
    metodo_pagamento: 'bonifico',
    causale: 'Quota Ottobre 2024 - Avviamento Pattinaggio',
    ricevuta_numero: 'RIC-2024-0038',
    note: 'Accreditato su c/c IBAN'
  },
  // Altro pagamento (Tesseramento Ente di Promozione UISP)
  {
    id: 6,
    tesserato_id: 3,
    quota_id: null,
    importo: 30.00,
    data_pagamento: '2024-09-10 18:00',
    metodo_pagamento: 'contanti',
    causale: 'Tesseramento Ente di Promozione Sportiva (UISP) e Circuito Trofei',
    ricevuta_numero: 'RIC-2024-0019',
    note: 'Iscrizione circuito promozionale'
  }
];

export const INITIAL_UTENTI: Utente[] = [
  {
    id: 1,
    username: 'admin',
    nome: 'Direttore Sportivo',
    ruolo: 'admin',
    is_kiosk: false,
    attivo: true,
    password: 'admin'
  },
  {
    id: 2,
    username: 'kiosk',
    nome: 'Totem / Desk Reception',
    ruolo: 'desk',
    is_kiosk: true, // Login diretto in Kiosk!
    attivo: true,
    password: 'kiosk'
  },
  {
    id: 3,
    username: 'segreteria',
    nome: 'Maria Segreteria',
    ruolo: 'operatore',
    is_kiosk: false,
    attivo: true,
    password: '123'
  }
];

export const INITIAL_SPESE_PREVISIONALI: SpesaPrevisionale[] = [
  {
    id: 1,
    anno_id: 1,
    titolo: 'Canone Affitto Pista di Pattinaggio Comunale',
    categoria: 'Affitto Impianti / Pista',
    importo_mensile: 180.00,
    mesi: ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
    ricorrente: true,
    note: 'Convenzione comunale per uso pista e spogliatoi 4 giorni a settimana'
  },
  {
    id: 2,
    anno_id: 1,
    titolo: 'Compensi Tecnici & Allenatori Federali (FISR)',
    categoria: 'Compensi Tecnici / Allenatori',
    importo_mensile: 220.00,
    mesi: ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
    ricorrente: true,
    note: 'Rimborsi forfettari istruttori avviamento, solo dance e singolo agonismo'
  },
  {
    id: 3,
    anno_id: 1,
    titolo: 'Riaffiliazione Societaria FISR & EPS (UISP/AICS)',
    categoria: 'Tesseramenti & Affiliazioni (FISR/EPS)',
    importo_mensile: 150.00,
    mesi: ['2024-09'],
    ricorrente: false,
    note: 'Quota di riaffiliazione annuale all\'inizio della stagione sportiva'
  },
  {
    id: 4,
    anno_id: 1,
    titolo: 'Polizza Assicurativa RCT Società e Infortuni Atleti',
    categoria: 'Assicurazioni',
    importo_mensile: 120.00,
    mesi: ['2024-10'],
    ricorrente: false,
    note: 'Copertura assicurativa annuale responsabilità civile verso terzi'
  },
  {
    id: 5,
    anno_id: 1,
    titolo: 'Materiale Sportivo & Ricambi Rotelle (Coni, Nastri, Freni)',
    categoria: 'Materiale Sportivo & Divise',
    importo_mensile: 85.00,
    mesi: ['2024-11', '2025-02'],
    ricorrente: false,
    note: 'Materiale di ricambio pista e presidi per percorsi didattici'
  },
  {
    id: 6,
    anno_id: 1,
    titolo: 'Assistenza Contabile e Adempimenti Riforma Sport / RASD',
    categoria: 'Amministrazione & Commercialista',
    importo_mensile: 60.00,
    mesi: ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'],
    ricorrente: true,
    note: 'Tenuta contabilità semplificata ASD e gestione registro nazionale RASD'
  }
];

