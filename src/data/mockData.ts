import { Associazione, Persona, Anno, Tesserato, Gruppo, GruppoTesserato, Quota, Pagamento, Utente } from '../types';

export const INITIAL_ASSOCIAZIONE: Associazione = {
  denominazione: 'A.S.D. Polisportiva Aurora',
  codice_fiscale: '97854120584',
  partita_iva: '04859620581',
  indirizzo: 'Via dello Sport, 24',
  cap: '00153',
  comune: 'Roma',
  provincia: 'RM',
  legale_rappresentante: 'Alessandro Bianchi',
  telefono: '06 5894123',
  email: 'segreteria@polisportivaurora.it',
  pec: 'polisportivaurora@pec.it',
  codice_affiliazione: 'CONI / CSEN n. 45892',
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
    nome_gruppo: 'Basket Under 14 Maschile',
    descrizione: 'Allenamenti Lun-Mer-Ven 17:30 - 19:00 Palazzetto A',
    categoria: 'Pallacanestro Giovanile',
    quota_mensile: 60.00,
    giorno_scadenza_mensile: 10,
    data_inizio: '2024-09-01',
    data_fine: '2025-05-31', // 9 mesi (Settembre - Maggio)
    istruttore: 'Coach Valerio Mancini'
  },
  {
    id: 2,
    anno_id: 1,
    nome_gruppo: 'Volley Minivolley Promo',
    descrizione: 'Allenamenti Mar-Gio 16:30 - 18:00 Palestra Scuole',
    categoria: 'Pallavolo Avviamento',
    quota_mensile: 45.00,
    giorno_scadenza_mensile: 10,
    data_inizio: '2024-10-01',
    data_fine: '2025-05-31', // 8 mesi
    istruttore: 'Istruttrice Laura Donati'
  },
  {
    id: 3,
    anno_id: 1,
    nome_gruppo: 'Ginnastica Artistica Junior',
    descrizione: 'Corso intermedio con attrezzistica',
    categoria: 'Ginnastica',
    quota_mensile: 55.00,
    giorno_scadenza_mensile: 15,
    data_inizio: '2024-09-15',
    data_fine: '2025-06-15',
    istruttore: 'Silvia Moretti'
  }
];

export const INITIAL_GRUPPI_TESSERATI: GruppoTesserato[] = [
  { id: 1, gruppo_id: 1, tesserato_id: 1, data_iscrizione: '2024-09-03' }, // Marco Rossi in Basket U14
  { id: 2, gruppo_id: 2, tesserato_id: 2, data_iscrizione: '2024-09-06' }, // Sofia Bianchi in Minivolley
  { id: 3, gruppo_id: 1, tesserato_id: 3, data_iscrizione: '2024-09-10' }, // Leonardo Ferrari in Basket U14
  { id: 4, gruppo_id: 2, tesserato_id: 4, data_iscrizione: '2024-09-15' }, // Giulia Romano in Minivolley
  { id: 5, gruppo_id: 1, tesserato_id: 5, data_iscrizione: '2024-09-01' }  // Matteo Colombo in Basket U14
];

export const INITIAL_QUOTE: Quota[] = [
  // Marco Rossi (Tesserato 1 - Basket Under 14, 60€/mese)
  {
    id: 1,
    tesserato_id: 1,
    gruppo_id: 1,
    causale: 'Quota Settembre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 60.00,
    data_scadenza: '2024-09-10',
    stato: 'pagata',
    mese_riferimento: '2024-09'
  },
  {
    id: 2,
    tesserato_id: 1,
    gruppo_id: 1,
    causale: 'Quota Ottobre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 60.00,
    data_scadenza: '2024-10-10',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 3,
    tesserato_id: 1,
    gruppo_id: 1,
    causale: 'Quota Novembre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 30.00,
    data_scadenza: '2024-11-10',
    stato: 'parziale', // In ritardo parziale
    mese_riferimento: '2024-11'
  },
  {
    id: 4,
    tesserato_id: 1,
    gruppo_id: 1,
    causale: 'Quota Dicembre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare', // Scaduta non pagata!
    mese_riferimento: '2024-12'
  },
  {
    id: 5,
    tesserato_id: 1,
    gruppo_id: 1,
    causale: 'Quota Gennaio 2025 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 0.00,
    data_scadenza: '2025-01-10',
    stato: 'da_pagare',
    mese_riferimento: '2025-01'
  },

  // Sofia Bianchi (Tesserato 2 - Volley Minivolley, 45€/mese)
  {
    id: 6,
    tesserato_id: 2,
    gruppo_id: 2,
    causale: 'Quota Ottobre 2024 - Volley Minivolley',
    importo: 45.00,
    importo_pagato: 45.00,
    data_scadenza: '2024-10-10',
    stato: 'pagata',
    mese_riferimento: '2024-10'
  },
  {
    id: 7,
    tesserato_id: 2,
    gruppo_id: 2,
    causale: 'Quota Novembre 2024 - Volley Minivolley',
    importo: 45.00,
    importo_pagato: 45.00,
    data_scadenza: '2024-11-10',
    stato: 'pagata',
    mese_riferimento: '2024-11'
  },
  {
    id: 8,
    tesserato_id: 2,
    gruppo_id: 2,
    causale: 'Quota Dicembre 2024 - Volley Minivolley',
    importo: 45.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-12-10',
    stato: 'da_pagare', // Scaduta non pagata!
    mese_riferimento: '2024-12'
  },

  // Leonardo Ferrari (Tesserato 3 - Basket Under 14, 60€/mese)
  {
    id: 9,
    tesserato_id: 3,
    gruppo_id: 1,
    causale: 'Quota Settembre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 60.00,
    data_scadenza: '2024-09-10',
    stato: 'pagata',
    mese_riferimento: '2024-09'
  },
  {
    id: 10,
    tesserato_id: 3,
    gruppo_id: 1,
    causale: 'Quota Ottobre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-10-10', // Molto scaduta!
    stato: 'da_pagare',
    mese_riferimento: '2024-10'
  },
  {
    id: 11,
    tesserato_id: 3,
    gruppo_id: 1,
    causale: 'Quota Novembre 2024 - Basket Under 14',
    importo: 60.00,
    importo_pagato: 0.00,
    data_scadenza: '2024-11-10',
    stato: 'da_pagare',
    mese_riferimento: '2024-11'
  }
];

export const INITIAL_PAGAMENTI: Pagamento[] = [
  // Pagamento legato a Quota 1 (Marco Rossi Settembre)
  {
    id: 1,
    tesserato_id: 1,
    quota_id: 1,
    importo: 60.00,
    data_pagamento: '2024-09-08 17:45',
    metodo_pagamento: 'pos',
    causale: 'Saldo Quota Settembre 2024 - Basket Under 14',
    ricevuta_numero: 'RIC-2024-0012',
    note: 'Pagato dal papà Giuseppe con bancomat al desk'
  },
  // Pagamento legato a Quota 2 (Marco Rossi Ottobre)
  {
    id: 2,
    tesserato_id: 1,
    quota_id: 2,
    importo: 60.00,
    data_pagamento: '2024-10-05 18:10',
    metodo_pagamento: 'contanti',
    causale: 'Saldo Quota Ottobre 2024 - Basket Under 14',
    ricevuta_numero: 'RIC-2024-0045',
    note: 'Contanti precisi'
  },
  // Acconto per Quota 3 (Marco Rossi Novembre)
  {
    id: 3,
    tesserato_id: 1,
    quota_id: 3,
    importo: 30.00,
    data_pagamento: '2024-11-12 16:30',
    metodo_pagamento: 'satispay',
    causale: 'Acconto Quota Novembre 2024 - Basket Under 14',
    ricevuta_numero: 'RIC-2024-0078',
    note: 'Rimangono 30€ da saldare'
  },
  // Pagamento NON riconducibile a quota (es. Kit gara societario / borsa)
  {
    id: 4,
    tesserato_id: 1,
    quota_id: null, // Pagamento libero / non quota!
    importo: 45.00,
    data_pagamento: '2024-09-15 11:20',
    metodo_pagamento: 'pos',
    causale: 'Acquisto Kit Gara Ufficiale 2024 (Maglia + Pantaloncino + Zaino)',
    ricevuta_numero: 'RIC-2024-0023',
    note: 'Taglia M, consegnata'
  },
  // Pagamento legato a Quota 6 (Sofia Bianchi)
  {
    id: 5,
    tesserato_id: 2,
    quota_id: 6,
    importo: 45.00,
    data_pagamento: '2024-10-02 16:50',
    metodo_pagamento: 'bonifico',
    causale: 'Quota Ottobre 2024 - Volley Minivolley',
    ricevuta_numero: 'RIC-2024-0038',
    note: 'Accreditato su c/c IBAN'
  },
  // Altro pagamento non riconducibile a quota (Visita medico-sportiva o Tesseramento federale)
  {
    id: 6,
    tesserato_id: 3,
    quota_id: null,
    importo: 25.00,
    data_pagamento: '2024-09-10 18:00',
    metodo_pagamento: 'contanti',
    causale: 'Quota Assicurativa Integrativa FIP',
    ricevuta_numero: 'RIC-2024-0019',
    note: 'Pratica inviata in federazione'
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
