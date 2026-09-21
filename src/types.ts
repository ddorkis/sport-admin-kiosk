export interface EnteAffiliato {
  id: string;
  tipo: 'FSN' | 'EPS' | 'DSA'; // FSN (es. FISR), EPS (es. UISP, AICS, CSEN), DSA
  sigla: string; // "FISR", "UISP", "AICS", "CSEN", "PGS", ecc.
  denominazione_estesa?: string;
  codice_societa: string; // Codice identificativo della società
  attivo?: boolean;
}

export interface Associazione {
  denominazione: string;
  disciplina: string; // "Pattinaggio Artistico a Rotelle"
  codice_fiscale: string;
  partita_iva: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  legale_rappresentante: string;
  telefono?: string;
  email?: string;
  pec?: string;
  codice_affiliazione?: string; // generico/storico
  codice_affiliazione_fisr?: string; // Codice FISR societario
  registro_rasd?: string; // Iscrizione Registro RASD / Dipartimento Sport
  enti_affiliati: EnteAffiliato[]; // Federazione FISR + Enti di Promozione Sportiva multipli
  specialita?: string[]; // Singolo, Solo Dance, Coppia Artistico, Gruppi Show, Avviamento
  iban?: string;
}

export interface Persona {
  id: number;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  data_nascita: string; // YYYY-MM-DD
  luogo_nascita: string;
  indirizzo: string;
  citta: string;
  telefono: string;
  email: string;
  is_minorenne: boolean;
  // Dati del tutore legale per minorenni
  tutore_nome?: string;
  tutore_cognome?: string;
  tutore_cf?: string;
  tutore_telefono?: string;
  tutore_email?: string;
  tutore_relazione?: 'Genitore' | 'Madre' | 'Padre' | 'Tutore Legale' | 'Altro';
  note?: string;
  data_creazione: string;
}

export interface Anno {
  id: number;
  anno: string; // es. "2024/2025"
  data_inizio: string;
  data_fine: string;
  attivo: boolean;
}

export interface Tesserato {
  id: number;
  persona_id: number;
  anno_id: number;
  numero_tessera: string;
  data_tesseramento: string;
  tipo_tesseramento: 'Agonista' | 'Non Agonista' | 'Promozionale' | 'Socio / Dirigente';
  certificato_medico_scadenza: string;
  stato: 'Attivo' | 'Sospeso' | 'Scaduto';
}

export interface Gruppo {
  id: number;
  anno_id: number;
  nome_gruppo: string;
  descrizione: string;
  categoria: string;
  quota_mensile: number;
  giorno_scadenza_mensile: number; // es. 10 del mese
  data_inizio: string; // YYYY-MM-DD
  data_fine: string; // YYYY-MM-DD
  istruttore: string;
}

export interface GruppoTesserato {
  id: number;
  gruppo_id: number;
  tesserato_id: number;
  data_iscrizione: string;
  note?: string;
}

export type StatoQuota = 'da_pagare' | 'parziale' | 'pagata' | 'annullata';

export interface Quota {
  id: number;
  tesserato_id: number;
  gruppo_id?: number | null;
  causale: string; // es. "Quota Ottobre 2024 - Under 14"
  importo: number;
  importo_pagato: number;
  data_scadenza: string; // YYYY-MM-DD
  stato: StatoQuota;
  mese_riferimento?: string; // "2024-10"
  note?: string; // es. "Annullata per ritiro atleta dal 01/03/2026"
}

export type MetodoPagamento = 'contanti' | 'pos' | 'bonifico' | 'satispay';

export interface Pagamento {
  id: number;
  tesserato_id: number;
  quota_id?: number | null; // Se null: pagamento non riconducibile a quota (es. divisa, visita, iscrizione gara)
  importo: number;
  data_pagamento: string; // ISO string o YYYY-MM-DD HH:mm
  metodo_pagamento: MetodoPagamento;
  causale: string;
  ricevuta_numero: string;
  note?: string;
}

export interface Utente {
  id: number;
  username: string;
  nome: string;
  password?: string;
  ruolo: 'admin' | 'operatore' | 'desk';
  is_kiosk: boolean;
  attivo: boolean;
}

// Helpers per vista con join
export interface TesseratoFull extends Tesserato {
  persona?: Persona;
  anno?: Anno;
  gruppi?: Gruppo[];
  quoteAperteCount?: number;
  quoteScaduteCount?: number;
  totaleDaSaldare?: number;
}
