import {
  Associazione,
  Persona,
  Anno,
  Tesserato,
  Gruppo,
  GruppoTesserato,
  Quota,
  Pagamento,
  Utente,
  TesseratoFull
} from '../types';
import {
  INITIAL_ASSOCIAZIONE,
  INITIAL_ANNI,
  INITIAL_PERSONE,
  INITIAL_TESSERATI,
  INITIAL_GRUPPI,
  INITIAL_GRUPPI_TESSERATI,
  INITIAL_QUOTE,
  INITIAL_PAGAMENTI,
  INITIAL_UTENTI
} from '../data/mockData';

const STORAGE_KEYS = {
  ASSOCIAZIONE: 'sport_gestionale_associazione',
  PERSONE: 'sport_gestionale_persone',
  ANNI: 'sport_gestionale_anni',
  TESSERATI: 'sport_gestionale_tesserati',
  GRUPPI: 'sport_gestionale_gruppi',
  GRUPPI_TESSERATI: 'sport_gestionale_gruppi_tesserati',
  QUOTE: 'sport_gestionale_quote',
  PAGAMENTI: 'sport_gestionale_pagamenti',
  UTENTI: 'sport_gestionale_utenti',
  CURRENT_USER: 'sport_gestionale_current_user',
};

// Carica o inizializza
function loadOrInit<T>(key: string, defaultData: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Errore caricamento da localStorage [${key}]:`, e);
  }
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Errore salvataggio in localStorage [${key}]:`, e);
  }
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.ASSOCIAZIONE);
  localStorage.removeItem(STORAGE_KEYS.PERSONE);
  localStorage.removeItem(STORAGE_KEYS.ANNI);
  localStorage.removeItem(STORAGE_KEYS.TESSERATI);
  localStorage.removeItem(STORAGE_KEYS.GRUPPI);
  localStorage.removeItem(STORAGE_KEYS.GRUPPI_TESSERATI);
  localStorage.removeItem(STORAGE_KEYS.QUOTE);
  localStorage.removeItem(STORAGE_KEYS.PAGAMENTI);
  localStorage.removeItem(STORAGE_KEYS.UTENTI);
  window.location.reload();
}

// Aggregatore stato iniziale per App.tsx
export interface AppState {
  associazione: Associazione;
  persone: Persona[];
  anni: Anno[];
  tesserati: Tesserato[];
  gruppi: Gruppo[];
  gruppi_tesserati: GruppoTesserato[];
  quote: Quota[];
  pagamenti: Pagamento[];
  utenti: Utente[];
}

export function getInitialState(): AppState {
  return {
    associazione: getAssociazione(),
    persone: getPersone(),
    anni: getAnni(),
    tesserati: getTesserati(),
    gruppi: getGruppi(),
    gruppi_tesserati: getGruppiTesserati(),
    quote: getQuote(),
    pagamenti: getPagamenti(),
    utenti: getUtenti()
  };
}

export function saveState(state: AppState): void {
  saveToStorage(STORAGE_KEYS.ASSOCIAZIONE, state.associazione);
  saveToStorage(STORAGE_KEYS.PERSONE, state.persone);
  saveToStorage(STORAGE_KEYS.ANNI, state.anni);
  saveToStorage(STORAGE_KEYS.TESSERATI, state.tesserati);
  saveToStorage(STORAGE_KEYS.GRUPPI, state.gruppi);
  saveToStorage(STORAGE_KEYS.GRUPPI_TESSERATI, state.gruppi_tesserati);
  saveToStorage(STORAGE_KEYS.QUOTE, state.quote);
  saveToStorage(STORAGE_KEYS.PAGAMENTI, state.pagamenti);
  saveToStorage(STORAGE_KEYS.UTENTI, state.utenti);
}

// Data Getters
export function getAssociazione(): Associazione {
  const ass = loadOrInit<Associazione>(STORAGE_KEYS.ASSOCIAZIONE, INITIAL_ASSOCIAZIONE);
  if (!ass.disciplina || !ass.enti_affiliati || ass.enti_affiliati.length === 0 || ass.denominazione === 'A.S.D. Polisportiva Aurora') {
    const upgraded: Associazione = {
      ...INITIAL_ASSOCIAZIONE,
      ...ass,
      disciplina: ass.disciplina || INITIAL_ASSOCIAZIONE.disciplina,
      enti_affiliati: (ass.enti_affiliati && ass.enti_affiliati.length > 0) ? ass.enti_affiliati : INITIAL_ASSOCIAZIONE.enti_affiliati,
      specialita: ass.specialita || INITIAL_ASSOCIAZIONE.specialita,
      codice_affiliazione_fisr: ass.codice_affiliazione_fisr || INITIAL_ASSOCIAZIONE.codice_affiliazione_fisr,
      registro_rasd: ass.registro_rasd || INITIAL_ASSOCIAZIONE.registro_rasd,
      denominazione: ass.denominazione === 'A.S.D. Polisportiva Aurora' ? INITIAL_ASSOCIAZIONE.denominazione : ass.denominazione,
      email: ass.email === 'segreteria@polisportivaurora.it' ? INITIAL_ASSOCIAZIONE.email : (ass.email || INITIAL_ASSOCIAZIONE.email),
      codice_affiliazione: ass.codice_affiliazione === 'CONI / CSEN n. 45892' ? INITIAL_ASSOCIAZIONE.codice_affiliazione : (ass.codice_affiliazione || INITIAL_ASSOCIAZIONE.codice_affiliazione)
    };
    saveAssociazione(upgraded);
    return upgraded;
  }
  return ass;
}

export function saveAssociazione(data: Associazione): void {
  saveToStorage(STORAGE_KEYS.ASSOCIAZIONE, data);
}

// Genera quote per una singola iscrizione
export function generaQuotePerIscrizione(
  gruppo: Gruppo,
  tesseratoId: number,
  quoteAttuali: Quota[]
): Quota[] {
  const { nuoveQuote } = generaQuoteAutomatichePerTesserato(tesseratoId, gruppo.id, quoteAttuali, [gruppo]);
  // Ritorna solo quelle nuove aggiunte
  return nuoveQuote.filter((nq) => !quoteAttuali.some((oq) => oq.id === nq.id));
}

// Data Getters
export function getPersone(): Persona[] {
  return loadOrInit<Persona[]>(STORAGE_KEYS.PERSONE, INITIAL_PERSONE);
}

export function getAnni(): Anno[] {
  return loadOrInit<Anno[]>(STORAGE_KEYS.ANNI, INITIAL_ANNI);
}

export function getTesserati(): Tesserato[] {
  return loadOrInit<Tesserato[]>(STORAGE_KEYS.TESSERATI, INITIAL_TESSERATI);
}

export function getGruppi(): Gruppo[] {
  const g = loadOrInit<Gruppo[]>(STORAGE_KEYS.GRUPPI, INITIAL_GRUPPI);
  if (g.length > 0 && g[0].nome_gruppo.includes('Basket')) {
    saveToStorage(STORAGE_KEYS.GRUPPI, INITIAL_GRUPPI);
    return INITIAL_GRUPPI;
  }
  return g;
}

export function getGruppiTesserati(): GruppoTesserato[] {
  return loadOrInit<GruppoTesserato[]>(STORAGE_KEYS.GRUPPI_TESSERATI, INITIAL_GRUPPI_TESSERATI);
}

export function getQuote(): Quota[] {
  return loadOrInit<Quota[]>(STORAGE_KEYS.QUOTE, INITIAL_QUOTE);
}

export function getPagamenti(): Pagamento[] {
  return loadOrInit<Pagamento[]>(STORAGE_KEYS.PAGAMENTI, INITIAL_PAGAMENTI);
}

export function getUtenti(): Utente[] {
  return loadOrInit<Utente[]>(STORAGE_KEYS.UTENTI, INITIAL_UTENTI);
}

export function getCurrentUser(): Utente | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  // Default: kiosk mode login per test immediato
  const defaultUser = INITIAL_UTENTI[0]; // admin
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setCurrentUser(user: Utente | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Logica per calcolo quote mensili automatiche da Gruppo (data_inizio a data_fine)
export function generaQuoteAutomatichePerTesserato(
  tesseratoId: number,
  gruppoId: number,
  quoteAttuali: Quota[],
  gruppi: Gruppo[]
): { nuoveQuote: Quota[]; numeroGenerate: number } {
  const gruppo = gruppi.find((g) => g.id === gruppoId);
  if (!gruppo) return { nuoveQuote: quoteAttuali, numeroGenerate: 0 };

  const start = new Date(gruppo.data_inizio);
  const end = new Date(gruppo.data_fine);
  const giorno = gruppo.giorno_scadenza_mensile || 10;
  const importo = gruppo.quota_mensile;

  const quoteGenerate: Quota[] = [];
  let maxId = quoteAttuali.reduce((max, q) => Math.max(max, q.id), 0);

  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const stop = new Date(end.getFullYear(), end.getMonth() + 1, 1);

  const nomiMesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  while (cur < stop) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const meseRif = `${year}-${monthStr}`;

    // Verifica se esiste già
    const giaEsiste = quoteAttuali.some(
      (q) => q.tesserato_id === tesseratoId && q.gruppo_id === gruppoId && q.mese_riferimento === meseRif
    );

    if (!giaEsiste) {
      maxId++;
      // Giorno effettivo (gestendo febbraio / mesi da 30gg)
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const giornoEffettivo = Math.min(giorno, lastDayOfMonth);
      const dataScadenza = `${year}-${monthStr}-${String(giornoEffettivo).padStart(2, '0')}`;
      const nomeMese = nomiMesi[month];

      quoteGenerate.push({
        id: maxId,
        tesserato_id: tesseratoId,
        gruppo_id: gruppoId,
        causale: `Quota ${nomeMese} ${year} - ${gruppo.nome_gruppo}`,
        importo: importo,
        importo_pagato: 0,
        data_scadenza: dataScadenza,
        stato: 'da_pagare',
        mese_riferimento: meseRif,
      });
    }

    cur.setMonth(cur.getMonth() + 1);
  }

  const elencoCompleto = [...quoteAttuali, ...quoteGenerate];
  saveToStorage(STORAGE_KEYS.QUOTE, elencoCompleto);
  return { nuoveQuote: elencoCompleto, numeroGenerate: quoteGenerate.length };
}

// Registra Pagamento e aggiorna Quota corrispondente
export function registraNuovoPagamento(
  data: {
    tesserato_id: number;
    quota_id?: number | null;
    importo: number;
    metodo_pagamento: Pagamento['metodo_pagamento'];
    causale: string;
    note?: string;
  },
  pagamentiAttuali: Pagamento[],
  quoteAttuali: Quota[]
): { nuoviPagamenti: Pagamento[]; nuoveQuote: Quota[]; nuovoPagamento: Pagamento } {
  const maxIdPag = pagamentiAttuali.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const ricevutaNumero = `RIC-${new Date().getFullYear()}-${String(maxIdPag).padStart(4, '0')}`;

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

  const nuovoPagamento: Pagamento = {
    id: maxIdPag,
    tesserato_id: data.tesserato_id,
    quota_id: data.quota_id || null,
    importo: Number(data.importo),
    data_pagamento: dateStr,
    metodo_pagamento: data.metodo_pagamento,
    causale: data.causale,
    ricevuta_numero: ricevutaNumero,
    note: data.note || ''
  };

  const nuoviPagamenti = [nuovoPagamento, ...pagamentiAttuali];
  saveToStorage(STORAGE_KEYS.PAGAMENTI, nuoviPagamenti);

  let nuoveQuote = [...quoteAttuali];
  if (data.quota_id) {
    nuoveQuote = quoteAttuali.map((q) => {
      if (q.id === data.quota_id) {
        const nuovoImportoPagato = Number(q.importo_pagato || 0) + Number(data.importo);
        const nuovoStato = nuovoImportoPagato >= q.importo ? 'pagata' : 'parziale';
        return {
          ...q,
          importo_pagato: nuovoImportoPagato,
          stato: nuovoStato as Quota['stato']
        };
      }
      return q;
    });
    saveToStorage(STORAGE_KEYS.QUOTE, nuoveQuote);
  }

  return { nuoviPagamenti, nuoveQuote, nuovoPagamento };
}

// Verifica se quota è scaduta
export function isQuotaScaduta(quota: Quota): boolean {
  if (quota.stato === 'pagata' || quota.stato === 'annullata') return false;
  const today = new Date().toISOString().substring(0, 10);
  return quota.data_scadenza < today;
}

// Calcolo giorni di ritardo
export function getGiorniRitardo(dataScadenza: string): number {
  const today = new Date();
  const scadenza = new Date(dataScadenza);
  const diffTime = today.getTime() - scadenza.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Calcola età da data di nascita
export function calcolaEta(dataNascita: string): number {
  if (!dataNascita) return 0;
  const oggi = new Date();
  const nascita = new Date(dataNascita);
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const m = oggi.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
    eta--;
  }
  return eta;
}

// Helper per comporre TesseratoFull con Persona e Statistiche
export function getTesseratiFull(
  tesserati: Tesserato[],
  persone: Persona[],
  anni: Anno[],
  gruppiTesserati: GruppoTesserato[],
  gruppi: Gruppo[],
  quote: Quota[]
): TesseratoFull[] {
  return tesserati.map((t) => {
    const persona = persone.find((p) => p.id === t.persona_id);
    const anno = anni.find((a) => a.id === t.anno_id);
    const assignedGroupIds = gruppiTesserati.filter((gt) => gt.tesserato_id === t.id).map((gt) => gt.gruppo_id);
    const tGruppi = gruppi.filter((g) => assignedGroupIds.includes(g.id));

    const tQuote = quote.filter((q) => q.tesserato_id === t.id);
    const quoteAperte = tQuote.filter((q) => q.stato !== 'pagata' && q.stato !== 'annullata');
    const quoteScadute = quoteAperte.filter(isQuotaScaduta);
    const totaleDaSaldare = quoteAperte.reduce((acc, q) => acc + (q.importo - (q.importo_pagato || 0)), 0);

    return {
      ...t,
      persona,
      anno,
      gruppi: tGruppi,
      quoteAperteCount: quoteAperte.length,
      quoteScaduteCount: quoteScadute.length,
      totaleDaSaldare
    };
  });
}
